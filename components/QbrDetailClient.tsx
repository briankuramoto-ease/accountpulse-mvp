"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExecutiveAccountBrief } from "@/components/ExecutiveAccountBrief";
import { QBRPreview } from "@/components/QBRPreview";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ActiveAccountPulseData, mockAccountPulseData, readActiveAccountPulseData } from "@/lib/browserData";
import { getAccountSnapshot } from "@/lib/metrics";

type QbrDetailClientProps = {
  accountId: string;
};

export function QbrDetailClient({ accountId }: QbrDetailClientProps) {
  const [activeData, setActiveData] = useState<ActiveAccountPulseData>(mockAccountPulseData);

  useEffect(() => {
    setActiveData(readActiveAccountPulseData());
  }, []);

  const customer = activeData.customers.find((item) => item.id === accountId);

  if (!customer) {
    return (
      <main className="page-shell">
        <section className="panel p-6">
          <p className="section-title">Customer Business Review</p>
          <h1 className="mt-2 text-3xl font-semibold">Account not found</h1>
          <p className="mt-3 text-sm text-steel">Upload CSV data or return to the dashboard to select an available account.</p>
        </section>
      </main>
    );
  }

  const snapshot = getAccountSnapshot(customer, activeData.lanes, activeData.shipments, activeData.actionItems);
  const topLanes = [...snapshot.lanes].sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-title">Customer Business Review</p>
          <h1 className="mt-2 text-4xl font-semibold">{customer.name}</h1>
        </div>
        <Link href={`/accounts/${customer.id}`} className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-paper">
          Back to account
        </Link>
      </div>

      <div className="space-y-6">
        <QBRPreview customer={customer} lanes={snapshot.lanes} shipments={snapshot.shipments} actionItems={snapshot.actionItems} />
        <ExecutiveAccountBrief brief={snapshot.executiveBrief} compact />
        <section className="grid gap-6 lg:grid-cols-3">
          <QbrSection
            title="Business outcomes"
            body={`Managed ${formatCurrency(customer.annualRevenue)} in freight revenue at ${formatPercent(customer.grossMargin)} gross margin, with ${formatPercent(
              snapshot.onTimeDelivery
            )} on-time delivery across the review period.`}
          />
          <QbrSection
            title="Risk narrative"
            body={`Health score is ${snapshot.healthScore.score} (${snapshot.healthScore.label}). Primary drivers: ${snapshot.healthScore.explanations.join(" ")}`}
          />
          <QbrSection
            title="Growth narrative"
            body={`Expansion score is ${snapshot.expansionScore.score} (${snapshot.expansionScore.label}). Prioritize controlled growth where lane density and carrier performance are already proven.`}
          />
        </section>
        <section className="panel p-6">
          <p className="section-title">Top Lanes To Discuss</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {topLanes.map((lane) => (
              <div key={lane.id} className="rounded-lg bg-paper p-4">
                <p className="font-semibold">
                  {lane.origin} to {lane.destination}
                </p>
                <p className="mt-2 text-sm text-steel">
                  {lane.mode} - {formatCurrency(lane.revenue)} revenue - {formatPercent(lane.margin)} margin
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function QbrSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="panel p-5">
      <p className="section-title">{title}</p>
      <p className="mt-4 text-sm leading-6 text-steel">{body}</p>
    </section>
  );
}
