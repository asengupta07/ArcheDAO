"use client";

import {
  APTOS_CONNECT_ACCOUNT_URL,
  AboutAptosConnect,
  AboutAptosConnectEducationScreen,
  AdapterNotDetectedWallet,
  AdapterWallet,
  AptosPrivacyPolicy,
  WalletItem,
  WalletSortingOptions,
  groupAndSortWallets,
  isAptosConnectWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  LogOut,
  User,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Add global styles for custom scrollbar
const scrollbarStyles = `
  .wallet-selector-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 0, 0, 0.3) rgba(255, 255, 255, 0.1);
  }

  .wallet-selector-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .wallet-selector-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .wallet-selector-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 0, 0, 0.3);
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .wallet-selector-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 0, 0, 0.5);
  }

  .wallet-selector-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

export function WalletSelector(
  walletSortingOptions: WalletSortingOptions & { className?: string }
) {
  const { account, connected, disconnect, wallet } = useWallet();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setIsConnecting(false);
  }, []);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address.toString());
      toast({
        title: "Success",
        description: "Copied wallet address to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy wallet address.",
      });
    }
  }, [account?.address, toast]);

  const handleConnect = useCallback(() => {
    setIsConnecting(true);
    // The connection will be handled by the wallet adapter
    // We'll reset the connecting state when dialog closes
  }, []);

  const glassClass =
    "backdrop-blur-md bg-white/10 border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-red-500/10 hover:scale-105 active:scale-95";

  return connected ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn(glassClass, "group relative overflow-hidden", walletSortingOptions.className)}>
          {/* Shimmer effect */}
          <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 ease-out" />
          
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Wallet className="w-4 h-4" />
            <span className="font-medium">
              {account?.ansName ||
                truncateAddress(account?.address?.toString()) ||
                "Unknown"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-xl shadow-black/20 animate-in fade-in-0 zoom-in-95 duration-200 min-w-[200px]"
      >
        <DropdownMenuItem 
          onSelect={copyAddress} 
          className="gap-3 hover:bg-white/20 transition-colors duration-200 cursor-pointer"
        >
          <Copy className="h-4 w-4" /> 
          <span>Copy address</span>
        </DropdownMenuItem>
        {wallet && isAptosConnectWallet(wallet) && (
          <DropdownMenuItem asChild>
            <a
              href={APTOS_CONNECT_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 hover:bg-white/20 transition-colors duration-200 cursor-pointer"
            >
              <User className="h-4 w-4" /> 
              <span>Account</span>
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onSelect={disconnect} 
          className="gap-3 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors duration-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> 
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className={cn(glassClass, "group relative overflow-hidden", walletSortingOptions.className)}>
          {/* Shimmer effect */}
          <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 ease-out" />
          
          <div className="flex items-center gap-2 relative z-10">
            <Wallet className="w-4 h-4" />
            <span className="font-medium">
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <ConnectWalletDialog 
        close={closeDialog} 
        onConnect={handleConnect}
        {...walletSortingOptions} 
      />
    </Dialog>
  );
}

interface ConnectWalletDialogProps extends WalletSortingOptions {
  close: () => void;
  onConnect: () => void;
}

function ConnectWalletDialog({
  close,
  onConnect,
  ...walletSortingOptions
}: ConnectWalletDialogProps) {
  const { wallets = [], notDetectedWallets = [] } = useWallet();

  const { aptosConnectWallets, availableWallets, installableWallets } =
    groupAndSortWallets(
      [...wallets, ...notDetectedWallets],
      walletSortingOptions
    );

  const hasAptosConnectWallets = !!aptosConnectWallets.length;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <DialogContent className="max-h-[80vh] overflow-auto backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-300 wallet-selector-scrollbar">
        <AboutAptosConnect renderEducationScreen={renderEducationScreen}>
          <DialogHeader className="pb-4">
            <DialogTitle className="flex flex-col text-center leading-snug text-2xl font-bold">
              {hasAptosConnectWallets ? (
                <>
                  <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Log in or sign up
                  </span>
                  <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                    with Social + Aptos Connect
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Connect Wallet
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {hasAptosConnectWallets && (
            <div className="flex flex-col gap-3 pt-3">
              {aptosConnectWallets.map((wallet, index) => (
                <div
                  key={wallet.name}
                  className="animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AptosConnectWalletRow
                    wallet={wallet}
                    onConnect={() => {
                      onConnect();
                      close();
                    }}
                  />
                </div>
              ))}
              
              <div className="flex gap-1 justify-center items-center text-white/60 text-sm mt-2">
                Learn more about{" "}
                <AboutAptosConnect.Trigger className="flex gap-1 py-2 items-center text-white hover:text-red-400 transition-colors duration-200">
                  Aptos Connect <ArrowRight size={16} />
                </AboutAptosConnect.Trigger>
              </div>
              
              <AptosPrivacyPolicy className="flex flex-col items-center py-2">
                <p className="text-xs leading-5 text-white/60">
                  <AptosPrivacyPolicy.Disclaimer />{" "}
                  <AptosPrivacyPolicy.Link className="text-white/60 underline underline-offset-4 hover:text-white transition-colors duration-200" />
                  <span className="text-white/60">.</span>
                </p>
                <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-white/60" />
              </AptosPrivacyPolicy>
              
              <div className="flex items-center gap-3 pt-4 text-white/60">
                <div className="h-px w-full bg-white/20" />
                <span className="text-sm">Or</span>
                <div className="h-px w-full bg-white/20" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-3">
            {availableWallets.map((wallet, index) => (
              <div
                key={wallet.name}
                className="animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
                style={{ animationDelay: `${(hasAptosConnectWallets ? aptosConnectWallets.length : 0) * 100 + index * 100}ms` }}
              >
                <WalletRow 
                  wallet={wallet} 
                  onConnect={() => {
                    onConnect();
                    close();
                  }} 
                />
              </div>
            ))}
            
            {!!installableWallets.length && (
              <Collapsible className="flex flex-col gap-3">
                <CollapsibleTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-2 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    More wallets <ChevronDown className="transition-transform duration-200" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                  {installableWallets.map((wallet, index) => (
                    <div
                      key={wallet.name}
                      className="animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <WalletRow
                        wallet={wallet}
                        onConnect={() => {
                          onConnect();
                          close();
                        }}
                      />
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </AboutAptosConnect>
      </DialogContent>
    </>
  );
}

interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="group relative overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 gap-4 border border-white/20 rounded-lg backdrop-blur-md bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/10">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 ease-out" />
        
        <div className="flex items-center gap-4 relative z-10">
          <WalletItem.Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
          <WalletItem.Name className="text-base font-medium text-white" />
        </div>
        
        <div className="relative z-10">
          {isInstallRequired(wallet) ? (
            <Button 
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 hover:scale-105 active:scale-95"
              asChild
            >
              <WalletItem.InstallLink />
            </Button>
          ) : (
            <WalletItem.ConnectButton asChild>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Connect
              </Button>
            </WalletItem.ConnectButton>
          )}
        </div>
      </div>
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem 
      wallet={wallet} 
      onConnect={onConnect}
      className="group relative overflow-hidden"
    >
      <WalletItem.ConnectButton asChild>
        <Button 
          size="lg" 
          variant="outline" 
          className="w-full gap-4 border-red-500/50 bg-red-500/10 text-white hover:bg-red-500/20 hover:border-red-500/70 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/25 relative overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 ease-out" />
          
          <div className="flex items-center gap-4 relative z-10">
            <WalletItem.Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            <WalletItem.Name className="text-base font-medium" />
          </div>
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}

function renderEducationScreen(screen: AboutAptosConnectEducationScreen) {
  return (
    <div className="animate-in fade-in-0 zoom-in-95 duration-300">
      <DialogHeader className="grid grid-cols-[1fr_4fr_1fr] items-center space-y-0 pb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={screen.cancel}
          className="hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft />
        </Button>
        <DialogTitle className="leading-snug text-lg text-center font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          About Aptos Connect
        </DialogTitle>
      </DialogHeader>

      <div className="flex h-[162px] pb-3 items-end justify-center">
        <div className="animate-in zoom-in-50 duration-500" style={{ animationDelay: "200ms" }}>
          <screen.Graphic />
        </div>
      </div>
      
      <div className="flex flex-col gap-3 text-center pb-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "400ms" }}>
        <screen.Title className="text-xl font-bold text-white" />
        <screen.Description className="text-sm text-white/70 [&>a]:underline [&>a]:underline-offset-4 [&>a]:text-white [&>a]:hover:text-red-400 [&>a]:transition-colors [&>a]:duration-200" />
      </div>

      <div className="grid grid-cols-3 items-center animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "600ms" }}>
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.back}
          className="justify-self-start hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Back
        </Button>
        <div className="flex items-center gap-2 place-self-center">
          {screen.screenIndicators.map((ScreenIndicator, i) => (
            <ScreenIndicator key={i} className="py-4">
              <div className="h-0.5 w-6 transition-all duration-300 bg-white/30 [[data-active]>&]:bg-red-500 [[data-active]>&]:shadow-sm [[data-active]>&]:shadow-red-500/50" />
            </ScreenIndicator>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.next}
          className="gap-2 justify-self-end hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {screen.screenIndex === screen.totalScreens - 1 ? "Finish" : "Next"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
