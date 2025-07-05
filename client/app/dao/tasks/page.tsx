"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InViewMotion from "@/components/InViewMotion";
import { Aurora } from "@/components/aurora";
import {
  Target,
  Plus,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

// Mock tasks data
const tasks = [
  {
    id: "TASK-101",
    title: "Update Documentation",
    description:
      "Update the DAO governance documentation with latest changes and procedures.",
    status: "in-progress",
    priority: "high",
    assignee: "0x8e46...74ac",
    reward: "500 APT",
    deadline: "2024-03-20",
    createdAt: "2024-03-15",
    category: "Documentation",
    estimatedHours: 8,
  },
  {
    id: "TASK-102",
    title: "Community Event Planning",
    description: "Plan and organize the quarterly community meetup event.",
    status: "open",
    priority: "medium",
    assignee: null,
    reward: "1000 APT",
    deadline: "2024-03-25",
    createdAt: "2024-03-14",
    category: "Community",
    estimatedHours: 20,
  },
  {
    id: "TASK-103",
    title: "Smart Contract Audit",
    description:
      "Conduct security audit of the new treasury management smart contract.",
    status: "completed",
    priority: "high",
    assignee: "0x7d32...91bc",
    reward: "2000 APT",
    deadline: "2024-03-18",
    createdAt: "2024-03-10",
    category: "Technical",
    estimatedHours: 40,
  },
  {
    id: "TASK-104",
    title: "Design New Logo",
    description:
      "Create a new logo design for the DAO brand refresh initiative.",
    status: "review",
    priority: "low",
    assignee: "0x9f23...45de",
    reward: "750 APT",
    deadline: "2024-03-22",
    createdAt: "2024-03-12",
    category: "Design",
    estimatedHours: 15,
  },
];

export default function TasksPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-500/10 text-blue-500";
      case "in-progress":
        return "bg-yellow-500/10 text-yellow-500";
      case "review":
        return "bg-purple-500/10 text-purple-500";
      case "completed":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-500";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500";
      case "low":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "technical":
        return "bg-purple-500/10 text-purple-500";
      case "community":
        return "bg-blue-500/10 text-blue-500";
      case "documentation":
        return "bg-green-500/10 text-green-500";
      case "design":
        return "bg-pink-500/10 text-pink-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const handleAssignTask = (taskId: string) => {
    toast({
      title: "Task Assigned",
      description: `You have been assigned to task ${taskId}`,
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "my-tasks") return task.assignee === account?.address;
    return task.status === filter;
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
                Please connect your wallet to access tasks.
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
                  Tasks
                </h1>
                <p className="text-gray-400">
                  Manage and complete DAO tasks to earn rewards
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dao/tasks/create")}
              className="bg-gradient-to-r from-red-900 to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </InViewMotion>

        {/* Task Stats */}
        <InViewMotion>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-900/50">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Open Tasks</p>
                    <p className="text-2xl font-bold text-white">
                      {tasks.filter((t) => t.status === "open").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-900/50">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-white">
                      {tasks.filter((t) => t.status === "in-progress").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-900/50">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-white">
                      {tasks.filter((t) => t.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-900/50">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">My Tasks</p>
                    <p className="text-2xl font-bold text-white">
                      {
                        tasks.filter((t) => t.assignee === account?.address)
                          .length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </InViewMotion>

        {/* Filters */}
        <InViewMotion>
          <div className="flex gap-4 mb-6">
            {[
              "all",
              "open",
              "in-progress",
              "review",
              "completed",
              "my-tasks",
            ].map((status) => (
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
                {status === "my-tasks"
                  ? "My Tasks"
                  : status.charAt(0).toUpperCase() +
                    status.slice(1).replace("-", " ")}
              </Button>
            ))}
          </div>
        </InViewMotion>

        {/* Tasks List */}
        <div className="space-y-6">
          {filteredTasks.map((task, index) => (
            <InViewMotion key={task.id}>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-400 text-sm">{task.id}</span>
                        <Badge className={getCategoryColor(task.category)}>
                          {task.category}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace("-", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} priority
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-300 mb-4">{task.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {task.assignee ? task.assignee : "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due {task.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{task.estimatedHours}h estimated</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{task.reward} reward</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/dao/tasks/${task.id}`)}
                        variant="outline"
                        size="sm"
                        className="border-red-900/20 text-white hover:bg-red-900/20"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {task.status === "open" && !task.assignee && (
                        <Button
                          onClick={() => handleAssignTask(task.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          Assign to Me
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for in-progress tasks */}
                  {task.status === "in-progress" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Progress</span>
                        <span>65%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-900 to-red-700 w-[65%]" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </InViewMotion>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <InViewMotion>
            <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-400">
                  {filter === "all"
                    ? "No tasks have been created yet."
                    : `No ${filter.replace("-", " ")} tasks found.`}
                </p>
              </CardContent>
            </Card>
          </InViewMotion>
        )}
      </div>
    </div>
  );
}
