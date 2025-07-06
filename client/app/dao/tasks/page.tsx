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
      if (!connected || !account) return;
      
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
    };

    fetchTasks();
  }, [account?.address, daoId, getDAOTasks, connected]);

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

  const renderTaskStatus = (task: TaskInfo) => {
    const statusLabel = getTaskStatusLabel(task.state);
    const statusColor = getTaskStatusColor(task.state);

    let additionalInfo = "";
    if (task.state === TASK_STATUS.SUBMITTED) {
      additionalInfo = ` (${task.positive_validations}/${task.required_validations} validations)`;
    }

    return (
      <Badge
        variant="outline"
        className={`${statusColor} capitalize`}
      >
        {statusLabel}{additionalInfo}
      </Badge>
    );
  };

  const renderAssignee = (task: TaskInfo) => {
    if (!task.assignee) {
      return <span className="text-red-200">Unassigned</span>;
    }

    // Handle assignee format from contract
    const assigneeAddress = task.assignee;
    return (
      <span className="font-mono text-red-100">
        {assigneeAddress.slice(0, 6)}...{assigneeAddress.slice(-4)}
      </span>
    );
  };

  const renderValidators = (task: TaskInfo) => {
    if (!task.validators || task.validators.length === 0) {
      return <span className="text-red-200">No validators yet</span>;
    }

    return (
      <div className="space-y-1">
        {task.validators.map((validator, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-red-300" />
            <span className="font-mono text-red-100">
              {validator.slice(0, 6)}...{validator.slice(-4)}
            </span>
            {task.validation_results[validator] !== undefined && (
              <Badge
                variant="outline"
                className={task.validation_results[validator] ? "text-green-400" : "text-red-400"}
              >
                {task.validation_results[validator] ? "Approved" : "Rejected"}
              </Badge>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    if (filter === "my-tasks") {
      return task.user_is_creator || task.user_is_assignee || task.user_is_validator;
    }
    if (filter === "open") return task.state === TASK_STATUS.OPEN;
    if (filter === "assigned") return task.state === TASK_STATUS.ASSIGNED;
    if (filter === "submitted") return task.state === TASK_STATUS.SUBMITTED;
    if (filter === "completed") return task.state === TASK_STATUS.COMPLETED;
    return true;
  });

  if (!connected) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={["#1a0000", "#000000", "#1a0000"]}
            amplitude={1.2}
            speed={0.3}
            blend={0.8}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-red-50 mb-4">
                Connect Your Wallet
              </CardTitle>
              <p className="text-red-200">
                Please connect your wallet to access tasks and start contributing to the DAO.
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
          colorStops={["#1a0000", "#000000", "#1a0000"]}
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
                className="text-red-100 hover:bg-red-950/60 hover:text-red-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-red-50">
                  Task Board
                </h1>
                <p className="text-red-200">
                  Contribute to the DAO by completing tasks and earn rewards
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dao/tasks/create")}
              className="bg-red-950 hover:bg-red-900 text-red-50 border border-red-800/50 shadow-lg shadow-red-900/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </InViewMotion>

        {/* Task Stats */}
        <InViewMotion>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl transform hover:scale-105 transition-transform duration-300 shadow-xl shadow-red-900/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-950">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-red-200">Open Tasks</p>
                    <p className="text-2xl font-bold text-red-50">
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

            <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl transform hover:scale-105 transition-transform duration-300 shadow-xl shadow-red-900/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-950">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-red-200">Assigned</p>
                    <p className="text-2xl font-bold text-red-50">
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

            <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl transform hover:scale-105 transition-transform duration-300 shadow-xl shadow-red-900/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-950">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-red-200">Completed</p>
                    <p className="text-2xl font-bold text-red-50">
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

            <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl transform hover:scale-105 transition-transform duration-300 shadow-xl shadow-red-900/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-950">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-red-200">My Tasks</p>
                    <p className="text-2xl font-bold text-red-50">
                      {
                        (tasks || []).filter((t) => {
                          const taskAssignee = t.assignee ? t.assignee.toString() : null;
                          const userAddress = account?.address ? account.address.toString() : null;
                          return taskAssignee === userAddress;
                        }).length
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
          <div className="flex flex-wrap gap-4 mb-6">
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
                className={`
                  ${filter === status
                    ? "bg-red-950/60 border-red-800 text-red-50 shadow-lg shadow-red-900/20"
                    : "border-red-900/40 text-red-200 hover:bg-red-950/60 hover:text-red-50 bg-red-950 hover:border-red-800"}
                  transition-all duration-300 hover:scale-105
                `}
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
        <div className="grid grid-cols-1 gap-6">
          {filteredTasks.map((task) => (
            <InViewMotion key={task.id}>
              <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl shadow-xl shadow-red-900/10">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-red-50 mb-2">
                          {task.title}
                        </h3>
                        <p className="text-red-200 line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {renderTaskStatus(task)}
                        <Badge
                          variant="outline"
                          className="text-yellow-400"
                        >
                          {formatAPTAmount(task.bounty_amount)} APT
                        </Badge>
                        <Badge
                          variant="outline"
                          className={isTaskExpired(task.deadline) ? "text-red-400" : "text-green-400"}
                        >
                          Due {formatDeadline(task.deadline)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-red-200">
                          <User className="w-4 h-4" />
                          <span>Assignee:</span>
                          {renderAssignee(task)}
                        </div>
                        {task.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {task.required_skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-blue-400"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {task.state === TASK_STATUS.SUBMITTED && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-red-100">Validators</h4>
                          {renderValidators(task)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        onClick={() => router.push(`/dao/tasks/${task.id}`)}
                        className="bg-red-950 hover:bg-red-900 text-red-50 border border-red-800/50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>

                      {task.state === TASK_STATUS.OPEN && !task.user_is_creator && (
                        <Button
                          onClick={() => handleAssignTask(task.id)}
                          disabled={loading}
                          className="bg-green-950 hover:bg-green-900 text-green-50 border border-green-800/50"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Take Task
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <InViewMotion>
            <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl shadow-xl shadow-red-900/10">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-50 mb-2">
                  No tasks found
                </h3>
                <p className="text-red-200">
                  {filter === "all"
                    ? "No tasks have been created yet. Be the first to create a task!"
                    : `No ${filter.replace("-", " ")} tasks found.`}
                </p>
                <Button
                  onClick={() => router.push("/dao/tasks/create")}
                  className="mt-6 bg-red-950 hover:bg-red-900 text-red-50 border border-red-800/50 shadow-lg shadow-red-900/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          </InViewMotion>
        )}
      </div>
    </div>
  );
}
