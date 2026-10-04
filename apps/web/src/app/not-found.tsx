import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>This page isn’t on your desk.</h1>
      <Link href="/" className="text-link">
        Back to projects
      </Link>
    </div>
  );
}
