# ERD (Engineering Requirements Document)

## 1. Overall Architecture









### The tools we're using, and why

| Part of the system | What we're using | Why this one, for this project specifically |
| --- | --- | --- |
| Backend language | Node.js + TypeScript | TypeScript catches errors before they happen, important around money-related code (the small-business payment math), where a silent mistake means a wrong number in a real tax filing. It's also the language Claude Code writes best in. |
| Backend framework | Express or Fastify | Either works fine. Express is more common, so an AI coding tool tends to get it right more often. |
| Database toolkit | Prisma | Matches almost exactly onto the data structure below. You can hand it directly to Claude Code to build from. |
| Database | PostgreSQL, hosted through Neon or Supabase | Free to start, ready in minutes, no server to set up yourself. |
| Frontend | React + TypeScript | Sharing the same types between the frontend and backend catches mismatches before they become bugs. |
| Look and feel | Tailwind CSS + shadcn/ui | This app is full of tables, lists, and status labels: vendor lists, the Trust Profile's four sections, alert cards. This combination already has clean, ready-made pieces for exactly that. |
| Scheduling recurring tasks | node-cron | Simple, built-in, no extra setup, good enough for regular vendor checks and the reminder system. |
| Vendor checking | Setu's free testing environment | Free to build and test with, well explained, covers tax number, PAN, and bank account checks all in one place. |
| AI writing | Anthropic's Claude, through their toolkit | The natural choice, since the whole thing is being built inside Claude Code already. |


## 2. What Information We Store, and How It's Connected
The single most important decision here is that we keep "vendor records as each factory entered them" separate from "the one real, confirmed vendor." Many raw entries can match down to one real vendor. This is exactly what lets us catch the same vendor being entered twice at two different factories, built right into how the information is stored, not just something the screen shows.
(The exact technical layout, every table and field, is kept unchanged below, since simplifying code would break it. The explanations around it are in plain words.)
sql
companies
  id, name, cin, pan, created_at

plants
  id, company_id (FK), name, state, plant_gstin, created_at

users
  id, company_id (FK), plant_id (FK, nullable),
  name, email, role  -- enum: plant_finance, group_compliance,
                      --       group_procurement, cfo, admin

vendor_records            -- raw, as imported, one per plant
  id, plant_id (FK), vendor_id (FK, nullable until matched),
  source_system, raw_name, raw_gstin, raw_pan,
  raw_bank_account, raw_ifsc, imported_at,
  import_status  -- enum: pending_match, matched, insufficient_data
                  -- covers messy Day-0 imports that can't be matched
                  -- or verified due to missing/malformed identifiers,
                  -- never left silently unresolved

vendors                   -- resolved, canonical, one per real vendor
  id, company_id (FK), legal_name, primary_gstin, pan,
  entity_status, created_at

vendor_gstins               -- a vendor can hold several, state-wise
  id, vendor_id (FK), gstin, state, status, last_verified_at

verification_attributes    -- implements the six-state taxonomy
  id, vendor_id (FK), attribute_type,   -- enum: gstin_status,
                                         -- udyam_status, bank_account,
                                         -- entity_status
  value, source, last_verified_at,
  status  -- enum: verified, changed, conflict,
          --       stale, unavailable, review_required

bank_accounts
  id, vendor_id (FK), account_number_masked, ifsc,
  account_holder_name, name_match_result, last_verified_at, status

duplicate_matches
  id, vendor_record_id_a (FK), vendor_record_id_b (FK),
  match_confidence,   -- always returned by the system and
                       -- always shown on screen, never a bare
                       -- "duplicate/not duplicate" without it
  matched_on,          -- e.g. "gstin", "pan+name"
  status,  -- enum: pending_review, confirmed_merge, dismissed
  reviewed_by (FK users), reviewed_at

invoices
  id, vendor_id (FK), plant_id (FK), invoice_number, amount,
  invoice_date, acceptance_date, written_agreement_exists (bool),
  agreed_payment_days,
  msme_classification_at_invoice,  -- locked in at invoice time, never
                                    -- automatically updated later
  due_date, payment_status, financial_year

payments
  id, invoice_id (FK), amount, payment_date, is_partial (bool)

