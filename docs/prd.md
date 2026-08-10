# Problem Space

## 14. Narrowed Problem Statement
Companies that make things (car parts, machines, whatever) often work with hundreds or thousands of suppliers, called vendors, and often run more than one factory. Here's the problem. When a company first starts working with a vendor, they check that vendor carefully. But after that, nobody checks again. Ever.
A vendor's bank account can change. Their tax papers can go bad. Whether they count as a small business (which affects how fast they must be paid, by law) can change too. And because each factory adds its own vendors on its own, the same vendor often gets added two or three times under slightly different names, and nobody notices.
So the Finance team keeps paying people and making decisions based on information that might already be wrong. Usually, nobody finds out until something breaks: a payment goes to the wrong place, someone gets paid twice, or an auditor asks a question nobody can answer.

## 15. Key Assumptions
endor information gets messy and out of date after a company starts working with them. We're very sure about this. Where this comes from: our own course research. All three research teams found this independently, and it was the strongest finding in the whole study.
Vendor information really does change after a company approves a vendor. Very sure. Where this comes from: the GST Search Taxpayer tool; the Udyam Registration check page.
You can check this information from outside the company. You don't need to ask the vendor. Very sure. Same two official sites above; anyone can use them for free.
Finance teams have a real, costly reason to care about this (a specific tax rule, Section 43B(h)). Very sure. Where this comes from: an explanation of the 45-day payment rule; a guide to the tax rule and the MSME-1 form; MSME Samadhaan, the government's own site for this.
Finance teams need to be told what a change means, not just shown raw data. A strong signal, not proven yet. Other tools in this space already do more than just show raw data. That's the gap our AI-written explanations are meant to fill.
People need to see proof before they trust a warning, not just take AI's word for it. This is a rule we're building by, not something we've tested yet. Every explanation must show where it came from, so someone can double-check it.
AI should help explain things, but never make the final call. This is our own choice, not a proven fact. AI can explain a change; a person still decides what happens next.
Not every single change is worth an alert. Our own guess, still to be tested.
The same vendor getting added twice at different factories happens often enough, and costs enough, that it's worth building the product around. Very sure. Where this comes from: the Washington State Auditor's Office. Companies accidentally pay the same vendor twice on 0.8 to 2% of all payments, and one dataset showed $6.8 million in fraud losses since 2021, tied to bank details being changed and nobody checking. Backed up by apexanalytix and Trustpair. One company cleanup job found 3,278 duplicate vendors in a single database.
Companies will actually pay money for ongoing checking, not just a one-time check when a vendor joins. This is our weakest guess. A Gartner survey (mentioned in our course research) found only 27% of effort goes into ongoing checking, versus 73% going into the one-time check at the start. That shows companies currently spend their effort unevenly. It doesn't prove they'll pay to fix it.
The big takeaway. The one guess that could sink this whole idea if we're wrong is that an early warning, explained clearly, actually makes Priya (our example user) do something differently, not just something she reads and ignores.


# Solution Space

## 2. What We're Building, in One Idea
Nirantar quietly sits behind the systems a factory already uses, and keeps an eye on every vendor after they've been approved. It doesn't replace anything. It just never stops checking.
At the middle of it is something we call the Vendor Trust Profile, one single place that holds everything about a vendor: who they are, whether their paperwork is in order, and what they're owed. For every single piece of that, it shows you the value, where that value came from, when it was last checked, and whether you can currently trust it.
When something changes, a plain-language explanation (written with the help of AI, but AI never gets the final say) tells you what changed, why it matters, what it affects, and what to do next. The actual decision always stays with a person.
Where the "gap in the market" claim comes from: apexanalytix and Trustpair both already watch vendors continuously, but only for bank fraud, worldwide, with nothing built for India's tax or small-business rules, and no single named "profile" per vendor like ours.
The big takeaway. Every competitor either checks a vendor once and stops, or watches all the time but just shows raw numbers. What makes Nirantar different is doing both at once: one trusted profile per vendor, explained in plain words, tied to what it's actually costing this company.


