import { ProjectPage } from "@/components/video/ProjectPage";
import { StoryView } from "@/components/video/StoryView";

export default async function Page(props: PageProps<"/studio/projects/[id]">) {
  const { id } = await props.params;
  return (
    <ProjectPage>
      <StoryView id={id} key={id} />
    </ProjectPage>
  );
}
