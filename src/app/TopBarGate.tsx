"use client";

import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function TopBarGate() {
  const pathname = usePathname();

  if (pathname.startsWith("/question/") || pathname === "/success") {
    return null;
  }

  return <TopBar />;
}