## 3. Primary User Persona
Priya Deshmukh, 34, Plant Finance Manager at a mid-size car-parts factory in Pune, part of a company that runs four factories across two states.
Priya's main goal is simple. Pay the right vendor, the right amount, on time, without anything blowing up on her desk later. Right now, checking on a vendor means jumping between five different places: the company's main system, the vendor list, the invoice, a spreadsheet, an email, and sometimes a government website, then putting the answer together herself. In her own words: "I can find the information if I spend enough time looking for it. I just don't know when I need to look." She doesn't need more data. She needs one place to look, and a plain-language explanation of what changed and why it matters, not a wall of numbers she has to figure out herself.
Note: Priya isn't a real person we interviewed. She's a stand-in built to match the kind of user our research points to.
The big takeaway. The one thing that can never break, no matter what else changes, is this: Priya has to be able to trust that when the Trust Profile says something is checked, and the AI explains why it matters, both are actually correct. If she gets fooled even a few times, she'll stop trusting the tool and go back to checking everything herself.

## 4. Product Flow
4.1 Getting started. A new company connects their vendor data, just a spreadsheet export, nothing complicated, and within minutes, sees real results: a Trust Profile for every vendor, showing which ones check out, and which ones might already exist twice under a slightly different name at another factory.
4.2 How information comes in, and how a change gets caught. There are three ways information enters the system: a bulk spreadsheet upload, an authorised person manually editing a record, or a vendor sending in their own update. All three are treated the same way, as something to check, not something to just believe, until it's confirmed against an outside source. Vendor self-service is out of scope for the MVP itself, so in practice, for this first version, information mostly comes in through a bulk upload or an internal manual edit.
Here's how that actually plays out. The company periodically uploads a fresh vendor list from its own system, whether that's Tally or something else. Nirantar compares this new upload against the last trusted information it already has stored. For example, if the bank account on file changes from one number to a different one, Nirantar notices the difference immediately and flags it as a change. It then checks that new information against the right outside source before doing anything else with it.
The flow looks like this: spreadsheet upload, compare against the last known value, change detected, check it against an outside source, alert, a person decides. The same approach applies to every attribute the product watches, not just bank details. And if the outside source can't be reached when this happens, Nirantar never marks the new value as confirmed. It keeps showing the last value that was actually verified, and clearly says the latest check couldn't be completed.
4.3 The everyday loop. This is the part Priya never has to think about. The system watches, notices when something changes, checks it against an outside source, and only then figures out what it means and what it might cost, before pulling a person in at all.
4.4 Looking something up. Before sending a payment, what Priya actually opens is the vendor's Trust Profile, one screen instead of five separate systems, with an answer in seconds.
4.5 Getting reminded. Ten days before a small-business payment deadline, Priya gets a reminder that says the actual rupee amount at stake, in plain words, not just a date on a calendar.
The big takeaway. The one step that asks the most of a person is confirming whether two vendor records are actually the same vendor. We made that a real decision a person makes, not something automatic, because merging two different vendors by mistake is worse than just asking someone to take one look.




User Flow: the Whole Journey, and What Happens When Something Goes Wrong

Here's how it goes. A brand-new company sets things up first; someone who's already using it goes straight to their dashboard. Everything else is one path.
Now the part that covers every situation, what happens once something is flagged:

Diagram 1. A person either sets things up for the first time, or logs straight into their dashboard, checks what needs attention, deals with it, and it's recorded automatically.
Diagram 2. No matter which of the three things triggered a flag, the shape of what happens next is the same. Something gets flagged, a person makes one specific kind of decision, and the outcome (approved, rejected, fixed, or sent up the chain) always ends up in the same record-keeping trail.
How an alert moves through the system, step by step. Every alert follows the same simple path: it opens, a person reviews it, that person makes a decision, and it's marked resolved or dismissed. If nobody acts within the time the alert allows, the path changes: it opens, nobody acts in time, it escalates automatically, and it gets picked up at the group level instead of staying with just one factory.
Here's what that looks like for a real example, a bank-detail change. The alert says the bank account changed. The decision available to the person reviewing it is to confirm the change, reject it, or investigate further. The final status ends up as resolved, dismissed, or escalated. And whichever way it goes, the decision, the person who made it, the time, the reason, and the evidence behind it all get written into the permanent record.

