import Link from "next/link";
import { Globe } from "lucide-react";

const COLS = [
  {
    title: "Support",
    links: [
      ["Help Center", "/"],
      ["Payment protection", "/"],
      ["Report a scam", "/"],
      ["Creator safety", "/"],
    ],
  },
  {
    title: "Creators",
    links: [
      ["Open your Studio", "/studio"],
      ["Fair-rate calculator", "/studio/deals"],
      ["Contract scanner", "/studio/deals"],
      ["Your media kit", "/c/mayamakes"],
    ],
  },
  {
    title: "CreatorAI",
    links: [
      ["How it works", "/onboarding"],
      ["For brands", "/"],
      ["Brand trust scores", "/"],
      ["Careers", "/"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line-soft bg-surface pb-24 md:pb-0">
      <div className="mx-auto max-w-[1760px] px-6 py-12 lg:px-10 xl:px-20">
        <div className="grid gap-8 md:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 text-sm font-semibold">{c.title}</h3>
              <ul className="space-y-3 text-sm text-ink">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line-soft">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-3 px-6 py-6 text-sm md:flex-row md:items-center md:justify-between lg:px-10 xl:px-20">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink">
            <span>© 2026 CreatorAI, Inc.</span>
            <span>·</span>
            <Link href="/" className="hover:underline">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/" className="hover:underline">
              Terms
            </Link>
            <span>·</span>
            <span className="text-ink-2">All brands shown are fictional demo data</span>
          </div>
          <div className="flex items-center gap-5 font-semibold">
            <span className="inline-flex items-center gap-2">
              <Globe className="size-4" /> English (US)
            </span>
            <span>$ USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
