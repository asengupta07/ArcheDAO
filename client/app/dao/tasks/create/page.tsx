"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InViewMotion from "@/components/InViewMotion";
import { Aurora } from "@/components/aurora";
import {
  ArrowLeft,
  Save,
  Calendar,
  Target,
  Coins,
  Clock,
  Tag,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function CreateTaskPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "medium",
    estimatedHours: "",
    reward: "",
    deadline: "",
    requirements: "",
    deliverables: "",
  });

  const categories = [
    "General",
    "Technical",
    "Community",
    "Documentation",
    "Design",
    "Marketing",
    "Research",
    "Legal",
  ];

  const priorities = [
    { value: "low", label: "Low Priority", color: "text-green-500" },
    { value: "medium", label: "Medium Priority", color: "text-yellow-500" },
    { value: "high", label: "High Priority", color: "text-red-500" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setTaskData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !taskData.title ||
      !taskData.description ||
      !taskData.reward ||
      !taskData.deadline
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically call your smart contract to create the task
    toast({
      title: "Task Created Successfully",
      description: "Your task has been published to the DAO.",
    });

    // Redirect back to tasks page
    router.push("/dao/tasks");
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
                Please connect your wallet to create tasks.
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Create New Task
              </h1>
              <p className="text-gray-400">
                Define a new task for DAO members to complete
              </p>
            </div>
          </div>
        </InViewMotion>

        <div className="max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Task Details */}
              <div className="lg:col-span-2 space-y-6">
                <InViewMotion>
                  <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        Task Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-white font-medium mb-2 block">
                          Title <span className="text-red-400">*</span>
                        </label>
                        <Input
                          value={taskData.title}
                          onChange={(e) =>
                            handleInputChange("title", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white"
                          placeholder="Enter task title"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          Description <span className="text-red-400">*</span>
                        </label>
                        <Textarea
                          value={taskData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white min-h-[120px]"
                          placeholder="Describe what needs to be accomplished..."
                          required
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          Requirements
                        </label>
                        <Textarea
                          value={taskData.requirements}
                          onChange={(e) =>
                            handleInputChange("requirements", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white min-h-[100px]"
                          placeholder="List any specific requirements, skills, or qualifications needed..."
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          Deliverables
                        </label>
                        <Textarea
                          value={taskData.deliverables}
                          onChange={(e) =>
                            handleInputChange("deliverables", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white min-h-[100px]"
                          placeholder="What should be delivered upon completion..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>
              </div>

              {/* Task Configuration */}
              <div className="space-y-6">
                <InViewMotion>
                  <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-white font-medium mb-2 block">
                          <Tag className="w-4 h-4 inline mr-1" />
                          Category
                        </label>
                        <select
                          value={taskData.category}
                          onChange={(e) =>
                            handleInputChange("category", e.target.value)
                          }
                          className="w-full bg-white/5 border border-red-900/20 rounded-lg px-3 py-2 text-white"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Priority
                        </label>
                        <select
                          value={taskData.priority}
                          onChange={(e) =>
                            handleInputChange("priority", e.target.value)
                          }
                          className="w-full bg-white/5 border border-red-900/20 rounded-lg px-3 py-2 text-white"
                        >
                          {priorities.map((priority) => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Estimated Hours
                        </label>
                        <Input
                          type="number"
                          value={taskData.estimatedHours}
                          onChange={(e) =>
                            handleInputChange("estimatedHours", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white"
                          placeholder="e.g., 8"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          <Coins className="w-4 h-4 inline mr-1" />
                          Reward (APT) <span className="text-red-400">*</span>
                        </label>
                        <Input
                          type="number"
                          value={taskData.reward}
                          onChange={(e) =>
                            handleInputChange("reward", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white"
                          placeholder="e.g., 500"
                          min="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium mb-2 block">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Deadline <span className="text-red-400">*</span>
                        </label>
                        <Input
                          type="date"
                          value={taskData.deadline}
                          onChange={(e) =>
                            handleInputChange("deadline", e.target.value)
                          }
                          className="bg-white/5 border-red-900/20 text-white"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>

                {/* Task Preview */}
                <InViewMotion>
                  <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-400">Title:</span>
                          <p className="text-white">
                            {taskData.title || "Untitled Task"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Category:</span>
                          <p className="text-white">{taskData.category}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Priority:</span>
                          <p
                            className={
                              priorities.find(
                                (p) => p.value === taskData.priority
                              )?.color
                            }
                          >
                            {
                              priorities.find(
                                (p) => p.value === taskData.priority
                              )?.label
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Reward:</span>
                          <p className="text-white">
                            {taskData.reward || "0"} APT
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Deadline:</span>
                          <p className="text-white">
                            {taskData.deadline || "Not set"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </InViewMotion>
              </div>
            </div>

            {/* Submit Button */}
            <InViewMotion>
              <div className="mt-8 flex gap-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-red-900 to-red-700 px-8"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dao/tasks")}
                  className="border-red-900/20 text-white hover:bg-red-900/20"
                >
                  Cancel
                </Button>
              </div>
            </InViewMotion>
          </form>
        </div>
      </div>
    </div>
  );
}
