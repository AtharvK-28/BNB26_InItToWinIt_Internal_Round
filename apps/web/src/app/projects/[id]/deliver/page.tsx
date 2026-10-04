import { DeliveryWorkspace } from "@/components/delivery-workspace";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeliveryWorkspace id={id} key={id} />;
}