## 5. Workflow Mapping — Before and After
Before Nirantar, Priya spends her month piecing together a vendor's status from five different places, with no single record she can fully trust, and she only finds out about a real problem after it's already happened. With Nirantar, every vendor has one Trust Profile, an AI-written explanation tells her plainly what changed and why it matters, and she's told before she acts, not after.


The big takeaway. The biggest win isn't hours saved in Priya's day. It's the payments and penalties that never happen at all, because one trusted profile and a clear explanation gave her enough time to act.

6. Platform Architecture

Five parts, working together. The company's own systems feed into the Trust Profile. An explanation engine works out why a change matters. An alert goes to whoever needs to act on it. And every single step gets written down. The one thing we have to work around: government websites like GST and Udyam aren't always available on demand, so the Trust Profile always tells you when something was last confirmed, instead of pretending everything is live all the time.
The rule that governs how AI is used here: the rules do the math, outside sources do the checking, AI explains what it means, and a person decides what happens. AI can sum up a change, explain why it matters, and suggest a next step. It can never make up evidence, work out a legal deadline on its own, or quietly change anything in the Trust Profile.
The big takeaway. The one thing we always designed around is this: outside data sources can be slow or unavailable, and AI can be wrong if it isn't grounded in real facts. So both the Trust Profile and the explanation engine are built to honestly say "not sure yet" instead of guessing.

## 7. Moonshot
Right now, the Trust Profile only exists inside one company. The bigger version of this idea is a shareable Trust Profile, a vendor's checked history, built once, and trusted by more than one company that buys from them. A company with several factories is already, underneath, a bit like several separate buyers sharing one name, each with their own version of the truth about the same vendor. The big dream just stretches that same idea further. Instead of asking "has this vendor already been checked somewhere else in my company," it eventually asks "has this vendor already been checked by any company." We can't build this yet. It only makes sense once enough companies are using Nirantar that there's a real network worth connecting.
The big takeaway. This bigger idea removes work that gets repeated across an entire industry, where two different buyers each pay separately to check the exact same vendor. It's worth waiting for, because a shareable Trust Profile is only valuable once more than one company actually trusts it.

## 8. User Stories
Getting started
As a Finance Manager, I want to connect my existing vendor data without a long setup, so that I see a first Trust Profile the very first time I use it. Done when: a company can go from signing up to seeing a first report in under a day.
As a CFO, I want to see the total risk across every one of our factories as one single number, so that I can decide if this is worth paying for.
Everyday use
As a Finance Manager, I want to be warned before I pay a vendor whose bank details just changed, so that I don't send money to the wrong place. This fixes the bank-fraud problem. See Washington State's $6.8 million figure.
As a Finance Manager, I want the system to explain why a change matters in plain words, so that I don't have to dig through raw numbers myself. This fixes the "too much information, not enough meaning" problem, exactly why the AI explanation exists.
As someone in Procurement, I want to be told if a vendor's Trust Profile already exists at another factory under a different name, so that I don't accidentally create a duplicate.
When something needs to be proven
As a Compliance lead, I want one file I can download that shows every vendor change and what was done about it, so that I'm not rebuilding this by hand every March.
The big takeaway. The bank-account warning is the one example that would hurt the most if it quietly failed. Real money lost, not just wasted time. So it deserves the most testing, more than the AI's writing quality.

