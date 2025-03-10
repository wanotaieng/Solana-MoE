import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Solana Transaction Parser",
  description:
    "AI-powered specialized transaction parser for Solana built on a Mixture of Experts (MoE) approach. Expert models cover SPL tokens, DeFi protocols, NFTs, and Governance.",
  keywords: [
    "solana",
    "transaction parser",
    "SPL tokens",
    "Metaplex",
    "NFT",
    "DeFi",
    "Raydium",
    "Jupiter",
    "Orca",
    "blockchain explorer",
    "web3",
    "governance",
    "mixture of experts",
  ],
  authors: [
    {
      name: "zombcat",
      url: "https://github.com/pumpkinzomb",
    },
  ],
  creator: "zombcat",
  publisher: "zombcat",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Solana Transaction Parser",
    description:
      "Advanced Solana transaction analysis using specialized AI experts for SPL, DeFi, NFTs, and Governance",
    type: "website",
    siteName: "Solana Transaction Parser",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solana Transaction Parser",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Transaction Parser",
    description:
      "Advanced Solana transaction analysis using specialized AI experts for SPL, DeFi, NFTs, and Governance",
    creator: "@zombcat",
    images: ["/twitter-image.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  icons: {
    icon: "/solana-favicon.ico",
    apple: "/solana-apple-icon.png",
  },
  category: "Technology",
  applicationName: "Solana Transaction Parser",
  other: {
    "theme-color": "#9945FF",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
