/* eslint-disable */
"use client";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_APTOS_API_KEY_TESTNET?: string;
      NEXT_PUBLIC_APTOS_API_KEY_DEVNET?: string;
    }
  }
}

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { setupAutomaticEthereumWalletDerivation } from "@aptos-labs/derived-wallet-ethereum";
import { setupAutomaticSolanaWalletDerivation } from "@aptos-labs/derived-wallet-solana";
import { PropsWithChildren, useEffect } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { useClaimSecretKey } from "@/hooks/useClaimSecretKey";
import { useAutoConnect } from "./AutoConnectProvider";
import { useToast } from "@/hooks/use-toast";

const searchParams =
  typeof window !== "undefined"
    ? new URL(window.location.href).searchParams
    : undefined;
const deriveWalletsFrom =
  searchParams?.get("deriveWalletsFrom")?.split(",") || [];
if (deriveWalletsFrom?.includes("ethereum")) {
  setupAutomaticEthereumWalletDerivation({ defaultNetwork: Network.TESTNET });
}
if (deriveWalletsFrom?.includes("solana")) {
  setupAutomaticSolanaWalletDerivation({ defaultNetwork: Network.TESTNET });
}

let dappImageURI: string | undefined;
if (typeof window !== "undefined") {
  dappImageURI = `${window.location.origin}${window.location.pathname}favicon.ico`;
}

// Create a wrapper component to handle wallet state
function WalletStateHandler({ children }: PropsWithChildren) {
  const { connected } = useWallet();
  const { setAutoConnect } = useAutoConnect();

  useEffect(() => {
    if (connected) {
      // When successfully connected, ensure autoConnect is enabled
      setAutoConnect(true);
    }
  }, [connected, setAutoConnect]);

  return <>{children}</>;
}

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { autoConnect } = useAutoConnect();
  const { toast } = useToast();

  // Enables claim flow when the `claim` query param is detected
  const claimSecretKey = useClaimSecretKey();

  return (
    <AptosWalletAdapterProvider
      autoConnect={autoConnect}
      dappConfig={{
        network: Network.TESTNET,
        aptosApiKeys: {
          testnet: process.env.NEXT_PUBLIC_APTOS_API_KEY_TESTNET,
          devnet: process.env.NEXT_PUBLIC_APTOS_API_KEY_DEVNET,
        },
        aptosConnect: {
          claimSecretKey,
          dappId: "57fa42a9-29c6-4f1e-939c-4eefa36d9ff5",
          dappImageURI,
        },
        mizuwallet: {
          manifestURL:
            "https://assets.mz.xyz/static/config/mizuwallet-connect-manifest.json",
        },
      }}
      onError={(error: any) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Unknown wallet error",
        });
      }}
    >
      <WalletStateHandler>
        {children}
      </WalletStateHandler>
    </AptosWalletAdapterProvider>
  );
};
