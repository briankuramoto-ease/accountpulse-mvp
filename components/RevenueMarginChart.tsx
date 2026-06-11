"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Customer, Shipment } from "@/data/mockData";

type RevenueMarginChartProps = {
  customer?: Customer;
  shipments: Shipment[];
};

export function RevenueMarginChart({ customer, shipments }: RevenueMarginChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = Array.from({ length: 6 }, (_, index) => {
    const month = `2026-${String(index + 1).padStart(2, "0")}`;
    const monthShipments = shipments.filter((shipment) => shipment.shipDate.startsWith(month));
    const revenue = monthShipments.reduce((sum, shipment) => sum + shipment.revenue, 0);
    const marginDollars = monthShipments.reduce((sum, shipment) => sum + shipment.revenue - shipment.cost, 0);
    return {
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index],
      revenue,
      margin: revenue ? Math.round((marginDollars / revenue) * 1000) / 10 : Math.round((customer?.grossMargin ?? 0.16) * 1000) / 10
    };
  });

  return (
    <div className="panel p-5">
      <div className="mb-5">
        <p className="section-title">Revenue & Margin</p>
        <h2 className="mt-1 text-xl font-semibold">{customer ? customer.name : "Portfolio trend"}</h2>
      </div>
      <div className="h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0e7490" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#0e7490" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#d8d2c8" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value, name) => (name === "revenue" ? [`$${Number(value).toLocaleString()}`, "Revenue"] : [`${value}%`, "Margin"])} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0e7490" fill="url(#revenueFill)" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="margin" stroke="#41734d" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-paper" />
        )}
      </div>
    </div>
  );
}
