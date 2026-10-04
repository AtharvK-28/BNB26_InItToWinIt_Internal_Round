import { ProjectPage } from "@/components/video/ProjectPage";
import { CutsView } from "@/components/video/CutsView";

export default async function Page(props: PageProps<"/studio/projects/[id]/cuts">) {
  const { id } = await props.params;
  return (
    <ProjectPage>
      <CutsView id={id} key={id} />
    </ProjectPage>
  );
}
