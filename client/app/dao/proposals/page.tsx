"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InViewMotion from "@/components/InViewMotion";

import { GradientBackground } from "@/components/ui/gradient-background";
import {
  Vote,
  Timer,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Target,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Coins,
  Wallet,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useProposals, ProposalInfo, AIPInfo } from "@/hooks/useProposals";
import {
  PROPOSAL_STATUS,
  VOTE_TYPES,
  getProposalStatusLabel,
  getProposalStatusColor,
  getUserTypeLabel,
} from "@/config/contract";
import { useTaskManager } from "@/hooks/useTaskManager";
import type { UserDAOEcosystem } from "@/types/dao";

export default function ProposalsPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [daoId, setDaoId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    category: "General",
    linkedAip: "",
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const { getCompleteDAOEcosystem } = useTaskManager();

  useEffect(() => {
    const fetchEcosystemData = async () => {
      if (connected && account) {
        try {
          const data = await getCompleteDAOEcosystem();
          if (data) {
            // Convert numeric values to strings to match the UserDAOEcosystem type
            const formattedData: UserDAOEcosystem = {
              user_address: data.user_address,
              total_daos_joined: data.total_daos_joined.toString(),
              total_voting_power: data.total_voting_power.toString(),
              total_proposals_created: data.total_proposals_created.toString(),
              total_tasks_created: data.total_tasks_created.toString(),
              total_votes_cast: data.total_votes_cast.toString(),
              generated_at: data.generated_at.toString(),
              daos: data.daos.map((dao) => ({
                dao_info: {
                  id: dao.dao_info.id,
                  dao_code: dao.dao_info.dao_code,
                  name: dao.dao_info.name,
                  description: dao.dao_info.description,
                  creator: dao.dao_info.creator,
                  governors: dao.dao_info.governors,
                  members: dao.dao_info.members,
                  total_staked: dao.dao_info.total_staked.toString(),
                  governance_token: dao.dao_info.governance_token,
                  minimum_proposal_threshold:
                    dao.dao_info.minimum_proposal_threshold.toString(),
                  voting_period: dao.dao_info.voting_period.toString(),
                  execution_delay: dao.dao_info.execution_delay.toString(),
                  proposal_count: dao.dao_info.proposal_count.toString(),
                  task_count: dao.dao_info.task_count.toString(),
                  treasury_balance: dao.dao_info.treasury_balance.toString(),
                  is_active: dao.dao_info.is_active,
                  created_at: dao.dao_info.created_at.toString(),
                  member_count: dao.dao_info.member_count,
                },
                user_membership: {
                  is_member: dao.user_membership.is_member,
                  is_governor: dao.user_membership.is_governor,
                  is_creator: dao.user_membership.is_creator,
                  voting_power: dao.user_membership.voting_power.toString(),
                  join_date: dao.user_membership.join_date.toString(),
                },
                proposals: (dao.proposals || []).map((proposal) => ({
                  id: proposal.id.toString(),
                  dao_id: proposal.dao_id.toString(),
                  title: proposal.title,
                  description: proposal.description,
                  proposer: proposal.creator,
                  start_time: proposal.start_time.toString(),
                  end_time: proposal.end_time.toString(),
                  execution_time: proposal.execution_time.toString(),
                  yes_votes: proposal.for_votes.toString(),
                  no_votes: proposal.against_votes.toString(),
                  abstain_votes: proposal.abstain_votes.toString(),
                  total_votes: (
                    proposal.for_votes +
                    proposal.against_votes +
                    proposal.abstain_votes
                  ).toString(),
                  state: proposal.state,
                  linked_aip: null, // Not available in the hook's type
                  created_at: proposal.created_at.toString(),
                  user_voted: proposal.user_vote_type !== null,
                  user_vote: proposal.user_vote_type,
                })),
                tasks: (dao.tasks || []).map((task) => ({
                  id: task.id.toString(),
                  dao_id: task.dao_id.toString(),
                  title: task.title,
                  description: task.description,
                  creator: task.creator,
                  assignee: task.assignee,
                  bounty_amount: task.bounty_amount.toString(),
                  deadline: task.deadline.toString(),
                  state: task.state,
                  created_at: task.created_at.toString(),
                  user_is_creator: task.user_is_creator,
                  user_is_assignee: task.user_is_assignee,
                })),
                user_proposals_created: dao.user_proposals_created.toString(),
                user_tasks_created: dao.user_tasks_created.toString(),
                user_votes_cast: dao.user_votes_cast.toString(),
                total_voting_power_used: dao.total_voting_power_used.toString(),
              })),
            };

            // Set the dao_id to the first DAO's ID if available
            if (formattedData.daos.length > 0) {
              setDaoId(formattedData.daos[0].dao_info.id);
            } else {
              toast({
                title: "No DAOs Found",
                description: "You are not a member of any DAOs.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching ecosystem data:", error);
          toast({
            title: "Error Loading DAOs",
            description: "Failed to load your DAO information.",
            variant: "destructive",
          });
        }
      }
    };

    fetchEcosystemData();
  }, [connected, account, getCompleteDAOEcosystem]);

  const {
    proposals,
    userProfile,
    userStakingInfo,
    userAIPs,
    daoInfo,
    userMembership,
    loading,
    error,
    createProposal,
    voteOnProposal,
    stakeForVotingPower,
    unstakeVotingPower,
    canCreateProposal,
    refetch,
  } = useProposals(daoId ? `${daoId}` : "1");

  const handleVote = async (
    proposalId: string,
    vote: "yes" | "no" | "abstain"
  ) => {
    try {
      const voteValue =
        vote === "yes"
          ? VOTE_TYPES.FOR
          : vote === "no"
          ? VOTE_TYPES.AGAINST
          : VOTE_TYPES.ABSTAIN;

      await voteOnProposal(proposalId, voteValue);
      toast({
        title: "Vote Submitted",
        description: `You voted ${vote} on proposal ${proposalId}`,
      });
    } catch (error: any) {
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    }
  };

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProposal(
        newProposal.title,
        newProposal.description,
        newProposal.category,
        newProposal.linkedAip || undefined
      );

      toast({
        title: "Proposal Created",
        description: "Your proposal has been submitted successfully.",
      });

      setNewProposal({
        title: "",
        description: "",
        category: "General",
        linkedAip: "",
      });
      setShowCreateDialog(false);
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create proposal",
        variant: "destructive",
      });
    }
  };

  const handleStaking = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid stake amount.",
        variant: "destructive",
      });
      return;
    }

    if (Number(stakeAmount) < 0.01) {
      toast({
        title: "Amount Too Small",
        description: "Minimum stake amount is 0.01 APT.",
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);
    try {
      // Convert APT to octas (1 APT = 100,000,000 octas)
      const amountInOctas = Math.floor(
        Number(stakeAmount) * 100_000_000
      ).toString();

      await stakeForVotingPower(amountInOctas);

      toast({
        title: "Staking Successful",
        description: `Successfully staked ${stakeAmount} APT for voting power.`,
      });

      setStakeAmount("");
    } catch (error: any) {
      toast({
        title: "Staking Failed",
        description: error.message || "Failed to stake APT",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstaking = async () => {
    if (!unstakeAmount || Number(unstakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid unstake amount.",
        variant: "destructive",
      });
      return;
    }

    const maxUnstake = userStakingInfo
      ? Number(userStakingInfo.staked_apt) / 100_000_000
      : 0;
    if (Number(unstakeAmount) > maxUnstake) {
      toast({
        title: "Amount Too Large",
        description: `Maximum unstake amount is ${maxUnstake.toFixed(4)} APT.`,
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(true);
    try {
      // Convert APT to octas (1 APT = 100,000,000 octas)
      const amountInOctas = Math.floor(
        Number(unstakeAmount) * 100_000_000
      ).toString();

      await unstakeVotingPower(amountInOctas);

      toast({
        title: "Unstaking Successful",
        description: `Successfully unstaked ${unstakeAmount} APT.`,
      });

      setUnstakeAmount("");
    } catch (error: any) {
      toast({
        title: "Unstaking Failed",
        description: error.message || "Failed to unstake APT",
        variant: "destructive",
      });
    } finally {
      setIsUnstaking(false);
    }
  };

  const getStatusColor = (status: number) => {
    return getProposalStatusColor(status);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "technical":
        return "bg-purple-500/10 text-purple-500";
      case "treasury":
        return "bg-green-500/10 text-green-500";
      case "community":
        return "bg-blue-500/10 text-blue-500";
      case "governance":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatTimeLeft = (endTime: string) => {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "< 1h";
  };

  const formatVotePercentage = (votes: string, total: string) => {
    const voteNum = Number(votes);
    const totalNum = Number(total);
    if (totalNum === 0) return 0;
    return Math.round((voteNum / totalNum) * 100);
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === "all") return true;
    const statusLabel = getProposalStatusLabel(proposal.state).toLowerCase();
    return statusLabel === filter;
  });

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
                Connect Your Wallet
              </CardTitle>
              <p className="text-gray-300">
                Please connect your wallet to access proposals.
              </p>
            </CardHeader>
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

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <InViewMotion>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dao/dashboard")}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="mt-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Proposals
                </h1>
                <p className="text-gray-400">
                  Vote on active proposals or create new ones
                </p>
                {daoInfo && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-red-900/50 text-red-200">
                      {daoInfo.name}
                    </Badge>
                    {userProfile && (
                      <Badge className="bg-blue-900/50 text-blue-200">
                        {getUserTypeLabel(userProfile.user_type)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-red-900 to-red-700"
                  disabled={!canCreateProposal()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-red-900/20 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4">
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Title
                    </label>
                    <Input
                      value={newProposal.title}
                      onChange={(e) =>
                        setNewProposal({
                          ...newProposal,
                          title: e.target.value,
                        })
                      }
                      className="bg-white/5 border-red-900/20 text-white"
                      placeholder="Enter proposal title"
                    />
                  </div>
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Category
                    </label>
                    <select
                      value={newProposal.category}
                      onChange={(e) =>
                        setNewProposal({
                          ...newProposal,
                          category: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-red-900/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="General">General</option>
                      <option value="Technical">Technical</option>
                      <option value="Treasury">Treasury</option>
                      <option value="Community">Community</option>
                      <option value="Governance">Governance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Linked AIP (Optional)
                    </label>
                    <select
                      value={newProposal.linkedAip}
                      onChange={(e) =>
                        setNewProposal({
                          ...newProposal,
                          linkedAip: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-red-900/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">No linked AIP</option>
                      {userAIPs.map((aip) => (
                        <option key={aip.id} value={aip.id}>
                          AIP-{aip.id}: {aip.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Description
                    </label>
                    <Textarea
                      value={newProposal.description}
                      onChange={(e) =>
                        setNewProposal({
                          ...newProposal,
                          description: e.target.value,
                        })
                      }
                      className="bg-white/5 border-red-900/20 text-white min-h-[120px]"
                      placeholder="Describe your proposal in detail..."
                    />
                  </div>
                  <Button
                    onClick={handleCreateProposal}
                    className="w-full bg-gradient-to-r from-red-900 to-red-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Submit Proposal"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </InViewMotion>

        {/* User can't create proposals message */}
        {!canCreateProposal() && (
          <InViewMotion>
            <Card className="bg-yellow-900/20 border-yellow-500/30 backdrop-blur-xl mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Only DAO creators and governors can create proposals
                  </span>
                </div>
                <p className="text-yellow-200 text-sm mt-1">
                  As a member, you can vote on existing proposals and stake
                  tokens to increase your voting power.
                </p>
              </CardContent>
            </Card>
          </InViewMotion>
        )}

        {/* Staking & Voting Power Section */}
        <InViewMotion>
          <div className="mb-12 w-full flex justify-center px-4">
            <div className="w-full max-w-4xl">
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Coins className="w-5 h-5 text-red-400" />
                    Staking & Voting Power
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Role & Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        className={
                          userMembership?.is_creator
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : userMembership?.is_governor
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : userMembership?.is_member
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }
                      >
                        {userMembership?.is_creator
                          ? "DAO Creator"
                          : userMembership?.is_governor
                          ? "Governor"
                          : userMembership?.is_member
                          ? "Member"
                          : "Not a member"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">
                      Privileges:{" "}
                      {userMembership?.is_creator
                        ? "Create Proposals, Govern DAO, Vote"
                        : userMembership?.is_governor
                        ? "Govern DAO, Vote"
                        : userMembership?.is_member
                        ? "Vote"
                        : "View Only"}
                    </div>
                  </div>

                  {/* Current Staking Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">Staked APT</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {userStakingInfo
                          ? (
                              Number(userStakingInfo.staked_apt) / 100_000_000
                            ).toFixed(4)
                          : "0.0000"}{" "}
                        APT
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Vote className="w-4 h-4" />
                        <span className="text-sm">Voting Power</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {userStakingInfo
                          ? (
                              Number(userStakingInfo.voting_percentage) / 100
                            ).toFixed(2)
                          : "0.00"}
                        %
                      </div>
                      <div className="text-xs text-gray-400">
                        {userStakingInfo
                          ? (
                              Number(userStakingInfo.calculated_voting_power) /
                              100
                            ).toFixed(2)
                          : "0.00"}{" "}
                        basis points
                      </div>
                    </div>
                  </div>

                  {/* Voting Power Breakdown */}
                  {userStakingInfo &&
                    (Number(userStakingInfo.reserved_power) > 0 ||
                      Number(userStakingInfo.staked_power) > 0) && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">
                          Power Breakdown
                        </div>
                        <div className="space-y-1">
                          {Number(userStakingInfo.reserved_power) > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-400">
                                Reserved (Role)
                              </span>
                              <span className="text-white">
                                {(
                                  Number(userStakingInfo.reserved_power) / 100
                                ).toFixed(2)}{" "}
                                bp
                              </span>
                            </div>
                          )}
                          {Number(userStakingInfo.staked_power) > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400">Staked</span>
                              <span className="text-white">
                                {(
                                  Number(userStakingInfo.staked_power) / 100
                                ).toFixed(2)}{" "}
                                bp
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* DAO Statistics */}
                  {userStakingInfo && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-3 bg-red-900/10 rounded-lg border border-red-900/20">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">
                          Total Staked
                        </div>
                        <div className="font-bold text-white">
                          {(
                            Number(userStakingInfo.total_dao_staked) /
                            100_000_000
                          ).toFixed(4)}{" "}
                          APT
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Your Share</div>
                        <div className="font-bold text-white">
                          {Number(userStakingInfo.total_dao_staked) > 0
                            ? (
                                (Number(userStakingInfo.staked_apt) /
                                  100_000_000 /
                                  (Number(userStakingInfo.total_dao_staked) /
                                    100_000_000)) *
                                100
                              ).toFixed(2)
                            : "0.00"}
                          %
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Min Stake</div>
                        <div className="font-bold text-white">0.01 APT</div>
                      </div>
                    </div>
                  )}

                  {/* Voting Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        userMembership?.is_member
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {userMembership?.is_member
                        ? "✓ Can Vote"
                        : "✗ Cannot Vote"}
                    </Badge>

                    {!userMembership?.is_member && (
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Info className="w-4 h-4" />
                        <span>Stake to gain voting power</span>
                      </div>
                    )}
                  </div>

                  {/* Staking Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Stake Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={loading}
                        >
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Stake APT
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/90 border-red-900/20 text-white">
                        <DialogHeader>
                          <DialogTitle>Stake APT for Voting Power</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 p-4">
                          <div className="space-y-2">
                            <label className="text-white font-medium">
                              Amount to Stake (APT)
                            </label>
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(e.target.value)}
                              className="bg-white/5 border-red-900/20 text-white"
                              placeholder="0.0000"
                            />
                            <div className="text-xs text-gray-400">
                              Minimum stake: 0.01 APT
                            </div>
                          </div>
                          <Button
                            onClick={handleStaking}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700"
                            disabled={
                              loading ||
                              isStaking ||
                              !stakeAmount ||
                              Number(stakeAmount) <= 0
                            }
                          >
                            {isStaking ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Staking...
                              </>
                            ) : (
                              "Stake APT"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Unstake Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-red-400/40 text-red-400 hover:bg-red-900/20"
                          disabled={
                            loading ||
                            !userStakingInfo ||
                            Number(userStakingInfo.staked_apt) === 0
                          }
                        >
                          <ArrowDown className="w-4 h-4 mr-2" />
                          Unstake
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/90 border-red-900/20 text-white">
                        <DialogHeader>
                          <DialogTitle>Unstake APT</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 p-4">
                          <div className="space-y-2">
                            <label className="text-white font-medium">
                              Amount to Unstake (APT)
                            </label>
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              max={
                                userStakingInfo
                                  ? Number(userStakingInfo.staked_apt) /
                                    100_000_000
                                  : 0
                              }
                              value={unstakeAmount}
                              onChange={(e) => setUnstakeAmount(e.target.value)}
                              className="bg-white/5 border-red-900/20 text-white"
                              placeholder="0.0000"
                            />
                            <div className="text-xs text-gray-400">
                              Available to unstake:{" "}
                              {userStakingInfo
                                ? (
                                    Number(userStakingInfo.staked_apt) /
                                    100_000_000
                                  ).toFixed(4)
                                : "0.0000"}{" "}
                              APT
                            </div>
                          </div>
                          <Button
                            onClick={handleUnstaking}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700"
                            disabled={
                              loading ||
                              isUnstaking ||
                              !unstakeAmount ||
                              Number(unstakeAmount) <= 0
                            }
                          >
                            {isUnstaking ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Unstaking...
                              </>
                            ) : (
                              "Unstake APT"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Information Box */}
                  <div className="p-3 bg-blue-900/10 rounded-lg border border-blue-900/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="text-xs text-blue-400">
                        <div className="font-medium mb-1">
                          Voting Power System:
                        </div>
                        <ul className="space-y-1 text-blue-300">
                          <li>
                            • Governors and creators get reserved voting power
                          </li>
                          <li>
                            • Additional power comes from staking APT tokens
                          </li>
                          <li>• Minimum 0.01 APT stake required to vote</li>
                          <li>
                            • Unstaking may be restricted during active
                            proposals
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </InViewMotion>

        {/* Filters */}
        <InViewMotion className="py-10 px-24">
          <div className="flex gap-4 mb-6">
            {["all", "active", "pending", "passed", "rejected"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status)}
                className={
                  filter === status
                    ? "bg-red-900/50 border-red-900/50"
                    : "border-red-900/20 text-white bg-black hover:bg-red-900/20"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </InViewMotion>

        {/* Loading State */}
        {loading && !proposals.length && (
          <InViewMotion className="px-24">
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Loading Proposals
                </h3>
                <p className="text-gray-400">
                  Fetching proposals from the blockchain...
                </p>
              </CardContent>
            </Card>
          </InViewMotion>
        )}

        {/* Error State */}
        {error && (
          <InViewMotion>
            <Card className="bg-red-900/20 border-red-500/30 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Error Loading Proposals
                </h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <Button
                  onClick={refetch}
                  className="bg-gradient-to-r from-red-900 to-red-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </InViewMotion>
        )}

        {/* Proposals List */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-24">
          {filteredProposals.map((proposal, index) => (
            <InViewMotion key={proposal.id}>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-400 text-sm">
                          PROP-{proposal.id}
                        </span>
                        <Badge className={getCategoryColor("general")}>
                          General
                        </Badge>
                        <Badge className={getStatusColor(proposal.state)}>
                          {getProposalStatusLabel(proposal.state)}
                        </Badge>
                        {proposal.linked_aip && (
                          <Badge className="bg-purple-500/10 text-purple-500">
                            AIP-{proposal.linked_aip}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {proposal.title}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {proposal.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            By {proposal.proposer.slice(0, 6)}...
                            {proposal.proposer.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(
                              Number(proposal.created_at) * 1000
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          <span>{formatTimeLeft(proposal.end_time)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {proposal.state === PROPOSAL_STATUS.ACTIVE &&
                        !proposal.user_voted &&
                        userMembership?.is_member && (
                          <>
                            <Button
                              onClick={() => handleVote(proposal.id, "yes")}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Vote Yes
                            </Button>
                            <Button
                              onClick={() => handleVote(proposal.id, "no")}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Vote No
                            </Button>
                          </>
                        )}
                      {proposal.user_voted && (
                        <Badge className="bg-red-900/50 text-red-200">
                          You voted
                        </Badge>
                      )}
                      {!userMembership?.is_member &&
                        proposal.state === PROPOSAL_STATUS.ACTIVE && (
                          <Badge className="bg-yellow-900/50 text-yellow-200">
                            Stake to vote
                          </Badge>
                        )}
                    </div>
                  </div>

                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>
                        Total Votes:{" "}
                        {(Number(proposal.total_votes) / 100_000_000).toFixed(
                          4
                        )}{" "}
                        APT
                      </span>
                      <span>
                        Voting ends: {formatTimeLeft(proposal.end_time)}
                      </span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div
                        className="bg-green-500 rounded-l"
                        style={{
                          width: `${formatVotePercentage(
                            proposal.yes_votes,
                            proposal.total_votes
                          )}%`,
                        }}
                      />
                      <div
                        className="bg-red-500 rounded-r"
                        style={{
                          width: `${formatVotePercentage(
                            proposal.no_votes,
                            proposal.total_votes
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-500">
                        {formatVotePercentage(
                          proposal.yes_votes,
                          proposal.total_votes
                        )}
                        % Yes (
                        {(Number(proposal.yes_votes) / 100_000_000).toFixed(4)}{" "}
                        APT)
                      </span>
                      <span className="text-red-500">
                        {formatVotePercentage(
                          proposal.no_votes,
                          proposal.total_votes
                        )}
                        % No (
                        {(Number(proposal.no_votes) / 100_000_000).toFixed(4)}{" "}
                        APT)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>
          ))}
        </div>

        {filteredProposals.length === 0 && !loading && (
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No proposals found
                </h3>
                <p className="text-gray-400">
                  {filter === "all"
                    ? "No proposals have been created yet."
                    : `No ${filter} proposals found.`}
                </p>
              </CardContent>
            </Card>
          </InViewMotion>
        )}

        {/* Blockchain Data Display */}
        {userStakingInfo && (
          <InViewMotion className="px-24">
            <div className="mb-8 mt-10">
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                    Blockchain Data Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Raw Blockchain Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Left Column - Staking Details */}
                    <div className="space-y-4 w-full">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Smart Contract Data
                      </h3>
                      <div className="space-y-3 w-full">
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">
                            Staked APT (Raw)
                          </span>
                          <span className="text-white font-mono text-xs">
                            {userStakingInfo.staked_apt} octas
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">
                            Staked APT (Formatted)
                          </span>
                          <span className="text-white">
                            {(
                              Number(userStakingInfo.staked_apt) / 100_000_000
                            ).toFixed(4)}{" "}
                            APT
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">
                            Total DAO Staked
                          </span>
                          <span className="text-white">
                            {(
                              Number(userStakingInfo.total_dao_staked) /
                              100_000_000
                            ).toFixed(4)}{" "}
                            APT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Voting Power Details */}
                    <div className="space-y-4 w-full">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Voting Power Calculation
                      </h3>
                      <div className="space-y-3 w-full">
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">
                            Calculated Power (Raw)
                          </span>
                          <span className="text-white font-mono">
                            {userStakingInfo.calculated_voting_power} bp
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">Reserved Power</span>
                          <span className="text-white">
                            {(
                              Number(userStakingInfo.reserved_power) / 100
                            ).toFixed(2)}{" "}
                            bp
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">Staked Power</span>
                          <span className="text-white">
                            {(
                              Number(userStakingInfo.staked_power) / 100
                            ).toFixed(2)}{" "}
                            bp
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg w-full">
                          <span className="text-gray-400">
                            Voting Percentage
                          </span>
                          <span className="text-white">
                            {(
                              Number(userStakingInfo.voting_percentage) / 100
                            ).toFixed(6)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart Contract Integration Info */}
                  <div className="p-4 bg-red-900/10 rounded-lg border border-red-900/20">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Blockchain Integration Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 mb-2">
                          Contract Functions Used
                        </div>
                        <div className="text-white font-mono text-xs">
                          <div>• get_user_staking_info()</div>
                          <div>• get_user_voting_power_breakdown()</div>
                          <div>• get_dao_proposals()</div>
                          <div>• stake_for_voting_power()</div>
                          <div>• vote()</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-2">
                          Connected Wallet
                        </div>
                        <div className="text-white font-mono text-xs">
                          {account?.address.toString().slice(0, 10)}...
                          {account?.address.toString().slice(-8)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </InViewMotion>
        )}
      </div>
    </div>
  );
}
