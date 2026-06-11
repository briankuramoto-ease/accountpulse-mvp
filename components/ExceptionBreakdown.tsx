"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Shipment } from "@/data/mockData";

type ExceptionBreakdownProps = {
  shipments: Shipment[];
};

const colors = ["#0e7490", "#b7791f", "#b42318", "#41734d", "#6b7280"];

export function ExceptionBreakdown({ shipments }: ExceptionBreakdownProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = ["Pickup Delay", "Delivery Delay", "Tender Reject", "Claim", "Detention"].map((type) => ({
    name: type,
    value: shipments.filter((shipment) => shipment.exceptionType === type).length
  }));

  return (
    <div className="panel p-5">
      <p className="section-title">Exception Breakdown</p>
      <h2 className="mt-1 text-xl font-semibold">Root-cause mix</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="h-56">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={3}>
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg bg-paper" />
          )}
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                {item.name}
              </span>
              <span className="text-sm text-steel">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
