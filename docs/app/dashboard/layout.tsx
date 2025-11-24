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

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col">
      <MainNavbar />
      <div className="relative flex flex-row">
        <ScrollArea className="flex-1 w-full h-[calc(100vh-64px)]">
          <div className="p-8 md:px-8 flex flex-col items-center">
            <div className="max-w-7xl w-full">{children}</div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
