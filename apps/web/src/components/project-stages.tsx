import Link from "next/link";

export function ProjectStages({
  id,
  active,
}: {
  id: string;
  active: "story" | "material" | "cuts" | "deliver";
}) {
  return (
    <nav className="project-stages" aria-label="Project stages">
      <ol className="stage-strip">
        <li>
          <Link
            href={`/projects/${id}/material`}
            className={active === "material" ? "current" : ""}
            aria-current={active === "material" ? "page" : undefined}
          >
            <span>01</span>Material
          </Link>
        </li>
        <li>
          <Link
            href={`/projects/${id}`}
            className={active === "story" ? "current" : ""}
            aria-current={active === "story" ? "page" : undefined}
          >
            <span>02</span>Story
          </Link>
        </li>
        <li>
          <Link
            href={`/projects/${id}/cuts`}
            className={active === "cuts" ? "current" : ""}
            aria-current={active === "cuts" ? "page" : undefined}
          >
            <span>03</span>Cuts
          </Link>
        </li>
        <li>
          <Link
            href={`/projects/${id}/deliver`}
            className={active === "deliver" ? "current" : ""}
            aria-current={active === "deliver" ? "page" : undefined}
          >
            <span>04</span>Deliver
          </Link>
        </li>
      </ol>
    </nav>
  );
}
