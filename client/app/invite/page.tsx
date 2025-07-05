"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Aurora } from "@/components/aurora";
import { toast } from "@/hooks/use-toast";

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for invite code in URL parameters on mount
  useEffect(() => {
    const urlInviteCode = searchParams.get("code");
    if (urlInviteCode) {
      setInviteCode(urlInviteCode);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      toast({
        title: "Missing Invite Code",
        description: "Please enter a valid invite code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement invite code validation and DAO onboarding logic
      // This would typically involve:
      // 1. Validating the invite code with your backend/contract
      // 2. Checking if the code is still valid/unused
      // 3. Processing the DAO membership

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Welcome to the DAO!",
        description: `Successfully joined with invite code: ${inviteCode}`,
      });

      // Redirect to onboarding or dashboard
      router.push("/onboarding");
    } catch (error) {
      console.error("Error processing invite:", error);
      toast({
        title: "Invalid Invite Code",
        description: "The invite code is invalid or has expired.",
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
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Joining...</span>
              </div>
            ) : (
              "Join"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