## 9. MVP Scope
The first version builds a Trust Profile for every vendor, at every factory, explains in plain language when something meaningful changes, and catches bank detail changes, small-business payment risk, and vendors that look like they've been duplicated. Nothing more than that, on purpose.
The Vendor Trust Profile. Our guess: one clear, proven view beats scattered raw data. It fails if people keep checking separate systems anyway.
Checking vendors against tax, small-business, and bank records. Our guess: checking independently catches things the company didn't already know about. Backed by the Washington State Auditor's Office.
Matching vendors across factories. Our guess: real, previously-unknown duplicate vendors exist and cost real money. Backed by apexanalytix, where 3,278 duplicates were found in one company's cleanup.
Working out small-business payment risk. Our guess: an early, specific rupee warning changes what Finance actually does. Backed by the law behind the 45-day payment rule.
The AI explanation. Our guess: a change that's been explained gets acted on faster than raw data. It fails if people ignore the explanation and go check the raw evidence themselves anyway.
The big takeaway. The one guess that would sink the whole idea if it's wrong is that a Trust Profile plus a clear explanation actually changes what someone does, not just gets read and forgotten.
What evidence gets shown with every alert. Every meaningful alert has to show the proof behind it, not just the conclusion. For a bank-detail change, that means the person can see the previous value, the new value, where the new value came from, when the change was first noticed, when it was last verified, the result of that verification, which vendor and factory it affects, and any invoice or payment it touches. The whole point is that nobody should have to trust Nirantar blindly. They should be able to see exactly why an alert was raised and check the evidence themselves if they want to. The same rule applies to duplicate-vendor alerts and small-business payment alerts too, not just bank changes.
(A much more detailed explanation of this MVP scope, what's in, what's out, and why, is further down in this document.)


## 10. What We Left Out and Why
Tracking licenses and certificates. Needs a place to store documents, which we haven't built yet.
A portal where vendors update their own info. Would make the product depend on vendors actually using it, a separate problem entirely.
Automatically blocking a payment. A wrong block could damage a real vendor relationship. The system suggests; a person decides.
Letting AI make the final call on a payment or a compliance decision. Left out on purpose, and permanently, not just for now. AI explains. It never decides.
One overall "risk score" per vendor. Would hide the actual proof behind a single number instead of showing it.
A Trust Profile shared across different companies. The big dream from section 7. Needs proof that one company will pay for the single-company version first.
The big takeaway. The biggest risk of keeping AI's role limited this way is that an explanation might sometimes be less complete than a fully automatic system could offer. We're betting that a person trusting the system matters more than speed.

## 11. Success Metrics
The main number we care about: what percentage of flagged vendor changes get fixed before they cause a real problem. No target set yet. The first month with real companies will set the baseline.
How many active vendors have a current, checked Trust Profile. Target to be set once we have real data.
How many real, previously-unknown duplicate vendors we actually find. Target: at least one genuine duplicate per company we work with.
How often an alert or explanation turns out to be wrong. Warning sign: people start ignoring alerts, or stop trusting the AI's explanation and go check the raw facts themselves instead.
None of the specific numbers above come from outside research. There's no public benchmark for a product this specific yet. The real targets will come from our first month with real companies, stated honestly rather than made up.
The big takeaway. If we could only track one number, it would be the main one above, because everything else, like Trust Profile coverage and explanation quality, only matters if it eventually moves that main number.


## 12. Implementation Plan
First, a manual check with two or three real companies, done by hand, no software yet, just to prove the problem is real. Second, build the foundation: the Trust Profile itself, checked and matched across every factory. This has to come first, since nothing else works without it. Third, add live watching, small-business payment tracking, and bank-detail alerts on top of that foundation. Fourth, add the AI explanation, on purpose, last, because explaining a change well only matters once the underlying information is solid. AI layered on top of shaky data just gives confident wrong answers, faster. Fifth, run a small trial and watch what companies actually do, not just what they say they'll do.
The big takeaway. The riskiest part of this plan is building the AI before the Trust Profile is solid, which is exactly why AI comes last, not first.

