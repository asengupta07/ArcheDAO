"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import InViewMotion from "@/components/InViewMotion";
import { Aurora } from "@/components/aurora";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Target,
  Coins,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Upload,
  Edit,
  Trash2,
  Play,
  Pause,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useTaskManager } from "@/hooks/useTaskManager";
import {
  TASK_STATUS,
  getTaskStatusLabel,
  getTaskStatusColor,
} from "@/config/contract";
import { Input } from "@/components/ui/input";

interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

interface TaskInfo {
  id: number;
  dao_id: number;
  title: string;
  description: string;
  creator: string;
  assignee: string | null;
  bounty_amount: number;
  required_skills: string[];
  deadline: number;
  state: number;
  submission_hash: string | null;
  validators: string[];
  validation_results: Record<string, boolean>;
  completion_proof: string | null;
  created_at: number;
  user_is_creator: boolean;
  user_is_assignee: boolean;
  user_is_validator: boolean;
  // UI fields with optional types since they may not come from API
  requirements?: string;
  deliverables?: string;
  status?: string;
  progress?: number;
  comments?: Comment[];
  createdBy?: string;
  estimatedHours?: number;
  reward?: string;
  category?: string;
}

interface SubmissionData {
  submission_hash: string;
  completion_proof: string;
}

// Add a type for the API response
interface TaskApiResponse {
  id: number;
  dao_id: number;
  title: string;
  description: string;
  creator: string;
  assignee: string | null;
  bounty_amount: number;
  required_skills: string[];
  deadline: number;
  state: number;
  submission_hash: string | null;
  validators: string[];
  validation_results: Record<string, boolean>;
  completion_proof: string | null;
  created_at: number;
  user_is_creator: boolean;
  user_is_assignee: boolean;
  user_is_validator: boolean;
}

// Add a function to handle undefined UI fields
const getUIValue = (
  value: string | number | undefined,
  defaultValue: string | number = ""
): string | number => {
  return value !== undefined ? value : defaultValue;
};

// Add a function to transform API data to UI data
const transformTaskData = (taskData: TaskApiResponse): TaskInfo => ({
  ...taskData,
  // Initialize UI fields with defaults
  requirements: taskData.description, // Using description as requirements for now
  deliverables: "", // Empty string default
  status: getTaskStatus(taskData.state), // You'll need to implement this function
  progress: 0,
  comments: [],
  createdBy: taskData.creator,
  estimatedHours: 0,
  reward: `${taskData.bounty_amount} APT`,
  category: "Default",
});

// Add a helper function to convert state to status
const getTaskStatus = (state: number): string => {
  const states = ["open", "assigned", "submitted", "completed", "cancelled"];
  return states[state] || "unknown";
};

