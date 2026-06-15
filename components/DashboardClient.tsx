"use client";

import { useEffect, useState } from "react";
import { AccountHealthTable } from "@/components/AccountHealthTable";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ExceptionBreakdown } from "@/components/ExceptionBreakdown";
import { LanePerformanceTable } from "@/components/LanePerformanceTable";
import { PortfolioSummaryCards } from "@/components/PortfolioSummaryCards";
import { PortfolioIntelligencePanel } from "@/components/PortfolioIntelligencePanel";
import { RevenueMarginChart } from "@/components/RevenueMarginChart";
import { ServicePerformanceChart } from "@/components/ServicePerformanceChart";
import { UPLOADED_DATA_KEY } from "@/lib/csvUpload";
import { mockAccountPulseData, readActiveAccountPulseData, ActiveAccountPulseData } from "@/lib/browserData";
import { identifyAtRiskAccounts, identifyExpansionCandidates, identifyMarginLeakageLanes } from "@/lib/metrics";

export function DashboardClient() {
  const [activeData, setActiveData] = useState<ActiveAccountPulseData>(mockAccountPulseData);

  useEffect(() => {
    const loadUploadedData = () => {
      setActiveData(readActiveAccountPulseData());
    };

    loadUploadedData();
    window.addEventListener("storage", loadUploadedData);
    window.addEventListener("accountpulse:uploaded-data", loadUploadedData);

    return () => {
      window.removeEventListener("storage", loadUploadedData);
      window.removeEventListener("accountpulse:uploaded-data", loadUploadedData);
    };
  }, []);

  const customers = activeData.customers;
  const lanes = activeData.lanes;
  const shipments = activeData.shipments;
  const actionItems = activeData.actionItems;
  const atRisk = identifyAtRiskAccounts(customers, shipments, actionItems);
  const expansion = identifyExpansionCandidates(customers, lanes, shipments);
  const leakage = identifyMarginLeakageLanes(lanes);
  const modeLabel =
    activeData.source === "uploaded"
      ? `Uploaded portfolio: ${activeData.customers.length} customers, ${activeData.lanes.length} lanes, ${activeData.rowCount} rows`
      : "Mock portfolio: 8 customers, 40 lanes, 500 shipments";

  const clearUpload = () => {
    window.localStorage.removeItem(UPLOADED_DATA_KEY);
    window.dispatchEvent(new Event("accountpulse:uploaded-data"));
  };

  return (
    <main className="page-shell">
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title">Portfolio Command Center</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">AccountPulse dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-steel">
            A static MVP view for account leaders to spot renewal risk, margin leakage, service issues, and expansion candidates across strategic freight
            customers.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-steel shadow-soft">
          <span>{modeLabel}</span>
          {activeData.source === "uploaded" ? (
            <button type="button" onClick={clearUpload} className="self-start rounded-md border border-ink/15 px-3 py-1 text-xs font-semibold text-ink hover:bg-paper">
              Return to demo mode
            </button>
          ) : null}
        </div>
      </section>

      <div className="space-y-6">
        <PortfolioSummaryCards customers={customers} lanes={lanes} shipments={shipments} actionItems={actionItems} />
        <PortfolioIntelligencePanel customers={customers} lanes={lanes} shipments={shipments} />
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
          <RevenueMarginChart shipments={shipments} />
          <ServicePerformanceChart shipments={shipments} />
        </div>
        <AccountHealthTable customers={customers} lanes={lanes} shipments={shipments} actionItems={actionItems} />
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <LanePerformanceTable lanes={leakage.map((item) => item.lane)} shipments={shipments} compact />
          <ActionItemsPanel actionItems={actionItems.filter((item) => item.status !== "Done").slice(0, 5)} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <ExceptionBreakdown shipments={shipments} />
          <div className="panel p-5">
            <p className="section-title">Priority Signals</p>
            <div className="mt-5 grid gap-4">
              <Signal title="At-risk accounts" value={atRisk.map((item) => item.customer.name).join(", ") || "None"} />
              <Signal title="Expansion candidates" value={expansion.slice(0, 3).map((item) => item.customer.name).join(", ") || "None"} />
              <Signal title="Margin leakage lanes" value={`${leakage.length} lanes below target or benchmark`} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Signal({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-4">
      <p className="metric-label">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}
