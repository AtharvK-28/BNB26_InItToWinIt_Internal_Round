import Link from "next/link";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";

export default function NotFound() {
  return (
    <>
      <ExploreHeader showSearch={false} />
      <main className="mx-auto grid max-w-[1120px] items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <h1 className="text-[96px] leading-none font-bold tracking-tight md:text-[140px]">Oops!</h1>
          <p className="mt-4 text-[26px] leading-snug">We can&apos;t seem to find the page you&apos;re looking for.</p>
          <p className="mt-2 text-sm font-semibold text-ink-2">Error code: 404</p>
          <p className="mt-8 text-sm">Here are some helpful links instead:</p>
          <ul className="mt-3 space-y-2 text-sm underline underline-offset-2">
            <li>
              <Link href="/deals">Explore brand deals</Link>
            </li>
            <li>
              <Link href="/studio">Open your Studio</Link>
            </li>
            <li>
              <Link href="/c/mayamakes">See a media kit</Link>
            </li>
          </ul>
        </div>
        <div className="hidden justify-center md:flex" aria-hidden>
          <svg width="320" height="320" viewBox="0 0 320 320">
            <circle cx="160" cy="160" r="150" fill="#f7f7f7" />
            <rect x="80" y="100" width="160" height="110" rx="24" fill="#ffd1da" />
            <path d="M145 130v50l42-25-42-25Z" fill="#ff385c" />
            <circle cx="232" cy="96" r="22" fill="#fff" stroke="#222" strokeWidth="4" />
            <path d="M227 90l10 12M237 90l-10 12" stroke="#222" strokeWidth="4" strokeLinecap="round" />
            <path d="M110 240h100" stroke="#dddddd" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </main>
      <Footer />
    </>
  );
}