changes
  id, vendor_id (FK), attribute_type, old_value, new_value,
  detected_at, verification_status

alerts
  id, vendor_id (FK), change_id (FK, nullable),
  duplicate_match_id (FK, nullable), invoice_id (FK, nullable),
  alert_type,  -- enum: bank_mismatch, possible_duplicate,
               --       msme_deadline, gst_status_change,
               --       deregistration
  severity, assigned_to (FK users),
  status,  -- enum: open, resolved, escalated, snoozed, dismissed
  escalation_deadline,  -- set when the alert is created, based on
                         -- how serious it is; a scheduled check marks
                         -- it "escalated" if it's still open past this
  ai_explanation, created_at, resolved_at, resolution_reason

audit_log                  -- a permanent record, never edited or erased
  id, entity_type, entity_id, action, performed_by (FK users, nullable),
  reason, evidence_ref, timestamp

exports
  id, company_id (FK), export_type,  -- enum: form_3cd, mca_msme1
  period, generated_at, generated_by (FK users)
How the pieces connect. One factory has many raw vendor records. Those raw records match down to one real vendor. One real vendor has many checked attributes, bank accounts, invoices, changes, and alerts. One invoice can have many payments. And every single action anywhere in the system writes a permanent record that nothing else ever overwrites.
Why a vendor's small-business status gets locked in at invoice time, not updated automatically. A vendor's official classification can change after an invoice is created. The payment-deadline math has to use whatever was true at that moment. Otherwise, old numbers would silently change every time a vendor's status changes today.
Why we track "not enough information yet." A company's very first upload will have missing tax numbers and messy formatting. Without a clear label for that, those records would just sit there, unresolved, and nobody would notice.
Why every alert has a built-in deadline. Without one, an alert could sit untouched forever, which defeats the whole purpose for something urgent, like a bank-account change on a vendor about to be paid.

## 3. How Different Parts of the System Talk to Each Other
POST   /auth/login
       body: { email, password }
       returns: { token, user: { id, role, company_id, plant_id } }

POST   /companies/{id}/plants
       body: { name, state, plant_gstin }

POST   /plants/{id}/vendor-records/import
       body: multipart CSV or { source_system, records: [...] }
       returns: { imported_count, matched_count,
                   pending_review_count, insufficient_data_count }

GET    /vendor-records?import_status=insufficient_data
       returns: [{ id, plant_id, raw_name, missing_fields }]

GET    /vendors?status=&plant_id=&search=
       returns: [{ id, legal_name, plant, status, last_verified_at }]

GET    /vendors/{id}
       returns: full Trust Profile: identity, compliance,
                finance context, verification_attributes array,
                change history

POST   /vendors/{id}/verify
       triggers an on-demand re-check against external sources
       returns: { verification_attributes: [...] }

GET    /duplicate-matches?status=pending_review
       returns: [{ id, vendor_record_a, vendor_record_b,
                    match_confidence,
                    matched_on }]

POST   /duplicate-matches/{id}/resolve
       body: { action: "confirm_merge" | "dismiss", reason }

GET    /alerts?status=open&assigned_to=
       returns: [{ id, vendor_id, alert_type, severity,
                    ai_explanation, created_at, escalation_deadline }]

POST   /alerts/{id}/action
       body: { action: "resolve"|"assign"|"escalate"|"snooze"|
                       "dismiss"|"override",
               reason, assigned_to }

GET    /invoices/msme-exposure?company_id=&as_of=

GET    /audit-log?entity_type=&entity_id=&from=&to=

GET    /exports/form-3cd?company_id=&financial_year=
GET    /exports/mca-msme1?company_id=&period=
In plain words: every single request only ever sees the one company it belongs to. There's no way for someone to type in a different ID and see another company's information. That's checked on the server, not just hidden on the screen.

## 4. The Rules Behind the Product
How trust is tracked. Every checked fact about a vendor sits in one of six states: checked and good, changed, the two sources disagree, too old to trust anymore, couldn't be reached right now, or needs a person to look. In plain words, here's how something moves between them. It starts as "couldn't be reached" and becomes "checked and good" once the outside source responds. If a later check comes back different, it becomes "changed." If that change is then confirmed again independently, it goes back to "checked and good." If the internal record and the outside source disagree and can't be sorted out on their own, it becomes "the two sources disagree." If too much time passes since the last successful check (30 days, by default), it becomes "too old to trust." And "needs a person to look" is reserved specifically for possible duplicate vendors, never used for a routine change.
How we work out the small-business payment deadline:
if vendor.msme_classification_at_invoice not in [Micro, Small]:
    not_applicable = true
