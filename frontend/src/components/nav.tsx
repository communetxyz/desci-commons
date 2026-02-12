"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/papers", label: "Papers" },
  { href: "/submit", label: "Submit" },
  { href: "/review", label: "Review" },
  { href: "/funding", label: "Funding" },
  { href: "/bounties", label: "Bounties" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition flex-shrink-0"
              onClick={closeMobileMenu}
            >
              🔬 DeSci Commons
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:text-emerald-400 transition px-2 py-1 rounded ${
                    isActive(item.href) 
                      ? "text-emerald-400 bg-emerald-400/10" 
                      : "text-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-400 hover:text-gray-200 transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-950/95">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition ${
                    isActive(item.href)
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800"
                  }`}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Connect Button */}
              <div className="sm:hidden pt-4 border-t border-gray-800 mt-4">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
