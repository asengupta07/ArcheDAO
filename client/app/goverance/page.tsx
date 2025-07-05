'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

// Hardcoded data for active governances/DAOs
const governanceData = [
  {
    id: 1,
    name: 'TechDAO',
    description: 'Advancing blockchain technology and development',
    activeProposals: 3,
    totalMembers: 1250,
    treasuryBalance: '125,000 APT',
    votingPower: {
      community: 60,
      governors: 40
    },
    recentActivity: 'High',
    status: 'active',
    proposals: [
      {
        title: 'Implement Layer 2 Scaling',
        status: 'active',
        votes: { yes: 75, no: 25 },
        timeLeft: '2 days'
      }
    ]
  },
  {
    id: 2,
    name: 'ArtistsDAO',
    description: 'Supporting digital artists and NFT creators',
    activeProposals: 2,
    totalMembers: 850,
    treasuryBalance: '75,000 APT',
    votingPower: {
      community: 70,
      governors: 30
    },
    recentActivity: 'Medium',
    status: 'active',
    proposals: [
      {
        title: 'NFT Marketplace Launch',
        status: 'pending',
        votes: { yes: 60, no: 40 },
        timeLeft: '5 days'
      }
    ]
  },
  {
    id: 3,
    name: 'GreenDAO',
    description: 'Promoting sustainable blockchain initiatives',
    activeProposals: 1,
    totalMembers: 2000,
    treasuryBalance: '250,000 APT',
    votingPower: {
      community: 50,
      governors: 50
    },
    recentActivity: 'Low',
    status: 'active',
    proposals: [
      {
        title: 'Carbon Offset Program',
        status: 'completed',
        votes: { yes: 90, no: 10 },
        timeLeft: '0 days'
      }
    ]
  },
  {
    id: 4,
    name: 'GamersDAO',
    description: 'Building the future of blockchain gaming',
    activeProposals: 4,
    totalMembers: 1500,
    treasuryBalance: '180,000 APT',
    votingPower: {
      community: 65,
      governors: 35
    },
    recentActivity: 'High',
    status: 'active',
    proposals: [
      {
        title: 'Gaming Tournament Platform',
        status: 'active',
        votes: { yes: 80, no: 20 },
        timeLeft: '3 days'
      }
    ]
  }
];

export default function GovernancePage() {
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

  const getActivityIcon = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'high':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Activity className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0">
        <Aurora 
          colorStops={["#8B0000", "#660000", "#8B0000"]} 
          amplitude={1.2}
          speed={0.3}
          blend={0.8}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Active Governance Portals
          </h1>
          <p className="text-xl text-red-100/80 max-w-3xl mx-auto">
            Explore and participate in various DAO governance activities across the ecosystem
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Crown, label: 'Total DAOs', value: '4' },
            { icon: Users, label: 'Total Members', value: '5,600' },
            { icon: Vote, label: 'Active Proposals', value: '10' },
            { icon: Coins, label: 'Total Treasury', value: '630,000 APT' },
          ].map((stat, index) => (
            <InViewMotion key={index}>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-900 to-red-700">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>
          ))}
        </div>

        {/* Governance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {governanceData.map((dao) => (
            <InViewMotion key={dao.id}>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <CardTitle className="text-2xl text-white mb-2">{dao.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {dao.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(dao.status)}>
                      {dao.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Members</span>
                      </div>
                      <p className="text-xl font-semibold text-white">{dao.totalMembers}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Treasury</span>
                      </div>
                      <p className="text-xl font-semibold text-white">{dao.treasuryBalance}</p>
                    </div>
                  </div>

                  {/* Voting Power Distribution */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Community Power</span>
                      <span>{dao.votingPower.community}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-900 to-red-700"
                        style={{ width: `${dao.votingPower.community}%` }}
                      />
                    </div>
                  </div>

                  {/* Latest Proposal */}
                  {dao.proposals[0] && (
                    <div className="border border-red-400/20 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-medium">{dao.proposals[0].title}</h4>
                        <Badge className={getStatusColor(dao.proposals[0].status)}>
                          {dao.proposals[0].status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{dao.proposals[0].timeLeft}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-green-500">{dao.proposals[0].votes.yes}% Yes</span>
                          <span className="text-red-500">{dao.proposals[0].votes.no}% No</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </InViewMotion>
          ))}
        </div>
      </div>
    </div>
  );
}
