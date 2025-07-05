'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InViewMotion from '@/components/InViewMotion';
import { Aurora } from '@/components/aurora';
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
  X
} from 'lucide-react';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from '@/hooks/use-toast';

// Hardcoded member data
const daoMembers = [
  { address: '0x8e46...74ac', role: 'Governor', joinedDate: '2024-01-15', votingPower: '15%' },
  { address: '0x7d32...91bc', role: 'Governor', joinedDate: '2024-01-16', votingPower: '12%' },
  { address: '0x9f23...45de', role: 'Member', joinedDate: '2024-02-01', votingPower: '5%' },
  { address: '0x2a1b...67cd', role: 'Member', joinedDate: '2024-02-15', votingPower: '3%' },
];

// Hardcoded DAO data (simulating smart contract data)
const daoContract = {
  daoId: 'dao_123',
  daoAddress: '0x8e46...74ac',
  name: 'TechDAO',
  role: 'Governor',
  overview: {
    totalMembers: 1250,
    treasuryBalance: '125,000 APT',
    marketValue: '$1,875,000',
    treasuryChange: '+12.5%',
    activeProposals: 3,
    totalProposals: 28,
    successRate: '85%',
  },
  votingPower: {
    community: 60,
    governors: 40,
    yourVotingPower: 15,
  },
  recentProposals: [
    {
      id: 'PROP-31',
      title: 'Implement Layer 2 Scaling',
      status: 'active',
      votes: { yes: 75, no: 25 },
      timeLeft: '2 days',
      quorum: 80,
      yourVote: 'yes',
    },
    {
      id: 'PROP-30',
      title: 'Treasury Diversification',
      status: 'pending',
      votes: { yes: 45, no: 55 },
      timeLeft: '5 days',
      quorum: 60,
      yourVote: null,
    },
    {
      id: 'PROP-29',
      title: 'Community Rewards Program',
      status: 'completed',
      votes: { yes: 90, no: 10 },
      timeLeft: '0 days',
      quorum: 100,
      yourVote: 'yes',
    }
  ],
  governanceMetrics: {
    proposalSuccessRate: '85%',
    averageQuorum: '75%',
    averageVotingPeriod: '5 days',
    governorParticipation: '92%',
  },
  treasuryActivity: [
    { type: 'Inflow', amount: '+5,000 APT', date: '2024-03-15' },
    { type: 'Outflow', amount: '-2,000 APT', date: '2024-03-14' },
    { type: 'Inflow', amount: '+8,000 APT', date: '2024-03-13' },
  ],
};

