'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network as AptosNetwork } from '@aptos-labs/ts-sdk';
import { toast } from '@/hooks/use-toast';
import { CONTRACT_CONFIG, CONTRACT_FUNCTIONS, RESOURCE_TYPES } from '../config/contract';

export function ProviderInitializer() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [checkingInitialization, setCheckingInitialization] = useState(false);

  // Initialize Aptos client for devnet
  useEffect(() => {
    const config = new AptosConfig({
      network: AptosNetwork.DEVNET,
    });
    setAptosClient(new Aptos(config));
  }, []);

  // Check if the platform is initialized by looking for PlatformConfig resource
  const checkPlatformInitialized = async () => {
    if (!aptosClient) return;

    try {
      setCheckingInitialization(true);
      
      // Check if the platform is initialized by looking for PlatformConfig
      await aptosClient.getAccountResource({
        accountAddress: CONTRACT_CONFIG.ADMIN_ADDRESS,
        resourceType: RESOURCE_TYPES.PLATFORM_CONFIG,
      });
      
      setInitialized(true);
      console.log("Platform is already initialized");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Resource not found")) {
        console.log("Platform not initialized, need to initialize");
        setInitialized(false);
      } else {
        console.error("Error checking platform initialization:", error);
      }
    } finally {
      setCheckingInitialization(false);
    }
  };

  // Initialize the platform (admin only)
  const initializePlatform = async () => {
    if (!aptosClient || !account || isInitializing) return;

    try {
      setIsInitializing(true);
      console.log("Initializing platform...");

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.INITIALIZE,
          functionArguments: [],
        },
      });
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      setInitialized(true);
      toast({
        title: "Platform Initialized",
        description: "The ArcheDAO platform has been initialized successfully.",
      });
    } catch (error) {
      console.error("Error initializing platform:", error);
      toast({
        title: "Platform Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize the platform.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Check platform initialization on component mount
  useEffect(() => {
    if (aptosClient && !checkingInitialization) {
      checkPlatformInitialized();
    }
  }, [aptosClient]);

  // Auto-initialize if admin is connected and platform is not initialized
  useEffect(() => {
    if (aptosClient && account && connected) {
      console.log("Account connected:", account.address.toString());
      console.log("Admin address:", CONTRACT_CONFIG.ADMIN_ADDRESS);
      console.log("Module address:", CONTRACT_CONFIG.MODULE_ADDRESS);
      console.log("Is admin?", account.address.toString() === CONTRACT_CONFIG.ADMIN_ADDRESS);
      console.log("Is module?", account.address.toString() === CONTRACT_CONFIG.MODULE_ADDRESS);
      console.log("Initialized?", initialized);
      console.log("Is initializing?", isInitializing);
      console.log("Checking initialization?", checkingInitialization);
    }
    
    if (
      aptosClient && 
      account && 
      connected && 
      !initialized && 
      !isInitializing && 
      !checkingInitialization &&
      (account.address.toString() === CONTRACT_CONFIG.ADMIN_ADDRESS || account.address.toString() === CONTRACT_CONFIG.MODULE_ADDRESS)
    ) {
      console.log("Admin connected, auto-initializing platform...");
      initializePlatform();
    }
  }, [aptosClient, account, connected, initialized, isInitializing, checkingInitialization]);

  // Show initialization status for debugging
  useEffect(() => {
    if (checkingInitialization) {
      console.log("Checking platform initialization...");
    }
  }, [checkingInitialization]);

  // Manual initialization function (exposed for admin use)
  const handleManualInitialization = async () => {
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to initialize the platform.",
        variant: "destructive",
      });
      return;
    }

    if (account?.address.toString() !== CONTRACT_CONFIG.ADMIN_ADDRESS && account?.address.toString() !== CONTRACT_CONFIG.MODULE_ADDRESS) {
      toast({
        title: "Unauthorized",
        description: "Only the admin can initialize the platform.",
        variant: "destructive",
      });
      return;
    }

    await initializePlatform();
  };

  // This component doesn't render anything visible, but could show initialization status
  if (checkingInitialization) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/20">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
          <span className="text-sm">Checking platform status...</span>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/20">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
          <span className="text-sm">Initializing platform...</span>
        </div>
      </div>
    );
  }

  if (!initialized && connected && (account?.address.toString() === CONTRACT_CONFIG.ADMIN_ADDRESS || account?.address.toString() === CONTRACT_CONFIG.MODULE_ADDRESS)) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/95 text-white p-6 rounded-xl backdrop-blur-md border border-red-500/30 shadow-2xl z-50 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">⚠️ Platform Not Initialized</div>
          <div className="text-sm text-red-100">
            The ArcheDAO platform needs to be initialized before use.
          </div>
          <div className="text-xs text-red-200 font-mono">
            Admin: {account?.address.toString().slice(0, 8)}...{account?.address.toString().slice(-8)}
          </div>
          <button
            onClick={handleManualInitialization}
            className="w-full px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            Initialize Platform Now
          </button>
        </div>
      </div>
    );
  }

  return null;
} 