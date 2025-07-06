"use client";

import {
  useState,
  useEffect,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";
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

import { GradientBackground } from "@/components/ui/gradient-background";
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
import {
  Aptos,
  AptosConfig,
  Network as AptosNetwork,
} from "@aptos-labs/ts-sdk";
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
  getVoteTypeColor,
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
  const [userEcosystem, setUserEcosystem] = useState<UserDAOEcosystem | null>(
    null
  );
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
        console.log(
          "No profile found, checking if user is a governor in any DAO..."
        );
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
              if (
                dao.governors.includes(account.address.toString()) ||
                dao.creator === account.address.toString()
              ) {
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
                    transactionHash: response.hash,
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
                    description:
                      "Failed to automatically join the DAO. Please try joining manually.",
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
        console.log(
          "User profile not found, checking if user is a governor..."
        );

        // Check if user is a governor and auto-join if needed
        const autoJoined = await checkAndAutoJoinDAO();

        if (autoJoined) {
          // Retry loading user data after auto-joining
          setTimeout(() => loadUserData(), 2000);
          return;
        } else {
          toast({
            title: "User Not Registered",
            description:
              "You need to join a DAO first to access this dashboard.",
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
          (dao: any) =>
            dao.user_membership &&
            (dao.user_membership.is_governor || dao.user_membership.is_creator)
        );

        if (governorDAOs.length > 0) {
          const selectedDAOInfo = governorDAOs[0].dao_info;
          setSelectedDAO(selectedDAOInfo);

          // Load detailed proposals and tasks using specific contract functions
          await loadDAOProposalsAndTasks(selectedDAOInfo.id);
        }
      } catch (error) {
        console.error("Error loading user ecosystem:", error);
        toast({
          title: "Error Loading DAO Data",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load DAO ecosystem data.",
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

  const loadDAOProposalsAndTasks = async (daoId: number) => {
    if (!aptosClient) return;

    try {
      // Load all proposals for the DAO using get_dao_proposals
      try {
        const proposalsData = await aptosClient.view({
          payload: {
            function: CONTRACT_FUNCTIONS.GET_DAO_PROPOSALS,
            functionArguments: [daoId.toString()],
          },
        });

        if (proposalsData && proposalsData[0]) {
          setProposals(proposalsData[0] as ProposalData[]);
        } else {
          setProposals([]);
        }
      } catch (error) {
        console.error("Error loading DAO proposals:", error);
        setProposals([]);
      }

      // Load all tasks for the DAO using get_dao_tasks
      try {
        const tasksData = await aptosClient.view({
          payload: {
            function: CONTRACT_FUNCTIONS.GET_DAO_TASKS,
            functionArguments: [daoId.toString()],
          },
        });

        if (tasksData && tasksData[0]) {
          setTasks(tasksData[0] as TaskData[]);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error("Error loading DAO tasks:", error);
        setTasks([]);
      }
    } catch (error) {
      console.error("Error loading DAO proposals and tasks:", error);
      toast({
        title: "Error Loading DAO Data",
        description: "Failed to load proposals and tasks for the DAO.",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadUserData();
    // If there's a selected DAO, also refresh its proposals and tasks
    if (selectedDAO) {
      await loadDAOProposalsAndTasks(selectedDAO.id);
    }
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
        transactionHash: response.hash,
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
      setPromotingMembers((prev) => [...prev, memberAddress]);

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: CONTRACT_FUNCTIONS.PROMOTE_TO_GOVERNOR,
          functionArguments: [selectedDAO.id, memberAddress],
        },
      });

      await aptosClient?.waitForTransaction({
        transactionHash: response.hash,
      });

      toast({
        title: "Member Promoted",
        description: `Successfully promoted ${memberAddress
          .toString()
          .slice(0, 8)}...${memberAddress.toString().slice(-8)} to governor.`,
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
      setPromotingMembers((prev) =>
        prev.filter((addr) => addr !== memberAddress)
      );
    }
  };

  const promoteAllMembersToGovernors = async () => {
    if (!selectedDAO || !account) return;

    const membersToPromote =
      selectedDAO.members?.filter(
        (member) =>
          !selectedDAO.governors?.includes(member) &&
          member !== selectedDAO.creator
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
            transactionHash: response.hash,
          });

          toast({
            title: "Member Promoted",
            description: `Promoted ${memberAddress
              .toString()
              .slice(0, 8)}...${memberAddress
              .toString()
              .slice(-8)} to governor.`,
          });
        } catch (error) {
          console.error(`Error promoting ${memberAddress}:`, error);
          toast({
            title: "Promotion Failed",
            description: `Failed to promote ${memberAddress
              .toString()
              .slice(0, 8)}...${memberAddress.toString().slice(-8)}.`,
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
        transactionHash: response.hash,
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
        transactionHash: response.hash,
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

  const selectDAO = async (dao: any) => {
    setSelectedDAO(dao.dao_info);
    // Load detailed proposals and tasks for the selected DAO
    await loadDAOProposalsAndTasks(dao.dao_info.id);
  };

  const isDAOCreator =
    selectedDAO &&
    account &&
    selectedDAO.creator === account.address.toString();
  const isGovernor =
    selectedDAO &&
    account &&
    selectedDAO.governors.includes(account.address.toString());
  const hasAccess = isDAOCreator || isGovernor;

  if (!connected) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <GradientBackground />
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
          <GradientBackground />
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
          <GradientBackground />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-white mb-4">
                Access Denied
              </CardTitle>
              <CardDescription className="text-gray-300">
                You need to be a Governor or DAO Creator to access this
                dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Your current role:{" "}
                  {userProfile
                    ? getUserTypeLabel(userProfile.user_type)
                    : "Unknown"}
                </div>
                <Button
                  onClick={() => (window.location.href = "/dao/dashboard")}
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
          <GradientBackground />
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
                onClick={() => (window.location.href = "/dao/dashboard")}
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
        <GradientBackground />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-[8rem] mt-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white">
                Governor Dashboard
              </h1>
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
              {selectedDAO
                ? `Managing ${selectedDAO.name}`
                : "Select a DAO to manage"}
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
                {account?.address?.toString().toString().slice(0, 6)}...
                {account?.address?.toString().toString().slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* DAO Selection */}
        {userEcosystem && userEcosystem.daos.length > 1 && (
          <div className="mb-8">
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Select DAO to Manage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userEcosystem.daos
                    .filter(
                      (dao: any) =>
                        dao.user_membership.is_governor ||
                        dao.user_membership.is_creator
                    )
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
                            <h3 className="text-white font-medium">
                              {dao.dao_info.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {dao.user_membership.is_creator
                                ? "Creator"
                                : "Governor"}
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
                      <Badge
                        className={
                          selectedDAO.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      >
                        {selectedDAO.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white font-medium">
                        {selectedDAO.created_at
                          ? new Date(
                              selectedDAO.created_at * 1000
                            ).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Governance Token</p>
                      <p className="text-white font-mono text-sm">
                        {selectedDAO.governance_token
                          ? `${selectedDAO.governance_token
                              .toString()
                              .slice(0, 8)}...${selectedDAO.governance_token
                              .toString()
                              .slice(-8)}`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total Supply</p>
                      <p className="text-white font-medium">
                        {selectedDAO.total_supply
                          ? selectedDAO.total_supply.toLocaleString()
                          : "0"}{" "}
                        tokens
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-white font-medium mb-4">
                      Governance Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voting Period:</span>
                        <span className="text-white">
                          {selectedDAO.voting_period
                            ? Math.floor(selectedDAO.voting_period / 86400)
                            : 0}{" "}
                          days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Execution Delay:</span>
                        <span className="text-white">
                          {selectedDAO.execution_delay
                            ? Math.floor(selectedDAO.execution_delay / 3600)
                            : 0}{" "}
                          hours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Proposal Threshold:
                        </span>
                        <span className="text-white">
                          {selectedDAO.minimum_proposal_threshold || 0} tokens
                        </span>
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
                        <p className="text-sm text-gray-400">
                          Treasury Balance
                        </p>
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
                          {showCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
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
                          onChange={(e) =>
                            setNewGovernorAddress(e.target.value)
                          }
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
                        Manage multiple members at once or set automatic
                        promotion rules
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={promoteAllMembersToGovernors}
                          disabled={
                            promotingMembers.length > 0 ||
                            !selectedDAO?.members?.length
                          }
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
                          <p className="text-white font-medium">
                            Auto-promote New Members
                          </p>
                          <p className="text-gray-400 text-sm">
                            Automatically promote new members to governors
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            setAutoPromoteNewMembers(!autoPromoteNewMembers)
                          }
                          variant={
                            autoPromoteNewMembers ? "default" : "outline"
                          }
                          className={
                            autoPromoteNewMembers
                              ? "bg-gradient-to-r from-green-900 to-green-700"
                              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                          }
                        >
                          {autoPromoteNewMembers ? "Enabled" : "Disabled"}
                        </Button>
                      </div>

                      <div className="text-sm text-gray-400">
                        Regular members that can be promoted:{" "}
                        {selectedDAO?.members?.filter(
                          (member) =>
                            !selectedDAO.governors?.includes(member) &&
                            member !== selectedDAO.creator
                        )?.length || 0}
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
                          <span className="text-white">
                            {selectedDAO.voting_period}s
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            Execution Delay:
                          </span>
                          <span className="text-white">
                            {selectedDAO.execution_delay}s
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            Proposal Threshold:
                          </span>
                          <span className="text-white">
                            {selectedDAO.minimum_proposal_threshold}
                          </span>
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
                          <div
                            className={`p-2 rounded-lg ${
                              governor === selectedDAO.creator
                                ? "bg-gradient-to-br from-yellow-900 to-yellow-700"
                                : governor === selectedDAO.creator
                                ? "bg-gradient-to-br from-red-900 to-red-700"
                                : "bg-gradient-to-br from-blue-900 to-blue-700"
                            }`}
                          >
                            {governor === selectedDAO.creator ? (
                              <Star className="w-4 h-4 text-white" />
                            ) : governor === selectedDAO.creator ? (
                              <Crown className="w-4 h-4 text-white" />
                            ) : (
                              <Users className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-mono text-sm">
                              {governor.toString().slice(0, 12)}...
                              {governor.toString().slice(-12)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {governor === selectedDAO.creator && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  Creator
                                </Badge>
                              )}
                              {governor === selectedDAO.creator && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  Governor
                                </Badge>
                              )}
                              {!governor && !selectedDAO.creator && (
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
                            {!governor && !selectedDAO.creator && (
                              <Button
                                onClick={() =>
                                  promoteMemberToGovernor(governor)
                                }
                                disabled={promotingMembers.includes(governor)}
                                size="sm"
                                className="bg-gradient-to-r from-green-900 to-green-700 hover:from-green-800 hover:to-green-600"
                              >
                                {promotingMembers.includes(governor) ? (
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

                            {governor && !selectedDAO.creator && (
                              <Button
                                onClick={() => demoteGovernor(governor)}
                                size="sm"
                                variant="destructive"
                                className="bg-red-600/20 hover:bg-red-600/30"
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Demote
                              </Button>
                            )}

                            {selectedDAO.creator && (
                              <Badge className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-1">
                                Owner
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!selectedDAO.governors ||
                      selectedDAO.governors.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No members found.</p>
                      </div>
                    )}
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
                        <p className="text-gray-400">
                          No proposals found for this DAO.
                        </p>
                      </div>
                    ) : (
                      proposals
                        .slice(0, 10)
                        .map(
                          (
                            proposal: any,
                            index: React.Key | null | undefined
                          ) => (
                            <div
                              key={index}
                              className="p-6 bg-white/5 rounded-lg border border-white/10"
                            >
                              {/* Proposal Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-white font-semibold text-lg">
                                      {proposal.title}
                                    </h4>
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                      Proposal #{proposal.id}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-300 text-sm">
                                    {proposal.description}
                                  </p>
                                </div>
                                <Badge
                                  className={getProposalStatusColor(
                                    proposal.state || proposal.status
                                  )}
                                >
                                  {getProposalStatusLabel(
                                    proposal.state || proposal.status
                                  )}
                                </Badge>
                              </div>

                              {/* Proposal Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    DAO ID
                                  </p>
                                  <p className="text-white font-semibold">
                                    {proposal.dao_id}
                                  </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    Total Votes
                                  </p>
                                  <p className="text-white font-semibold text-lg">
                                    {parseInt(
                                      proposal.total_votes || "0"
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    Created
                                  </p>
                                  <p className="text-white font-semibold">
                                    {new Date(
                                      parseInt(proposal.created_at) * 1000
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {/* Proposer Information */}
                              <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <p className="text-xs text-purple-400 uppercase tracking-wide">
                                  Proposed By
                                </p>
                                <p className="text-purple-200 font-mono text-sm">
                                  {proposal.proposer.slice(0, 12)}...
                                  {proposal.proposer.slice(-8)}
                                </p>
                              </div>

                              {/* Voting Results */}
                              <div className="mb-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <p className="text-xs text-blue-400 uppercase tracking-wide mb-3">
                                  Voting Results
                                </p>

                                <div className="grid grid-cols-3 gap-4 mb-3">
                                  <div className="text-center">
                                    <p className="text-green-200 font-bold text-lg">
                                      {parseInt(
                                        proposal.yes_votes || "0"
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-green-400">
                                      Yes Votes
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-red-200 font-bold text-lg">
                                      {parseInt(
                                        proposal.no_votes || "0"
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-red-400">
                                      No Votes
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-200 font-bold text-lg">
                                      {parseInt(
                                        proposal.abstain_votes || "0"
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      Abstain
                                    </p>
                                  </div>
                                </div>

                                {/* Voting Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs text-blue-400 mb-1">
                                    <span>Voting Distribution</span>
                                    <span>
                                      Total:{" "}
                                      {parseInt(
                                        proposal.total_votes || "0"
                                      ).toLocaleString()}{" "}
                                      votes
                                    </span>
                                  </div>
                                  <div className="w-full flex rounded-full h-3 overflow-hidden">
                                    <div
                                      className="bg-green-500 transition-all duration-300"
                                      style={{
                                        width: `${
                                          parseInt(proposal.total_votes) > 0
                                            ? (parseInt(
                                                proposal.yes_votes || "0"
                                              ) /
                                                parseInt(
                                                  proposal.total_votes
                                                )) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                    <div
                                      className="bg-red-500 transition-all duration-300"
                                      style={{
                                        width: `${
                                          parseInt(proposal.total_votes) > 0
                                            ? (parseInt(
                                                proposal.no_votes || "0"
                                              ) /
                                                parseInt(
                                                  proposal.total_votes
                                                )) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                    <div
                                      className="bg-gray-500 transition-all duration-300"
                                      style={{
                                        width: `${
                                          parseInt(proposal.total_votes) > 0
                                            ? (parseInt(
                                                proposal.abstain_votes || "0"
                                              ) /
                                                parseInt(
                                                  proposal.total_votes
                                                )) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Voting Percentages */}
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div className="text-center">
                                    <span className="text-green-300">
                                      {parseInt(proposal.total_votes) > 0
                                        ? Math.round(
                                            (parseInt(
                                              proposal.yes_votes || "0"
                                            ) /
                                              parseInt(proposal.total_votes)) *
                                              100
                                          )
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-red-300">
                                      {parseInt(proposal.total_votes) > 0
                                        ? Math.round(
                                            (parseInt(
                                              proposal.no_votes || "0"
                                            ) /
                                              parseInt(proposal.total_votes)) *
                                              100
                                          )
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-gray-300">
                                      {parseInt(proposal.total_votes) > 0
                                        ? Math.round(
                                            (parseInt(
                                              proposal.abstain_votes || "0"
                                            ) /
                                              parseInt(proposal.total_votes)) *
                                              100
                                          )
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Timeline Information */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                  <p className="text-xs text-yellow-400 uppercase tracking-wide">
                                    Start Time
                                  </p>
                                  <p className="text-yellow-200 text-sm">
                                    {new Date(
                                      parseInt(proposal.start_time) * 1000
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                  <p className="text-xs text-orange-400 uppercase tracking-wide">
                                    End Time
                                  </p>
                                  <p className="text-orange-200 text-sm">
                                    {new Date(
                                      parseInt(proposal.end_time) * 1000
                                    ).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-orange-300 mt-1">
                                    {new Date(
                                      parseInt(proposal.end_time) * 1000
                                    ) > new Date()
                                      ? "Active"
                                      : "Ended"}
                                  </p>
                                </div>
                                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                  <p className="text-xs text-red-400 uppercase tracking-wide">
                                    Execution Time
                                  </p>
                                  <p className="text-red-200 text-sm">
                                    {new Date(
                                      parseInt(proposal.execution_time) * 1000
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* User Voting Status */}
                              <div className="mb-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                <p className="text-xs text-indigo-400 uppercase tracking-wide">
                                  Your Voting Status
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        proposal.user_voted
                                          ? "bg-green-600/20 text-green-300 border-green-500/30"
                                          : "bg-gray-600/20 text-gray-300 border-gray-500/30"
                                      }
                                    >
                                      {proposal.user_voted
                                        ? "✓ Voted"
                                        : "✗ Not Voted"}
                                    </Badge>
                                  </div>
                                  {proposal.user_voted &&
                                    proposal.user_vote &&
                                    proposal.user_vote.vec &&
                                    proposal.user_vote.vec.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-indigo-300 text-sm">
                                          Your vote:
                                        </span>
                                        <Badge
                                          className={
                                            proposal.user_vote.vec[0] === "0"
                                              ? "bg-green-600/20 text-green-300 border-green-500/30"
                                              : proposal.user_vote.vec[0] ===
                                                "1"
                                              ? "bg-red-600/20 text-red-300 border-red-500/30"
                                              : "bg-gray-600/20 text-gray-300 border-gray-500/30"
                                          }
                                        >
                                          {proposal.user_vote.vec[0] === "0"
                                            ? "Yes"
                                            : proposal.user_vote.vec[0] === "1"
                                            ? "No"
                                            : "Abstain"}
                                        </Badge>
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* Linked AIP Information */}
                              {proposal.linked_aip &&
                                proposal.linked_aip.vec &&
                                proposal.linked_aip.vec.length > 0 && (
                                  <div className="mb-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                    <p className="text-xs text-cyan-400 uppercase tracking-wide">
                                      Linked AIP
                                    </p>
                                    <p className="text-cyan-200 font-mono text-sm">
                                      AIP #{proposal.linked_aip.vec[0]}
                                    </p>
                                  </div>
                                )}

                              {/* Proposal Timeline Footer */}
                              <div className="text-xs text-gray-400 border-t border-white/10 pt-3">
                                <div className="flex justify-between items-center">
                                  <span>
                                    Created:{" "}
                                    {new Date(
                                      parseInt(proposal.created_at) * 1000
                                    ).toLocaleString()}
                                  </span>
                                  <span>
                                    Duration:{" "}
                                    {Math.ceil(
                                      (parseInt(proposal.end_time) -
                                        parseInt(proposal.start_time)) /
                                        86400
                                    )}{" "}
                                    days
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )
                    )}
                    {proposals.length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-gray-400 text-sm">
                          And {proposals.length - 10} more proposals...
                        </p>
                        <Button
                          onClick={() =>
                            (window.location.href = "/dao/proposals")
                          }
                          className="mt-2 bg-gradient-to-r from-red-900 to-red-700"
                        >
                          View All Proposals
                        </Button>
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
                        <p className="text-gray-400">
                          No tasks found for this DAO.
                        </p>
                      </div>
                    ) : (
                      tasks
                        .slice(0, 10)
                        .map(
                          (task: any, index: React.Key | null | undefined) => (
                            <div
                              key={index}
                              className="p-6 bg-white/5 rounded-lg border border-white/10"
                            >
                              {/* Task Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-white font-semibold text-lg">
                                      {task.title}
                                    </h4>
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                      Task #{task.id}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-300 text-sm">
                                    {task.description}
                                  </p>
                                </div>
                                <Badge
                                  className={getTaskStatusColor(
                                    task.state || task.status
                                  )}
                                >
                                  {getTaskStatusLabel(
                                    task.state || task.status
                                  )}
                                </Badge>
                              </div>

                              {/* Task Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    Bounty Amount
                                  </p>
                                  <p className="text-white font-semibold text-lg">
                                    {(
                                      parseInt(
                                        task.bounty_amount || task.reward || "0"
                                      ) / 100000000
                                    ).toFixed(2)}{" "}
                                    APT
                                  </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    DAO ID
                                  </p>
                                  <p className="text-white font-semibold">
                                    {task.dao_id}
                                  </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    Created
                                  </p>
                                  <p className="text-white font-semibold">
                                    {new Date(
                                      parseInt(task.created_at) * 1000
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {/* Deadline and Assignment */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                  <p className="text-xs text-orange-400 uppercase tracking-wide">
                                    Deadline
                                  </p>
                                  <p className="text-orange-200 font-semibold">
                                    {new Date(
                                      parseInt(task.deadline) * 1000
                                    ).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-orange-300 mt-1">
                                    {new Date(parseInt(task.deadline) * 1000) >
                                    new Date()
                                      ? "Active"
                                      : "Expired"}
                                  </p>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                  <p className="text-xs text-blue-400 uppercase tracking-wide">
                                    Assignee
                                  </p>
                                  {task.assignee &&
                                  task.assignee.vec &&
                                  task.assignee.vec.length > 0 ? (
                                    <p className="text-blue-200 font-mono text-sm">
                                      {task.assignee.vec[0].slice(0, 12)}...
                                      {task.assignee.vec[0].slice(-8)}
                                    </p>
                                  ) : (
                                    <p className="text-blue-300 text-sm">
                                      Not assigned
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {task.user_is_assignee && (
                                      <Badge className="bg-blue-600/20 text-blue-300 text-xs">
                                        You are assignee
                                      </Badge>
                                    )}
                                    {task.user_is_creator && (
                                      <Badge className="bg-purple-600/20 text-purple-300 text-xs">
                                        You created this
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Creator Information */}
                              <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <p className="text-xs text-purple-400 uppercase tracking-wide">
                                  Created By
                                </p>
                                <p className="text-purple-200 font-mono text-sm">
                                  {task.creator.slice(0, 12)}...
                                  {task.creator.slice(-8)}
                                </p>
                              </div>

                              {/* Validation Information */}
                              {(task.required_validations ||
                                task.total_validations ||
                                task.positive_validations) && (
                                <div className="mb-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                  <p className="text-xs text-green-400 uppercase tracking-wide mb-3">
                                    Validation Status
                                  </p>

                                  <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div className="text-center">
                                      <p className="text-green-200 font-bold text-lg">
                                        {task.positive_validations || 0}
                                      </p>
                                      <p className="text-xs text-green-400">
                                        Positive
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-green-200 font-bold text-lg">
                                        {task.total_validations || 0}
                                      </p>
                                      <p className="text-xs text-green-400">
                                        Total
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-green-200 font-bold text-lg">
                                        {task.required_validations || 0}
                                      </p>
                                      <p className="text-xs text-green-400">
                                        Required
                                      </p>
                                    </div>
                                  </div>

                                  {/* Validation Progress Bar */}
                                  {task.required_validations && (
                                    <div className="mb-3">
                                      <div className="flex justify-between text-xs text-green-400 mb-1">
                                        <span>Validation Progress</span>
                                        <span>
                                          {task.positive_validations || 0}/
                                          {task.required_validations}(
                                          {Math.round(
                                            ((task.positive_validations || 0) /
                                              task.required_validations) *
                                              100
                                          )}
                                          %)
                                        </span>
                                      </div>
                                      <div className="w-full bg-green-900/30 rounded-full h-2">
                                        <div
                                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${Math.min(
                                              ((task.positive_validations ||
                                                0) /
                                                task.required_validations) *
                                                100,
                                              100
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Validation Results */}
                                  {task.validation_results &&
                                    task.validation_results.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-xs text-green-400 mb-2">
                                          Validation Results:
                                        </p>
                                        <div className="flex gap-1">
                                          {task.validation_results.map(
                                            (result: boolean, idx: number) => (
                                              <Badge
                                                key={idx}
                                                className={
                                                  result
                                                    ? "bg-green-600/20 text-green-300 border-green-500/30"
                                                    : "bg-red-600/20 text-red-300 border-red-500/30"
                                                }
                                              >
                                                {result ? "✓" : "✗"}
                                              </Badge>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Validators */}
                                  {task.validators &&
                                    task.validators.length > 0 && (
                                      <div>
                                        <p className="text-xs text-green-400 mb-2">
                                          Validators ({task.validators.length}):
                                        </p>
                                        <div className="space-y-1">
                                          {task.validators.map(
                                            (
                                              validator: string,
                                              idx: number
                                            ) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between text-xs"
                                              >
                                                <span className="text-green-200 font-mono">
                                                  {validator.slice(0, 12)}...
                                                  {validator.slice(-8)}
                                                </span>
                                                {task.validation_results &&
                                                  task.validation_results[
                                                    idx
                                                  ] !== undefined && (
                                                    <Badge
                                                      className={
                                                        task.validation_results[
                                                          idx
                                                        ]
                                                          ? "bg-green-600/20 text-green-300 border-green-500/30"
                                                          : "bg-red-600/20 text-red-300 border-red-500/30"
                                                      }
                                                    >
                                                      {task.validation_results[
                                                        idx
                                                      ]
                                                        ? "Approved"
                                                        : "Rejected"}
                                                    </Badge>
                                                  )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}

                              {/* Task Timeline */}
                              <div className="text-xs text-gray-400 border-t border-white/10 pt-3">
                                <div className="flex justify-between items-center">
                                  <span>
                                    Created:{" "}
                                    {new Date(
                                      parseInt(task.created_at) * 1000
                                    ).toLocaleString()}
                                  </span>
                                  {task.completed_at &&
                                    parseInt(task.completed_at) > 0 && (
                                      <span>
                                        Completed:{" "}
                                        {new Date(
                                          parseInt(task.completed_at) * 1000
                                        ).toLocaleString()}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          )
                        )
                    )}
                    {tasks.length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-gray-400 text-sm">
                          And {tasks.length - 10} more tasks...
                        </p>
                        <Button
                          onClick={() => (window.location.href = "/dao/tasks")}
                          className="mt-2 bg-gradient-to-r from-red-900 to-red-700"
                        >
                          View All Tasks
                        </Button>
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
                      const isGovernor =
                        selectedDAO.governors?.includes(member);
                      const isCreator = member === selectedDAO.creator;
                      const isPromoting = promotingMembers.includes(member);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isCreator
                                  ? "bg-gradient-to-br from-yellow-900 to-yellow-700"
                                  : isGovernor
                                  ? "bg-gradient-to-br from-red-900 to-red-700"
                                  : "bg-gradient-to-br from-blue-900 to-blue-700"
                              }`}
                            >
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
                                {member.toString().slice(0, 12)}...
                                {member.toString().slice(-12)}
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
                                  onClick={() =>
                                    promoteMemberToGovernor(member)
                                  }
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

                    {(!selectedDAO.members ||
                      selectedDAO.members.length === 0) && (
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
