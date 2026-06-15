"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useState } from "react";
import {
  buildDashboardDataFromCsv,
  CsvPreviewRow,
  requiredCsvColumns,
  UPLOADED_DATA_KEY,
  validateCsvRows
} from "@/lib/csvUpload";
import { formatCurrency, formatPercent } from "@/lib/format";

export function CsvUploadWorkspace() {
  const [fileName, setFileName] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);

  const handleFile = (file: File | undefined) => {
    setApplied(false);
    setFileName(file?.name ?? "");
    setPreviewRows([]);
    setErrors([]);
    setMissingColumns([]);

    if (!file) return;

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const validation = validateCsvRows(result.data);
        setPreviewRows(validation.rows);
        setErrors([...validation.errors, ...result.errors.map((error) => `Parse error: ${error.message}`)]);
        setMissingColumns(validation.missingColumns);
      },
      error: (error) => {
        setErrors([error.message]);
      }
    });
  };

  const applyToDashboard = () => {
    const dashboardData = buildDashboardDataFromCsv(previewRows);
    window.localStorage.setItem(UPLOADED_DATA_KEY, JSON.stringify(dashboardData));
    window.dispatchEvent(new Event("accountpulse:uploaded-data"));
    setApplied(true);
  };

  const clearUploadedData = () => {
    window.localStorage.removeItem(UPLOADED_DATA_KEY);
    window.dispatchEvent(new Event("accountpulse:uploaded-data"));
    setApplied(false);
  };

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="section-title">Data Intake</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">CSV upload</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-steel">
              Parse shipment CSVs in the browser, validate required columns, preview computed economics, and update the dashboard for the current session.
            </p>
          </div>
          <a
            href="/sample-shipments.csv"
            download="sample-shipments.csv"
            className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
          >
            Download sample CSV
          </a>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="panel p-6">
          <p className="section-title">Required Columns</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {requiredCsvColumns.map((column) => (
              <span
                key={column}
                className={`rounded-md border px-3 py-2 text-xs font-semibold ${missingColumns.includes(column) ? "border-signal/25 bg-signal/10 text-signal" : "border-ink/10 bg-paper text-steel"}`}
              >
                {column}
              </span>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="section-title">Upload File</p>
          <div className="mt-4 rounded-lg border border-dashed border-ink/20 bg-white p-6">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => handleFile(event.target.files?.[0])}
              className="block w-full text-sm text-steel file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {fileName ? <p className="mt-3 text-sm text-steel">Loaded {fileName}</p> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyToDashboard}
              disabled={!previewRows.length || errors.length > 0}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-harbor disabled:cursor-not-allowed disabled:bg-steel/40"
            >
              Apply to dashboard
            </button>
            <button type="button" onClick={clearUploadedData} className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-paper">
              Clear uploaded data
            </button>
            <Link href="/dashboard" className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-paper">
              Open dashboard
            </Link>
          </div>
          {applied ? <p className="mt-3 text-sm font-medium text-moss">Uploaded data is active on the dashboard.</p> : null}
        </div>
      </section>

      {errors.length ? (
        <section className="panel mt-6 border-signal/20 p-5">
          <p className="section-title text-signal">Validation Errors</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-signal">
            {errors.map((error) => (
              <li key={error}>- {error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-ink/10 px-5 py-4">
          <p className="section-title">Preview Table</p>
          <h2 className="mt-1 text-xl font-semibold">{previewRows.length ? `${previewRows.length} parsed shipments` : "No CSV loaded"}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-ink/[0.03] text-xs uppercase tracking-[0.12em] text-steel">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Shipment</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Lane</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Carrier</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Margin</th>
                <th className="px-5 py-3">Margin %</th>
                <th className="px-5 py-3">Exception</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {previewRows.slice(0, 25).map((row) => (
                <tr key={row.shipment_id} className="bg-white">
                  <td className="px-5 py-4 font-medium">{row.customer_name}</td>
                  <td className="px-5 py-4">{row.shipment_id}</td>
                  <td className="px-5 py-4">{row.shipment_date}</td>
                  <td className="px-5 py-4">
                    {row.origin_city}, {row.origin_state} to {row.destination_city}, {row.destination_state}
                  </td>
                  <td className="px-5 py-4">{row.mode}</td>
                  <td className="px-5 py-4">{row.carrier_name}</td>
                  <td className="px-5 py-4">{formatCurrency(row.parsed_revenue)}</td>
                  <td className="px-5 py-4">{formatCurrency(row.parsed_cost)}</td>
                  <td className="px-5 py-4">{formatCurrency(row.margin)}</td>
                  <td className="px-5 py-4">{formatPercent(row.margin_pct)}</td>
                  <td className="px-5 py-4">{row.exception_reason || "None"}</td>
                </tr>
              ))}
              {!previewRows.length ? (
                <tr>
                  <td colSpan={11} className="bg-white px-5 py-10 text-center text-sm text-steel">
                    Upload a CSV or download the sample file to see parsed shipments here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
