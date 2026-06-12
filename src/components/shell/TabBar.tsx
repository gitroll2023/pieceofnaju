"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Route, Puzzle } from "lucide-react";

const TABS = [
  { href: "/", label: "발견", icon: Map },
  { href: "/recommend", label: "추천", icon: Route },
  { href: "/pieces", label: "내조각", icon: Puzzle },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      <ul style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                data-active={active}
              >
                <Icon strokeWidth={active ? 2.4 : 1.9} className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
