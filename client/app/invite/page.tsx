"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Aurora } from "@/components/aurora";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network as AptosNetwork } from "@aptos-labs/ts-sdk";
import { CONTRACT_FUNCTIONS } from "@/config/contract";

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account, connected, signAndSubmitTransaction } = useWallet();

  // Initialize Aptos client
  useEffect(() => {
    const config = new AptosConfig({
      network: AptosNetwork.DEVNET,
    });
    setAptosClient(new Aptos(config));
  }, []);

  // Check for invite code in URL parameters on mount
  useEffect(() => {
    const urlInviteCode = searchParams.get("code");
    if (urlInviteCode) {
      setInviteCode(urlInviteCode);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to join the DAO.",
        variant: "destructive",
      });
      return;
    }

    if (!inviteCode.trim()) {
      toast({
        title: "Missing Invite Code",
        description: "Please enter a valid invite code.",
        variant: "destructive",
      });
      return;
    }

    if (!aptosClient) {
      toast({
        title: "Client Not Ready",
        description: "Please wait for the client to initialize.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the smart contract function to join DAO by code
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.JOIN_DAO_BY_CODE,
          functionArguments: [inviteCode.trim()],
        },
      });

      // Wait for transaction to be confirmed
      await aptosClient.waitForTransaction({ 
        transactionHash: response.hash 
      });

      toast({
        title: "Welcome to the DAO!",
        description: `Successfully joined with invite code: ${inviteCode}`,
      });

      // Redirect to dashboard
      router.push("/dao/dashboard");
    } catch (error) {
      console.error("Error processing invite:", error);
      let errorMessage = "The invite code is invalid or has expired.";
      
      if (error instanceof Error) {
        if (error.message.includes("E_DAO_NOT_FOUND")) {
          errorMessage = "DAO not found. Please check your invite code.";
        } else if (error.message.includes("E_NOT_AUTHORIZED")) {
          errorMessage = "This DAO doesn't allow public membership.";
        } else if (error.message.includes("already a member")) {
          errorMessage = "You are already a member of this DAO.";
        }
      }
      
      toast({
        title: "Failed to Join DAO",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#8B0000", "#660000", "#8B0000"]}
          amplitude={1.2}
          speed={0.3}
          blend={0.8}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-16">
        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-12 text-center">
          Join the DAO
        </h1>

        {/* Wallet Connection Status */}
        {!connected && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 max-w-md w-full text-center">
            <p className="text-red-300 text-sm">
              Please connect your wallet to join a DAO
            </p>
          </div>
        )}

        {connected && account && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 max-w-md w-full text-center">
            <p className="text-green-300 text-sm">
              Connected: {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 text-center font-mono text-xl tracking-wider"
            placeholder="Enter invitation code"
            required
            disabled={!connected}
          />

          <Button
            type="submit"
            disabled={isLoading || !connected}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Joining DAO...</span>
              </div>
            ) : !connected ? (
              "Connect Wallet First"
            ) : (
              "Join DAO"
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-8 text-center max-w-md">
          <p className="text-gray-400 text-sm">
            Enter the invitation code provided by the DAO to join as a member. 
            You'll receive 100 initial voting power tokens upon joining.
          </p>
        </div>
      </div>
    </div>
  );
}
