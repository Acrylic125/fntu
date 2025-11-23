"use client";

import Link from "next/link";
import { Favicon } from "./icons/favicon";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";

export function MainNavbar() {
  const { user } = useUser();

  return (
    <nav className="w-full flex flex-col items-center border-b border-border">
      <div className="w-full h-14 md:h-16 max-w-ui flex flex-row items-center justify-between py-1.5 px-4 md:px-8">
        <div className="flex flex-row items-center h-full">
          <Link href="/" className="h-full flex flex-row gap-2.5 items-center">
            <div className="relative aspect-square w-10 rounded-md overflow-hidden">
              <Favicon />
            </div>
            <div className="text-base font-bold">FNTU</div>
          </Link>
          <Button
            variant="ghost"
            asChild
            className="text-left flex flex-row items-center justify-start"
          >
            <Link href="/docs">Docs</Link>
          </Button>
        </div>
        <div className="flex flex-row items-center gap-2">
          {user ? <UserButton /> : <SignInButton />}
        </div>
      </div>
    </nav>
  );
}
