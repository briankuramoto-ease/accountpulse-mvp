import Link from "next/link";
import { Lane, Shipment } from "@/data/mockData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateExceptionRate, calculateOnTimeDelivery } from "@/lib/metrics";

type LanePerformanceTableProps = {
  lanes: Lane[];
  shipments: Shipment[];
  compact?: boolean;
};

export function LanePerformanceTable({ lanes, shipments, compact = false }: LanePerformanceTableProps) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-ink/10 px-5 py-4">
        <p className="section-title">Lane Performance</p>
        <h2 className="mt-1 text-xl font-semibold">{compact ? "Priority lanes" : "Network lane economics"}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-[0.12em] text-steel">
            <tr>
              <th className="px-5 py-3">Lane</th>
              <th className="px-5 py-3">Mode</th>
              <th className="px-5 py-3">Volume</th>
              <th className="px-5 py-3">Revenue</th>
              <th className="px-5 py-3">Margin</th>
              <th className="px-5 py-3">OTD</th>
              <th className="px-5 py-3">Exceptions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {lanes.slice(0, compact ? 8 : lanes.length).map((lane) => {
              const laneShipments = shipments.filter((shipment) => shipment.laneId === lane.id);
              return (
                <tr key={lane.id} className="bg-white transition hover:bg-paper/60">
                  <td className="px-5 py-4">
                    <Link href={`/lanes/${lane.id}`} className="font-semibold text-ink hover:text-harbor">
                      {lane.origin} to {lane.destination}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-steel">{lane.mode}</td>
                  <td className="px-5 py-4">{lane.monthlyVolume}/mo</td>
                  <td className="px-5 py-4">{formatCurrency(lane.revenue)}</td>
                  <td className="px-5 py-4">{formatPercent(lane.margin)}</td>
                  <td className="px-5 py-4">{formatPercent(calculateOnTimeDelivery(laneShipments))}</td>
                  <td className="px-5 py-4">{formatPercent(calculateExceptionRate(laneShipments))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
