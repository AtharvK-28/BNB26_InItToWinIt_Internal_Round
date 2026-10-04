import { NewProjectPage } from "./NewProjectPage";

export default async function Page(props: PageProps<"/studio/projects/new">) {
  const sp = await props.searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  return <NewProjectPage title={str(sp.title)} brief={str(sp.brief)} contentId={str(sp.content)} />;
}
