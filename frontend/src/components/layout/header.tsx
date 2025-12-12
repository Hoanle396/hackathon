import React from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "Login", href: "/login" },
  { label: "Get Started", href: "/register", highlight: true },
];

const Header = () => {
  const router = useRouter();

  return (
    <nav className="backdrop-blur-md bg-black border-b border-zinc-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent cursor-pointer">
              AI Code Reviewer
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-zinc-300 transition-all duration-300 hover:text-white group",
                  item.highlight &&
                    "text-black bg-white px-4 py-1.5 rounded-md font-medium hover:bg-zinc-200 shadow-md"
                )}
              >
                {!item.highlight && (
                  <>
                    {item.label}
                    <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                  </>
                )}
                {item.highlight && item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
