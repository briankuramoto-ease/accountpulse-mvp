"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shipment } from "@/data/mockData";

type ServicePerformanceChartProps = {
  shipments: Shipment[];
};

export function ServicePerformanceChart({ shipments }: ServicePerformanceChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = Array.from({ length: 6 }, (_, index) => {
    const month = `2026-${String(index + 1).padStart(2, "0")}`;
    const monthShipments = shipments.filter((shipment) => shipment.shipDate.startsWith(month));
    const total = monthShipments.length || 1;
    return {
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index],
      onTime: Math.round((monthShipments.filter((shipment) => shipment.onTime).length / total) * 100),
      exceptions: Math.round((monthShipments.filter((shipment) => shipment.exceptionType !== "None").length / total) * 100)
    };
  });

  return (
    <div className="panel p-5">
      <div className="mb-5">
        <p className="section-title">Service Performance</p>
        <h2 className="mt-1 text-xl font-semibold">OTD and exception trend</h2>
      </div>
      <div className="h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#d8d2c8" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, ""]} />
              <Bar dataKey="onTime" name="On time" fill="#41734d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exceptions" name="Exceptions" fill="#b7791f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-paper" />
        )}
      </div>
    </div>
  );
}
