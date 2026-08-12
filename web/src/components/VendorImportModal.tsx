import { useEffect, useRef, useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { importVendorRecords, ApiError } from '../api';
import type { VendorImportResult } from '../types';
import Dropdown from './Dropdown';
import { colors, radius, shadow, type, transition } from '../theme';

export interface PlantOption {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  plantOptions: PlantOption[];
  onImported: () => void;
}

type Step = 'pick' | 'uploading' | 'result' | 'error';

// This modal only ever sends the selected file and renders exactly what the
// backend's import response says happened — it does not re-validate rows,
// re-derive counts, or guess at what a status means. The backend is the
// single source of truth for what counts as imported / skipped /
// insufficient_data; duplicating that logic here would let the two drift.
export default function VendorImportModal({ open, onClose, plantOptions, onImported }: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [plantId, setPlantId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VendorImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This component stays mounted (just renders null) while closed, so it's
  // present in the tree before `vendors` has loaded and plantOptions is
  // still empty — a useState initializer would only run once, at that
  // empty-array moment, and never pick up the real options once they
  // arrive. Syncing here instead, without stomping a selection already made.
  useEffect(() => {
    if (!plantId && plantOptions[0]) setPlantId(String(plantOptions[0].id));
  }, [plantOptions, plantId]);

  if (!open) return null;

  function reset() {
    setStep('pick');
    setFile(null);
    setResult(null);
    setErrorMessage(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleUpload() {
    if (!file || !plantId) return;
    setStep('uploading');
    setErrorMessage(null);
    try {
      const res = await importVendorRecords(Number(plantId), file);
      setResult(res);
      setStep('result');
      onImported();
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : 'Could not reach the server. Check your connection and try again.',
      );
      setStep('error');
    }
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(19,27,46,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: radius.lg,
          boxShadow: shadow.popover,
          width: '100%',
          maxWidth: 480,
          margin: '0 20px',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ ...type.h2, fontSize: 18, color: colors.ink }}>Import vendors</div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              display: 'flex',
              border: 'none',
              background: 'none',
              padding: 4,
              cursor: 'pointer',
              color: colors.faint,
            }}
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        {step === 'pick' && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>Plant</div>
            <div style={{ marginBottom: 16 }}>
              <Dropdown
                value={plantId}
                onChange={setPlantId}
                options={plantOptions.map((p) => ({ value: String(p.id), label: p.name }))}
              />
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>
              Vendor CSV
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 14px',
                border: `1px dashed ${colors.border}`,
                borderRadius: radius.sm,
                background: colors.surfaceSunk,
                color: file ? colors.ink : colors.faint,
                fontSize: 13,
                fontFamily: 'inherit',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <Upload size={15} strokeWidth={2.25} style={{ flex: 'none' }} />
              {file ? file.name : 'Choose a CSV file'}
            </button>

            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || !plantId}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: radius.sm,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !file || !plantId ? 'default' : 'pointer',
                  background: colors.primary.gradient,
                  color: '#fff',
                  opacity: !file || !plantId ? 0.5 : 1,
                }}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '10px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#fff',
                  color: colors.muted,
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'uploading' && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
            Uploading and checking rows…
          </div>
        )}

        {step === 'error' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: '#F8E9E9',
                border: '1px solid #E9BFBF',
                borderRadius: radius.sm,
                padding: '10px 12px',
                marginBottom: 18,
                color: colors.danger,
                fontSize: 13,
              }}
            >
              <AlertTriangle size={15} strokeWidth={2.25} style={{ flex: 'none', marginTop: 1 }} />
              <span>{errorMessage}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setStep('pick')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: radius.sm,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: colors.primary.gradient,
                  color: '#fff',
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '10px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#fff',
                  color: colors.muted,
                }}
              >
                Close
              </button>
            </div>
          </>
        )}

        {step === 'result' && result && <ImportSummary result={result} onDone={handleClose} onImportAnother={reset} />}
      </div>
    </div>
  );
}

function ImportSummary({
  result,
  onDone,
  onImportAnother,
}: {
  result: VendorImportResult;
  onDone: () => void;
  onImportAnother: () => void;
}) {
  const hasSkipped = result.parse_errors.length > 0;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: hasSkipped ? 16 : 22 }}>
        <SummaryStat label="Imported" value={result.imported_count} color={colors.success} />
        <SummaryStat label="Pending review" value={result.pending_review_count} color={colors.muted} />
        <SummaryStat label="Insufficient data" value={result.insufficient_data_count} color="#1E7A8C" />
      </div>

      {hasSkipped && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={13} strokeWidth={2.25} color={colors.warning} />
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.warning }}>
              {result.parse_errors.length} row{result.parse_errors.length === 1 ? '' : 's'} skipped
            </span>
          </div>
          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: radius.sm,
            }}
          >
            {result.parse_errors.map((e, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  borderBottom: i < result.parse_errors.length - 1 ? `1px solid ${colors.divider}` : 'none',
                }}
              >
                <span style={{ color: colors.faint, flex: 'none' }}>Row {e.row}</span>
                <span style={{ color: colors.slate, textAlign: 'right' }}>{e.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: radius.sm,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: colors.primary.gradient,
            color: '#fff',
          }}
        >
          Done
        </button>
        <button
          type="button"
          onClick={onImportAnother}
          style={{
            padding: '10px 16px',
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: '#fff',
            color: colors.muted,
            transition: `background ${transition.base}`,
          }}
        >
          Import another file
        </button>
      </div>
    </>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: colors.surfaceSunk, borderRadius: radius.sm, padding: '12px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.3px' }}>{value}</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: colors.faint, marginTop: 2 }}>{label}</div>
    </div>
  );
}
