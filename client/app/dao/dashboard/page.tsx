"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InViewMotion from "@/components/InViewMotion";
import { Aurora } from "@/components/aurora";
import {
  Users,
  Vote,
  Target,
  Wallet,
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  RefreshCw,
  Crown,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Aptos, AptosConfig, Network as AptosNetwork } from "@aptos-labs/ts-sdk";
import { 
  CONTRACT_FUNCTIONS, 
  RESOURCE_TYPES, 
  getUserTypeLabel, 
  getUserTypeColor,
  getProposalStatusLabel,
  getProposalStatusColor,
  getTaskStatusLabel,
  getTaskStatusColor
} from "@/config/contract";
import { toast } from "@/hooks/use-toast";

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

interface UserDAOEcosystem {
  user_address: string;
  total_daos_joined: number;
  total_voting_power: number;
  total_proposals_created: number;
  total_tasks_created: number;
  total_votes_cast: number;
  daos: DAOEcosystemEntry[];
  generated_at: number;
}

interface DAOEcosystemEntry {
  dao_info: {
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
  };
  user_membership: {
    is_member: boolean;
    is_governor: boolean;
    is_creator: boolean;
    voting_power: number;
    joined_at: number;
  };
  proposals: any[];
  tasks: any[];
  votes: any[];
}

export default function DashboardPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEcosystem, setUserEcosystem] = useState<UserDAOEcosystem | null>(null);
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
        console.log("User profile not found, user might not be registered");
        toast({
          title: "Welcome to ArcheDAO!",
          description: "Use an invite code to join a DAO and get started.",
        });
        setLoading(false);
        return;
      }

      // Get user's complete DAO ecosystem
      try {
        const ecosystemData = await aptosClient.view({
          payload: {
            function: CONTRACT_FUNCTIONS.GET_COMPLETE_USER_DAO_ECOSYSTEM,
            functionArguments: [account.address.toString()],
          },
        });
        
        if (ecosystemData && ecosystemData[0]) {
          setUserEcosystem(ecosystemData[0] as UserDAOEcosystem);
        }
      } catch (error) {
        console.error("Error loading user ecosystem:", error);
        toast({
          title: "Error Loading DAO Data",
          description: "Failed to load your DAO ecosystem data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error Loading Profile",
        description: "Failed to load your profile data.",
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Proposal":
        return Vote;
      case "Task":
        return Target;
      case "Vote":
        return CheckCircle;
      case "Member":
        return Users;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

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
                Connect Your Wallet
              </CardTitle>
              <p className="text-gray-300">
                Please connect your wallet to access your DAO dashboard.
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
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
                <span className="text-white text-lg">Loading your DAO data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userProfile || !userEcosystem) {
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
                Welcome to ArcheDAO!
              </CardTitle>
              <p className="text-gray-300 mb-6">
                You're not a member of any DAO yet. Use an invite code to join a DAO and get started.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/invite')}
                  className="bg-gradient-to-r from-red-900 to-red-700"
                >
                  Join a DAO
                </Button>
                <Button 
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {refreshing ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
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
        {/* Header */}
        <InViewMotion>
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back to ArcheDAO
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-400">
                  Your role:{" "}
                  <Badge className={getUserTypeColor(userProfile.user_type)}>
                    {getUserTypeLabel(userProfile.user_type)}
                  </Badge>
                </p>
                <p className="text-gray-400">
                  Member of {userEcosystem.total_daos_joined} DAOs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Connected Wallet</p>
                <p className="text-white font-mono text-sm">
                  {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
                </p>
              </div>
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
          </div>
        </InViewMotion>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">DAOs Joined</p>
                    <p className="text-2xl font-bold text-white">
                      {userEcosystem.total_daos_joined}
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
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Voting Power</p>
                    <p className="text-2xl font-bold text-white">
                      {userEcosystem.total_voting_power}
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
                    <p className="text-sm text-gray-400">Votes Cast</p>
                    <p className="text-2xl font-bold text-white">
                      {userEcosystem.total_votes_cast}
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
                    <p className="text-sm text-gray-400">Tasks Created</p>
                    <p className="text-2xl font-bold text-white">
                      {userEcosystem.total_tasks_created}
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
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Reputation</p>
                    <p className="text-2xl font-bold text-white">
                      {userProfile.reputation_score}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </InViewMotion>
        </div>

        {/* DAOs List */}
        <InViewMotion>
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-white">Your DAOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userEcosystem.daos.map((daoEntry, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {daoEntry.dao_info.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {daoEntry.dao_info.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {daoEntry.user_membership.is_creator && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                            Creator
                          </Badge>
                        )}
                        {daoEntry.user_membership.is_governor && (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">
                            Governor
                          </Badge>
                        )}
                        {daoEntry.user_membership.is_member && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            Member
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Members</p>
                        <p className="text-white font-medium">{daoEntry.dao_info.member_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Your Voting Power</p>
                        <p className="text-white font-medium">{daoEntry.user_membership.voting_power}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Proposals</p>
                        <p className="text-white font-medium">{daoEntry.dao_info.proposal_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Tasks</p>
                        <p className="text-white font-medium">{daoEntry.dao_info.task_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push('/dao/proposals')}
                        className="bg-gradient-to-r from-red-900 to-red-700"
                      >
                        View Proposals
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push('/dao/tasks')}
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        View Tasks
                      </Button>
                      {(daoEntry.user_membership.is_creator || daoEntry.user_membership.is_governor) && (
                        <Button
                          size="sm"
                          onClick={() => router.push('/dao/governor')}
                          className="bg-gradient-to-r from-yellow-900 to-yellow-700"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </InViewMotion>

        {/* Quick Actions */}
        <InViewMotion>
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-red-400/50 transition-colors cursor-pointer"
                     onClick={() => router.push('/dao/proposals')}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                      <Vote className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">View Proposals</h3>
                      <p className="text-sm text-gray-400">Review and vote on active proposals</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-400 ml-auto" />
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-red-400/50 transition-colors cursor-pointer"
                     onClick={() => router.push('/dao/tasks')}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Task Management</h3>
                      <p className="text-sm text-gray-400">Create and manage DAO tasks</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-400 ml-auto" />
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-red-400/50 transition-colors cursor-pointer"
                     onClick={() => router.push('/invite')}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Join More DAOs</h3>
                      <p className="text-sm text-gray-400">Use invite codes to join additional DAOs</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-400 ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        </InViewMotion>
      </div>
    </div>
  );
}
