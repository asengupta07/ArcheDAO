"use client";

import { useState, memo } from "react";
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
  Loader2,
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useTaskManager } from "@/hooks/useTaskManager";
import { useToast } from "@/hooks/use-toast";

// Create a memoized background component
const Background = memo(function Background() {
  return (
    <div className="fixed inset-0 z-0">
      <Aurora
        colorStops={["#1a0000", "#000000", "#1a0000"]}
        amplitude={1.2}
        speed={0.3}
        blend={0.8}
      />
    </div>
  );
});

export default function CreateTaskPage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const { createTask } = useTaskManager();
  const { toast: useToastToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskData, setTaskData] = useState({
    dao_id: 1, // TODO: Get from context or params
    title: "",
    description: "",
    category: "General",
    priority: "medium",
    estimatedHours: "",
    bounty_amount: "",
    required_skills: "",
    deadline: "",
    required_validations: "2", // Default minimum required validations
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a task.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!taskData.title.trim() || !taskData.description.trim() || !taskData.bounty_amount || !taskData.deadline) {
        throw new Error("Please fill in all required fields");
      }

      // Parse required skills into array
      const skillsArray = (taskData.required_skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      // Convert bounty to Octas (1 APT = 100000000 Octas)
      const bountyInOctas = Math.floor(parseFloat(taskData.bounty_amount) * 100000000);

      // Convert deadline to Unix timestamp
      const deadlineDate = new Date(taskData.deadline);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

      // Validate required validations
      const requiredValidations = parseInt(taskData.required_validations);
      if (isNaN(requiredValidations) || requiredValidations < 2) {
        throw new Error("At least 2 validations are required");
      }

      await createTask({
        dao_id: taskData.dao_id,
        title: taskData.title,
        description: taskData.description,
        bounty_amount: bountyInOctas,
        required_skills: skillsArray,
        deadline: deadlineTimestamp,
        required_validations: requiredValidations,
      });

      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
      });

      router.push("/dao/tasks");
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error Creating Task",
        description:
          error instanceof Error ? error.message : "Failed to create task.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen relative">
        <Background />
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-red-50 mb-4">
                Connect Your Wallet
              </CardTitle>
              <p className="text-red-200">
                Please connect your wallet to create a task.
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10 container mx-auto px-4 py-[8rem] mt-6">
        <InViewMotion>
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dao/tasks")}
              className="text-red-100 hover:bg-red-950/60 hover:text-red-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-red-50">
                Create Task
              </h1>
              <p className="text-red-200">Create a new task for your DAO</p>
            </div>
          </div>
        </InViewMotion>

        <InViewMotion>
          <Card className="bg-black/40 border-red-900/40 backdrop-blur-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-red-50 font-medium">Title</label>
                  <Input
                    name="title"
                    value={taskData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter task title"
                    required
                    className="bg-red-950/20 border-red-900/40 text-red-50 placeholder-red-200/50 focus:border-red-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-red-50 font-medium">Description</label>
                  <Textarea
                    name="description"
                    value={taskData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter task description, requirements, and deliverables"
                    required
                    className="bg-red-950/20 border-red-900/40 text-red-50 placeholder-red-200/50 min-h-[150px] focus:border-red-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-red-50 font-medium">Required Skills</label>
                  <Input
                    name="required_skills"
                    value={taskData.required_skills}
                    onChange={(e) => handleInputChange("required_skills", e.target.value)}
                    placeholder="Enter required skills (comma-separated)"
                    className="bg-red-950/20 border-red-900/40 text-red-50 placeholder-red-200/50 focus:border-red-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-red-50 font-medium">Bounty Amount (APT)</label>
                  <Input
                    name="bounty_amount"
                    type="number"
                    step="0.1"
                    min="0"
                    value={taskData.bounty_amount}
                    onChange={(e) => handleInputChange("bounty_amount", e.target.value)}
                    placeholder="Enter bounty amount in APT"
                    required
                    className="bg-red-950/20 border-red-900/40 text-red-50 placeholder-red-200/50 focus:border-red-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-red-50 font-medium">Required Validations</label>
                  <Input
                    name="required_validations"
                    type="number"
                    min="2"
                    value={taskData.required_validations}
                    onChange={(e) => handleInputChange("required_validations", e.target.value)}
                    placeholder="Minimum number of validations required (min: 2)"
                    required
                    className="bg-red-950/20 border-red-900/40 text-red-50 placeholder-red-200/50 focus:border-red-800"
                  />
                  <p className="text-sm text-red-300">
                    Minimum number of positive validations needed to complete the task (minimum: 2)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-red-50 font-medium">Deadline</label>
                  <Input
                    name="deadline"
                    type="datetime-local"
                    value={taskData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    required
                    className="bg-red-950/20 border-red-900/40 text-red-50 placeholder-red-200/50 focus:border-red-800"
                  />
                </div>

                <div className="mt-6 p-4 bg-red-950/20 border border-red-900/40 rounded-lg">
                  <p className="text-sm text-red-200">
                    <span className="font-medium">Note:</span> Creating a task requires a fee of 0.1 APT. This fee helps maintain the platform and prevent spam.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-950 hover:bg-red-900 text-red-50 border border-red-800/50 shadow-lg shadow-red-900/20 disabled:bg-red-950/40 disabled:text-red-200/60 disabled:border-red-900/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </InViewMotion>
      </div>
    </div>
  );
}

