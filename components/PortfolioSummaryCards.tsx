import { Customer, Lane, Shipment, ActionItem } from "@/data/mockData";
import { formatCompact, formatPercent } from "@/lib/format";
import {
  calculateExceptionRate,
  calculateExpansionScore,
  calculateHealthScore,
  calculateOnTimeDelivery,
  identifyAtRiskAccounts,
  identifyExpansionCandidates
} from "@/lib/metrics";

type PortfolioSummaryCardsProps = {
  customers: Customer[];
  lanes: Lane[];
  shipments: Shipment[];
  actionItems: ActionItem[];
};

export function PortfolioSummaryCards({ customers, lanes, shipments, actionItems }: PortfolioSummaryCardsProps) {
  const revenue = customers.reduce((sum, customer) => sum + customer.annualRevenue, 0);
  const averageHealth =
    customers.reduce((sum, customer) => {
      const accountShipments = shipments.filter((shipment) => shipment.accountId === customer.id);
      const accountActions = actionItems.filter((item) => item.accountId === customer.id);
      return sum + calculateHealthScore(customer, accountShipments, accountActions).score;
    }, 0) / customers.length;
  const averageExpansion =
    customers.reduce((sum, customer) => {
      const accountShipments = shipments.filter((shipment) => shipment.accountId === customer.id);
      const accountLanes = lanes.filter((lane) => lane.accountId === customer.id);
      return sum + calculateExpansionScore(customer, accountLanes, accountShipments).score;
    }, 0) / customers.length;
  const atRisk = identifyAtRiskAccounts(customers, shipments, actionItems).length;
  const expansionCandidates = identifyExpansionCandidates(customers, lanes, shipments).length;

  const cards = [
    { label: "Managed revenue", value: `$${formatCompact(revenue)}`, detail: "Across 8 active shipper accounts" },
    { label: "Portfolio health", value: Math.round(averageHealth).toString(), detail: `${atRisk} accounts need intervention` },
    { label: "Expansion score", value: Math.round(averageExpansion).toString(), detail: `${expansionCandidates} accounts showing growth fit` },
    { label: "On-time delivery", value: formatPercent(calculateOnTimeDelivery(shipments)), detail: "Rolling six-month shipment base" },
    { label: "Exception rate", value: formatPercent(calculateExceptionRate(shipments)), detail: "Service drag across shipment base" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="panel p-5">
          <p className="metric-label">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{card.value}</p>
          <p className="mt-2 text-sm text-steel">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}