## 13. Trade-offs and Limitations
We're not trying to manage everything about vendors. Finding new vendors, negotiating contracts, and running purchases stay exactly where they are today. We're not replacing the company's main system. We chose not to automatically block a payment, because wrongly holding up a payment to a real vendor is a cost we're not willing to risk before our checking is proven reliable. We could let AI handle the whole process end to end. We won't. Payment math and legal deadlines stay as fixed rules anyone can check, and AI's only job is explaining a confirmed change, never deciding what's true. We depend on outside sources, GST and Udyam, being available and correct. When they go quiet, the product says so honestly instead of guessing.
The big takeaway. The trade-off we're least comfortable with is never letting AI make the final call, even when it seems confident. We chose the slower, human-checked path as the safer place to start.

## 14. Who Else Is Doing This, and What Makes Us Different
Nobody else does exactly what Nirantar does, but plenty of companies do pieces of it, and it's worth being honest about each one rather than pretending the space is empty.
Reason KYV is the closest match we found in India. It checks GST and PAN details, connects to a company's existing systems, and produces reports ready for an audit. It's built for the same country, the same kind of problem. What we couldn't confirm is whether it watches a vendor continuously after the first check, or whether it catches the same vendor being added twice at different factories. Both of those are the core of what Nirantar does.
Trustpair is the closest match anywhere in the world, but only for one piece of the problem. It watches vendor bank details all the time, at real scale (over 500 companies use it), and it's very good at catching fraud. It has nothing built for India's tax rules or small-business payment laws, and it doesn't try to spot the same vendor appearing twice inside one company.
apexanalytix is a large, well-known name in cleaning up messy vendor records. It's found real, large duplicate-vendor problems inside big companies (one cleanup found 3,278 duplicates in a single database), which is strong proof our core idea is real. It's built for huge global companies, not a mid-size Indian factory business, and it isn't built around India's specific rules either.
The big enterprise players (SAP Ariba, Coupa, Ivalua, and similar tools) already offer some vendor-checking features. They're built for very large companies with big budgets and long setup times, often many months just to get started. A mid-size manufacturer with a few factories is usually too small for these tools to make sense, and too complex for a plain spreadsheet to keep handling.
Smaller, India-specific MSME tools (like Figment) already check a vendor's small-business status. What they don't do is connect that single check to bank-fraud checking, cross-factory duplicate matching, and a plain-language explanation, all in one place.
The big takeaway. Every single piece of what Nirantar does already exists somewhere, done well, by someone else. What doesn't exist anywhere we could find is all of it together, built specifically for a mid-size Indian company running more than one factory. That gap, not any single feature, is what we're actually building for.

## 15. How This Makes Money
This part of the plan is a starting guess, not something we've tested with a real paying customer yet, and it's worth saying that plainly rather than presenting it as settled.
The first payment, before any software exists. The very first thing we'd sell isn't a subscription. It's the manual health check described in section 12, sold as a one-time paid service to two or three real companies. This is cheap for us to deliver and gives a company a real, concrete result (an actual list of duplicate vendors and real rupee exposure) before they've committed to anything ongoing.
The ongoing product, once it's built. After the manual check proves the idea works, the plan is a monthly subscription, priced by how many factories a company connects and roughly how many active vendors it's watching, since that's a fair reflection of how much real work the product is doing for them. A company with two factories and a few hundred active vendors would pay less than a company with five factories and a couple thousand.
Who actually decides to pay. The CFO signs off on this, since they're the one who cares about the total risk number. But the day-to-day users, like Priya, are the ones who need to actually trust and use it for the subscription to ever get renewed.
What we genuinely don't know yet. We don't have a real number for what a company would actually pay each month, since nothing exactly like this has been priced in this market before. The honest plan is to let the first few real companies help set that number, rather than guessing it out of thin air and hoping it's close.
The big takeaway. Money only starts coming in twice here: once, small and fast, from the manual health check; and again, larger and ongoing, only after the software has actually proven it changes what a real Finance team does. Skipping straight to the second one without the first would mean asking someone to pay for a promise instead of a proof.
