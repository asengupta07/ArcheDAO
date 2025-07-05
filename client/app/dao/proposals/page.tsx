"use client";

import { useState } from "react";
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
import { Aurora } from "@/components/aurora";
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
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

// Mock proposals data
const proposals = [
  {
    id: "PROP-31",
    title: "Implement Layer 2 Scaling Solution",
    description:
      "Proposal to integrate a Layer 2 scaling solution to reduce transaction costs and improve throughput for our DAO operations.",
    status: "active",
    votes: { yes: 75, no: 25 },
    totalVotes: 450,
    quorum: 80,
    timeLeft: "2 days",
    createdBy: "0x8e46...74ac",
    createdAt: "2024-03-15",
    yourVote: null,
    category: "Technical",
  },
  {
    id: "PROP-30",
    title: "Treasury Diversification Strategy",
    description:
      "Diversify our treasury holdings across multiple assets to reduce risk and increase yield potential.",
    status: "active",
    votes: { yes: 45, no: 55 },
    totalVotes: 320,
    quorum: 60,
    timeLeft: "5 days",
    createdBy: "0x7d32...91bc",
    createdAt: "2024-03-14",
    yourVote: null,
    category: "Treasury",
  },
  {
    id: "PROP-29",
    title: "Community Rewards Program",
    description:
      "Launch a rewards program to incentivize community participation and contribution to DAO activities.",
    status: "completed",
    votes: { yes: 90, no: 10 },
    totalVotes: 680,
    quorum: 100,
    timeLeft: "0 days",
    createdBy: "0x9f23...45de",
    createdAt: "2024-03-10",
    yourVote: "yes",
    category: "Community",
  },
  {
    id: "PROP-28",
    title: "Governance Parameter Updates",
    description:
      "Update voting periods and quorum requirements to improve governance efficiency.",
    status: "pending",
    votes: { yes: 0, no: 0 },
    totalVotes: 0,
    quorum: 50,
    timeLeft: "7 days",
    createdBy: "0x2a1b...67cd",
    createdAt: "2024-03-12",
    yourVote: null,
    category: "Governance",
  },
];

export default function ProposalsPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    category: "General",
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
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

  const handleVote = (proposalId: string, vote: "yes" | "no") => {
    toast({
      title: "Vote Submitted",
      description: `You voted ${vote} on proposal ${proposalId}`,
    });
  };

  const handleCreateProposal = () => {
    if (!newProposal.title || !newProposal.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Proposal Created",
      description: "Your proposal has been submitted for review.",
    });

    setNewProposal({ title: "", description: "", category: "General" });
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === "all") return true;
    return proposal.status === filter;
  });

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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dao/dashboard")}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Proposals
                </h1>
                <p className="text-gray-400">
                  Vote on active proposals or create new ones
                </p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-900 to-red-700">
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
                  >
                    Submit Proposal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </InViewMotion>

        {/* Filters */}
        <InViewMotion>
          <div className="flex gap-4 mb-6">
            {["all", "active", "pending", "completed"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status)}
                className={
                  filter === status
                    ? "bg-red-900/50 border-red-900/50"
                    : "border-red-900/20 text-white hover:bg-red-900/20"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </InViewMotion>

        {/* Proposals List */}
        <div className="space-y-6">
          {filteredProposals.map((proposal, index) => (
            <InViewMotion key={proposal.id}>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-400 text-sm">
                          {proposal.id}
                        </span>
                        <Badge className={getCategoryColor(proposal.category)}>
                          {proposal.category}
                        </Badge>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
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
                          <span>By {proposal.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{proposal.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          <span>{proposal.timeLeft}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {proposal.status === "active" && !proposal.yourVote && (
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
                      {proposal.yourVote && (
                        <Badge className="bg-red-900/50 text-red-200">
                          Your vote: {proposal.yourVote}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Votes: {proposal.totalVotes}</span>
                      <span>Quorum: {proposal.quorum}%</span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div
                        className="bg-green-500 rounded-l"
                        style={{ width: `${proposal.votes.yes}%` }}
                      />
                      <div
                        className="bg-red-500 rounded-r"
                        style={{ width: `${proposal.votes.no}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-500">
                        {proposal.votes.yes}% Yes
                      </span>
                      <span className="text-red-500">
                        {proposal.votes.no}% No
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>
          ))}
        </div>

        {filteredProposals.length === 0 && (
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
      </div>
    </div>
  );
}