export default function TaskDetailPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const {
    getTask,
    assignTask,
    submitTask,
    validateTask,
    distributeBounty,
    loading,
    formatAPTAmount,
    formatDeadline,
    isTaskExpired,
  } = useTaskManager();

  const [newComment, setNewComment] = useState("");
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [submissionData, setSubmissionData] = useState({
    submission_hash: "",
    completion_proof: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch task data when component mounts
  useEffect(() => {
    const fetchTask = async () => {
      if (connected && account && taskId) {
        try {
          const taskData = await getTask(parseInt(taskId));
          if (taskData) {
            setTask(transformTaskData(taskData));
          }
        } catch (error) {
          console.error("Error fetching task:", error);
          toast({
            title: "Error Loading Task",
            description: "Failed to load task details from the blockchain.",
            variant: "destructive",
          });
        }
      }
    };

    fetchTask();
  }, [connected, account?.address, taskId, getTask]);

  const handleAssignTask = async () => {
    if (!task) return;
    try {
      setIsLoading(true);
      await assignTask(task.id);
      const updatedTask = await getTask(task.id);
      if (updatedTask) {
        setTask(transformTaskData(updatedTask));
      }
      toast({
        title: "Task Assigned",
        description: "You have successfully been assigned to this task.",
      });
    } catch (error) {
      console.error("Error assigning task:", error);
      toast({
        title: "Error Assigning Task",
        description:
          error instanceof Error ? error.message : "Failed to assign task.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTask = async () => {
    if (
      !task ||
      !submissionData.submission_hash ||
      !submissionData.completion_proof
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please provide both submission hash and completion proof.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await submitTask(
        task.id,
        submissionData.submission_hash,
        submissionData.completion_proof
      );
      const updatedTask = await getTask(task.id);
      if (updatedTask) {
        setTask(transformTaskData(updatedTask));
      }
      setSubmissionData({ submission_hash: "", completion_proof: "" });
      toast({
        title: "Task Submitted",
        description: "Your work has been submitted for validation.",
      });
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error Submitting Task",
        description:
          error instanceof Error ? error.message : "Failed to submit task.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateTask = async (isValid: boolean) => {
    if (!task) return;
    try {
      setIsLoading(true);
      await validateTask(task.id, isValid);
      const updatedTask = await getTask(task.id);
      if (updatedTask) {
        setTask(transformTaskData(updatedTask));
      }
      toast({
        title: isValid ? "Task Approved" : "Task Rejected",
        description: isValid
          ? "The task submission has been approved."
          : "The task submission has been rejected.",
      });
    } catch (error) {
      console.error("Error validating task:", error);
      toast({
        title: "Error Validating Task",
        description:
          error instanceof Error ? error.message : "Failed to validate task.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeBounty = async () => {
    if (!task) return;
    try {
      setIsLoading(true);
      await distributeBounty(task.id);
      const updatedTask = await getTask(task.id);
      if (updatedTask) {
        setTask(transformTaskData(updatedTask));
      }
      toast({
        title: "Bounty Distributed",
        description: "The task bounty has been distributed to the assignee.",
      });
    } catch (error) {
      console.error("Error distributing bounty:", error);
      toast({
        title: "Error Distributing Bounty",
        description:
          error instanceof Error
            ? error.message
            : "Failed to distribute bounty.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // TODO: Implement status change logic
    console.log("Status change not implemented:", newStatus);
  };

  const handleAddComment = async () => {
    // TODO: Implement comment addition logic
    console.log("Add comment not implemented");
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
                Please connect your wallet to view task details.
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!task) {
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
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading Task...
                  </>
                ) : (
                  "Task Not Found"
                )}
              </CardTitle>
              <p className="text-gray-300">
                {loading
                  ? "Fetching task details from the blockchain..."
                  : "The requested task could not be found."}
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
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dao/tasks")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-gray-400 text-sm">TASK-{task.id}</span>
                <Badge className={getTaskStatusColor(task.state)}>
                  {getTaskStatusLabel(task.state)}
                </Badge>
                {isTaskExpired(task.deadline) && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Expired
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {task.title}
              </h1>
            </div>
            {task.state === TASK_STATUS.OPEN && !task.assignee && (
              <Button
                onClick={handleAssignTask}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                Assign to Me
              </Button>
            )}
          </div>
        </InViewMotion>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(task.required_skills || []).map(
                (skill: string, index: number) => (
                  <Badge key={index} className="bg-red-900/30 text-red-200">
                    {skill}
                  </Badge>
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Validators
            </h3>
            <div className="space-y-2">
              {(task.validators || []).length > 0 ? (
                (task.validators || []).map(
                  (validator: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-gray-300"
                    >
                      <User className="w-4 h-4" />
                      <span>
                        {validator.slice(0, 6)}...{validator.slice(-4)}
                      </span>
                      {task.validation_results &&
                        task.validation_results[validator] !== undefined && (
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
                  )
                )
              ) : (
                <p className="text-gray-400">No validators assigned</p>
              )}
            </div>
          </div>
        </div>

        {task.state === TASK_STATUS.SUBMITTED && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Submission Details
            </h3>
            <div className="space-y-4 bg-white/5 rounded-lg p-4">
              {task.submission_hash && (
                <div>
                  <label className="text-sm text-gray-400">
                    Submission Hash
                  </label>
                  <div className="font-mono text-white break-all">
                    {task.submission_hash}
                  </div>
                </div>
              )}
              {task.completion_proof && (
                <div>
                  <label className="text-sm text-gray-400">
                    Completion Proof
                  </label>
                  <div className="text-white whitespace-pre-wrap">
                    {task.completion_proof}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add validation buttons for validators */}
        {task.state === TASK_STATUS.SUBMITTED && task.user_is_validator && (
          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => handleValidateTask(true)}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve Submission
            </Button>
            <Button
              onClick={() => handleValidateTask(false)}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Reject Submission
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Description */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {task.description}
                  </p>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Requirements */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    {getUIValue(task.requirements)}
                  </p>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Deliverables */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Deliverables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                    {getUIValue(task.deliverables)}
                  </pre>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Progress (if in progress) */}
            {task.status === "in-progress" && (
              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Completion</span>
                        <span>{getUIValue(task.progress, 0)}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-900 to-red-700 transition-all duration-300"
                          style={{ width: `${getUIValue(task.progress, 0)}%` }}
                        />
                      </div>
                      {task.assignee && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStatusChange("review")}
                            className="bg-purple-600 hover:bg-purple-700"
                            size="sm"
                          >
                            Submit for Review
                          </Button>
                          <Button
                            onClick={() => handleStatusChange("completed")}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>
            )}

            {/* Comments */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    <MessageSquare className="w-5 h-5 inline mr-2" />
                    Comments ({task.comments?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {task.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-medium font-mono">
                            {comment.author}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.content}</p>
                      </div>
                    ))}

                    {/* Add Comment */}
                    <div className="border-t border-white/10 pt-4">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="bg-white/5 border-red-900/20 text-white mb-3"
                        rows={3}
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="bg-gradient-to-r from-red-900 to-red-700"
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Task Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Assignee</p>
                      <p className="text-white font-mono">
                        {task.assignee || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Created by</p>
                      <p className="text-white font-mono">
                        {getUIValue(task.createdBy)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Deadline</p>
                      <p className="text-white">{task.deadline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Estimated Hours</p>
                      <p className="text-white">
                        {getUIValue(task.estimatedHours)}h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Reward</p>
                      <p className="text-white">{getUIValue(task.reward)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Category</p>
                      <p className="text-white">{getUIValue(task.category)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Actions */}
            {task.assignee && (
              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-900/20 text-white hover:bg-red-900/20"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Task
                    </Button>
                  </CardContent>
                </Card>
              </InViewMotion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
