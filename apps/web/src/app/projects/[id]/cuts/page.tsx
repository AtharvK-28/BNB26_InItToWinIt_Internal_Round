import { CutsWorkspace } from "@/components/cuts-workspace";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CutsWorkspace id={id} key={id} />;
}
