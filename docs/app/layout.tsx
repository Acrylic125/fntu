import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F*** NTU",
  description:
    "Distilling data from NTU to make it easy for you to build and analyze.",
  applicationName: "F*** NTU",
  authors: [{ name: "Acrylic125", url: "https://github.com/Acrylic125" }],
  keywords: ["fntu", "ntu", "data", "api", "playground"],
  twitter: {
    title: "F*** NTU",
    description:
      "Distilling data from NTU to make it easy for you to build and analyze.",
    card: "summary_large_image",
    site: "@fntu",
    creator: "@acrylic125",
    images: "/banner.png",
  },
  openGraph: {
    title: "F*** NTU",
    description:
      "Distilling data from NTU to make it easy for you to build and analyze.",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/banner.png",
        width: 960,
        height: 540,
        alt: "F*** NTU Thumbnail",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="4f3761d0-a3c6-4fad-a2d3-c7f076718680"
        ></script>
      </head>
      <Providers>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
        >
          {children}
        </body>
      </Providers>
    </html>
  );
}
