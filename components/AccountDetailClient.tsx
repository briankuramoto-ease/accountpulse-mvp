"use client";

import { useEffect, useState } from "react";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ExecutiveAccountBrief } from "@/components/ExecutiveAccountBrief";
import { ExecutiveBriefCard } from "@/components/ExecutiveBriefCard";
import { ExceptionBreakdown } from "@/components/ExceptionBreakdown";
import { LanePerformanceTable } from "@/components/LanePerformanceTable";
import { QBRPreview } from "@/components/QBRPreview";
import { RevenueMarginChart } from "@/components/RevenueMarginChart";
import { ServicePerformanceChart } from "@/components/ServicePerformanceChart";
import { ActiveAccountPulseData, mockAccountPulseData, readActiveAccountPulseData } from "@/lib/browserData";
import { getAccountSnapshot } from "@/lib/metrics";

type AccountDetailClientProps = {
  accountId: string;
};

export function AccountDetailClient({ accountId }: AccountDetailClientProps) {
  const [activeData, setActiveData] = useState<ActiveAccountPulseData>(mockAccountPulseData);

  useEffect(() => {
    setActiveData(readActiveAccountPulseData());
  }, []);

  const customer = activeData.customers.find((item) => item.id === accountId);

  if (!customer) {
    return (
      <main className="page-shell">
        <section className="panel p-6">
          <p className="section-title">Account Detail</p>
          <h1 className="mt-2 text-3xl font-semibold">Account not found</h1>
          <p className="mt-3 text-sm text-steel">Upload CSV data or return to the dashboard to select an available account.</p>
        </section>
      </main>
    );
  }

  const snapshot = getAccountSnapshot(customer, activeData.lanes, activeData.shipments, activeData.actionItems);

  return (
    <main className="page-shell">
      <div className="space-y-6">
        <ExecutiveBriefCard
          customer={snapshot.customer}
          lanes={snapshot.lanes}
          shipments={snapshot.shipments}
          healthScore={snapshot.healthScore}
          expansionScore={snapshot.expansionScore}
        />
        <ExecutiveAccountBrief brief={snapshot.executiveBrief} />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <RevenueMarginChart customer={snapshot.customer} shipments={snapshot.shipments} />
          <ServicePerformanceChart shipments={snapshot.shipments} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <LanePerformanceTable lanes={snapshot.lanes} shipments={snapshot.shipments} />
          <ActionItemsPanel actionItems={snapshot.actionItems} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <ExceptionBreakdown shipments={snapshot.shipments} />
          <QBRPreview customer={snapshot.customer} lanes={snapshot.lanes} shipments={snapshot.shipments} actionItems={snapshot.actionItems} />
        </div>
      </div>
    </main>
  );
}
