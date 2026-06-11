export type Customer = {
  id: string;
  name: string;
  segment: "Enterprise" | "Mid-Market" | "Strategic";
  region: string;
  vertical: string;
  owner: string;
  annualRevenue: number;
  targetRevenue: number;
  grossMargin: number;
  baselineMargin: number;
  contractRenewal: string;
};

export type Lane = {
  id: string;
  accountId: string;
  origin: string;
  destination: string;
  mode: string;
  monthlyVolume: number;
  revenue: number;
  margin: number;
  targetMargin: number;
  avgCostPerMile: number;
  benchmarkCostPerMile: number;
};

export type Shipment = {
  id: string;
  accountId: string;
  laneId: string;
  shipDate: string;
  revenue: number;
  cost: number;
  onTime: boolean;
  exceptionType: string;
  status: "Delivered" | "In Transit" | "Exception";
};

export type ActionItem = {
  id: string;
  accountId: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Done";
};

export const customers: Customer[] = [
  {
    id: "c-001",
    name: "Northstar Foods",
    segment: "Strategic",
    region: "Midwest",
    vertical: "Food & Beverage",
    owner: "Maya Chen",
    annualRevenue: 4860000,
    targetRevenue: 5400000,
    grossMargin: 0.184,
    baselineMargin: 0.171,
    contractRenewal: "2026-11-15"
  },
  {
    id: "c-002",
    name: "Everline Retail Group",
    segment: "Enterprise",
    region: "Southeast",
    vertical: "Retail",
    owner: "Jordan Price",
    annualRevenue: 7340000,
    targetRevenue: 7200000,
    grossMargin: 0.142,
    baselineMargin: 0.164,
    contractRenewal: "2026-09-30"
  },
  {
    id: "c-003",
    name: "Summit Industrial Supply",
    segment: "Mid-Market",
    region: "Northeast",
    vertical: "Industrial",
    owner: "Priya Shah",
    annualRevenue: 2620000,
    targetRevenue: 3100000,
    grossMargin: 0.211,
    baselineMargin: 0.198,
    contractRenewal: "2027-02-12"
  },
  {
    id: "c-004",
    name: "BlueOak Home Goods",
    segment: "Enterprise",
    region: "West",
    vertical: "Consumer Goods",
    owner: "Evan Miller",
    annualRevenue: 5910000,
    targetRevenue: 6400000,
    grossMargin: 0.133,
    baselineMargin: 0.156,
    contractRenewal: "2026-08-20"
  },
  {
    id: "c-005",
    name: "Keystone Pharma",
    segment: "Strategic",
    region: "Northeast",
    vertical: "Healthcare",
    owner: "Maya Chen",
    annualRevenue: 6580000,
    targetRevenue: 6900000,
    grossMargin: 0.226,
    baselineMargin: 0.214,
    contractRenewal: "2027-01-10"
  },
  {
    id: "c-006",
    name: "HarborTech Components",
    segment: "Mid-Market",
    region: "West",
    vertical: "Manufacturing",
    owner: "Luis Romero",
    annualRevenue: 3180000,
    targetRevenue: 3800000,
    grossMargin: 0.176,
    baselineMargin: 0.182,
    contractRenewal: "2026-12-05"
  },
  {
    id: "c-007",
    name: "Redwood Appliances",
    segment: "Enterprise",
    region: "Southwest",
    vertical: "Durables",
    owner: "Priya Shah",
    annualRevenue: 4490000,
    targetRevenue: 5000000,
    grossMargin: 0.158,
    baselineMargin: 0.165,
    contractRenewal: "2026-10-18"
  },
  {
    id: "c-008",
    name: "Atlas Auto Parts",
    segment: "Strategic",
    region: "Midwest",
    vertical: "Automotive",
    owner: "Jordan Price",
    annualRevenue: 8120000,
    targetRevenue: 7900000,
    grossMargin: 0.192,
    baselineMargin: 0.186,
    contractRenewal: "2027-03-22"
  }
];

const laneCities = [
  ["Chicago, IL", "Dallas, TX"],
  ["Atlanta, GA", "Orlando, FL"],
  ["Los Angeles, CA", "Phoenix, AZ"],
  ["Columbus, OH", "Charlotte, NC"],
  ["Memphis, TN", "Kansas City, MO"]
];

const modes: Lane["mode"][] = ["FTL", "LTL", "Intermodal", "Drayage"];

export const lanes: Lane[] = customers.flatMap((customer, customerIndex) =>
  laneCities.map(([origin, destination], laneIndex) => {
    const sequence = customerIndex * 5 + laneIndex + 1;
    const monthlyVolume = 34 + ((sequence * 7) % 76);
    const revenue = monthlyVolume * (1450 + ((sequence * 113) % 920));
    const margin = 0.115 + ((sequence * 17) % 145) / 1000;
    const targetMargin = 0.17 + ((sequence * 9) % 45) / 1000;

    return {
      id: `l-${String(sequence).padStart(3, "0")}`,
      accountId: customer.id,
      origin,
      destination,
      mode: modes[sequence % modes.length],
      monthlyVolume,
      revenue,
      margin,
      targetMargin,
      avgCostPerMile: 1.72 + ((sequence * 11) % 48) / 100,
      benchmarkCostPerMile: 1.68 + ((sequence * 7) % 36) / 100
    };
  })
);

const exceptionTypes: Shipment["exceptionType"][] = [
  "None",
  "None",
  "None",
  "None",
  "Pickup Delay",
  "Delivery Delay",
  "Tender Reject",
  "Claim",
  "Detention"
];

export const shipments: Shipment[] = Array.from({ length: 500 }, (_, index) => {
  const lane = lanes[index % lanes.length];
  const customer = customers.find((item) => item.id === lane.accountId)!;
  const monthOffset = index % 12;
  const day = (index % 27) + 1;
  const exceptionType = exceptionTypes[(index * 5 + lane.id.length) % exceptionTypes.length];
  const onTime = exceptionType === "None" || (index + customer.name.length) % 9 !== 0;
  const revenue = 1280 + ((index * 73) % 1820);
  const cost = revenue * (0.74 + ((index * 13) % 16) / 100);

  return {
    id: `s-${String(index + 1).padStart(4, "0")}`,
    accountId: customer.id,
    laneId: lane.id,
    shipDate: `2026-${String((monthOffset % 6) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    revenue,
    cost,
    onTime,
    exceptionType,
    status: exceptionType === "None" ? "Delivered" : index % 4 === 0 ? "Exception" : "Delivered"
  };
});

const actionTitles = [
  "Prepare renewal risk brief",
  "Review margin leakage on top three lanes",
  "Schedule executive sponsor check-in",
  "Validate Q3 volume forecast",
  "Propose drop-trailer expansion",
  "Resolve recurring detention pattern",
  "Align carrier routing guide",
  "Draft QBR expansion narrative",
  "Confirm claims recovery plan",
  "Audit spot quote dependency"
];

export const actionItems: ActionItem[] = Array.from({ length: 20 }, (_, index) => {
  const customer = customers[index % customers.length];
  const priorities: ActionItem["priority"][] = ["High", "Medium", "Low"];
  const statuses: ActionItem["status"][] = ["Open", "In Progress", "Done"];

  return {
    id: `a-${String(index + 1).padStart(3, "0")}`,
    accountId: customer.id,
    title: actionTitles[index % actionTitles.length],
    owner: customer.owner,
    dueDate: `2026-07-${String((index % 22) + 3).padStart(2, "0")}`,
    priority: priorities[(index + 1) % priorities.length],
    status: statuses[index % statuses.length]
  };
});
