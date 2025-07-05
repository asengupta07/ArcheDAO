"use client";

import { WalletSelector } from "@/components/WalletSelector";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { LabelValueGrid } from "@/components/LabelValueGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { account, connected, network } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              ArcheDAO
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect your Aptos wallet to start using our decentralized application. 
              Secure, fast, and user-friendly blockchain interaction.
            </p>
            <div className="flex justify-center">
              <WalletSelector />
            </div>
          </div>

          {/* Wallet Information Section */}
          {connected && account && (
            <div className="mb-12">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Wallet Connected
                  </CardTitle>
                  <CardDescription>
                    Your wallet is successfully connected to the Aptos network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LabelValueGrid
                    items={[
                      {
                        label: "Address",
                        value: (
                          <div className="font-mono text-sm break-all">
                            {account.address?.toString()}
                          </div>
                        ),
                      },
                      {
                        label: "Network",
                        value: (
                          <div className="capitalize">
                            {network?.name || "Unknown"}
                          </div>
                        ),
                      },
                      {
                        label: "ANS Name",
                        value: (
                          <div>
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
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">🔒 Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Your wallet connection is secured using industry-standard encryption
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">⚡ Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Built on Aptos blockchain for lightning-fast transaction speeds
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">🌟 User-Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Simple and intuitive interface for seamless blockchain interaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Section */}
          {!connected && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these simple steps to connect your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                  <li>Click the "Connect a Wallet" button above</li>
                  <li>Choose your preferred wallet from the list</li>
                  <li>Follow the prompts to authorize the connection</li>
                  <li>Start using the application with your connected wallet</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
