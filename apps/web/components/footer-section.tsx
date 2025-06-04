import Link from "next/link";

import { LogoMarkDark, LogoMarkLight } from "./logo";

const links = [
  {
    href: "https://github.com/ephraimduncan/weekday",
    title: "GitHub",
  },
  {
    href: "/privacy",
    title: "Privacy Policy",
  },
  {
    href: "/terms",
    title: "Terms of Service",
  },
];

export default function FooterSection() {
  return (
    <footer className="bg-background border-b py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="order-last flex items-center gap-3 md:order-first">
            <Link
              className="flex items-center space-x-2"
              aria-label="home"
              href="/"
            >
              <LogoMarkDark
                className="text-foreground h-8 w-8 dark:hidden"
                aria-hidden={true}
              />
              <LogoMarkLight
                className="text-foreground hidden h-8 w-8 dark:block"
                aria-hidden={true}
              />
            </Link>
            <span className="text-muted-foreground block text-center text-sm">
              © {new Date().getFullYear()} Weekday, All rights reserved
            </span>
          </div>

          <div className="order-first flex flex-wrap gap-x-6 gap-y-4 md:order-last">
            {links.map((link, index) => (
              <Link
                key={index}
                className="text-muted-foreground hover:text-primary block duration-150"
                href={link.href}
              >
                <span>{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
