"use client";

import { useState, useEffect, JSXElementConstructor,  ReactElement, ReactNode, ReactPortal } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InViewMotion from "@/components/InViewMotion";
import { Aurora } from "@/components/aurora";
import {
  Activity,
  Users,
  Timer,
  TrendingUp,
  Vote,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  BarChart3,
  Crown,
  ChartPie,
  Target,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Shield,
  Link,
  Copy,
  Check,
  UserPlus,
  X,
  UserMinus,
  Key,
  Settings,
  UserCheck,
  Zap,
  GitBranch,
  Star,
  TrendingDown,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "@/hooks/use-toast";
import { Aptos, AptosConfig, Network as AptosNetwork } from "@aptos-labs/ts-sdk";
import { 
  CONTRACT_CONFIG, 
  USER_TYPES, 
  CONTRACT_FUNCTIONS, 
  RESOURCE_TYPES, 
  PROPOSAL_STATUS,
  TASK_STATUS,
  VOTE_TYPES,
  getUserTypeLabel, 
  getUserTypeColor,
  getProposalStatusLabel,
  getProposalStatusColor,
  getTaskStatusLabel,
  getTaskStatusColor,
  getVoteTypeLabel,
  getVoteTypeColor
} from "../../../config/contract";

interface UserProfile {
  address: string;
  user_type: number;
  reputation_score: number;
  contribution_score: number;
  is_premium: boolean;
  premium_expires: number;
  governance_participation: number;
  voting_power: number;
  created_at: number;
}

interface DAOInfo {
  id: number;
  dao_code: string;
  name: string;
  description: string;
  creator: string;
  governors: string[];
  members: string[];
  total_supply: number;
  governance_token: string;
  minimum_proposal_threshold: number;
  voting_period: number;
  execution_delay: number;
  proposal_count: number;
  task_count: number;
  treasury_balance: number;
  is_active: boolean;
  created_at: number;
  member_count: number;
}

interface UserDAOEcosystem {
  user_address: string;
  total_daos_joined: number;
  total_voting_power: number;
  total_proposals_created: number;
  total_tasks_created: number;
  total_votes_cast: number;
  daos: any[];
  generated_at: number;
}

interface ProposalData {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: number; // Enum value from contract
  votes_for: number;
  votes_against: number;
  total_votes: number;
  start_time: number;
  end_time: number;
  execution_time: number;
  quorum_threshold: number;
  created_at: number;
}

interface TaskData {
  id: number;
  title: string;
  description: string;
  creator: string;
  assignee: string;
  status: number; // Enum value from contract
  reward: number;
  deadline: number;
  created_at: number;
  completed_at: number;
}

interface VoteData {
  proposal_id: number;
  voter: string;
  vote_type: number; // Enum value from contract
  voting_power: number;
  timestamp: number;
}

export default function GovernancePage() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEcosystem, setUserEcosystem] = useState<UserDAOEcosystem | null>(null);
  const [selectedDAO, setSelectedDAO] = useState<DAOInfo | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);
  const [newGovernorAddress, setNewGovernorAddress] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [autoJoining, setAutoJoining] = useState(false);
  const [promotingMembers, setPromotingMembers] = useState<string[]>([]);
  const [autoPromoteNewMembers, setAutoPromoteNewMembers] = useState(false);

  // Utility function to safely access selectedDAO properties
  const safeDAOProperty = (property: keyof DAOInfo, fallback: any = null) => {
    if (!selectedDAO) return fallback;
    const value = selectedDAO[property];
    return value !== undefined && value !== null ? value : fallback;
  };

  // Initialize Aptos client
  useEffect(() => {
    const config = new AptosConfig({
      network: AptosNetwork.DEVNET,
    });
    setAptosClient(new Aptos(config));
  }, []);

  // Load user data when connected
  useEffect(() => {
    if (connected && account && aptosClient) {
      loadUserData();
    }
  }, [connected, account, aptosClient]);

  const checkAndAutoJoinDAO = async () => {
    if (!account || !aptosClient) return false;

    try {
      // Check if user already has a profile
      try {
        await aptosClient.getAccountResource({
          accountAddress: account.address,
          resourceType: RESOURCE_TYPES.USER_PROFILE,
        });
        return false; // Profile exists, no need to auto-join
      } catch (error) {
        // Profile doesn't exist, check if user is a governor in any DAO
        console.log("No profile found, checking if user is a governor in any DAO...");
      }

      // Get all DAOs and check if user is a governor in any of them
      try {
        const registryResource = await aptosClient.getAccountResource({
          accountAddress: CONTRACT_CONFIG.MODULE_ADDRESS,
          resourceType: RESOURCE_TYPES.DAO_REGISTRY,
        });
        
        // For now, we'll try to get DAO info for common DAO IDs
        // In a real implementation, you'd iterate through all DAOs
        for (let daoId = 1; daoId <= 10; daoId++) {
          try {
            const daoData = await aptosClient.view({
              payload: {
                function: CONTRACT_FUNCTIONS.GET_DAO_INFO,
                functionArguments: [daoId.toString()],
              },
            });
            
            if (daoData && daoData[0]) {
              const dao = daoData[0] as DAOInfo;
              // Check if user is a governor or creator of this DAO
              if (dao.governors.includes(account.address.toString()) || 
                  dao.creator === account.address.toString()) {
                // User is a governor, auto-join this DAO
                setAutoJoining(true);
                toast({
                  title: "Auto-joining DAO",
                  description: `You are a governor of ${dao.name}. Auto-joining to create your profile...`,
                });
                
                try {
                  const response = await signAndSubmitTransaction({
                    sender: account.address,
                    data: {
                      function: CONTRACT_FUNCTIONS.JOIN_DAO_BY_ID,
                      functionArguments: [daoId.toString()],
                    },
                  });

                  await aptosClient.waitForTransaction({ 
                    transactionHash: response.hash 
                  });

                  toast({
                    title: "Successfully Joined DAO",
                    description: `You have been automatically added to ${dao.name} as a governor.`,
                  });
                  
                  setAutoJoining(false);
                  return true; // Successfully joined
                } catch (joinError) {
                  console.error("Error auto-joining DAO:", joinError);
                  toast({
                    title: "Auto-join Failed",
                    description: "Failed to automatically join the DAO. Please try joining manually.",
                    variant: "destructive",
                  });
                  setAutoJoining(false);
                  return false;
                }
              }
            }
          } catch (daoError) {
            // DAO doesn't exist or error fetching, continue to next
            continue;
          }
        }
      } catch (registryError) {
        console.error("Error checking DAO registry:", registryError);
      }
      
      return false; // No governor role found
    } catch (error) {
      console.error("Error in checkAndAutoJoinDAO:", error);
      setAutoJoining(false);
      return false;
    }
  };

  const loadUserData = async () => {
    if (!account || !aptosClient) return;

    try {
      setLoading(true);
      
      // Get user profile
      try {
        const profileResource = await aptosClient.getAccountResource({
          accountAddress: account.address,
          resourceType: RESOURCE_TYPES.USER_PROFILE,
        });
        setUserProfile(profileResource.data as UserProfile);
      } catch (error) {
        console.log("User profile not found, checking if user is a governor...");
        
        // Check if user is a governor and auto-join if needed
        const autoJoined = await checkAndAutoJoinDAO();
        
        if (autoJoined) {
          // Retry loading user data after auto-joining
          setTimeout(() => loadUserData(), 2000);
          return;
        } else {
          toast({
            title: "User Not Registered",
            description: "You need to join a DAO first to access this dashboard.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Get user's complete DAO ecosystem
      try {
        const ecosystemData = await aptosClient.view({
          payload: {
            function: CONTRACT_FUNCTIONS.GET_COMPLETE_USER_DAO_ECOSYSTEM,
            functionArguments: [account.address.toString()],
          },
        });
        
        if (!ecosystemData || !ecosystemData[0]) {
          throw new Error("No ecosystem data returned");
        }
        
        setUserEcosystem(ecosystemData[0] as UserDAOEcosystem);
        
        // Select the first DAO where user is a governor or creator
        const userEcosystemData = ecosystemData[0] as UserDAOEcosystem;
        if (!userEcosystemData.daos || userEcosystemData.daos.length === 0) {
          toast({
            title: "No DAOs Found",
            description: "You are not a member of any DAOs yet.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const governorDAOs = userEcosystemData.daos.filter(
          (dao: any) => dao.user_membership && (dao.user_membership.is_governor || dao.user_membership.is_creator)
        );
        
        if (governorDAOs.length > 0) {
          setSelectedDAO(governorDAOs[0].dao_info);
          // Load proposals and tasks for the selected DAO
          setProposals(governorDAOs[0].proposals || []);
          setTasks(governorDAOs[0].tasks || []);
        }
      } catch (error) {
        console.error("Error loading user ecosystem:", error);
        toast({
          title: "Error Loading DAO Data",
          description: error instanceof Error ? error.message : "Failed to load DAO ecosystem data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load user data from the blockchain.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const generateInviteLink = async () => {
    if (!selectedDAO || !account) return;

    try {
      const uniqueCode = Math.random().toString(36).substring(2, 15);
      const newLink = `${window.location.origin}/invite?code=${selectedDAO.dao_code}&dao_id=${selectedDAO.id}`;
      setInviteLink(newLink);
      
      toast({
        title: "Invite Link Generated",
        description: `Share this link for users to join ${selectedDAO.name}`,
      });
    } catch (error) {
      console.error("Error generating invite link:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite link.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "The invite link has been copied to your clipboard.",
    });
  };

  const promoteToGovernor = async () => {
    if (!selectedDAO || !account || !newGovernorAddress) return;

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.PROMOTE_TO_GOVERNOR,
          functionArguments: [selectedDAO.id, newGovernorAddress],
        },
      });

      await aptosClient?.waitForTransaction({ 
        transactionHash: response.hash 
      });

      toast({
        title: "Member Promoted",
        description: `Successfully promoted ${newGovernorAddress} to governor.`,
      });
      
      setNewGovernorAddress("");
      await refreshData();
    } catch (error) {
      console.error("Error promoting member:", error);
      toast({
        title: "Promotion Failed",
        description: "Failed to promote member to governor.",
        variant: "destructive",
      });
    }
  };

  const promoteMemberToGovernor = async (memberAddress: string) => {
    if (!selectedDAO || !account || !memberAddress) return;

    // Check if member is already a governor
    if (selectedDAO.governors?.includes(memberAddress)) {
      toast({
        title: "Already a Governor",
        description: "This member is already a governor.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPromotingMembers(prev => [...prev, memberAddress]);

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.PROMOTE_TO_GOVERNOR,
          functionArguments: [selectedDAO.id, memberAddress],
        },
      });

      await aptosClient?.waitForTransaction({ 
        transactionHash: response.hash 
      });

      toast({
        title: "Member Promoted",
        description: `Successfully promoted ${memberAddress.toString().slice(0, 8)}...${memberAddress.toString().slice(-8)} to governor.`,
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error promoting member:", error);
      toast({
        title: "Promotion Failed",
        description: "Failed to promote member to governor.",
        variant: "destructive",
      });
    } finally {
      setPromotingMembers(prev => prev.filter(addr => addr !== memberAddress));
    }
  };

  const promoteAllMembersToGovernors = async () => {
    if (!selectedDAO || !account) return;

    const membersToPromote = selectedDAO.members?.filter(member => 
      !selectedDAO.governors?.includes(member) && member !== selectedDAO.creator
    ) || [];

    if (membersToPromote.length === 0) {
      toast({
        title: "No Members to Promote",
        description: "All members are already governors.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPromotingMembers(membersToPromote);

      // Promote each member individually
      for (const memberAddress of membersToPromote) {
        try {
          const response = await signAndSubmitTransaction({
            sender: account.address,
            data: {
              function: CONTRACT_FUNCTIONS.PROMOTE_TO_GOVERNOR,
              functionArguments: [selectedDAO.id, memberAddress],
            },
          });

          await aptosClient?.waitForTransaction({ 
            transactionHash: response.hash 
          });

          toast({
            title: "Member Promoted",
            description: `Promoted ${memberAddress.toString().slice(0, 8)}...${memberAddress.toString().slice(-8)} to governor.`,
          });
        } catch (error) {
          console.error(`Error promoting ${memberAddress}:`, error);
          toast({
            title: "Promotion Failed",
            description: `Failed to promote ${memberAddress.toString().slice(0, 8)}...${memberAddress.toString().slice(-8)}.`,
            variant: "destructive",
          });
        }
      }
      
      await refreshData();
    } catch (error) {
      console.error("Error promoting all members:", error);
      toast({
        title: "Bulk Promotion Failed",
        description: "Failed to promote all members to governors.",
        variant: "destructive",
      });
    } finally {
      setPromotingMembers([]);
    }
  };

  const demoteGovernor = async (governorAddress: string) => {
    if (!selectedDAO || !account) return;

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.DEMOTE_GOVERNOR,
          functionArguments: [selectedDAO.id, governorAddress],
        },
      });

      await aptosClient?.waitForTransaction({ 
        transactionHash: response.hash 
      });

      toast({
        title: "Governor Demoted",
        description: `Successfully demoted ${governorAddress} from governor.`,
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error demoting governor:", error);
      toast({
        title: "Demotion Failed",
        description: "Failed to demote governor.",
        variant: "destructive",
      });
    }
  };

  const transferOwnership = async () => {
    if (!selectedDAO || !account || !newOwnerAddress) return;

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.TRANSFER_DAO_OWNERSHIP,
          functionArguments: [selectedDAO.id, newOwnerAddress],
        },
      });

      await aptosClient?.waitForTransaction({ 
        transactionHash: response.hash 
      });

      toast({
        title: "Ownership Transferred",
        description: `Successfully transferred ownership to ${newOwnerAddress}.`,
      });
      
      setNewOwnerAddress("");
      await refreshData();
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast({
        title: "Transfer Failed",
        description: "Failed to transfer ownership.",
        variant: "destructive",
      });
    }
  };

  const selectDAO = (dao: any) => {
    setSelectedDAO(dao.dao_info);
    setProposals(dao.proposals || []);
    setTasks(dao.tasks || []);
  };

  const isDAOCreator = selectedDAO && account && selectedDAO.creator === account.address.toString();
  const isGovernor = selectedDAO && account && selectedDAO.governors.includes(account.address.toString());
  const hasAccess = isDAOCreator || isGovernor;

  if (!connected) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={["#8B0000", "#660000", "#8B0000"]}
            amplitude={1.2}
            speed={0.3}
            blend={0.8}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-white mb-4">
                Access Restricted
              </CardTitle>
              <CardDescription className="text-gray-300">
                Please connect your wallet to access the governor dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-red-900 to-red-700">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading || autoJoining) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={["#8B0000", "#660000", "#8B0000"]}
            amplitude={1.2}
            speed={0.3}
            blend={0.8}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="animate-spin h-8 w-8 border-4 border-red-500/30 border-t-red-500 rounded-full"></div>
                <span className="text-white text-lg">
                  {autoJoining ? "Auto-joining DAO..." : "Loading DAO data..."}
                </span>
              </div>
              {autoJoining && (
                <p className="text-gray-300 text-sm mt-4">
                  You are a governor of a DAO. Creating your profile...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={["#8B0000", "#660000", "#8B0000"]}
            amplitude={1.2}
            speed={0.3}
            blend={0.8}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-white mb-4">
                Access Denied
              </CardTitle>
              <CardDescription className="text-gray-300">
                You need to be a Governor or DAO Creator to access this dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Your current role: {userProfile ? getUserTypeLabel(userProfile.user_type) : "Unknown"}
                </div>
                <Button 
                  onClick={() => window.location.href = '/dao/dashboard'}
                  className="bg-gradient-to-r from-red-900 to-red-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedDAO) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={["#8B0000", "#660000", "#8B0000"]}
            amplitude={1.2}
            speed={0.3}
            blend={0.8}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-white mb-4">
                No DAO Selected
              </CardTitle>
              <CardDescription className="text-gray-300">
                Please select a DAO to manage from your available DAOs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '/dao/dashboard'}
                className="bg-gradient-to-r from-red-900 to-red-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#8B0000", "#660000", "#8B0000"]}
          amplitude={1.2}
          speed={0.3}
          blend={0.8}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-[8rem] mt-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white">Governor Dashboard</h1>
              <Button
                onClick={refreshData}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {refreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-gray-400">
              {selectedDAO ? `Managing ${selectedDAO.name}` : "Select a DAO to manage"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200">
                {isDAOCreator ? "DAO Creator" : "Governor"}
              </span>
            </div>
            {selectedDAO && (
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
                <span className="text-gray-400">{selectedDAO.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
              <span className="text-red-200/80 font-mono text-sm">
                {account?.address?.toString().toString().slice(0, 6)}...{account?.address?.toString().toString().slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* DAO Selection */}
        {userEcosystem && userEcosystem.daos.length > 1 && (
          <div className="mb-8">
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">Select DAO to Manage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userEcosystem.daos
                    .filter((dao: any) => dao.user_membership.is_governor || dao.user_membership.is_creator)
                    .map((dao: any) => (
                      <div
                        key={dao.dao_info.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedDAO?.id === dao.dao_info.id
                            ? "border-red-500 bg-red-500/10"
                            : "border-white/20 bg-white/5 hover:border-red-400/50"
                        }`}
                        onClick={() => selectDAO(dao)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{dao.dao_info.name}</h3>
                            <p className="text-sm text-gray-400">
                              {dao.user_membership.is_creator ? "Creator" : "Governor"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedDAO && (
          <>
            {/* DAO Status Overview */}
            <div className="mb-8">
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    DAO Overview & Governance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">DAO Status</p>
                      <Badge className={selectedDAO.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {selectedDAO.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white font-medium">
                        {selectedDAO.created_at ? new Date(selectedDAO.created_at * 1000).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Governance Token</p>
                      <p className="text-white font-mono text-sm">
                        {selectedDAO.governance_token ? 
                          `${selectedDAO.governance_token.toString().slice(0, 8)}...${selectedDAO.governance_token.toString().slice(-8)}` : 
                          'N/A'
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total Supply</p>
                      <p className="text-white font-medium">
                        {selectedDAO.total_supply ? selectedDAO.total_supply.toLocaleString() : '0'} tokens
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-white font-medium mb-4">Governance Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voting Period:</span>
                        <span className="text-white">{selectedDAO.voting_period ? Math.floor(selectedDAO.voting_period / 86400) : 0} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Execution Delay:</span>
                        <span className="text-white">{selectedDAO.execution_delay ? Math.floor(selectedDAO.execution_delay / 3600) : 0} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Proposal Threshold:</span>
                        <span className="text-white">{selectedDAO.minimum_proposal_threshold || 0} tokens</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Members</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedDAO.member_count || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>

              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Treasury Balance</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedDAO.treasury_balance || 0} APT
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>

              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                        <Vote className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Proposals</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedDAO.proposal_count || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>

              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Tasks</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedDAO.task_count || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>
            </div>

            {/* Management Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Invite Members */}
              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Invite Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">
                      Generate an invite link for new members to join your DAO
                    </p>
                    <Button
                      onClick={generateInviteLink}
                      className="bg-gradient-to-r from-red-900 to-red-700 w-full"
                    >
                      Generate Invite Link
                    </Button>
                    {inviteLink && (
                      <div className="flex gap-2">
                        <Input
                          value={inviteLink}
                          readOnly
                          className="bg-white/5 border-red-900/20 text-white"
                        />
                        <Button
                          onClick={copyToClipboard}
                          className="bg-gradient-to-r from-red-900 to-red-700"
                        >
                          {showCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </InViewMotion>

              {/* DAO Creator Only - Promote to Governor */}
              {isDAOCreator && (
                <InViewMotion>
                  <Card className="bg-white/5 border-yellow-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        Promote to Governor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-400 text-sm">
                        Promote a member to governor role (DAO Creator only)
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={newGovernorAddress}
                          onChange={(e) => setNewGovernorAddress(e.target.value)}
                          placeholder="Member address to promote"
                          className="bg-white/5 border-yellow-900/20 text-white"
                        />
                        <Button
                          onClick={promoteToGovernor}
                          disabled={!newGovernorAddress}
                          className="bg-gradient-to-r from-yellow-900 to-yellow-700"
                        >
                          Promote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>
              )}
            </div>

            {/* Bulk Member Management */}
            {isDAOCreator && (
              <div className="mb-8">
                <InViewMotion>
                  <Card className="bg-white/5 border-blue-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Bulk Member Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-400 text-sm">
                        Manage multiple members at once or set automatic promotion rules
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={promoteAllMembersToGovernors}
                          disabled={promotingMembers.length > 0 || !selectedDAO?.members?.length}
                          className="bg-gradient-to-r from-blue-900 to-blue-700 relative"
                        >
                          {promotingMembers.length > 0 ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                              Promoting All...
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Promote All Members
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={refreshData}
                          className="bg-gradient-to-r from-gray-900 to-gray-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Member List
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Auto-promote New Members</p>
                          <p className="text-gray-400 text-sm">Automatically promote new members to governors</p>
                        </div>
                        <Button
                          onClick={() => setAutoPromoteNewMembers(!autoPromoteNewMembers)}
                          variant={autoPromoteNewMembers ? "default" : "outline"}
                          className={autoPromoteNewMembers ? 
                            "bg-gradient-to-r from-green-900 to-green-700" : 
                            "bg-white/10 border-white/20 text-white hover:bg-white/20"
                          }
                        >
                          {autoPromoteNewMembers ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        Regular members that can be promoted: {
                          selectedDAO?.members?.filter(member => 
                            !selectedDAO.governors?.includes(member) && member !== selectedDAO.creator
                          )?.length || 0
                        }
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>
              </div>
            )}

            {/* DAO Creator Only - Advanced Management */}
            {isDAOCreator && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InViewMotion>
                  <Card className="bg-white/5 border-yellow-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-yellow-400" />
                        Transfer Ownership
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-400 text-sm">
                        Transfer DAO ownership to another member (irreversible)
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={newOwnerAddress}
                          onChange={(e) => setNewOwnerAddress(e.target.value)}
                          placeholder="New owner address"
                          className="bg-white/5 border-yellow-900/20 text-white"
                        />
                        <Button
                          onClick={transferOwnership}
                          disabled={!newOwnerAddress}
                          className="bg-gradient-to-r from-yellow-900 to-yellow-700"
                        >
                          Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>

                <InViewMotion>
                  <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        DAO Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Voting Period:</span>
                          <span className="text-white">{selectedDAO.voting_period}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Execution Delay:</span>
                          <span className="text-white">{selectedDAO.execution_delay}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Proposal Threshold:</span>
                          <span className="text-white">{selectedDAO.minimum_proposal_threshold}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>
              </div>
            )}

            {/* Governors List */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Governors ({selectedDAO.governors?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDAO.governors?.map((governor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-mono text-sm">
                              {governor.toString().slice(0, 8)}...{governor.toString().slice(-8)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {governor === selectedDAO.creator && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  Creator
                                </Badge>
                              )}
                              <Badge className="bg-red-500/20 text-red-400 text-xs">
                                Governor
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {isDAOCreator && governor !== selectedDAO.creator && (
                          <Button
                            onClick={() => demoteGovernor(governor)}
                            size="sm"
                            variant="destructive"
                            className="bg-red-600/20 hover:bg-red-600/30"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Demote
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Proposals Section */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Vote className="w-5 h-5" />
                    DAO Proposals ({proposals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposals.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No proposals found for this DAO.</p>
                      </div>
                    ) : (
                      proposals.slice(0, 10).map((proposal: { title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: number; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; proposer: { toString: () => string | any[]; }; id: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; quorum_threshold: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; votes_for: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; total_votes: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; votes_against: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; created_at: number; end_time: number; }, index: React.Key | null | undefined) => (
                        <div
                          key={index}
                          className="p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-white font-medium">{proposal.title}</h4>
                                <Badge className={getProposalStatusColor(proposal.status)}>
                                  {getProposalStatusLabel(proposal.status)}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mb-3">
                                {proposal.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">
                                  Proposer: {proposal.proposer.toString().slice(0, 8)}...{proposal.proposer.toString().slice(-8)}
                                </span>
                                <span className="text-gray-400">
                                  ID: {proposal.id}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Voting Progress */}
                          <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-300 mb-2">
                              <span>Voting Progress</span>
                              <span>Quorum: {proposal.quorum_threshold}%</span>
                            </div>
                            <div className="flex gap-2 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-green-500"
                                style={{ 
                                  width: `${(Number(proposal.votes_for || 0) / Math.max(Number(proposal.total_votes || 0), 1)) * 100}%` 
                                }}
                              />
                              <div
                                className="bg-red-500"
                                style={{ 
                                  width: `${(Number(proposal.votes_against || 0) / Math.max(Number(proposal.total_votes || 0), 1)) * 100}%` 
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                              <span className="text-green-400">
                                For: {Number(proposal.votes_for || 0)}
                              </span>
                              <span className="text-red-400">
                                Against: {Number(proposal.votes_against || 0)}
                              </span>
                              <span className="text-gray-400">
                                Total: {Number(proposal.total_votes || 0)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Proposal Timeline */}
                          <div className="mt-4 text-xs text-gray-400">
                            <div className="flex justify-between">
                              <span>Created: {new Date(proposal.created_at * 1000).toLocaleDateString()}</span>
                              <span>Ends: {new Date(proposal.end_time * 1000).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {proposals.length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-gray-400 text-sm">
                          And {proposals.length - 10} more proposals...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Tasks Section */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    DAO Tasks ({tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No tasks found for this DAO.</p>
                      </div>
                    ) : (
                      tasks.slice(0, 10).map((task: { title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: number; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; creator: { toString: () => string | any[]; }; assignee: { toString: () => string | any[]; }; id: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; reward: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; deadline: number; created_at: number; completed_at: number; }, index: React.Key | null | undefined) => (
                        <div
                          key={index}
                          className="p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-white font-medium">{task.title}</h4>
                                <Badge className={getTaskStatusColor(task.status)}>
                                  {getTaskStatusLabel(task.status)}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mb-3">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">
                                  Creator: {task.creator.toString().slice(0, 8)}...{task.creator.toString().slice(-8)}
                                </span>
                                {task.assignee && (
                                  <span className="text-gray-400">
                                    Assignee: {task.assignee.toString().slice(0, 8)}...{task.assignee.toString().slice(-8)}
                                  </span>
                                )}
                                <span className="text-gray-400">
                                  ID: {task.id}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Task Details */}
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Reward</p>
                              <p className="text-white font-medium">{Number(task.reward || 0)} APT</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Deadline</p>
                              <p className="text-white font-medium">
                                {new Date(task.deadline * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Task Timeline */}
                          <div className="mt-4 text-xs text-gray-400">
                            <div className="flex justify-between">
                              <span>Created: {new Date(task.created_at * 1000).toLocaleDateString()}</span>
                              {task.completed_at > 0 && (
                                <span>Completed: {new Date(task.completed_at * 1000).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {tasks.length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-gray-400 text-sm">
                          And {tasks.length - 10} more tasks...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* All Members with Management */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    All Members ({selectedDAO.members?.length || 0})
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage member roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDAO.members?.map((member, index) => {
                      const isGovernor = selectedDAO.governors?.includes(member);
                      const isCreator = member === selectedDAO.creator;
                      const isPromoting = promotingMembers.includes(member);
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isCreator ? 'bg-gradient-to-br from-yellow-900 to-yellow-700' :
                              isGovernor ? 'bg-gradient-to-br from-red-900 to-red-700' :
                              'bg-gradient-to-br from-blue-900 to-blue-700'
                            }`}>
                              {isCreator ? (
                                <Star className="w-4 h-4 text-white" />
                              ) : isGovernor ? (
                                <Crown className="w-4 h-4 text-white" />
                              ) : (
                                <Users className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-mono text-sm">
                                {member.toString().slice(0, 12)}...{member.toString().slice(-12)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {isCreator && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                    Creator
                                  </Badge>
                                )}
                                {isGovernor && (
                                  <Badge className="bg-red-500/20 text-red-400 text-xs">
                                    Governor
                                  </Badge>
                                )}
                                {!isGovernor && !isCreator && (
                                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                    Member
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action buttons for DAO Creator */}
                          {isDAOCreator && (
                            <div className="flex items-center gap-2">
                              {!isGovernor && !isCreator && (
                                <Button
                                  onClick={() => promoteMemberToGovernor(member)}
                                  disabled={isPromoting}
                                  size="sm"
                                  className="bg-gradient-to-r from-green-900 to-green-700 hover:from-green-800 hover:to-green-600"
                                >
                                  {isPromoting ? (
                                    <>
                                      <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full mr-1"></div>
                                      Promoting...
                                    </>
                                  ) : (
                                    <>
                                      <Crown className="w-3 h-3 mr-1" />
                                      Promote
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {isGovernor && !isCreator && (
                                <Button
                                  onClick={() => demoteGovernor(member)}
                                  size="sm"
                                  variant="destructive"
                                  className="bg-red-600/20 hover:bg-red-600/30"
                                >
                                  <UserMinus className="w-3 h-3 mr-1" />
                                  Demote
                                </Button>
                              )}
                              
                              {isCreator && (
                                <Badge className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-1">
                                  Owner
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {(!selectedDAO.members || selectedDAO.members.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No members found.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>
          </>
        )}
      </div>
    </div>
  );
}
