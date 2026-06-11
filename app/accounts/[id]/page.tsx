import { notFound } from "next/navigation";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ExecutiveAccountBrief } from "@/components/ExecutiveAccountBrief";
import { ExecutiveBriefCard } from "@/components/ExecutiveBriefCard";
import { ExceptionBreakdown } from "@/components/ExceptionBreakdown";
import { LanePerformanceTable } from "@/components/LanePerformanceTable";
import { QBRPreview } from "@/components/QBRPreview";
import { RevenueMarginChart } from "@/components/RevenueMarginChart";
import { ServicePerformanceChart } from "@/components/ServicePerformanceChart";
import { actionItems, customers, lanes, shipments } from "@/data/mockData";
import { getAccountSnapshot } from "@/lib/metrics";

export function generateStaticParams() {
  return customers.map((customer) => ({ id: customer.id }));
}

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customers.find((item) => item.id === id);
  if (!customer) notFound();

  const snapshot = getAccountSnapshot(customer, lanes, shipments, actionItems);

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
