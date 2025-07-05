"use client";

import { useState, memo, useCallback } from "react";
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
        colorStops={["#8B0000", "#660000", "#8B0000"]}
        amplitude={1.2}
        speed={0.3}
        blend={0.8}
      />
    </div>
  );
});

// Add debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
    validators: "", // New field for validators
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

  // Debounced input handler
  const debouncedInputChange = useCallback(
    debounce((field: string, value: string) => {
      setTaskData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }, 100),
    []
  );

  const handleInputChange = (field: string, value: string) => {
    // Update the input value immediately for UI responsiveness
    const input = document.querySelector(
      `[name="${field}"]`
    ) as HTMLInputElement;
    if (input) {
      input.value = value;
    }
    // Debounce the state update
    debouncedInputChange(field, value);
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

      // Parse required skills into array
      const skillsArray = (taskData.required_skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      // Parse validators into array
      const validatorsArray = (taskData.validators || "")
        .split(",")
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0);

      // Convert bounty to Octas (1 APT = 100000000 Octas)
      const bountyInOctas = parseFloat(taskData.bounty_amount) * 100000000;

      // Convert deadline to Unix timestamp
      const deadlineDate = new Date(taskData.deadline);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

      await createTask({
        dao_id: taskData.dao_id,
        title: taskData.title,
        description: taskData.description,
        bounty_amount: bountyInOctas,
        required_skills: skillsArray,
        deadline: deadlineTimestamp,
        validators: validatorsArray,
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
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl p-8 text-center max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-white mb-4">
                Connect Your Wallet
              </CardTitle>
              <p className="text-gray-300">
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
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Create Task
              </h1>
              <p className="text-gray-400">Create a new task for your DAO</p>
            </div>
          </div>
        </InViewMotion>

        <InViewMotion>
          <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white font-medium">Title</label>
                  <Input
                    value={taskData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter task title"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">Description</label>
                  <Textarea
                    value={taskData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter task description, requirements, and deliverables"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">
                    Required Skills
                  </label>
                  <Input
                    value={taskData.required_skills}
                    onChange={(e) =>
                      handleInputChange("required_skills", e.target.value)
                    }
                    placeholder="Enter required skills (comma-separated)"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">Validators</label>
                  <Input
                    value={taskData.validators}
                    onChange={(e) =>
                      handleInputChange("validators", e.target.value)
                    }
                    placeholder="Enter validator addresses (comma-separated)"
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                  <p className="text-sm text-gray-400">
                    Optional: Add addresses of validators who can approve task
                    completion
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-white font-medium">
                      Bounty (APT)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={taskData.bounty_amount}
                      onChange={(e) =>
                        handleInputChange("bounty_amount", e.target.value)
                      }
                      placeholder="Enter bounty amount in APT"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-medium">Deadline</label>
                    <Input
                      type="datetime-local"
                      value={taskData.deadline}
                      onChange={(e) =>
                        handleInputChange("deadline", e.target.value)
                      }
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-900 to-red-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    "Create Task"
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
