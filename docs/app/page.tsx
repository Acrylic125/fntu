import { MainNavbar } from "@/components/navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <MainNavbar />
      <div className="relative flex flex-row">
        <ScrollArea className="flex-1 w-full h-[calc(100vh-64px)]">
          <div className="p-8 md:px-8 flex flex-col items-center"></div>
        </ScrollArea>
      </div>
    </div>
  );
}
