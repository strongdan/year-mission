"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  listLabProgressAction,
  saveConfirmedLabScanAction,
  scanLabImageAction,
  type ConfirmedLabScan,
} from "@/app/lab-actions";

interface LabPanelView {
  id: string;
  collected_at: string | null;
  source_name: string | null;
  ai_interpretation: string | null;
  created_at: string;
}

interface LabResultView {
  id: string;
  panel_id: string;
  test_name: string;
  loinc_code: string | null;
  value_numeric: number | string | null;
  value_text: string | null;
  unit: string | null;
  reference_low: number | string | null;
  reference_high: number | string | null;
  reference_text: string | null;
  abnormal_flag: string;
  created_at: string;
}

interface LabProgressView {
  panels: LabPanelView[];
  results: LabResultView[];
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/fhir+json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toFhirBundle(scan: ConfirmedLabScan) {
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: scan.results.map((result, index) => ({
      fullUrl: `urn:uuid:year-mission-lab-${index}`,
      resource: {
        resourceType: "Observation",
        status: "final",
        category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
        code: {
          coding: result.loincCode ? [{ system: "http://loinc.org", code: result.loincCode, display: result.testName }] : undefined,
          text: result.testName,
        },
        effectiveDateTime: scan.collectedAt ?? undefined,
        valueQuantity: result.valueNumeric != null ? { value: result.valueNumeric, unit: result.unit ?? undefined } : undefined,
        valueString: result.valueNumeric == null ? result.valueText ?? undefined : undefined,
        referenceRange:
          result.referenceLow != null || result.referenceHigh != null || result.referenceText
            ? [{
                low: result.referenceLow != null ? { value: result.referenceLow, unit: result.unit ?? undefined } : undefined,
                high: result.referenceHigh != null ? { value: result.referenceHigh, unit: result.unit ?? undefined } : undefined,
                text: result.referenceText ?? undefined,
              }]
            : undefined,
      },
    })),
  };
}

