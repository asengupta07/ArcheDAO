"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";

// Mock DAO data
const daoData = {
  name: "TechDAO",
  overview: {
    totalMembers: 1250,
    treasuryBalance: "125,000 APT",
    activeProposals: 3,
    completedTasks: 47,
    yourVotingPower: 15,
    membershipTier: "Governor",
  },
  recentActivity: [
    {
      type: "Proposal",
      title: "Implement Layer 2 Scaling",
      status: "active",
      time: "2 hours ago",
    },
    {
      type: "Task",
      title: "Update Documentation",
      status: "completed",
      time: "1 day ago",
    },
    {
      type: "Vote",
      title: "Treasury Diversification",
      status: "pending",
      time: "2 days ago",
    },
    {
      type: "Member",
      title: "New member joined",
      status: "info",
      time: "3 days ago",
    },
  ],
  quickActions: [
    {
      title: "View Proposals",
      description: "Review and vote on active proposals",
      icon: Vote,
      href: "/dao/proposals",
    },
    {
      title: "Task Management",
      description: "Create and manage DAO tasks",
      icon: Target,
      href: "/dao/tasks",
    },
    {
      title: "Governor Panel",
      description: "Advanced governance controls",
      icon: Users,
      href: "/dao/governor",
    },
  ],
};

export default function DashboardPage() {
  const { account, connected } = useWallet();
  const router = useRouter();

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
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back to {daoData.name}
            </h1>
            <p className="text-gray-400">
              Your role:{" "}
              <Badge className="bg-red-900/50 text-red-200">
                {daoData.overview.membershipTier}
              </Badge>
            </p>
          </div>
        </InViewMotion>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Key Metrics */}
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
                      {daoData.overview.totalMembers}
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
                      {daoData.overview.treasuryBalance}
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
                    <p className="text-sm text-gray-400">Active Proposals</p>
                    <p className="text-2xl font-bold text-white">
                      {daoData.overview.activeProposals}
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
                    <p className="text-sm text-gray-400">Completed Tasks</p>
                    <p className="text-2xl font-bold text-white">
                      {daoData.overview.completedTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Quick Actions */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daoData.quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => router.push(action.href)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-white font-medium">
                              {action.title}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Recent Activity */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daoData.recentActivity.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-white font-medium">
                              {activity.title}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </InViewMotion>

          {/* Your Voting Power */}
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl md:col-span-4">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Your Governance Power
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <p className="text-white font-medium">Voting Power</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {daoData.overview.yourVotingPower}%
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      <p className="text-white font-medium">Proposals Voted</p>
                    </div>
                    <p className="text-2xl font-bold text-white">12</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <PieChart className="w-5 h-5 text-green-500" />
                      <p className="text-white font-medium">
                        Participation Rate
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">89%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </InViewMotion>
        </div>
      </div>
    </div>
  );
}
