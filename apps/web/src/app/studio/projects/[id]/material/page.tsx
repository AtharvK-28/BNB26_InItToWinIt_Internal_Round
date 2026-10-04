import { ProjectPage } from "@/components/video/ProjectPage";
import { MaterialView } from "@/components/video/MaterialView";

export default async function Page(props: PageProps<"/studio/projects/[id]/material">) {
  const { id } = await props.params;
  return (
    <ProjectPage>
      <MaterialView id={id} key={id} />
    </ProjectPage>
  );
}