export function LabScanCard() {
  const [draft, setDraft] = useState<ConfirmedLabScan | null>(null);
  const [recent, setRecent] = useState<LabProgressView>({ panels: [], results: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await listLabProgressAction();
      if (result.ok) setRecent(result.data as LabProgressView);
    });
  };

  useEffect(() => { load(); }, []);

  const latestPanel = recent.panels[0];
  const latestResults = useMemo(
    () => latestPanel ? recent.results.filter((result) => result.panel_id === latestPanel.id).slice(0, 8) : [],
    [latestPanel, recent.results]
  );

  async function handleImage(file: File | null) {
    if (!file) return;
    setMessage(null);
    const form = new FormData();
    form.set("image", file);
    startTransition(async () => {
      const result = await scanLabImageAction(form);
      if (!result.ok) return setMessage(result.error);
      setDraft(result.data);
      setMessage("AI extracted these values. Review every value before saving.");
    });
  }

  function updateResult(index: number, patch: Record<string, unknown>) {
    if (!draft) return;
    const results = draft.results.map((result, i) => i === index ? { ...result, ...patch } : result);
    setDraft({ ...draft, results });
  }

  function save() {
    if (!draft) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveConfirmedLabScanAction(draft);
      if (!result.ok) return setMessage(result.error);
      setDraft(null);
      setMessage(`Saved ${result.data.resultCount} confirmed lab values.`);
      load();
    });
  }

  return (
    <section className="mx-4 mb-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Blood tests</h2>
          <p className="mt-1 text-xs text-zinc-500">Scan a report, review the extraction, and keep confirmed lab trends with your Progress evidence.</p>
        </div>
        <label className="cursor-pointer rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500">
          {isPending ? "Working…" : "Scan report"}
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            disabled={isPending}
            onChange={(event) => void handleImage(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <p className="mt-3 text-[11px] leading-4 text-zinc-600">
        The image is sent to the configured Gemini vision model for extraction and is not stored by Year Mission. AI can misread lab reports; nothing is saved until you confirm it.
      </p>

      {message && <p className="mt-3 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-300">{message}</p>}

      {draft && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">Collection date/time
              <input className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" value={draft.collectedAt ?? ""} onChange={(e) => setDraft({ ...draft, collectedAt: e.target.value || null })} />
            </label>
            <label className="text-xs text-zinc-500">Lab/source
              <input className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" value={draft.sourceName ?? ""} onChange={(e) => setDraft({ ...draft, sourceName: e.target.value || null })} />
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-[720px] w-full text-xs">
              <thead className="bg-zinc-900 text-zinc-500"><tr><th className="p-2 text-left">Test</th><th className="p-2 text-left">Value</th><th className="p-2 text-left">Unit</th><th className="p-2 text-left">Reference</th><th className="p-2 text-left">Flag</th></tr></thead>
              <tbody>
                {draft.results.map((result, index) => (
                  <tr key={`${result.testName}-${index}`} className="border-t border-zinc-800">
                    <td className="p-2"><input className="w-full bg-transparent text-zinc-200" value={result.testName} onChange={(e) => updateResult(index, { testName: e.target.value })} /></td>
                    <td className="p-2"><input className="w-24 bg-transparent text-zinc-200" value={result.valueNumeric ?? result.valueText ?? ""} onChange={(e) => {
                      const n = Number(e.target.value); updateResult(index, Number.isFinite(n) && e.target.value.trim() !== "" ? { valueNumeric: n, valueText: null } : { valueNumeric: null, valueText: e.target.value || null });
                    }} /></td>
                    <td className="p-2"><input className="w-24 bg-transparent text-zinc-300" value={result.unit ?? ""} onChange={(e) => updateResult(index, { unit: e.target.value || null })} /></td>
                    <td className="p-2"><input className="w-40 bg-transparent text-zinc-400" value={result.referenceText ?? [result.referenceLow, result.referenceHigh].filter((v) => v != null).join("–")} onChange={(e) => updateResult(index, { referenceText: e.target.value || null })} /></td>
                    <td className="p-2 text-zinc-400">{result.abnormalFlag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {draft.interpretation && (
            <div className="rounded-xl bg-zinc-900/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">AI summary</p>
              <p className="mt-1 text-sm leading-5 text-zinc-300">{draft.interpretation}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button disabled={isPending} onClick={save} className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">Confirm & save</button>
            <button onClick={() => downloadJson("year-mission-labs.fhir.json", toFhirBundle(draft))} className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300">Export FHIR JSON</button>
            <button onClick={() => setDraft(null)} className="rounded-xl px-3 py-2 text-xs text-zinc-500">Discard</button>
          </div>
        </div>
      )}

      {!draft && latestPanel && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-medium text-zinc-300">Latest panel</p>
            <p className="text-[11px] text-zinc-600">{latestPanel.collected_at ? new Date(latestPanel.collected_at).toLocaleDateString() : "date unknown"}</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {latestResults.map((result) => (
              <div key={result.id} className="rounded-xl bg-zinc-900/70 p-3">
                <p className="truncate text-[11px] text-zinc-500">{result.test_name}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">{result.value_numeric ?? result.value_text ?? "—"} <span className="font-normal text-zinc-500">{result.unit ?? ""}</span></p>
                {result.abnormal_flag !== "unknown" && <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">{result.abnormal_flag}</p>}
              </div>
            ))}
          </div>
          {latestPanel.ai_interpretation && <p className="mt-3 text-xs leading-5 text-zinc-500">{latestPanel.ai_interpretation}</p>}
        </div>
      )}

      <div className="mt-4 border-t border-zinc-900 pt-3 text-[11px] leading-4 text-zinc-600">
        Apple Health clinical lab records are read-only to third-party apps, so Year Mission cannot write arbitrary scanned lab reports into Health. The FHIR export preserves structured results for portability; a future native iOS bridge can write only HealthKit data types Apple explicitly allows apps to share.
      </div>
    </section>
  );
}
