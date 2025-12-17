"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "Login", href: "/login" },
  { label: "Get Started", href: "/register", highlight: true },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img
              src="/logo-horizontal.svg"
              alt="Logo"
              className="h-12 transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-zinc-300 transition hover:text-white group",
                  item.highlight &&
                  "text-black bg-white px-4 py-2 rounded-md font-medium hover:bg-zinc-200 shadow-md"
                )}
              >
                {!item.highlight && (
                  <>
                    {item.label}
                    <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full" />
                  </>
                )}
                {item.highlight && item.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-zinc-300 hover:text-white transition"
            aria-label="Toggle menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 bg-black",
          open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-6 pt-2 space-y-3 border-t border-zinc-800 bg-black">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block text-center py-3 rounded-lg text-zinc-300 hover:text-white transition",
                item.highlight &&
                "bg-white text-black font-semibold hover:bg-zinc-200 shadow"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Header;
