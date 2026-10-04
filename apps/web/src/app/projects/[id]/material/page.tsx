import { MaterialWorkspace } from "@/components/material-workspace";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MaterialWorkspace id={id} key={id} />;
}
