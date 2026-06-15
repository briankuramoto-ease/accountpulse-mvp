"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExceptionBreakdown } from "@/components/ExceptionBreakdown";
import { RevenueMarginChart } from "@/components/RevenueMarginChart";
import { ServicePerformanceChart } from "@/components/ServicePerformanceChart";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ActiveAccountPulseData, mockAccountPulseData, readActiveAccountPulseData } from "@/lib/browserData";
import { calculateExceptionRate, calculateOnTimeDelivery } from "@/lib/metrics";

type LaneDetailClientProps = {
  laneId: string;
};

export function LaneDetailClient({ laneId }: LaneDetailClientProps) {
  const [activeData, setActiveData] = useState<ActiveAccountPulseData>(mockAccountPulseData);

  useEffect(() => {
    setActiveData(readActiveAccountPulseData());
  }, []);

  const lane = activeData.lanes.find((item) => item.id === laneId);

  if (!lane) {
    return (
      <main className="page-shell">
        <section className="panel p-6">
          <p className="section-title">Lane Detail</p>
          <h1 className="mt-2 text-3xl font-semibold">Lane not found</h1>
          <p className="mt-3 text-sm text-steel">Upload CSV data or return to the dashboard to select an available lane.</p>
        </section>
      </main>
    );
  }

  const customer = activeData.customers.find((item) => item.id === lane.accountId);
  const laneShipments = activeData.shipments.filter((shipment) => shipment.laneId === lane.id);

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="section-title">Lane Detail</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">
              {lane.origin} to {lane.destination}
            </h1>
            <p className="mt-2 text-sm text-steel">
              {lane.mode} lane for{" "}
              {customer ? (
                <Link href={`/accounts/${customer.id}`} className="font-semibold text-harbor">
                  {customer.name}
                </Link>
              ) : (
                "Unknown account"
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LaneMetric label="Revenue" value={formatCurrency(lane.revenue)} />
            <LaneMetric label="Margin" value={formatPercent(lane.margin)} />
            <LaneMetric label="OTD" value={formatPercent(calculateOnTimeDelivery(laneShipments))} />
            <LaneMetric label="Exceptions" value={formatPercent(calculateExceptionRate(laneShipments))} />
          </div>
        </div>
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueMarginChart customer={customer} shipments={laneShipments} />
        <ServicePerformanceChart shipments={laneShipments} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ExceptionBreakdown shipments={laneShipments} />
        <div className="panel p-5">
          <p className="section-title">Commercial Readout</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-steel">
            <p>
              Target margin is {formatPercent(lane.targetMargin)} versus current {formatPercent(lane.margin)}. Cost per mile is{" "}
              {formatCurrency(lane.avgCostPerMile, 2)} against a benchmark of {formatCurrency(lane.benchmarkCostPerMile, 2)}.
            </p>
            <p>Recommended next move: validate carrier mix, detention exposure, and pickup-day imbalance before the next customer rate conversation.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function LaneMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[118px] rounded-lg border border-ink/10 bg-white p-3">
      <p className="metric-label">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
