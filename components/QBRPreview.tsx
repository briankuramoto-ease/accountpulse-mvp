import Link from "next/link";
import { Customer, Lane, Shipment, ActionItem } from "@/data/mockData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateExceptionRate, calculateOnTimeDelivery } from "@/lib/metrics";

type QBRPreviewProps = {
  customer: Customer;
  lanes: Lane[];
  shipments: Shipment[];
  actionItems: ActionItem[];
};

export function QBRPreview({ customer, lanes, shipments, actionItems }: QBRPreviewProps) {
  const highValueLane = [...lanes].sort((a, b) => b.revenue - a.revenue)[0];
  const openActions = actionItems.filter((item) => item.status !== "Done");

  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-title">QBR Preview</p>
          <h2 className="mt-1 text-2xl font-semibold">{customer.name} business review</h2>
        </div>
        <Link href={`/qbr/${customer.id}`} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-harbor">
          Open QBR
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QbrStat label="Revenue under management" value={formatCurrency(customer.annualRevenue)} />
        <QbrStat label="On-time delivery" value={formatPercent(calculateOnTimeDelivery(shipments))} />
        <QbrStat label="Exception rate" value={formatPercent(calculateExceptionRate(shipments))} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-paper p-4">
          <p className="metric-label">Expansion story</p>
          <p className="mt-2 text-sm leading-6 text-steel">
            Lead with service reliability, then position incremental volume on {highValueLane?.origin} to {highValueLane?.destination} and adjacent lanes where
            current density supports sharper carrier pricing.
          </p>
        </div>
        <div className="rounded-lg bg-paper p-4">
          <p className="metric-label">Commitments</p>
          <p className="mt-2 text-sm leading-6 text-steel">
            {openActions.length} open follow-ups should be closed or reframed before the customer meeting to protect credibility with operations and procurement.
          </p>
        </div>
      </div>
    </div>
  );
}

function QbrStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4">
      <p className="metric-label">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
