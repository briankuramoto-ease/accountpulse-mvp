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
  total_revenue: number;
  margin: number;
  margin_pct: number;
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
      const totalRevenue = revenue + accessorial;
      const margin = totalRevenue - cost;
      const marginPct = totalRevenue ? margin / totalRevenue : 0;

      if (!csvRow.customer_name) errors.push(`Row ${index + 2}: customer_name is required.`);
      if (!csvRow.shipment_id) errors.push(`Row ${index + 2}: shipment_id is required.`);
      if (!csvRow.shipment_date || Number.isNaN(Date.parse(csvRow.shipment_date))) errors.push(`Row ${index + 2}: shipment_date is invalid.`);
      if (!Number.isFinite(revenue)) errors.push(`Row ${index + 2}: revenue must be numeric.`);
      if (!Number.isFinite(cost)) errors.push(`Row ${index + 2}: cost must be numeric.`);
      if (!Number.isFinite(accessorial)) errors.push(`Row ${index + 2}: accessorial_amount must be numeric.`);

      return {
        ...csvRow,
        total_revenue: totalRevenue,
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
    const revenue = currencyNumber(row.revenue) + currencyNumber(row.accessorial_amount || "0");
    const cost = currencyNumber(row.cost);

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

export const sampleCsvRows: CsvShipmentRow[] = [
  {
    customer_name: "Northstar Foods",
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
    accessorial_amount: "125",
    account_owner: "Maya Chen"
  },
  {
    customer_name: "Northstar Foods",
    shipment_id: "CSV-1002",
    shipment_date: "2026-06-05",
    origin_city: "Columbus",
    origin_state: "OH",
    destination_city: "Charlotte",
    destination_state: "NC",
    mode: "LTL",
    carrier_name: "Summit Freight",
    revenue: "1380",
    cost: "1190",
    on_time_pickup: "true",
    on_time_delivery: "false",
    exception_reason: "Delivery Delay",
    accessorial_amount: "0",
    account_owner: "Maya Chen"
  },
  {
    customer_name: "Everline Retail Group",
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
    accessorial_amount: "75",
    account_owner: "Jordan Price"
  }
];