elif invoice.written_agreement_exists:
    deadline_days = min(invoice.agreed_payment_days, 45)
else:
    deadline_days = 15

due_date = invoice.acceptance_date + deadline_days

if today > due_date and invoice.payment_status != "paid":
    exposure = invoice.amount * company.tax_rate
    flag_for: [form_3cd_clause_22, mca_msme1_half_yearly]
In plain words: the payment deadline is never more than 45 days, no matter what a contract says. If there's no written agreement, it's 15 days. This is checked per invoice, and for part-payments, per unpaid part, never treated as "fully paid" just because some of it was paid.
How we spot duplicate vendors. We only suggest that two vendor entries are the same vendor if they share a tax number, or share a PAN and have a very similar name. Sharing just an address, or just a similar-sounding name, is never enough on its own. This stops us from wrongly flagging two real, separate companies that just happen to share a building or a common name. And no match is ever merged automatically. A person always has to confirm it.
How alerts get sent to the right person, and what happens if nobody acts. How urgent an alert is depends on how much money is at risk and how soon a deadline is. An alert about one factory goes to that factory's Finance person. An alert about a vendor duplicated across two factories goes up to the group level. And every alert has a built-in deadline. A very urgent one gets escalated automatically after 24 hours if nobody's touched it, a high-priority one after 48 hours, everything else after 5 days, at which point it's automatically sent up to the group level and someone is notified. This means an alert can never just quietly sit there forever, unseen.
How we make sure a "maybe" is never shown as a "definitely." Whenever the system shows a possible vendor match, it always shows how confident it is, never just a plain "yes, duplicate" or "no, not a duplicate." This matters especially for anyone using this information to negotiate with a supplier. They should never think a probable match is a certain one.
What happens with messy, incomplete uploads. If a vendor record comes in with no tax number and no PAN at all, we don't try to check it or match it. We mark it clearly as "needs more information" and put it in a separate list for someone to complete by hand, rather than losing it or leaving it stuck halfway processed.
How far AI is allowed to go. The AI only ever sees the specific facts already stored in the system: what changed, the old and new values, where the information came from, which invoices are affected, and it only writes an explanation. It's never allowed to change anything, work out a legal deadline by itself, or state something it wasn't actually given as fact.
Rules do the math. Outside sources do the checking. AI explains. People decide.

## 5. Who Can See What, and Who Can Do What

| Role | What they can see | What they're allowed to do |
| --- | --- | --- |
| Factory Finance person | Their own factory's vendors, invoices, and alerts | Fix, assign, or escalate alerts for their own factory |
| Group Compliance | Every factory's vendors and alerts, the full record trail, downloadable reports | Fix or escalate any alert; create reports |
| Group Procurement | Every factory's vendors, possible duplicate matches | Confirm or dismiss a possible duplicate match |
| CFO / Admin | Everything, including settings | Everything, plus managing users and settings |

This is checked on the server every single time, not assumed just because of what a screen shows, so a Factory Finance person genuinely cannot see another factory's data, even by trying to trick the system. Only Group Procurement, Group Compliance, or an Admin can confirm a duplicate match. A Factory Finance person can look at a possible match but can't approve merging it, since that affects more than just their own factory. And when an alert gets escalated, it becomes visible to Group Compliance and the CFO no matter which factory it started at. That's the entire point of escalating it.

