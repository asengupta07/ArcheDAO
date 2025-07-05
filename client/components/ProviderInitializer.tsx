'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network as AptosNetwork } from '@aptos-labs/ts-sdk';
import { toast } from '@/hooks/use-toast';

// Contract information from environment variables
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '';
const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || '';

export function ProviderInitializer() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize Aptos client for devnet
  useEffect(() => {
    const config = new AptosConfig({
      network: AptosNetwork.DEVNET,
    });
    setAptosClient(new Aptos(config));
  }, []);

  // Check if the portal system is initialized
  const checkSystemInitialized = async () => {
    if (!aptosClient || !account) return;

    try {
      await aptosClient.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::PortalSystem`,
      });
      setInitialized(true);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Resource not found")) {
        setInitialized(false);
        // Auto-initialize if not found
        initializeSystem();
      } else {
        console.error("Error checking system initialization:", error);
      }
    }
  };

  // Initialize the portal system
  const initializeSystem = async () => {
    if (!aptosClient || !account || isInitializing) return;

    try {
      setIsInitializing(true);

      const transaction: any = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::initialize`,
          functionArguments: [],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      setInitialized(true);
      toast({
        title: "Portal System Initialized",
        description: "The portal system has been initialized successfully.",
      });
    } catch (error) {
      console.error("Error initializing system:", error);
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize portal system.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Effect to check/initialize when wallet connects
  useEffect(() => {
    if (aptosClient && account && connected && !initialized && !isInitializing) {
      checkSystemInitialized();
    }
  }, [aptosClient, account, connected, initialized, isInitializing]);

  // This component doesn't render anything, it just handles initialization
  return null;
} 