export default function GovernancePage() {
  const { account, connected } = useWallet();
  const [inviteLink, setInviteLink] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const generateInviteLink = () => {
    // In real implementation, this would call the smart contract to generate a unique code
    const uniqueCode = Math.random().toString(36).substring(2, 15);
    const newLink = `${window.location.origin}/invite?code=${uniqueCode}`;
    setInviteLink(newLink);
    toast({
      title: "Invite Link Generated",
      description: "The link will be valid for 24 hours.",
    });
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

  const handleVote = (proposalId: string, vote: 'yes' | 'no') => {
    toast({
      title: "Vote Submitted",
      description: `You voted ${vote} on proposal ${proposalId}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
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
              <CardTitle className="text-2xl text-white mb-4">Access Restricted</CardTitle>
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
            <h1 className="text-4xl font-bold text-white">Governor Dashboard</h1>
            <p className="text-gray-400">Welcome to the governor dashboard. Here you can manage the DAO and its members.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
              <Shield className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{daoContract.role}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
              <span className="text-gray-400">{daoContract.name}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
              <span className="text-red-200/80 font-mono">
                {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Key Metrics Row */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Members</p>
                    <p className="text-2xl font-bold text-white">{daoContract.overview.totalMembers}</p>
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
                    <p className="text-2xl font-bold text-white">{daoContract.overview.treasuryBalance}</p>
                    <p className="text-sm text-green-500">{daoContract.overview.treasuryChange}</p>
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
                    <p className="text-sm text-gray-400">Your Voting Power</p>
                    <p className="text-2xl font-bold text-white">{daoContract.votingPower.yourVotingPower}%</p>
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
                    <p className="text-sm text-gray-400">Proposal Success Rate</p>
                    <p className="text-2xl font-bold text-white">{daoContract.governanceMetrics.proposalSuccessRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Voting Power Distribution - Span 2 columns */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white">Voting Power Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Community</span>
                      <span>{daoContract.votingPower.community}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-900 to-red-700"
                        style={{ width: `${daoContract.votingPower.community}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Governors</span>
                      <span>{daoContract.votingPower.governors}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500"
                        style={{ width: `${daoContract.votingPower.governors}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Treasury Activity - Span 2 columns */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white">Recent Treasury Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daoContract.treasuryActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'Inflow' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-white">{activity.type}</span>
                      </div>
                      <div className="text-right">
                        <p className={activity.type === 'Inflow' ? 'text-green-500' : 'text-red-500'}>
                          {activity.amount}
                        </p>
                        <p className="text-sm text-gray-400">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Members List - Span 2 columns */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white">Members</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-red-900 to-red-700"
                      onClick={generateInviteLink}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/90 border-red-900/20 text-white">
                    <DialogHeader>
                      <DialogTitle>Invite New Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-4">
                      <p className="text-gray-400">Share this link to invite a new member:</p>
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
                      <p className="text-sm text-gray-500">Link expires in 24 hours</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daoMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={member.role === 'Governor' ? 'bg-red-900/50' : 'bg-gray-800/50'}>
                          {member.role}
                        </Badge>
                        <span className="text-white font-mono">{member.address}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Joined: {member.joinedDate}</p>
                        <p className="text-white">{member.votingPower} voting power</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Active Proposals with Voting - Full width */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-4">
              <CardHeader>
                <CardTitle className="text-xl text-white">Active Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daoContract.recentProposals.map((proposal, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400">{proposal.id}</span>
                            <h4 className="text-white font-medium">{proposal.title}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status}
                            </Badge>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Timer className="w-4 h-4" />
                              <span>{proposal.timeLeft}</span>
                            </div>
                          </div>
                        </div>
                        {proposal.status === 'active' && !proposal.yourVote && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleVote(proposal.id, 'yes')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              Vote Yes
                            </Button>
                            <Button
                              onClick={() => handleVote(proposal.id, 'no')}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              Vote No
                            </Button>
                          </div>
                        )}
                        {proposal.yourVote && (
                          <Badge className="bg-red-900/50 text-red-200">
                            Your vote: {proposal.yourVote}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-300">
                          <span>Votes</span>
                          <span>Quorum: {proposal.quorum}%</span>
                        </div>
                        <div className="flex gap-2 h-2">
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
                          <span className="text-green-500">{proposal.votes.yes}% Yes</span>
                          <span className="text-red-500">{proposal.votes.no}% No</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Governance Metrics Section */}
          <div className="col-span-full mt-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Governance Metrics</h2>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-red-900/10">
                <div className="flex flex-col gap-3">
                  <h3 className="text-gray-400 text-sm font-medium">Proposal Success Rate</h3>
                  <p className="text-5xl font-bold text-white">{daoContract.governanceMetrics.proposalSuccessRate}</p>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-red-900/10">
                <div className="flex flex-col gap-3">
                  <h3 className="text-gray-400 text-sm font-medium">Average Quorum</h3>
                  <p className="text-5xl font-bold text-white">{daoContract.governanceMetrics.averageQuorum}</p>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-red-900/10">
                <div className="flex flex-col gap-3">
                  <h3 className="text-gray-400 text-sm font-medium">Average Voting Period</h3>
                  <p className="text-5xl font-bold text-white">{daoContract.governanceMetrics.averageVotingPeriod}</p>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-red-900/10">
                <div className="flex flex-col gap-3">
                  <h3 className="text-gray-400 text-sm font-medium">Governor Participation</h3>
                  <p className="text-5xl font-bold text-white">{daoContract.governanceMetrics.governorParticipation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 