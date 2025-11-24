import { AnalyzeHero } from "@/components/icons/analyze-hero";
import { FStarsHero } from "@/components/icons/fstars-hero";
import { HeroIcon } from "@/components/icons/hero";
import { MainNavbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <MainNavbar />
      <div className="relative flex flex-row">
        <ScrollArea className="flex-1 w-full h-[calc(100vh-64px)]">
          <div className="w-full flex flex-col items-center pb-72">
            <div className="w-full flex flex-col gap-8 items-center max-w-7xl">
              <header className="w-full flex flex-col items-center lg:flex-row p-8 gap-8 lg:gap-0">
                <div className="flex-3 xl:flex-2 flex flex-col gap-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl leading-14 md:leading-18 lg:leading-20 font-bold text-center lg:text-left">
                    MAKING <span className="text-red-400">NTU</span>
                    <br />
                    MORE <span className="text-blue-400">OPEN</span>
                  </h1>
                  <p className="text-lg max-w-sm text-center lg:text-left">
                    Distilling data from NTU to make it easy for you to build
                    and analyze.
                  </p>
                  <div className="pt-8 flex flex-row justify-center lg:justify-start gap-2">
                    <Button asChild className="w-fit">
                      <Link href="/docs/getting-started">Get Started</Link>
                    </Button>
                    <Button asChild className="w-fit" variant="outline">
                      <a
                        href="https://github.com/Acrylic125/fntu"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="flex-2 lg:flex-3">
                  <HeroIcon />
                </div>
              </header>
              <section className="w-full p-8 flex flex-col gap-4">
                <h2 className="text-3xl font-bold">
                  3 Ways to access the data
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-2 md:gap-4 border border-border rounded-md bg-card">
                    <div className="flex flex-col gap-2 md:gap-4 p-4 md:p-6">
                      <h3 className="text-blue-400 text-2xl md:text-3xl lg:text-4xl leading-10 md:leading-14 lg:leading-16 font-bold">
                        API Playground
                      </h3>
                      <p className="text-lg max-w-sm">
                        API to play with the data. See what data is available.
                      </p>
                    </div>
                    <div className="px-1.5 md:px-3 pb-4 md:pb-6">
                      <Button
                        variant="link"
                        asChild
                        className="w-fit text-base"
                      >
                        <Link href="/docs/playground">
                          Learn More <ArrowRightIcon className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex flex-col gap-2 md:gap-4 border border-border rounded-md bg-card">
                    <div className="flex flex-col gap-2 md:gap-4 p-4 md:p-6">
                      <h3 className="text-red-400 text-2xl md:text-3xl lg:text-4xl leading-10 md:leading-14 lg:leading-16 font-bold">
                        Download the Data
                      </h3>
                      <p className="text-lg max-w-sm">
                        Raw data that{"'"}s organised for you to load into your
                        own database.
                      </p>
                    </div>
                    <div className="px-1.5 md:px-3 pb-4 md:pb-6">
                      <Button
                        variant="link"
                        asChild
                        className="w-fit text-base"
                      >
                        <Link href="/docs/download">
                          Learn More <ArrowRightIcon className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-col gap-2 md:gap-4 border border-border rounded-md bg-card">
                    <div className="flex flex-col gap-2 md:gap-4 p-4 md:p-6">
                      <h3 className="text-primary text-2xl md:text-3xl lg:text-4xl leading-10 md:leading-14 lg:leading-16 font-bold">
                        Scrape the Data
                      </h3>
                      <p className="text-lg max-w-2xl">
                        Scripts ready to scrape and transform data. Perfect for
                        when you need to extend off, to suit your own use cases.
                      </p>
                    </div>
                    <div className="px-1.5 md:px-3 pb-4 md:pb-6">
                      <Button
                        variant="link"
                        asChild
                        className="w-fit text-base"
                      >
                        <Link href="/docs/scraper">
                          Learn More <ArrowRightIcon className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
              <section className="w-full p-8 flex flex-col gap-8 items-center">
                <h2 className="text-3xl font-bold text-center">
                  Cool stuff you can do
                </h2>
                <div className="w-full flex flex-col gap-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="col-span-1 flex flex-col items-center lg:items-start gap-2 h-full justify-center">
                      <h3 className="font-bold text-center lg:text-left text-primary text-2xl md:text-3xl lg:text-4xl">
                        Build stuff like F*** Stars
                      </h3>
                      <p className="text-lg max-w-sm text-center lg:text-left">
                        We dread STARs, we dread having to swap indexes, we
                        dread finding a good toilet to uhhh... do business in.
                        So many problems, find one and build a solution!
                      </p>
                      <div className="flex flex-row gap-2 pt-8">
                        <Button
                          variant="outline"
                          asChild
                          className="w-fit text-base"
                        >
                          <a
                            href="https://fstars.benapps.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Check out FStars{" "}
                          </a>
                        </Button>
                        <Button
                          variant="default"
                          asChild
                          className="w-fit text-base"
                        >
                          <a
                            href="https://github.com/Acrylic125/fstars"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Github
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-1 p-4">
                      <FStarsHero />
                    </div>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="col-span-1 flex flex-col items-center lg:items-start gap-2 h-full justify-center">
                      <h3 className="font-bold max-w-sm text-center lg:text-left text-primary text-2xl md:text-3xl lg:text-4xl">
                        Ask and answer the {'"important"'} questions
                      </h3>
                      <p className="text-lg max-w-sm text-center lg:text-left">
                        {
                          "How many toilets are there on campus? How much utilisation do the facilities get? Analyze the data to find the answers!"
                        }
                      </p>
                    </div>
                    <div className="col-span-1 p-4 flex flex-col items-center justify-center">
                      <AnalyzeHero />
                    </div>
                  </div>
                </div>
              </section>

              <section className="w-full p-8 flex flex-col gap-8 items-center">
                <h2 className="text-3xl font-bold text-center">Try it out!</h2>
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  <Button asChild className="w-fit">
                    <Link href="/docs/getting-started">Get Started</Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
