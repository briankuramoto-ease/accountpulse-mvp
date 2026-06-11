import Link from "next/link";
import { notFound } from "next/navigation";
import { ExceptionBreakdown } from "@/components/ExceptionBreakdown";
import { RevenueMarginChart } from "@/components/RevenueMarginChart";
import { ServicePerformanceChart } from "@/components/ServicePerformanceChart";
import { customers, lanes, shipments } from "@/data/mockData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateExceptionRate, calculateOnTimeDelivery } from "@/lib/metrics";

export function generateStaticParams() {
  return lanes.map((lane) => ({ id: lane.id }));
}

export default async function LanePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lane = lanes.find((item) => item.id === id);
  if (!lane) notFound();

  const customer = customers.find((item) => item.id === lane.accountId);
  const laneShipments = shipments.filter((shipment) => shipment.laneId === lane.id);

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="section-title">Lane Detail</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{lane.origin} to {lane.destination}</h1>
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
            <p>
              Recommended next move: validate carrier mix, detention exposure, and pickup-day imbalance before the next customer rate conversation.
            </p>
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
