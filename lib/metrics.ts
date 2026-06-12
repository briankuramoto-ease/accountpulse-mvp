import { ActionItem, Customer, Lane, Shipment } from "@/data/mockData";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export type ScoreLabel = "Healthy" | "Watch" | "At Risk" | "Critical";

export type ScoreFactor = {
  name: string;
  points: number;
  maxPoints: number;
  explanation: string;
};

export type AccountScore = {
  score: number;
  label: ScoreLabel;
  factors: ScoreFactor[];
  explanations: string[];
};

export type ExecutiveAccountBrief = {
  accountStatus: string[];
  whatChanged: string[];
  commercialImpact: string[];
  serviceRisks: string[];
  marginLeakageSignals: string[];
  expansionOpportunities: string[];
  recommendedInternalActions: string[];
  customerFacingTalkingPoints: string[];
};

function scoreLabel(score: number): ScoreLabel {
  if (score >= 85) return "Healthy";
  if (score >= 70) return "Watch";
  if (score >= 55) return "At Risk";
  return "Critical";
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function splitShipmentPeriods(shipments: Shipment[]) {
  const months = Array.from(new Set(shipments.map((shipment) => monthKey(shipment.shipDate)))).sort();
  const midpoint = Math.max(1, Math.ceil(months.length / 2));
  const priorMonths = months.slice(0, midpoint);
  const recentMonths = months.slice(midpoint);

  return {
    prior: shipments.filter((shipment) => priorMonths.includes(monthKey(shipment.shipDate))),
    recent: shipments.filter((shipment) => recentMonths.includes(monthKey(shipment.shipDate)))
  };
}

function percentChange(current: number, previous: number) {
  if (!previous) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

function shipmentRevenue(shipments: Shipment[]) {
  return shipments.reduce((sum, shipment) => sum + shipment.revenue, 0);
}

function shipmentMargin(shipments: Shipment[], fallback: number) {
  const revenue = shipmentRevenue(shipments);
  if (!revenue) return fallback;
  return shipments.reduce((sum, shipment) => sum + shipment.revenue - shipment.cost, 0) / revenue;
}

function factor(name: string, points: number, maxPoints: number, explanation: string): ScoreFactor {
  return {
    name,
    points: Math.round(clamp(points, 0, maxPoints)),
    maxPoints,
    explanation
  };
}

function topDrivers(factors: ScoreFactor[]) {
  const weakest = [...factors].sort((a, b) => a.points / a.maxPoints - b.points / b.maxPoints).slice(0, 3);
  return weakest.map((item) => item.explanation);
}

function describeTrend(value: number) {
  if (value >= 0.08) return "up materially";
  if (value >= 0.02) return "up modestly";
  if (value > -0.02) return "essentially flat";
  if (value > -0.08) return "down modestly";
  return "down materially";
}

export function calculateRevenueTrend(shipments: Shipment[]) {
  const { prior, recent } = splitShipmentPeriods(shipments);
  return percentChange(shipmentRevenue(recent), shipmentRevenue(prior));
}

export function calculateVolumeTrend(shipments: Shipment[]) {
  const { prior, recent } = splitShipmentPeriods(shipments);
  return percentChange(recent.length, prior.length);
}

export function calculateExceptionRate(shipments: Shipment[]) {
  if (!shipments.length) return 0;
  const exceptions = shipments.filter((shipment) => shipment.exceptionType !== "None").length;
  return exceptions / shipments.length;
}

export function calculateOnTimeDelivery(shipments: Shipment[]) {
  if (!shipments.length) return 0;
  const onTime = shipments.filter((shipment) => shipment.onTimeDelivery ?? shipment.onTime).length;
  return onTime / shipments.length;
}

export function calculateMarginTrend(customer: Customer, shipments: Shipment[]) {
  if (!shipments.length) return customer.grossMargin - customer.baselineMargin;
  const realizedMargin = shipmentMargin(shipments, customer.grossMargin);
  return realizedMargin - customer.baselineMargin;
}

export function calculateHealthScore(customer: Customer, shipments: Shipment[], actionItems: ActionItem[] = []) {
  const { prior, recent } = splitShipmentPeriods(shipments);
  const priorRevenue = shipmentRevenue(prior);
  const recentRevenue = shipmentRevenue(recent);
  const revenueTrend = percentChange(recentRevenue, priorRevenue);
  const marginTrend = calculateMarginTrend(customer, shipments);
  const onTimeDelivery = calculateOnTimeDelivery(shipments);
  const exceptionRate = calculateExceptionRate(shipments);
  const volumeTrend = percentChange(recent.length, prior.length);
  const openItems = actionItems.filter((item) => item.status !== "Done");
  const openHighPriority = openItems.filter((item) => item.priority === "High").length;
  const actionHygiene = actionItems.length ? 1 - openItems.length / actionItems.length - openHighPriority * 0.12 : 1;

  const factors = [
    factor(
      "Revenue trend",
      revenueTrend >= 0.1 ? 20 : revenueTrend >= 0 ? 14 + revenueTrend * 60 : 14 + revenueTrend * 70,
      20,
      `${revenueTrend >= 0 ? "Revenue is up" : "Revenue is down"} ${Math.abs(revenueTrend * 100).toFixed(1)}% in the recent period.`
    ),
    factor(
      "Gross margin trend",
      marginTrend >= 0.02 ? 25 : marginTrend >= 0 ? 18 + marginTrend * 350 : 18 + marginTrend * 360,
      25,
      `${marginTrend >= 0 ? "Gross margin is above" : "Gross margin is below"} baseline by ${Math.abs(marginTrend * 100).toFixed(1)} points.`
    ),
    factor(
      "On-time delivery",
      ((onTimeDelivery - 0.75) / 0.23) * 20,
      20,
      `On-time delivery is ${(onTimeDelivery * 100).toFixed(1)}% across the account.`
    ),
    factor(
      "Exception rate",
      ((0.3 - exceptionRate) / 0.25) * 15,
      15,
      `Exception rate is ${(exceptionRate * 100).toFixed(1)}% of shipments.`
    ),
    factor(
      "Volume stability",
      (1 - Math.min(Math.abs(volumeTrend), 0.35) / 0.35) * 10,
      10,
      `Shipment volume moved ${Math.abs(volumeTrend * 100).toFixed(1)}% between periods.`
    ),
    factor(
      "Action item hygiene",
      actionHygiene * 10,
      10,
      `${openItems.length} open action items, including ${openHighPriority} high-priority follow-ups.`
    )
  ];

  const score = Math.round(factors.reduce((sum, item) => sum + item.points, 0));

  return {
    score,
    label: scoreLabel(score),
    factors,
    explanations: topDrivers(factors)
  };
}

export function calculateExpansionScore(customer: Customer, lanes: Lane[], shipments: Shipment[]) {
  const { prior, recent } = splitShipmentPeriods(shipments);
  const revenueGrowth = percentChange(shipmentRevenue(recent), shipmentRevenue(prior));
  const priorLaneCount = new Set(prior.map((shipment) => shipment.laneId)).size;
  const recentLaneCount = new Set(recent.map((shipment) => shipment.laneId)).size;
  const laneCountGrowth = percentChange(recentLaneCount, priorLaneCount);
  const onTimeDelivery = calculateOnTimeDelivery(shipments);
  const averageLaneMargin = lanes.length ? lanes.reduce((sum, lane) => sum + lane.margin, 0) / lanes.length : 0;
  const exceptionRate = calculateExceptionRate(shipments);
  const penetration = lanes.length / 10;

  const factors = [
    factor(
      "Revenue growth",
      revenueGrowth >= 0.15 ? 20 : revenueGrowth >= 0 ? 10 + revenueGrowth * 67 : 10 + revenueGrowth * 50,
      20,
      `${revenueGrowth >= 0 ? "Revenue growth is positive" : "Revenue contracted"} at ${Math.abs(revenueGrowth * 100).toFixed(1)}%.`
    ),
    factor(
      "Lane count growth",
      laneCountGrowth >= 0.2 ? 20 : laneCountGrowth >= 0 ? 10 + laneCountGrowth * 50 : 10 + laneCountGrowth * 40,
      20,
      `Active lane count moved from ${priorLaneCount} to ${recentLaneCount}.`
    ),
    factor(
      "Strong service performance",
      ((onTimeDelivery - 0.82) / 0.16) * 15 + (1 - exceptionRate) * 5,
      20,
      `Service signal combines ${(onTimeDelivery * 100).toFixed(1)}% on-time delivery and ${(exceptionRate * 100).toFixed(1)}% exceptions.`
    ),
    factor(
      "Healthy margin",
      ((averageLaneMargin - 0.12) / 0.1) * 20,
      20,
      `Average lane margin is ${(averageLaneMargin * 100).toFixed(1)}%.`
    ),
    factor(
      "Low current lane penetration",
      (1 - clamp(penetration, 0, 1)) * 20,
      20,
      `${lanes.length} active lanes leaves ${Math.max(10 - lanes.length, 0)} modeled lane opportunities.`
    )
  ];

  const score = Math.round(factors.reduce((sum, item) => sum + item.points, 0));

  return {
    score,
    label: scoreLabel(score),
    factors,
    explanations: topDrivers(factors)
  };
}

export function identifyAtRiskAccounts(customers: Customer[], shipments: Shipment[], actionItems: ActionItem[]) {
  return customers
    .map((customer) => ({
      customer,
      score: calculateHealthScore(
        customer,
        shipments.filter((shipment) => shipment.accountId === customer.id),
        actionItems.filter((item) => item.accountId === customer.id)
      ).score
    }))
    .filter((item) => item.score < 70)
    .sort((a, b) => a.score - b.score);
}

export function identifyExpansionCandidates(customers: Customer[], lanes: Lane[], shipments: Shipment[]) {
  return customers
    .map((customer) => ({
      customer,
      score: calculateExpansionScore(
        customer,
        lanes.filter((lane) => lane.accountId === customer.id),
        shipments.filter((shipment) => shipment.accountId === customer.id)
      ).score
    }))
    .filter((item) => item.score >= 68)
    .sort((a, b) => b.score - a.score);
}

export function identifyMarginLeakageLanes(lanes: Lane[]) {
  return lanes
    .map((lane) => ({
      lane,
      leakage: lane.targetMargin - lane.margin,
      costGap: lane.avgCostPerMile - lane.benchmarkCostPerMile
    }))
    .filter((item) => item.leakage > 0.018 || item.costGap > 0.16)
    .sort((a, b) => b.leakage + b.costGap / 10 - (a.leakage + a.costGap / 10));
}

export function generateExecutiveAccountBrief(
  customer: Customer,
  accountLanes: Lane[],
  accountShipments: Shipment[],
  accountActions: ActionItem[]
): ExecutiveAccountBrief {
  const healthScore = calculateHealthScore(customer, accountShipments, accountActions);
  const expansionScore = calculateExpansionScore(customer, accountLanes, accountShipments);
  const revenueTrend = calculateRevenueTrend(accountShipments);
  const volumeTrend = calculateVolumeTrend(accountShipments);
  const marginTrend = calculateMarginTrend(customer, accountShipments);
  const onTimeDelivery = calculateOnTimeDelivery(accountShipments);
  const exceptionRate = calculateExceptionRate(accountShipments);
  const openActions = accountActions.filter((item) => item.status !== "Done");
  const highPriorityActions = openActions.filter((item) => item.priority === "High");
  const topLanes = [...accountLanes].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const leakageLanes = identifyMarginLeakageLanes(accountLanes).slice(0, 3);
  const worstServiceLanes = accountLanes
    .map((lane) => {
      const laneShipments = accountShipments.filter((shipment) => shipment.laneId === lane.id);
      return {
        lane,
        exceptionRate: calculateExceptionRate(laneShipments),
        onTimeDelivery: calculateOnTimeDelivery(laneShipments)
      };
    })
    .sort((a, b) => b.exceptionRate - a.exceptionRate || a.onTimeDelivery - b.onTimeDelivery)
    .slice(0, 3);
  const avgLaneMargin = accountLanes.length ? accountLanes.reduce((sum, lane) => sum + lane.margin, 0) / accountLanes.length : customer.grossMargin;
  const renewalRisk =
    healthScore.label === "Critical" || healthScore.label === "At Risk"
      ? "Protect the relationship before pricing or renewal leverage weakens."
      : "Maintain executive confidence while using the data to shape the next commercial ask.";

  return {
    accountStatus: [
      `${customer.name} is ${healthScore.label.toLowerCase()} with a health score of ${healthScore.score} and expansion score of ${expansionScore.score}.`,
      `Revenue is ${describeTrend(revenueTrend)} and shipment volume is ${describeTrend(volumeTrend)} versus the prior period.`,
      `Current gross margin is ${(customer.grossMargin * 100).toFixed(1)}%, with realized margin ${(Math.abs(marginTrend) * 100).toFixed(1)} points ${marginTrend >= 0 ? "above" : "below"} baseline.`
    ],
    whatChanged: [
      `Revenue moved ${revenueTrend >= 0 ? "up" : "down"} ${Math.abs(revenueTrend * 100).toFixed(1)}% in the latest shipment period.`,
      `Shipment count moved ${volumeTrend >= 0 ? "up" : "down"} ${Math.abs(volumeTrend * 100).toFixed(1)}%, which ${Math.abs(volumeTrend) > 0.12 ? "changes carrier density and forecast confidence" : "keeps the operating profile relatively stable"}.`,
      `Service finished at ${(onTimeDelivery * 100).toFixed(1)}% on-time delivery with ${(exceptionRate * 100).toFixed(1)}% exceptions.`
    ],
    commercialImpact: [
      renewalRisk,
      marginTrend < 0
        ? `Margin is trailing baseline, so rate, accessorial, and carrier-mix discipline should be part of the next commercial discussion.`
        : `Margin is above baseline, creating room to defend value and selectively pursue additional wallet share.`,
      revenueTrend < 0
        ? `Declining revenue should be clarified before the account is treated as stable pipeline coverage.`
        : `Positive revenue movement supports a stronger QBR narrative around reliability and earned growth.`
    ],
    serviceRisks: worstServiceLanes.map(
      ({ lane, exceptionRate: laneExceptionRate, onTimeDelivery: laneOnTime }) =>
        `${lane.origin} to ${lane.destination}: ${(laneOnTime * 100).toFixed(1)}% OTD and ${(laneExceptionRate * 100).toFixed(1)}% exceptions on ${lane.mode}.`
    ),
    marginLeakageSignals: leakageLanes.length
      ? leakageLanes.map(
          ({ lane, leakage, costGap }) =>
            `${lane.origin} to ${lane.destination}: margin is ${(leakage * 100).toFixed(1)} points below target with a ${costGap >= 0 ? "positive" : "favorable"} cost-per-mile gap of $${Math.abs(costGap).toFixed(2)}.`
        )
      : [`No priority leakage lane is above threshold; keep monitoring spot exposure and accessorial recovery.`],
    expansionOpportunities: [
      expansionScore.score >= 70
        ? `Expansion score supports a controlled growth ask, especially where service is stable and density already exists.`
        : `Expansion should be positioned selectively until service and margin risks are cleaner.`,
      ...topLanes.map((lane) => `${lane.origin} to ${lane.destination} is a high-value lane to use as the anchor for adjacent-lane or committed-volume discussion.`),
      accountLanes.length < 7
        ? `Current modeled penetration is ${accountLanes.length} lanes, leaving room to discuss uncovered origins, destinations, and mode mix.`
        : `Current lane penetration is relatively broad, so expansion should focus on consolidation and premium service commitments.`
    ],
    recommendedInternalActions: [
      ...openActions.slice(0, 4).map((item) => `${item.owner}: ${item.title} by ${item.dueDate} (${item.priority}).`),
      highPriorityActions.length
        ? `Close ${highPriorityActions.length} high-priority action item${highPriorityActions.length === 1 ? "" : "s"} before the customer conversation.`
        : `Confirm the account team has a clean owner/date plan for all open follow-ups before the QBR.`
    ],
    customerFacingTalkingPoints: [
      `Lead with the current service picture: ${(onTimeDelivery * 100).toFixed(1)}% on-time delivery and the specific lanes driving exceptions.`,
      marginTrend < 0
        ? `Frame pricing around cost-to-serve facts, not a generic rate increase.`
        : `Use margin stability to reinforce the value of the operating model before asking for more volume.`,
      revenueTrend >= 0
        ? `Position recent revenue growth as evidence that the partnership can absorb a broader lane set.`
        : `Ask directly what changed in tender behavior and where AccountPulse can recover lost freight.`
    ]
  };
}

export function getAccountSnapshot(
  customer: Customer,
  allLanes: Lane[],
  allShipments: Shipment[],
  allActions: ActionItem[]
) {
  const accountLanes = allLanes.filter((lane) => lane.accountId === customer.id);
  const accountShipments = allShipments.filter((shipment) => shipment.accountId === customer.id);
  const accountActions = allActions.filter((item) => item.accountId === customer.id);

  return {
    customer,
    lanes: accountLanes,
    shipments: accountShipments,
    actionItems: accountActions,
    healthScore: calculateHealthScore(customer, accountShipments, accountActions),
    expansionScore: calculateExpansionScore(customer, accountLanes, accountShipments),
    executiveBrief: generateExecutiveAccountBrief(customer, accountLanes, accountShipments, accountActions),
    marginTrend: calculateMarginTrend(customer, accountShipments),
    exceptionRate: calculateExceptionRate(accountShipments),
    onTimeDelivery: calculateOnTimeDelivery(accountShipments)
  };
}
