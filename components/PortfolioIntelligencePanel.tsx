import { Customer, Lane, Shipment } from "@/data/mockData";
import { aggregatePortfolioData, generateRuleBasedInsights, RankedMetric } from "@/lib/csvUpload";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

type PortfolioIntelligencePanelProps = {
  customers: Customer[];
  lanes: Lane[];
  shipments: Shipment[];
};

export function PortfolioIntelligencePanel({ customers, lanes, shipments }: PortfolioIntelligencePanelProps) {
  const metrics = aggregatePortfolioData(customers, lanes, shipments);
  const insights = generateRuleBasedInsights(customers, lanes, shipments);
  const cards = [
    { label: "Total revenue", value: formatCurrency(metrics.totalRevenue), detail: `${metrics.shipmentCount} shipments` },
    { label: "Total cost", value: formatCurrency(metrics.totalCost), detail: "Carrier cost base" },
    { label: "Total margin", value: formatCurrency(metrics.totalMargin), detail: formatPercent(metrics.marginPct) },
    { label: "On-time pickup", value: formatPercent(metrics.onTimePickupPct), detail: "Uploaded CSV field" },
    { label: "On-time delivery", value: formatPercent(metrics.onTimeDeliveryPct), detail: "Uploaded CSV field" },
    { label: "Exceptions", value: String(metrics.exceptionCount), detail: "Shipment exceptions" },
    { label: "Accessorials", value: formatCurrency(metrics.accessorialTotal), detail: `${formatPercent(metrics.accessorialPct)} of revenue` }
  ];

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title">CSV Intelligence</p>
          <h2 className="mt-1 text-xl font-semibold">Portfolio economics and rule-based signals</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-ink/10 bg-white p-4">
            <p className="metric-label">{card.label}</p>
            <p className="mt-2 text-xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-steel">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <MetricList title="Top customers by revenue" rows={metrics.topCustomersByRevenue} formatValue={(value) => `$${formatCompact(value)}`} />
        <MetricList title="Top lanes by margin" rows={metrics.topLanesByMargin} formatValue={(value) => `$${formatCompact(value)}`} />
        <MetricList title="Top carriers by shipment count" rows={metrics.topCarriersByShipmentCount} formatValue={(value) => `${value}`} />
        <MetricList title="Exceptions by reason" rows={metrics.exceptionsByReason} formatValue={(value) => `${value}`} emptyText="No exceptions" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-4">
          <p className="metric-label">Monthly revenue and margin trend</p>
          <div className="mt-3 space-y-2">
            {metrics.monthlyTrend.map((month) => (
              <div key={month.month} className="grid grid-cols-[88px_1fr_1fr] gap-3 rounded-md bg-paper px-3 py-2 text-sm">
                <span className="font-semibold">{month.month}</span>
                <span className="text-steel">Revenue {formatCurrency(month.revenue)}</span>
                <span className="text-steel">Margin {formatCurrency(month.margin)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-4">
          <p className="metric-label">Rule-based executive insights</p>
          <div className="mt-3 space-y-3">
            {insights.map((insight) => (
              <div key={insight.title} className="rounded-md bg-paper p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{insight.title}</p>
                  <span className={severityClass(insight.severity)}>{insight.severity}</span>
                </div>
                <p className="mt-2 text-sm leading-5 text-steel">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricList({
  title,
  rows,
  formatValue,
  emptyText = "No data"
}: {
  title: string;
  rows: RankedMetric[];
  formatValue: (value: number) => string;
  emptyText?: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4">
      <p className="metric-label">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.name} className="flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 text-sm">
              <span className="min-w-0 truncate font-medium">{row.name}</span>
              <span className="shrink-0 text-steel">{formatValue(row.value)}</span>
            </div>
          ))
        ) : (
          <p className="rounded-md bg-paper px-3 py-2 text-sm text-steel">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function severityClass(severity: "High" | "Medium" | "Low") {
  const tone =
    severity === "High"
      ? "border-signal/20 bg-signal/10 text-signal"
      : severity === "Medium"
        ? "border-amberline/20 bg-amberline/10 text-amberline"
        : "border-moss/20 bg-moss/10 text-moss";

  return `rounded-md border px-2 py-1 text-xs font-semibold ${tone}`;
}
