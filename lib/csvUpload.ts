import { Customer, Lane, Shipment, ActionItem } from "@/data/mockData";

export const UPLOADED_DATA_KEY = "accountpulse.uploadedData.v1";

export const requiredCsvColumns = [
  "customer_name",
  "shipment_id",
  "shipment_date",
  "origin_city",
  "origin_state",
  "destination_city",
  "destination_state",
  "mode",
  "carrier_name",
  "revenue",
  "cost",
  "on_time_pickup",
  "on_time_delivery",
  "exception_reason",
  "accessorial_amount",
  "account_owner"
] as const;

export type RequiredCsvColumn = (typeof requiredCsvColumns)[number];

export type CsvShipmentRow = Record<RequiredCsvColumn, string>;

export type CsvPreviewRow = CsvShipmentRow & {
  parsed_revenue: number;
  parsed_cost: number;
  parsed_accessorial_amount: number;
  margin: number;
  margin_pct: number;
};

export type RankedMetric = {
  name: string;
  value: number;
  detail?: string;
};

export type MonthlyTrendPoint = {
  month: string;
  revenue: number;
  margin: number;
};

export type PortfolioAggregates = {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPct: number;
  shipmentCount: number;
  onTimePickupPct: number;
  onTimeDeliveryPct: number;
  exceptionCount: number;
  accessorialTotal: number;
  accessorialPct: number;
  topCustomersByRevenue: RankedMetric[];
  topLanesByMargin: RankedMetric[];
  topCarriersByShipmentCount: RankedMetric[];
  exceptionsByReason: RankedMetric[];
  monthlyTrend: MonthlyTrendPoint[];
};

export type RuleBasedInsight = {
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
};

export type CsvValidationResult = {
  rows: CsvPreviewRow[];
  errors: string[];
  missingColumns: string[];
};

export type UploadedDashboardData = {
  source: "uploaded";
  uploadedAt: string;
  customers: Customer[];
  lanes: Lane[];
  shipments: Shipment[];
  actionItems: ActionItem[];
  rowCount: number;
};

const currencyNumber = (value: string) => Number(String(value ?? "").replace(/[$,]/g, "").trim());

const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const booleanValue = (value: string) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "y", "1", "on time", "ontime"].includes(normalized);
};

const normalizeException = (value: string) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : "None";
};

export function validateCsvRows(rawRows: Record<string, unknown>[]): CsvValidationResult {
  const headers = new Set(Object.keys(rawRows[0] ?? {}).map((key) => key.trim()));
  const missingColumns = requiredCsvColumns.filter((column) => !headers.has(column));
  const errors = missingColumns.map((column) => `Missing required column: ${column}`);

  if (missingColumns.length) {
    return { rows: [], errors, missingColumns };
  }

  const rows = rawRows
    .filter((row) => requiredCsvColumns.some((column) => String(row[column] ?? "").trim()))
    .map((row, index) => {
      const csvRow = requiredCsvColumns.reduce((accumulator, column) => {
        accumulator[column] = String(row[column] ?? "").trim();
        return accumulator;
      }, {} as CsvShipmentRow);

      const revenue = currencyNumber(csvRow.revenue);
      const cost = currencyNumber(csvRow.cost);
      const accessorial = currencyNumber(csvRow.accessorial_amount || "0");
      const margin = revenue - cost;
      const marginPct = revenue ? margin / revenue : 0;

      if (!csvRow.customer_name) errors.push(`Row ${index + 2}: customer_name is required.`);
      if (!csvRow.shipment_id) errors.push(`Row ${index + 2}: shipment_id is required.`);
      if (!csvRow.shipment_date || Number.isNaN(Date.parse(csvRow.shipment_date))) errors.push(`Row ${index + 2}: shipment_date is invalid.`);
      if (!Number.isFinite(revenue)) errors.push(`Row ${index + 2}: revenue must be numeric.`);
      if (!Number.isFinite(cost)) errors.push(`Row ${index + 2}: cost must be numeric.`);
      if (!Number.isFinite(accessorial)) errors.push(`Row ${index + 2}: accessorial_amount must be numeric.`);

      return {
        ...csvRow,
        parsed_revenue: revenue,
        parsed_cost: cost,
        parsed_accessorial_amount: accessorial,
        margin,
        margin_pct: marginPct
      };
    });

  return { rows, errors, missingColumns };
}

