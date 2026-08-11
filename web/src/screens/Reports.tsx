// DEMO DATA — this entire screen is hard-coded, not backend-wired. The real
// exports table (server/db/001_init.sql) exists in the schema but no route
// generates a real Form 3CD or MCA MSME-1 file yet. "Generate" below only
// simulates a delay and shows a success toast — it does not write to the
// database or produce a downloadable file. Exposure figures reference the
// same seeded vendors used on the MSME Deadlines screen. Real report
// generation (Piece 9) is a later phase.
import { useState } from 'react';
import { FileText, FileSpreadsheet, Check, Download, type LucideIcon } from 'lucide-react';
import Card from '../components/Card';
import { colors, radius, shadow, type } from '../theme';

interface ReportDef {
  id: 'form_3cd' | 'mca_msme1';
  name: string;
  icon: LucideIcon;
  description: string;
  period: string;
  last_generated_at: string | null;
  last_generated_by: string | null;
}

const reportDefs: ReportDef[] = [
  {
    id: 'form_3cd',
    name: 'Form 3CD — Clause 22',
    icon: FileText,
    description:
      'Disallowed MSME payment exposure for tax audit reporting, computed from invoices to Micro and Small vendors that remained unpaid past the statutory deadline.',
    period: 'FY 2025-26, Q1',
    last_generated_at: '1 Aug 2026, 10:00 am',
    last_generated_by: 'Rohan Kapoor (CFO)',
  },
  {
    id: 'mca_msme1',
    name: 'MCA MSME-1',
    icon: FileSpreadsheet,
    description:
      'Half-yearly return of outstanding payments to Micro and Small enterprises beyond the statutory 45-day deadline, filed with the Ministry of Corporate Affairs.',
    period: 'Apr–Sep 2026 (H1)',
    last_generated_at: null,
    last_generated_by: null,
  },
];

interface ExportHistoryRow {
  id: number;
  report: string;
  period: string;
  generated_at: string;
  generated_by: string;
}

const history: ExportHistoryRow[] = [
  { id: 1, report: 'Form 3CD — Clause 22', period: 'FY 2025-26, Q1', generated_at: '1 Aug 2026, 10:00 am', generated_by: 'Rohan Kapoor (CFO)' },
  { id: 2, report: 'Form 3CD — Clause 22', period: 'FY 2024-25, Q4', generated_at: '3 Apr 2026, 4:20 pm', generated_by: 'Arjun Mehta (Group Compliance)' },
  { id: 3, report: 'MCA MSME-1', period: 'Oct 2025–Mar 2026 (H2)', generated_at: '12 Apr 2026, 11:10 am', generated_by: 'Rohan Kapoor (CFO)' },
];

export default function Reports() {
  const [generating, setGenerating] = useState<ReportDef['id'] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Record<string, { at: string; by: string }>>({});

  function handleGenerate(report: ReportDef) {
    setGenerating(report.id);
    setToast(null);
    setTimeout(() => {
      setGenerating(null);
      setLastGenerated((prev) => ({ ...prev, [report.id]: { at: 'Just now', by: 'Rohan Kapoor (CFO)' } }));
      setToast(`${report.name} generated for ${report.period}.`);
      setTimeout(() => setToast(null), 5000);
    }, 1200);
  }

  return (
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <h1 style={{ ...type.h1, margin: '0 0 6px', color: colors.ink }}>Export &amp; Reports</h1>
      <p style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>Statutory filing exports, generated from checked, permanent records.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {reportDefs.map((r) => {
          const Icon = r.icon;
          const isGenerating = generating === r.id;
          const generated = lastGenerated[r.id];
          const lastAt = generated?.at ?? r.last_generated_at;
          const lastBy = generated?.by ?? r.last_generated_by;

          return (
            <Card key={r.id} padding={22} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radius.sm,
                    background: colors.primary[50],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon size={17} strokeWidth={2.25} color={colors.primary[600]} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.name}</div>
              </div>

              <p style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.5, margin: '0 0 16px', flex: 1 }}>{r.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, marginBottom: 16, paddingTop: 14, borderTop: `1px solid ${colors.borderSubtle}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.faint }}>Period</span>
                  <span style={{ fontWeight: 600 }}>{r.period}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.faint }}>Last generated</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{lastAt ? `${lastAt}${lastBy ? ` · ${lastBy}` : ''}` : 'Never'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleGenerate(r)}
                  disabled={isGenerating}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: radius.sm,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isGenerating ? 'default' : 'pointer',
                    background: colors.primary.gradient,
                    color: '#fff',
                    opacity: isGenerating ? 0.7 : 1,
                  }}
                >
                  {isGenerating ? 'Generating…' : 'Generate'}
                </button>
                {lastAt && (
                  <button
                    disabled
                    title="Demo only — no file to download yet"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 14px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.sm,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'not-allowed',
                      background: '#fff',
                      color: '#B7BCC6',
                    }}
                  >
                    <Download size={14} strokeWidth={2.25} />
                    Download
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, overflow: 'hidden', boxShadow: shadow.card }}>
        <div style={{ padding: '16px 24px', fontSize: 13.5, fontWeight: 700, color: colors.ink, borderBottom: `1px solid ${colors.border}` }}>Export history</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.4fr 1.4fr 1.6fr',
            gap: 10,
            padding: '12px 24px',
            fontSize: 11.5,
            fontWeight: 700,
            color: colors.faint,
            borderBottom: `1px solid ${colors.borderSubtle}`,
            background: colors.surfaceSunk,
          }}
        >
          <div>REPORT</div>
          <div>PERIOD</div>
          <div>GENERATED</div>
          <div>GENERATED BY</div>
        </div>
        {history.map((h) => (
          <div
            key={h.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.4fr 1.4fr 1.6fr',
              gap: 10,
              padding: '15px 24px',
              fontSize: 12.5,
              borderBottom: `1px solid ${colors.divider}`,
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 600 }}>{h.report}</div>
            <div style={{ color: colors.muted }}>{h.period}</div>
            <div style={{ color: colors.faint }}>{h.generated_at}</div>
            <div style={{ color: colors.slate }}>{h.generated_by}</div>
          </div>
        ))}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#E7F2EF',
            color: colors.success,
            border: '1px solid #B7DBD2',
            padding: '12px 18px',
            borderRadius: radius.sm + 1,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: shadow.popover,
            maxWidth: 340,
          }}
        >
          <Check size={16} strokeWidth={2.25} />
          {toast}
        </div>
      )}
    </div>
  );
}
