import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { PropsWithChildren } from "react";
import { AutoConnectProvider } from "@/components/AutoConnectProvider";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { WalletSelector } from "@/components/WalletSelector";
import Navbar from "@/components/FloatingNavbar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ArcheDAO",
  description:
    "ArcheDAO is a decentralized DAO ecosystem on Aptos, onboard community and grow together",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "flex justify-center min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AutoConnectProvider>
          <ReactQueryClientProvider>
            <WalletProvider>
              <div className="fixed top-4 right-4 z-50">
                <WalletSelector className="px-6 py-2 text-base font-semibold" />
              </div>
              <Navbar
                navItems={[
                  { label: "Home", link: "#" },
                  { label: "Wallet", link: "#wallet" },
                  { label: "Features", link: "#features" },
                  { label: "About", link: "#about" },
                ]}
              />
              {children}
            </WalletProvider>
          </ReactQueryClientProvider>
        </AutoConnectProvider>
      </body>
    </html>
  );
}
