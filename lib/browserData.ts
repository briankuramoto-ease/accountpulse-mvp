import { actionItems, customers, lanes, shipments } from "@/data/mockData";
import { UploadedDashboardData, UPLOADED_DATA_KEY } from "@/lib/csvUpload";

export type ActiveAccountPulseData = {
  source: "mock" | "uploaded";
  customers: typeof customers;
  lanes: typeof lanes;
  shipments: typeof shipments;
  actionItems: typeof actionItems;
  rowCount?: number;
  uploadedAt?: string;
};

export const mockAccountPulseData: ActiveAccountPulseData = {
  source: "mock",
  customers,
  lanes,
  shipments,
  actionItems
};

export function readUploadedData(): UploadedDashboardData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(UPLOADED_DATA_KEY);
    return stored ? (JSON.parse(stored) as UploadedDashboardData) : null;
  } catch {
    return null;
  }
}

export function readActiveAccountPulseData(): ActiveAccountPulseData {
  const uploadedData = readUploadedData();
  if (!uploadedData) return mockAccountPulseData;

  return {
    source: "uploaded",
    customers: uploadedData.customers,
    lanes: uploadedData.lanes,
    shipments: uploadedData.shipments,
    actionItems: uploadedData.actionItems,
    rowCount: uploadedData.rowCount,
    uploadedAt: uploadedData.uploadedAt
  };
}
