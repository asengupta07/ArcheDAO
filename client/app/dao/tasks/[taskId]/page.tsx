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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  required_validations: number;
  total_validations: number;
  positive_validations: number;
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
  required_validations: number;
  total_validations: number;
  positive_validations: number;
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
  // Only keep contract-specific fields
  id: taskData.id,
  dao_id: taskData.dao_id,
  title: taskData.title,
  description: taskData.description,
  creator: taskData.creator,
  assignee: taskData.assignee,
  bounty_amount: taskData.bounty_amount,
  required_skills: taskData.required_skills,
  deadline: taskData.deadline,
  state: taskData.state,
  submission_hash: taskData.submission_hash,
  validators: taskData.validators,
  validation_results: taskData.validation_results,
  completion_proof: taskData.completion_proof,
  created_at: taskData.created_at,
  user_is_creator: taskData.user_is_creator,
  user_is_assignee: taskData.user_is_assignee,
  user_is_validator: taskData.user_is_validator,
  required_validations: taskData.required_validations,
  total_validations: taskData.total_validations,
  positive_validations: taskData.positive_validations,
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);

  // Fetch task data when component mounts
  useEffect(() => {
    const fetchTask = async () => {
      if (!connected || !account || !taskId) return;

      try {
        setIsLoading(true);
        setError(null);
        const taskData = await getTask(parseInt(taskId));
        if (taskData) {
          setTask(transformTaskData(taskData));
        } else {
          setError("Task not found");
          toast({
            title: "Task Not Found",
            description: "The requested task could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        setError("Failed to load task");
        toast({
          title: "Error Loading Task",
          description: "Failed to load task details from the blockchain.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [account?.address, taskId, getTask, connected]);

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
      setIsSubmitDialogOpen(false);
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

      // Verify task is in submitted state
      if (task.state !== TASK_STATUS.SUBMITTED) {
        throw new Error("Task must be in submitted state to validate");
      }

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

      // Verify task is completed and has enough validations
      if (task.state !== TASK_STATUS.COMPLETED) {
        throw new Error("Task must be completed to distribute bounty");
      }
      if (task.positive_validations < task.required_validations) {
        throw new Error(
          `Task needs at least ${task.required_validations} positive validations`
        );
      }

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

  if (!connected || !account) {
    return (
      <div className="min-h-screen bg-black text-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p>Please connect your wallet to view task details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin" />
            <span>Loading task details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-black text-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              className="bg-red-950/20 border-red-900/40 text-red-50 hover:bg-red-900/40"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="bg-red-950/20 border-red-900/40">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
                <p className="text-red-200">
                  {error || "The requested task could not be found."}
                </p>
                <Button
                  className="mt-6 bg-red-900/40 hover:bg-red-900/60"
                  onClick={() => router.push("/dao/tasks")}
                >
                  View All Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora
          key="background-aurora"
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

            {/* Required Skills */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {task.required_skills?.map((skill, index) => (
                      <Badge key={index} className="bg-red-900/30 text-red-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Task Submission Form */}
            {task.state === TASK_STATUS.ASSIGNED &&
              task.assignee === account.address.toString() && (
                <InViewMotion>
                  <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        Submit Task
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Dialog
                        open={isSubmitDialogOpen}
                        onOpenChange={setIsSubmitDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <Upload className="w-4 h-4 mr-2" />
                            Submit Work
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/90 border border-red-900/20">
                          <DialogHeader>
                            <DialogTitle className="text-xl text-white">
                              Submit Task Work
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="text-sm text-gray-400 mb-2 block">
                                Submission Hash (e.g. IPFS hash, GitHub commit)
                              </label>
                              <Input
                                value={submissionData.submission_hash}
                                onChange={(e) =>
                                  setSubmissionData((prev) => ({
                                    ...prev,
                                    submission_hash: e.target.value,
                                  }))
                                }
                                className="bg-black border-red-900/20 text-white"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-400 mb-2 block">
                                Completion Proof
                              </label>
                              <Textarea
                                value={submissionData.completion_proof}
                                onChange={(e) =>
                                  setSubmissionData((prev) => ({
                                    ...prev,
                                    completion_proof: e.target.value,
                                  }))
                                }
                                className="bg-black border-red-900/20 text-white"
                                rows={4}
                              />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                              <Button
                                variant="outline"
                                onClick={() => setIsSubmitDialogOpen(false)}
                                className="bg-transparent border-red-900/20 text-white hover:bg-red-950/50"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSubmitTask}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={loading}
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                Submit
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </InViewMotion>
              )}

            {/* Submission Details */}
            {task.state >= TASK_STATUS.SUBMITTED && (
              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Submission Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {task.submission_hash && (
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Submission Hash
                          </label>
                          <div className="font-mono text-white break-all bg-white/5 p-3 rounded">
                            {task.submission_hash}
                          </div>
                        </div>
                      )}
                      {task.completion_proof && (
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Completion Proof
                          </label>
                          <div className="text-white whitespace-pre-wrap bg-white/5 p-3 rounded">
                            {task.completion_proof}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>
            )}

            {/* Validation Section */}
            {task.state === TASK_STATUS.SUBMITTED && (
              <InViewMotion>
                <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Validation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Validation Button - Show for anyone who hasn't validated yet */}
                      {task.state === TASK_STATUS.SUBMITTED &&
                        account?.address &&
                        !task.validators.includes(
                          account.address.toString()
                        ) && (
                          <>
                            <Button
                              onClick={() => setIsValidateDialogOpen(true)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Validate This Task
                            </Button>

                            <Dialog
                              open={isValidateDialogOpen}
                              onOpenChange={setIsValidateDialogOpen}
                            >
                              <DialogContent className="bg-black/90 border border-red-900/20">
                                <DialogHeader>
                                  <DialogTitle className="text-xl text-white">
                                    Validate Task Submission
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  {/* Submission Details */}
                                  <div>
                                    <h3 className="text-white font-semibold mb-2">
                                      Submission Hash
                                    </h3>
                                    <div className="font-mono text-sm text-gray-300 bg-white/5 p-3 rounded break-all">
                                      {task.submission_hash}
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="text-white font-semibold mb-2">
                                      Completion Proof
                                    </h3>
                                    <div className="text-sm text-gray-300 bg-white/5 p-3 rounded whitespace-pre-wrap">
                                      {task.completion_proof}
                                    </div>
                                  </div>

                                  {/* Validation Actions */}
                                  <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsValidateDialogOpen(false)
                                      }
                                      className="bg-transparent border-red-900/20 text-white hover:bg-red-950/50"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        handleValidateTask(false);
                                        setIsValidateDialogOpen(false);
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={loading}
                                    >
                                      {loading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <X className="w-4 h-4 mr-2" />
                                      )}
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        handleValidateTask(true);
                                        setIsValidateDialogOpen(false);
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={loading}
                                    >
                                      {loading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                      )}
                                      Approve
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                      {/* Progress Section */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">
                          Required Validations
                        </span>
                        <Badge className="bg-red-950/60 text-red-200">
                          {task.positive_validations} /{" "}
                          {task.required_validations}
                        </Badge>
                      </div>
                      <div className="h-2 bg-red-950/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-900 to-red-700 transition-all duration-300"
                          style={{
                            width: `${
                              (task.positive_validations /
                                task.required_validations) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      {/* Validators List */}
                      <div className="space-y-2">
                        {task.validators.map((validator, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white/5 p-2 rounded"
                          >
                            <span className="font-mono text-gray-300">
                              {validator.slice(0, 6)}...{validator.slice(-4)}
                            </span>
                            {task.validation_results[validator] !==
                            undefined ? (
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
                            ) : (
                              <Badge className="bg-yellow-900/30 text-yellow-200">
                                Pending
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InViewMotion>
            )}
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
                      <p className="text-gray-400 text-sm">Creator</p>
                      <p className="text-white font-mono">
                        {task.creator.slice(0, 6)}...{task.creator.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Assignee</p>
                      <p className="text-white font-mono">
                        {task.assignee
                          ? `${task.assignee
                              .toString()
                              .slice(0, 6)}...${task.assignee
                              .toString()
                              .slice(-4)}`
                          : "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Deadline</p>
                      <p className="text-white">
                        {formatDeadline(task.deadline)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Bounty</p>
                      <p className="text-white">
                        {formatAPTAmount(task.bounty_amount)} APT
                      </p>
                    </div>
                  </div>

                  {task.state === TASK_STATUS.COMPLETED &&
                    task.user_is_creator && (
                      <Button
                        onClick={handleDistributeBounty}
                        className="w-full bg-green-600 hover:bg-green-700 mt-4"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Coins className="w-4 h-4 mr-2" />
                        )}
                        Distribute Bounty
                      </Button>
                    )}
                </CardContent>
              </Card>
            </InViewMotion>
          </div>
        </div>
      </div>
    </div>
  );
}