export function buildDashboardDataFromCsv(rows: CsvPreviewRow[]): UploadedDashboardData {
  const customerMap = new Map<string, Customer>();
  const laneMap = new Map<string, Lane>();
  const laneShipmentCounts = new Map<string, number>();
  const laneRevenue = new Map<string, number>();
  const laneMargin = new Map<string, number>();

  const shipments: Shipment[] = rows.map((row, index) => {
    const customerId = `u-c-${slug(row.customer_name) || index}`;
    const laneKey = `${customerId}|${row.origin_city}, ${row.origin_state}|${row.destination_city}, ${row.destination_state}|${row.mode}`;
    const laneId = `u-l-${slug(laneKey)}`;
    const revenue = row.parsed_revenue;
    const cost = row.parsed_cost;

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: customerId,
        name: row.customer_name,
        segment: "Strategic",
        region: row.origin_state || "Uploaded",
        vertical: "Uploaded CSV",
        owner: row.account_owner || "Unassigned",
        annualRevenue: 0,
        targetRevenue: 0,
        grossMargin: 0,
        baselineMargin: 0.16,
        contractRenewal: "2026-12-31"
      });
    }

    if (!laneMap.has(laneId)) {
      laneMap.set(laneId, {
        id: laneId,
        accountId: customerId,
        origin: `${row.origin_city}, ${row.origin_state}`,
        destination: `${row.destination_city}, ${row.destination_state}`,
        mode: row.mode,
        monthlyVolume: 0,
        revenue: 0,
        margin: 0,
        targetMargin: 0.18,
        avgCostPerMile: 0,
        benchmarkCostPerMile: 0
      });
    }

    laneShipmentCounts.set(laneId, (laneShipmentCounts.get(laneId) ?? 0) + 1);
    laneRevenue.set(laneId, (laneRevenue.get(laneId) ?? 0) + revenue);
    laneMargin.set(laneId, (laneMargin.get(laneId) ?? 0) + (revenue - cost));

    return {
      id: row.shipment_id || `uploaded-${index + 1}`,
      accountId: customerId,
      laneId,
      shipDate: row.shipment_date,
      revenue,
      cost,
      onTime: booleanValue(row.on_time_pickup) && booleanValue(row.on_time_delivery),
      onTimePickup: booleanValue(row.on_time_pickup),
      onTimeDelivery: booleanValue(row.on_time_delivery),
      carrierName: row.carrier_name || "Unknown carrier",
      accessorialAmount: row.parsed_accessorial_amount,
      exceptionType: normalizeException(row.exception_reason),
      status: normalizeException(row.exception_reason) === "None" ? "Delivered" : "Exception"
    };
  });

  const customers = Array.from(customerMap.values()).map((customer) => {
    const accountShipments = shipments.filter((shipment) => shipment.accountId === customer.id);
    const revenue = accountShipments.reduce((sum, shipment) => sum + shipment.revenue, 0);
    const marginDollars = accountShipments.reduce((sum, shipment) => sum + shipment.revenue - shipment.cost, 0);
    const grossMargin = revenue ? marginDollars / revenue : 0;

    return {
      ...customer,
      annualRevenue: revenue,
      targetRevenue: revenue * 1.08,
      grossMargin,
      baselineMargin: Math.max(grossMargin - 0.015, 0.08)
    };
  });

  const lanes = Array.from(laneMap.values()).map((lane) => {
    const revenue = laneRevenue.get(lane.id) ?? 0;
    const marginDollars = laneMargin.get(lane.id) ?? 0;

    return {
      ...lane,
      monthlyVolume: laneShipmentCounts.get(lane.id) ?? 0,
      revenue,
      margin: revenue ? marginDollars / revenue : 0,
      avgCostPerMile: 0,
      benchmarkCostPerMile: 0
    };
  });

  return {
    source: "uploaded",
    uploadedAt: new Date().toISOString(),
    customers,
    lanes,
    shipments,
    actionItems: [],
    rowCount: rows.length
  };
}

