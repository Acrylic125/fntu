import { MainNavbar } from "@/components/navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

const sections = [
  {
    title: "Introduction",
    pages: [
      {
        title: "Getting Started",
        href: "/docs/getting-started",
      },
    ],
  },
  {
    title: "API Playground",
    pages: [
      {
        title: "Playground",
        href: "/docs/playground",
      },
      {
        title: "Hosting the Playground",
        href: "/docs/hosting",
      },
    ],
  },
  {
    title: "Download the Data",
    pages: [
      {
        title: "Download",
        href: "/docs/download",
      },
      {
        title: "Load into Database",
        href: "/docs/load-into-database",
      },
    ],
  },
  {
    title: "Scrape the Data",
    pages: [
      {
        title: "Scraper",
        href: "/docs/scraper",
      },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col">
      <MainNavbar />
      <div className="relative flex flex-row">
        <ScrollArea className="hidden lg:block w-64 h-[calc(100vh-64px)] border-r border-border">
          <div className="flex flex-col gap-8 p-4 md:px-8">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <h2 className="text-lg font-bold">{section.title}</h2>
                <div className="flex flex-col gap-2">
                  {section.pages.map((page) => (
                    <Link key={page.href} href={page.href}>
                      {page.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <ScrollArea className="flex-1 w-full h-[calc(100vh-64px)]">
          <div className="p-4 pt-12 pb-72 md:px-8 flex flex-col items-center">
            <div className="max-w-7xl w-full prose prose-sm md:prose-base lg:prose-lg prose-neutral dark:prose-invert">
              {children}
            </div>
          </div>
        </ScrollArea>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="lg:hidden absolute top-4 left-4"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <ScrollArea className="h-svh">
              <SheetHeader>
                <SheetTitle className="sr-only">Documentation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-8 p-8">
                {sections.map((section) => (
                  <div key={section.title} className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold">{section.title}</h2>
                    <div className="flex flex-col gap-2">
                      {section.pages.map((page) => (
                        <Link key={page.href} href={page.href}>
                          {page.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
