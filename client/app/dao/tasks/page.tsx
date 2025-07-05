"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useTaskManager, type TaskInfo } from "@/hooks/useTaskManager";
import {
  TASK_STATUS,
  getTaskStatusLabel,
  getTaskStatusColor,
} from "@/config/contract";

export default function TasksPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const {
    getDAOTasks,
    getUserCreatedTasks,
    assignTask,
    loading,
    formatAPTAmount,
    formatDeadline,
    isTaskExpired,
  } = useTaskManager();
  const [filter, setFilter] = useState("all");
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [daoId] = useState(1); // Default DAO ID - this should be dynamic in a real app

  // Fetch tasks when component mounts or when account changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (connected && account) {
        try {
          const daoTasks = await getDAOTasks(daoId);
          setTasks(daoTasks);
        } catch (error) {
          console.error("Error fetching tasks:", error);
          toast({
            title: "Error Loading Tasks",
            description: "Failed to load tasks from the blockchain.",
            variant: "destructive",
          });
        }
      }
    };

    fetchTasks();
  }, [connected, account?.address, daoId, getDAOTasks]);

  const handleAssignTask = async (taskId: number) => {
    try {
      await assignTask(taskId);
      // Refresh tasks after assignment
      const daoTasks = await getDAOTasks(daoId);
      setTasks(daoTasks);
    } catch (error) {
      console.error("Error assigning task:", error);
      // Error handling is done in the useTaskManager hook
    }
  };

  const filteredTasks = (tasks || []).filter((task) => {
    if (filter === "all") return true;
    if (filter === "my-tasks") return task.assignee === account?.address;
    // Convert status number to string for comparison
    const statusLabel = getTaskStatusLabel(task.state)
      .toLowerCase()
      .replace(" ", "-");
    return statusLabel === filter;
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
                      {
                        (tasks || []).filter(
                          (t) => t.state === TASK_STATUS.OPEN
                        ).length
                      }
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
                    <p className="text-sm text-gray-400">Assigned</p>
                    <p className="text-2xl font-bold text-white">
                      {
                        (tasks || []).filter(
                          (t) => t.state === TASK_STATUS.ASSIGNED
                        ).length
                      }
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
                      {
                        (tasks || []).filter(
                          (t) => t.state === TASK_STATUS.COMPLETED
                        ).length
                      }
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
                        (tasks || []).filter(
                          (t) => t.assignee === account?.address
                        ).length
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
              "assigned",
              "submitted",
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
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-400">
                          TASK-{task.id}
                        </span>
                        <Badge className={getTaskStatusColor(task.state)}>
                          {getTaskStatusLabel(task.state)}
                        </Badge>
                        {isTaskExpired(task.deadline) && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl text-white">
                        {task.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dao/tasks/${task.id}`)}
                      className="text-white hover:bg-white/10"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 line-clamp-3 mb-4">
                    {task.description}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {task.required_skills.map((skill, index) => (
                      <Badge key={index} className="bg-red-900/30 text-red-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        {task.assignee
                          ? `${task.assignee.slice(
                              0,
                              6
                            )}...${task.assignee.slice(-4)}`
                          : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due {formatDeadline(task.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        Creator: {task.creator.slice(0, 6)}...
                        {task.creator.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{formatAPTAmount(task.bounty_amount)} APT</span>
                    </div>
                  </div>

                  {task.state === TASK_STATUS.SUBMITTED && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Validation Status
                      </h4>
                      <div className="space-y-2">
                        {task.validators.map((validator, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-300"
                          >
                            <User className="w-4 h-4" />
                            <span>
                              {validator.slice(0, 6)}...{validator.slice(-4)}
                            </span>
                            {task.validation_results[validator] !==
                              undefined && (
                              <Badge
                                className={
                                  task.validation_results[validator]
                                    ? "bg-green-900/30 text-green-200"
                                    : "bg-red-900/30 text-red-200"
                                }
                              >
                                {task.validation_results[validator]
                                  ? "Approved"
                                  : "Rejected"}
                              </Badge>
                            )}
                          </div>
                        ))}
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
