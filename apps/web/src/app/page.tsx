import { redirect } from "next/navigation";

/** CreatorAI opens on the Studio; the brand-deal marketplace lives at /deals. */
export default function Home() {
  redirect("/studio");
}
