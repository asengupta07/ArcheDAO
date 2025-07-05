"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

// Mock task data - in real app this would be fetched based on taskId
const mockTask = {
  id: "TASK-101",
  title: "Update Documentation",
  description:
    "Update the DAO governance documentation with latest changes and procedures. This includes updating the voting mechanisms, proposal creation process, and member onboarding guidelines.",
  status: "in-progress",
  priority: "high",
  assignee: "0x8e46...74ac",
  reward: "500 APT",
  deadline: "2024-03-20",
  createdAt: "2024-03-15",
  createdBy: "0x7d32...91bc",
  category: "Documentation",
  estimatedHours: 8,
  progress: 65,
  requirements:
    "Experience with technical writing, understanding of DAO governance, Markdown proficiency",
  deliverables:
    "- Updated governance documentation\n- Onboarding guide for new members\n- FAQ section updates\n- Review and approval from core team",
  comments: [
    {
      id: 1,
      author: "0x8e46...74ac",
      content:
        "Started working on the governance section. Making good progress!",
      timestamp: "2024-03-16 10:30",
    },
    {
      id: 2,
      author: "0x7d32...91bc",
      content:
        "Great! Let me know if you need any clarification on the new voting mechanisms.",
      timestamp: "2024-03-16 14:20",
    },
  ],
};

export default function TaskDetailPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const [newComment, setNewComment] = useState("");
  const [task, setTask] = useState(mockTask);
  const [isAssigned, setIsAssigned] = useState(
    task.assignee === account?.address
  );

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

  const handleAssignTask = () => {
    setTask({ ...task, assignee: account?.address || "" });
    setIsAssigned(true);
    toast({
      title: "Task Assigned",
      description: "You have been assigned to this task.",
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setTask({ ...task, status: newStatus });
    toast({
      title: "Status Updated",
      description: `Task status changed to ${newStatus}.`,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: task.comments.length + 1,
      author: account?.address || "",
      content: newComment,
      timestamp: new Date().toLocaleString(),
    };

    setTask({
      ...task,
      comments: [...task.comments, comment],
    });
    setNewComment("");
    toast({
      title: "Comment Added",
      description: "Your comment has been posted.",
    });
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
                <span className="text-gray-400 text-sm">{task.id}</span>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace("-", " ")}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {task.title}
              </h1>
            </div>
            {task.status === "open" && !task.assignee && (
              <Button
                onClick={handleAssignTask}
                className="bg-green-600 hover:bg-green-700"
              >
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

            {/* Requirements */}
            <InViewMotion>
              <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{task.requirements}</p>
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
                    {task.deliverables}
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
                        <span>{task.progress}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-900 to-red-700 transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      {isAssigned && (
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
                    Comments ({task.comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {task.comments.map((comment) => (
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
                      <p className="text-white font-mono">{task.createdBy}</p>
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
                      <p className="text-white">{task.estimatedHours}h</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Reward</p>
                      <p className="text-white">{task.reward}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Category</p>
                      <p className="text-white">{task.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </InViewMotion>

            {/* Actions */}
            {isAssigned && (
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
