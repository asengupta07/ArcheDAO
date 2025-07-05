"use client";

import { WalletSelector } from "@/components/WalletSelector";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { LabelValueGrid } from "@/components/LabelValueGrid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Beams from "@/components/ui/beams";
import FloatingNavbar from "@/components/FloatingNavbar";

export default function Home() {
  const { account, connected, network } = useWallet();

  const navItems = [
    { label: "Home", link: "#" },
    { label: "Wallet", link: "#wallet" },
    { label: "Features", link: "#features" },
    { label: "About", link: "#about" },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background Beams */}
      <div className="fixed inset-0 z-0">
        <Beams
          beamWidth={2}
          beamHeight={32}
          beamNumber={20}
          lightColor="#ff0000"
          speed={5}
          noiseIntensity={2}
          scale={0.2}
          rotation={135}
          beamSpacing={0}
        />
      </div>

      {/* Navbar */}
      <FloatingNavbar navItems={navItems} />

      {/* Main Content */}
      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                ArcheDAO
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Connect your Aptos wallet to start using our decentralized
                application. Secure, fast, and user-friendly blockchain
                interaction.
              </p>
              <div className="flex justify-center">
                <WalletSelector />
              </div>
            </div>

            {/* Wallet Information Section */}
            {connected && account && (
              <div className="mb-12" id="wallet">
                <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Wallet Connected
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Your wallet is successfully connected to the Aptos network
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LabelValueGrid
                      items={[
                        {
                          label: "Address",
                          value: (
                            <div className="font-mono text-sm break-all text-white">
                              {account.address?.toString()}
                            </div>
                          ),
                        },
                        {
                          label: "Network",
                          value: (
                            <div className="capitalize text-white">
                              {network?.name || "Unknown"}
                            </div>
                          ),
                        },
                        {
                          label: "ANS Name",
                          value: (
                            <div className="text-white">
                              {account.ansName || "Not set"}
                            </div>
                          ),
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-8 mb-12" id="features">
              <Card className="text-center bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    🔒 Secure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200">
                    Your wallet connection is secured using industry-standard
                    encryption
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg text-white">⚡ Fast</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200">
                    Built on Aptos blockchain for lightning-fast transaction
                    speeds
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    🌟 User-Friendly
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200">
                    Simple and intuitive interface for seamless blockchain
                    interaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Getting Started Section */}
            {!connected && (
              <Card
                className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20"
                id="about"
              >
                <CardHeader>
                  <CardTitle className="text-white">Getting Started</CardTitle>
                  <CardDescription className="text-gray-200">
                    Follow these simple steps to connect your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-3 text-gray-200">
                    <li>Click the "Connect a Wallet" button above</li>
                    <li>Choose your preferred wallet from the list</li>
                    <li>Follow the prompts to authorize the connection</li>
                    <li>
                      Start using the application with your connected wallet
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
