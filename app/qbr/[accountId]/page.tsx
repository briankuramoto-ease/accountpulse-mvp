import { QbrDetailClient } from "@/components/QbrDetailClient";
import { customers } from "@/data/mockData";

export function generateStaticParams() {
  return customers.map((customer) => ({ accountId: customer.id }));
}

export default async function QbrPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return <QbrDetailClient accountId={accountId} />;
}