function addMetric(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function rankedMetrics(map: Map<string, number>, limit = 5): RankedMetric[] {
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function aggregatePortfolioData(customers: Customer[], lanes: Lane[], shipments: Shipment[]): PortfolioAggregates {
  const totalRevenue = shipments.reduce((sum, shipment) => sum + shipment.revenue, 0);
  const totalCost = shipments.reduce((sum, shipment) => sum + shipment.cost, 0);
  const totalMargin = totalRevenue - totalCost;
  const accessorialTotal = shipments.reduce((sum, shipment) => sum + (shipment.accessorialAmount ?? 0), 0);
  const exceptionShipments = shipments.filter((shipment) => shipment.exceptionType !== "None");
  const pickupKnown = shipments.filter((shipment) => shipment.onTimePickup !== undefined);
  const deliveryKnown = shipments.filter((shipment) => shipment.onTimeDelivery !== undefined);
  const customerRevenue = new Map<string, number>();
  const laneMargin = new Map<string, number>();
  const carrierShipments = new Map<string, number>();
  const exceptionReasons = new Map<string, number>();
  const monthly = new Map<string, { revenue: number; margin: number }>();

  shipments.forEach((shipment) => {
    const customer = customers.find((item) => item.id === shipment.accountId);
    const lane = lanes.find((item) => item.id === shipment.laneId);
    const margin = shipment.revenue - shipment.cost;
    addMetric(customerRevenue, customer?.name ?? shipment.accountId, shipment.revenue);
    addMetric(laneMargin, lane ? `${lane.origin} to ${lane.destination}` : shipment.laneId, margin);
    addMetric(carrierShipments, shipment.carrierName ?? "Unassigned carrier", 1);
    if (shipment.exceptionType !== "None") addMetric(exceptionReasons, shipment.exceptionType, 1);

    const month = shipment.shipDate.slice(0, 7);
    const current = monthly.get(month) ?? { revenue: 0, margin: 0 };
    monthly.set(month, {
      revenue: current.revenue + shipment.revenue,
      margin: current.margin + margin
    });
  });

  return {
    totalRevenue,
    totalCost,
    totalMargin,
    marginPct: totalRevenue ? totalMargin / totalRevenue : 0,
    shipmentCount: shipments.length,
    onTimePickupPct: pickupKnown.length
      ? pickupKnown.filter((shipment) => shipment.onTimePickup).length / pickupKnown.length
      : shipments.filter((shipment) => shipment.onTime).length / Math.max(shipments.length, 1),
    onTimeDeliveryPct: deliveryKnown.length
      ? deliveryKnown.filter((shipment) => shipment.onTimeDelivery).length / deliveryKnown.length
      : shipments.filter((shipment) => shipment.onTime).length / Math.max(shipments.length, 1),
    exceptionCount: exceptionShipments.length,
    accessorialTotal,
    accessorialPct: totalRevenue ? accessorialTotal / totalRevenue : 0,
    topCustomersByRevenue: rankedMetrics(customerRevenue),
    topLanesByMargin: rankedMetrics(laneMargin),
    topCarriersByShipmentCount: rankedMetrics(carrierShipments),
    exceptionsByReason: rankedMetrics(exceptionReasons),
    monthlyTrend: Array.from(monthly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, revenue: value.revenue, margin: value.margin }))
  };
}