## 6. Things We've Made Sure to Handle
We never automatically merge two vendors. A person always has to confirm it. Nothing in the system can do this on its own.
Having more than one tax number under one company is normal, not suspicious. The system checks for genuine multi-location tax registrations before ever suggesting two vendors are duplicates.
"Couldn't check" is never treated as "all clear." If a check fails, the record is clearly marked as unverified, and it never quietly stops an alert from being sent just because a check couldn't be completed.
The small-business payment rule only applies to Micro and Small businesses, never Medium-sized ones, even if they're registered.
The payment deadline is never more than 45 days, no matter what any contract says.
Part-payments are tracked individually, so a partial payment never accidentally marks a whole invoice as fully paid.
A disputed or rejected delivery shifts the deadline correctly, instead of always counting from the invoice date.
If an outside source is down, we never quietly assume everything's fine. We mark it clearly as unchecked.
Anyone overriding a decision has to give a reason. The system won't accept an empty one.
An alert can never sit forever without anyone noticing. The built-in deadline and automatic escalation take care of that.
A "maybe" duplicate is never shown as a certain one.
Messy uploads are never silently lost. They're clearly flagged for someone to complete.

## 7. Big Decisions We Made, and Why
We buy the vendor-checking service rather than build our own connection to government records. Companies like Setu already do this well. There's no reason to rebuild it.
We will never let the system automatically block a payment or merge a vendor on its own. This is a permanent choice, not just something true for now.
Anything involving money or legal rules is worked out by fixed, checkable logic. AI is only ever used to explain, never to calculate. This keeps anything that ends up in a tax filing fully checkable, line by line.
For the first version, we accept a simple spreadsheet upload instead of connecting directly to every factory's software. This saves a huge amount of build time, and means we're not depending on how reliable each factory's own system is before we've even proven the idea works.
All our data is stored inside India. This isn't optional. It's necessary given how sensitive bank and tax information is, and what India's data protection law expects.
We identify a vendor by their tax number and PAN, not by "whichever company happened to create this record." This was a small, cheap decision made early, so that if we ever build the shareable version of the Trust Profile later, we won't have to rebuild everything from scratch.

