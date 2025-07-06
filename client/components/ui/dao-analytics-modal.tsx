"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  AreaChart as RAreaChart,
  Area,
  Legend,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Activity, BarChart3, CheckCircle, TrendingUp, Users, Vote } from "lucide-react"

interface DAOAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
}

const customColors = {
  background: "rgb(0, 0, 0)",
  text: "rgb(255, 255, 255)",
  border: "rgba(255, 255, 255, 0.1)",
  red: {
    primary: "#ef4444",
    secondary: "rgba(239, 68, 68, 0.5)",
    light: "#fca5a5",
  },
  blue: {
    primary: "#3b82f6",
    secondary: "rgba(59, 130, 246, 0.5)",
    light: "#93c5fd",
  },
  green: {
    primary: "#22c55e",
    secondary: "rgba(34, 197, 94, 0.5)",
    light: "#86efac",
  },
  yellow: {
    primary: "#eab308",
    secondary: "rgba(234, 179, 8, 0.5)",
    light: "#fde047",
  },
  purple: {
    primary: "#a855f7",
    secondary: "rgba(168, 85, 247, 0.5)",
    light: "#c4b5fd",
  },
  gray: {
    primary: "#6b7280",
    secondary: "rgba(107, 114, 128, 0.5)",
    light: "#d1d5db",
  },
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 border border-red-500/30 rounded-lg p-3 shadow-lg backdrop-blur-sm">
        {label && <p className="text-white font-medium mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DAOAnalyticsModal({ isOpen, onClose }: DAOAnalyticsModalProps) {
  const { account } = useWallet()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  const fetchAnalytics = async () => {
    if (!account) return

    try {
      setLoading(true)
      const address = account.address.toString()
      console.log("Fetching analytics for address:", address)

      const response = await fetch("/api/dao-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: address,
        }),
      })

      console.log("Analytics API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Analytics API error:", errorText)
        throw new Error("Failed to fetch analytics")
      }

      const data = await response.json()
      console.log("Analytics API response data:", data)

      if (!data.success) {
        throw new Error(data.error || "Failed to generate analytics")
      }

      setAnalysis(data.data.analysis)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to generate DAO analytics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch analytics when modal opens
  useEffect(() => {
    if (isOpen && account) {
      setAnalysis(null) // Reset previous analysis
      fetchAnalytics()
    }
  }, [isOpen, account])

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20"
    if (score >= 60) return "bg-yellow-500/20"
    return "bg-red-500/20"
  }

  // Format data for charts to ensure unique keys
  const formatChartData = (data: any) => {
    if (!data) return []
    return data.map((item: any, index: number) => ({
      ...item,
      id: `${item.name}-${index}`, // Add unique id
    }))
  }

  // Prepare voting patterns data
  const votingPatternsData = [
    {
      id: "votes-cast",
      name: "Votes Cast",
      value: analysis?.trends?.votingPatterns?.totalVotes || 0,
    },
    {
      id: "participation",
      name: "Participation",
      value: analysis?.trends?.votingPatterns?.averageParticipation || 0,
    },
  ]

  // Chart colors array for consistent coloring
  const chartColors = [
    customColors.red.primary,
    customColors.blue.primary,
    customColors.green.primary,
    customColors.yellow.primary,
    customColors.purple.primary,
    customColors.gray.primary,
  ]

  // Prepare proposal categories data with fallback
  let proposalData = analysis?.trends?.proposalActivity?.categories
    ? formatChartData(analysis.trends.proposalActivity.categories)
    : []

  if (proposalData.length === 0 && analysis?.trends?.proposalActivity) {
    proposalData = formatChartData([
      {
        name: "Proposals",
        count: analysis.trends.proposalActivity.total || 0,
      },
    ])
  }

  // Prepare task categories data with fallback
  let taskData = analysis?.trends?.taskCompletion?.categories
    ? formatChartData(analysis.trends.taskCompletion.categories)
    : []

  if (taskData.length === 0 && analysis?.trends?.taskCompletion) {
    taskData = formatChartData([
      {
        name: "Tasks",
        count: analysis.trends.taskCompletion.total || 0,
      },
    ])
  }

  if (!analysis) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black/95 border-red-500/20 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-500" />
              {loading ? "Generating DAO Analytics..." : "Preparing Analysis"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-red-500/30 border-t-red-500 rounded-full"></div>
            {loading && <div className="text-gray-400 text-sm animate-pulse">Analyzing your DAO ecosystem data...</div>}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-red-500/20 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" />
            DAO Ecosystem Analytics
          </DialogTitle>
        </DialogHeader>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/5 border-red-400/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Overview</CardTitle>
              <CardDescription className="text-gray-300">{analysis.overview.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total DAOs</p>
                    <p className="text-xl font-bold text-white">{analysis.overview.totalDaos}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Vote className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Voting Power</p>
                    <p className="text-xl font-bold text-white">{analysis.overview.totalVotingPower}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Activity className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Governance Score</p>
                    <p className={`text-xl font-bold ${getHealthColor(analysis.overview.governanceScore)}`}>
                      {analysis.overview.governanceScore}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Participation</p>
                    <p className={`text-xl font-bold ${getHealthColor(analysis.overview.participationRate)}`}>
                      {analysis.overview.participationRate}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-red-400/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Voting Patterns</CardTitle>
            </CardHeader>
            <CardContent className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={votingPatternsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={1}
                  >
                    {votingPatternsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <RTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: "#ffffff" }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trends Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/5 border-red-400/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Proposal Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={proposalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="proposalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={customColors.red.primary} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={customColors.red.primary} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#ffffff"
                      tick={{ fill: "#ffffff", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      stroke="#ffffff"
                      tick={{ fill: "#ffffff", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <RTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="url(#proposalGradient)"
                      radius={[4, 4, 0, 0]}
                      stroke={customColors.red.primary}
                      strokeWidth={1}
                    />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-xl font-bold text-green-400">
                    {analysis?.trends?.proposalActivity?.successRate || 0}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-gray-400">Your Proposals</p>
                  <p className="text-xl font-bold text-blue-400">{analysis?.trends?.proposalActivity?.byUser || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-red-400/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RAreaChart data={taskData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={customColors.red.primary} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={customColors.red.primary} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#ffffff"
                      tick={{ fill: "#ffffff", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      stroke="#ffffff"
                      tick={{ fill: "#ffffff", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <RTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={customColors.red.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTasks)"
                      dot={{ fill: customColors.red.primary, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: customColors.red.primary, strokeWidth: 2 }}
                    />
                  </RAreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-xl font-bold text-green-400">
                    {analysis?.trends?.taskCompletion?.completionRate || 0}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-gray-400">Your Tasks</p>
                  <p className="text-xl font-bold text-blue-400">{analysis?.trends?.taskCompletion?.byUser || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DAO-Specific Metrics */}
        <Card className="bg-white/5 border-red-400/20 mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-white">DAO-Specific Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.daoSpecificMetrics.map((dao: any, index: number) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-red-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{dao.name}</h3>
                      <Badge
                        className={`mt-1 ${
                          dao.userRole === "Creator"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : dao.userRole === "Governor"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {dao.userRole}
                      </Badge>
                    </div>
                    <div
                      className={`text-lg font-bold px-3 py-1 rounded-lg ${getHealthBgColor(dao.healthScore)} ${getHealthColor(dao.healthScore)}`}
                    >
                      {dao.healthScore}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-sm text-gray-400">Members</p>
                      <p className="text-white font-semibold">{dao.memberCount}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-sm text-gray-400">Treasury</p>
                      <p className="text-white font-semibold">{dao.treasuryBalance}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-sm text-gray-400">Proposals</p>
                      <p className="text-white font-semibold">{dao.proposalCount}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-sm text-gray-400">Tasks</p>
                      <p className="text-white font-semibold">{dao.taskCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-white/5 border-red-400/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <h4 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Vote className="w-4 h-4 text-purple-400" />
                  Governance
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.governance.map((rec: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-white">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Participation
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.participation.map((rec: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-white">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Growth
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.growth.map((rec: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-white">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