export function generateRuleBasedInsights(customers: Customer[], lanes: Lane[], shipments: Shipment[]): RuleBasedInsight[] {
  const aggregates = aggregatePortfolioData(customers, lanes, shipments);
  const insights: RuleBasedInsight[] = [];

  if (aggregates.marginPct < 0.12) {
    insights.push({
      title: "Margin pressure",
      description: `Portfolio margin is ${(aggregates.marginPct * 100).toFixed(1)}%, below the 12% executive watch threshold.`,
      severity: "High"
    });
  }

  if (aggregates.onTimeDeliveryPct && aggregates.onTimeDeliveryPct < 0.92) {
    insights.push({
      title: "Service risk",
      description: `On-time delivery is ${(aggregates.onTimeDeliveryPct * 100).toFixed(1)}%, below the 92% customer confidence threshold.`,
      severity: "High"
    });
  }

  if (aggregates.accessorialPct > 0.05) {
    insights.push({
      title: "Accessorial leakage",
      description: `Accessorials equal ${(aggregates.accessorialPct * 100).toFixed(1)}% of revenue, above the 5% watch line.`,
      severity: "Medium"
    });
  }

  const exceptionCarrierCounts = new Map<string, number>();
  shipments
    .filter((shipment) => shipment.exceptionType !== "None")
    .forEach((shipment) => addMetric(exceptionCarrierCounts, shipment.carrierName ?? "Unassigned carrier", 1));
  const topExceptionCarrier = rankedMetrics(exceptionCarrierCounts, 1)[0];
  if (topExceptionCarrier && aggregates.exceptionCount && topExceptionCarrier.value / aggregates.exceptionCount >= 0.5) {
    insights.push({
      title: "Carrier concentration risk",
      description: `${topExceptionCarrier.name} owns ${topExceptionCarrier.value} of ${aggregates.exceptionCount} exceptions.`,
      severity: "Medium"
    });
  }

  const negativeLane = lanes.find((lane) => lane.margin < 0);
  if (negativeLane) {
    insights.push({
      title: "Lane-level profitability issue",
      description: `${negativeLane.origin} to ${negativeLane.destination} is running at ${(negativeLane.margin * 100).toFixed(1)}% margin.`,
      severity: "High"
    });
  }

  if (!insights.length) {
    insights.push({
      title: "No critical rule-based flags",
      description: "Revenue, service, accessorials, carrier concentration, and lane profitability are within the current demo thresholds.",
      severity: "Low"
    });
  }

  return insights;
}

export const sampleCsvRows: CsvShipmentRow[] = [
  {
    customer_name: "Acme Foods",
    shipment_id: "CSV-1001",
    shipment_date: "2026-06-01",
    origin_city: "Chicago",
    origin_state: "IL",
    destination_city: "Dallas",
    destination_state: "TX",
    mode: "FTL",
    carrier_name: "Lakefront Logistics",
    revenue: "2450",
    cost: "1985",
    on_time_pickup: "true",
    on_time_delivery: "true",
    exception_reason: "",
    accessorial_amount: "175",
    account_owner: "Maya Chen"
  },
  {
    customer_name: "Acme Foods",
    shipment_id: "CSV-1002",
    shipment_date: "2026-06-05",
    origin_city: "Columbus",
    origin_state: "OH",
    destination_city: "Charlotte",
    destination_state: "NC",
    mode: "LTL",
    carrier_name: "Summit Freight",
    revenue: "1380",
    cost: "1295",
    on_time_pickup: "true",
    on_time_delivery: "false",
    exception_reason: "Delivery Delay",
    accessorial_amount: "0",
    account_owner: "Maya Chen"
  },
  {
    customer_name: "Northstar Retail Group",
    shipment_id: "CSV-2001",
    shipment_date: "2026-06-08",
    origin_city: "Atlanta",
    origin_state: "GA",
    destination_city: "Orlando",
    destination_state: "FL",
    mode: "Intermodal",
    carrier_name: "Piedmont Intermodal",
    revenue: "3120",
    cost: "2525",
    on_time_pickup: "true",
    on_time_delivery: "true",
    exception_reason: "",
    accessorial_amount: "260",
    account_owner: "Jordan Price"
  },
  {
    customer_name: "Ironwood Manufacturing",
    shipment_id: "CSV-3001",
    shipment_date: "2026-06-11",
    origin_city: "Memphis",
    origin_state: "TN",
    destination_city: "Kansas City",
    destination_state: "MO",
    mode: "FTL",
    carrier_name: "Summit Freight",
    revenue: "2100",
    cost: "2245",
    on_time_pickup: "false",
    on_time_delivery: "false",
    exception_reason: "Pickup Delay",
    accessorial_amount: "40",
    account_owner: "Priya Shah"
  }
];
