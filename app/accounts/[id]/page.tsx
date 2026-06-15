import { AccountDetailClient } from "@/components/AccountDetailClient";
import { customers } from "@/data/mockData";

export function generateStaticParams() {
  return customers.map((customer) => ({ id: customer.id }));
}

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountDetailClient accountId={id} />;
}
