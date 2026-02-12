"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Nav() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-emerald-400">
            🔬 DeSci Commons
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/papers" className="hover:text-emerald-400 transition">Papers</Link>
            <Link href="/submit" className="hover:text-emerald-400 transition">Submit</Link>
            <Link href="/review" className="hover:text-emerald-400 transition">Review</Link>
            <Link href="/funding" className="hover:text-emerald-400 transition">Funding</Link>
            <Link href="/bounties" className="hover:text-emerald-400 transition">Bounties</Link>
            <Link href="/profile" className="hover:text-emerald-400 transition">Profile</Link>
          </div>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
