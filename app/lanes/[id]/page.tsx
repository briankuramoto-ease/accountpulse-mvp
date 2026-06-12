import { LaneDetailClient } from "@/components/LaneDetailClient";
import { lanes } from "@/data/mockData";

export function generateStaticParams() {
  return lanes.map((lane) => ({ id: lane.id }));
}

export default async function LanePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LaneDetailClient laneId={id} />;
}
