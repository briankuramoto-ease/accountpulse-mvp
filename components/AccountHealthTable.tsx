import Link from "next/link";
import { Customer, Shipment, ActionItem, Lane } from "@/data/mockData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateExceptionRate, calculateExpansionScore, calculateHealthScore, calculateOnTimeDelivery } from "@/lib/metrics";
import { AccountHealthBadge } from "@/components/AccountHealthBadge";

type AccountHealthTableProps = {
  customers: Customer[];
  lanes: Lane[];
  shipments: Shipment[];
  actionItems: ActionItem[];
};

export function AccountHealthTable({ customers, lanes, shipments, actionItems }: AccountHealthTableProps) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <div>
          <p className="section-title">Account Health</p>
          <h2 className="mt-1 text-xl font-semibold">Strategic portfolio view</h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-[0.12em] text-steel">
            <tr>
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Revenue</th>
              <th className="px-5 py-3">Margin</th>
              <th className="px-5 py-3">OTD</th>
              <th className="px-5 py-3">Exceptions</th>
              <th className="px-5 py-3">Health</th>
              <th className="px-5 py-3">Expansion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {customers.map((customer) => {
              const accountShipments = shipments.filter((shipment) => shipment.accountId === customer.id);
              const accountActions = actionItems.filter((item) => item.accountId === customer.id);
              const accountLanes = lanes.filter((lane) => lane.accountId === customer.id);
              const health = calculateHealthScore(customer, accountShipments, accountActions);
              const expansion = calculateExpansionScore(customer, accountLanes, accountShipments);

              return (
                <tr key={customer.id} className="bg-white transition hover:bg-paper/60">
                  <td className="px-5 py-4">
                    <Link href={`/accounts/${customer.id}`} className="font-semibold text-ink hover:text-harbor">
                      {customer.name}
                    </Link>
                    <p className="mt-1 text-xs text-steel">
                      {customer.vertical} - {customer.region}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-steel">{customer.owner}</td>
                  <td className="px-5 py-4 font-medium">{formatCurrency(customer.annualRevenue)}</td>
                  <td className="px-5 py-4">{formatPercent(customer.grossMargin)}</td>
                  <td className="px-5 py-4">{formatPercent(calculateOnTimeDelivery(accountShipments))}</td>
                  <td className="px-5 py-4">{formatPercent(calculateExceptionRate(accountShipments))}</td>
                  <td className="px-5 py-4">
                    <AccountHealthBadge score={health.score} label={health.label} />
                  </td>
                  <td className="px-5 py-4">
                    <AccountHealthBadge score={expansion.score} label={expansion.label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