## 8. What We're Deliberately Not Building Right Now
Connecting directly and deeply into every factory's own software. For now, a spreadsheet upload is enough.
Tracking licenses, certificates, and insurance. Needs a place to store documents, which doesn't exist yet.
Tracking changes in who owns a vendor company. Needs a much heavier data source than what we're using now.
A portal where vendors can update their own details.
A public way for other systems to plug into ours.
A mobile app.
Automatically blocking any payment, for any reason.
A Trust Profile that's shared across different companies, the big dream from earlier, needs proof one company will pay for the single-company version first.
Any decision made by AI beyond writing an explanation.
Also deliberately set aside, not forgotten: protecting against someone deliberately trying to trick our duplicate-detection system (worth doing once the basic version is proven, not before); figuring out data-sharing rules for joint-venture or partly-owned factories (a legal question to raise directly with real companies first); and matching vendor names written in different regional languages or scripts (our current tax-number-first approach mostly avoids needing this, but it's a known gap for later).


# Implementation Plan: How to Actually Build It

### A starting folder structure
nirantar/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── plants/
│   │   ├── users/
│   │   ├── ingestion/
│   │   ├── verification/
│   │   ├── identity-resolution/
│   │   ├── monitoring/
│   │   ├── msme-rules/
│   │   ├── invoices/
│   │   ├── alerts/
│   │   ├── ai-explain/
│   │   ├── audit/
│   │   ├── exports/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── App.tsx
│   └── package.json
└── README.md

## Piece 1: Signing in, companies, factories, users
What's needed: express, jsonwebtoken, bcrypt, prisma, @prisma/client
What to build: the sign-in system, plus the basic setup for companies, factories, and users
How to know it's done right: signing in gives you a working pass; trying to look at another factory's data with the wrong pass gets blocked, not shown.
How to test it: signing in correctly; a wrong password; an expired pass; directly trying to reach another factory's data.

## Piece 2: Bringing vendor data in
What's needed: multer, csv-parse
What to build: the file upload, and marking incomplete records as "needs more information" instead of silently dropping them
How to know it's done right: a real, messy spreadsheet uploads without crashing; incomplete rows show up in the review list, not vanish.
How to test it: a clean test file; a genuinely messy one with missing pieces.

## Piece 3: Checking vendors against outside sources
What's needed: axios
What to build: the connection to Setu's checking service, and turning its answers into our six trust states
How to know it's done right: a known-good test tax number comes back "checked and good"; a broken connection comes back "couldn't check," not a crash.
How to test it: a correct test call; wrong login details; a simulated timeout.

## Piece 4: Spotting duplicate vendors
What's needed: a name-comparison tool (string-similarity or fastest-levenshtein)
What to build: the matching logic, and the screen where a person confirms or rejects a possible match
How to know it's done right: two records sharing a tax number get matched; two records only sharing an address don't; the confidence level is always shown; a Factory Finance person can't approve a merge.
How to test it: specifically the case of two real, separate companies that just happen to share an address. Make sure they're not wrongly matched.

## Piece 5: Watching for changes over time
What's needed: node-cron
What to build: the scheduled job that re-checks everything regularly and records what's changed
How to know it's done right: a manually changed test value gets caught on the next scheduled check.
How to test it: run it with the checking service deliberately broken partway through. It shouldn't crash the whole batch.

## Piece 6: Small-business payment rules
What's needed: nothing extra, this is pure logic
What to build: the exact deadline and exposure calculation, written as a standalone, fully testable piece of code with no outside dependencies
How to know it's done right: every possible situation has a passing test: small business or not, with or without a written agreement, disputed or not, part-paid or fully paid.
How to test it: this is the single highest-stakes piece of logic in the whole product. Every situation needs to be tested before this code touches anything else.

## Piece 7: Alerts
What's needed: nothing extra beyond what's already installed
What to build: creating alerts with the right urgency and deadline, the actions someone can take on them, and the automatic escalation check
How to know it's done right: a very urgent alert left untouched escalates automatically and goes to the group level; trying to override something without giving a reason is rejected.
How to test it: fast-forward a test clock to make sure escalation actually triggers, without waiting real hours.

## Piece 8: The AI explanation
What's needed: Anthropic's official toolkit
What to build: a message sent to Claude containing only the specific facts about one alert, asking for a plain explanation that only uses what it was given
How to know it's done right: given very little information, the explanation says so honestly, rather than making something up; this part of the system can never write to the database beyond its own explanation.
How to test it: deliberately give it a sparse, thin example and check by hand that it doesn't invent anything.

## Piece 9: Keeping a permanent record, and reports
What's needed: a report-formatting tool (exceljs or pdfkit)
What to build: a permanent log hooked into every single action across the whole system, plus the two specific report formats needed for filing
How to know it's done right: every action leaves a permanent trace; nobody, not even an admin through the app, can edit or delete that trace, enforced at the database level itself.
How to test it: try to directly delete a record from the permanent log using a limited database account. It should fail.

## Piece 10: The dashboards
What's needed: a charting tool if a trend graph is wanted (recharts)
What to build: the summary screens, built from live counts, never a separately-stored number that could drift out of sync with reality
How to know it's done right: every number on the dashboard matches what you'd get by checking the database directly.
How to test it: manually check the database and compare it to what the dashboard shows.

## What Order to Build These In
Pieces 1, 2, 3, and 4 have to happen in that exact order. Each one needs the one before it. Pieces 5, 6, and 7 can happen in any order once 1 through 4 are solid, since they each build on that same foundation separately. Piece 8, the AI, comes deliberately last among the core pieces. Explaining shaky information just gives confident wrong answers, faster. Pieces 9 and 10 sit on top of everything else, so they naturally come last.

## Testing the Whole Journey, Including When Things Go Wrong
The bank-detail-change journey: upload, check, spot the change, create an alert, explain it, a person resolves it, it's recorded. And the same journey with the checking service down partway through.
The duplicate-vendor journey: two records at different factories, matched, shown for review, confirmed, merged, keeping both histories. And the same journey where a reviewer says "not the same vendor," making sure they correctly stay separate.
The small-business payment journey: an invoice is created, the deadline is worked out correctly for its specific situation, a reminder fires before the deadline, it's paid on time, the risk clears. And the same journey where it's paid late, making sure it correctly shows up in both required reports.
The escalation journey: a very urgent alert left untouched. Check that it escalates on schedule and reaches the right person, not just that the setting exists somewhere.
The messy-upload journey: a spreadsheet with genuinely incomplete rows. Check that they land in the review list instead of disappearing, and that completing the missing information puts them back on the normal path.
Each of these is a real, complete journey with a documented way it can fail. It's worth deliberately testing the failure, not just hoping it never happens.
