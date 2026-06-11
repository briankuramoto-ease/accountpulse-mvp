import { Customer, Lane, Shipment } from "@/data/mockData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { AccountScore, calculateExceptionRate, calculateOnTimeDelivery } from "@/lib/metrics";
import { ScoreSummaryCard } from "@/components/ScoreSummaryCard";

type ExecutiveBriefCardProps = {
  customer: Customer;
  lanes: Lane[];
  shipments: Shipment[];
  healthScore: AccountScore;
  expansionScore: AccountScore;
};

export function ExecutiveBriefCard({ customer, lanes, shipments, healthScore, expansionScore }: ExecutiveBriefCardProps) {
  const topLane = [...lanes].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="panel p-6">
      <p className="section-title">Executive Brief</p>
      <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{customer.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            {customer.segment} {customer.vertical.toLowerCase()} shipper managed by {customer.owner}. Current signal shows{" "}
            {healthScore.label === "Healthy"
              ? "a stable service profile"
              : healthScore.label === "Watch"
                ? "manageable service and margin pressure"
                : healthScore.label === "At Risk"
                  ? "material renewal risk"
                  : "critical executive attention required"}{" "}
            with an expansion score of {expansionScore.score}.
          </p>
        </div>
        <div className="grid min-w-[280px] grid-cols-2 gap-3">
          <BriefMetric label="Revenue" value={formatCurrency(customer.annualRevenue)} />
          <BriefMetric label="Gross margin" value={formatPercent(customer.grossMargin)} />
          <BriefMetric label="OTD" value={formatPercent(calculateOnTimeDelivery(shipments))} />
          <BriefMetric label="Exceptions" value={formatPercent(calculateExceptionRate(shipments))} />
        </div>
      </div>
      {topLane ? (
        <div className="mt-5 rounded-lg border border-ink/10 bg-paper p-4">
          <p className="metric-label">Largest lane</p>
          <p className="mt-1 font-semibold">
            {topLane.origin} to {topLane.destination}
          </p>
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ScoreSummaryCard title="Transparent health score" score={healthScore} />
        <ScoreSummaryCard title="Expansion score" score={expansionScore} />
      </div>
    </div>
  );
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <p className="metric-label">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
