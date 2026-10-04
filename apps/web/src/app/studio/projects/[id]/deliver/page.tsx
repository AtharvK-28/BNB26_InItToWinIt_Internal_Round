import { ProjectPage } from "@/components/video/ProjectPage";
import { DeliverView } from "@/components/video/DeliverView";

export default async function Page(props: PageProps<"/studio/projects/[id]/deliver">) {
  const { id } = await props.params;
  return (
    <ProjectPage>
      <DeliverView id={id} key={id} />
    </ProjectPage>
  );
}
