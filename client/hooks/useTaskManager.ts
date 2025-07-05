import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";
import { CONTRACT_CONFIG, CONTRACT_FUNCTIONS, TASK_STATUS } from "@/config/contract";

// Initialize Aptos client
const config = new AptosConfig({ 
  network: CONTRACT_CONFIG.NETWORK as Network,
  fullnode: CONTRACT_CONFIG.NODE_URL,
});
const aptos = new Aptos(config);

// Task interfaces
export interface Task {
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

export interface TaskInfo {
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

export interface CreateTaskData {
  dao_id: number;
  title: string;
  description: string;
  bounty_amount: number;
  required_skills: string[];
  deadline: number;
  validators?: string[]; // Optional validators list
}

export const useTaskManager = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new task
  const createTask = async (taskData: CreateTaskData) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.CREATE_TASK,
          functionArguments: [
            taskData.dao_id,
            taskData.title,
            taskData.description,
            taskData.bounty_amount,
            taskData.required_skills,
            taskData.deadline,
          ],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Task Created Successfully",
        description: "Your task has been published to the DAO.",
      });

      return response;
    } catch (error) {
      console.error("Error creating task:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create task";
      setError(errorMessage);
      toast({
        title: "Error Creating Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Assign task to user
  const assignTask = async (taskId: number) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.ASSIGN_TASK,
          functionArguments: [taskId],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Task Assigned",
        description: "You have been assigned to this task.",
      });

      return response;
    } catch (error) {
      console.error("Error assigning task:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to assign task";
      setError(errorMessage);
      toast({
        title: "Error Assigning Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Submit task completion
  const submitTask = async (taskId: number, submissionHash: string, completionProof: string) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Convert submission hash to vector<u8>
      const submissionBytes = Array.from(new TextEncoder().encode(submissionHash));

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.SUBMIT_TASK,
          functionArguments: [taskId, submissionBytes, completionProof],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Task Submitted",
        description: "Your task submission has been recorded.",
      });

      return response;
    } catch (error) {
      console.error("Error submitting task:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit task";
      setError(errorMessage);
      toast({
        title: "Error Submitting Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Validate task submission
  const validateTask = async (taskId: number, isValid: boolean) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.VALIDATE_TASK,
          functionArguments: [taskId, isValid],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Task Validated",
        description: `Task marked as ${isValid ? "valid" : "invalid"}.`,
      });

      return response;
    } catch (error) {
      console.error("Error validating task:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to validate task";
      setError(errorMessage);
      toast({
        title: "Error Validating Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Distribute bounty for completed task
  const distributeBounty = async (taskId: number) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.DISTRIBUTE_BOUNTY,
          functionArguments: [taskId],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Bounty Distributed",
        description: "Task bounty has been distributed to the assignee.",
      });

      return response;
    } catch (error) {
      console.error("Error distributing bounty:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to distribute bounty";
      setError(errorMessage);
      toast({
        title: "Error Distributing Bounty",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get task details
  const getTask = useCallback(async (taskId: number): Promise<TaskInfo | null> => {
    try {
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_TASK,
          typeArguments: [],
          functionArguments: [taskId],
        },
      });

      if (response && response.length > 0) {
        const taskData = response[0] as any;
        return {
          id: Number(taskData[0]),
          dao_id: Number(taskData[1]),
          title: taskData[2],
          description: taskData[3],
          creator: taskData[4],
          assignee: taskData[5] === "0x0" ? null : taskData[5],
          bounty_amount: Number(taskData[6]),
          required_skills: taskData[7] as string[],
          deadline: Number(taskData[8]),
          state: Number(taskData[9]),
          submission_hash: taskData[10] === "0x0" ? null : taskData[10],
          validators: taskData[11] as string[],
          validation_results: taskData[12] as Record<string, boolean>,
          completion_proof: taskData[13] === "0x0" ? null : taskData[13],
          created_at: Number(taskData[14]),
          user_is_creator: account?.address === taskData[4],
          user_is_assignee: account?.address === taskData[5],
          user_is_validator: account?.address ? taskData[11].includes(account.address) : false,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching task:", error);
      return null;
    }
  }, [account?.address]);

  // Get all tasks for a DAO
  const getDAOTasks = useCallback(async (daoId: number): Promise<TaskInfo[]> => {
    try {
      setLoading(true);
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_DAO_TASKS,
          typeArguments: [],
          functionArguments: [daoId],
        },
      });

      if (response && response.length > 0) {
        const tasksData = response[0] as any[];
        return tasksData.map((taskData: any) => ({
          id: Number(taskData.id),
          dao_id: Number(taskData.dao_id),
          title: taskData.title,
          description: taskData.description,
          creator: taskData.creator,
          assignee: taskData.assignee === "0x0" ? null : taskData.assignee,
          bounty_amount: Number(taskData.bounty_amount),
          required_skills: taskData.required_skills as string[],
          deadline: Number(taskData.deadline),
          state: Number(taskData.state),
          submission_hash: taskData.submission_hash === "0x0" ? null : taskData.submission_hash,
          validators: taskData.validators as string[],
          validation_results: taskData.validation_results as Record<string, boolean>,
          completion_proof: taskData.completion_proof === "0x0" ? null : taskData.completion_proof,
          created_at: Number(taskData.created_at),
          user_is_creator: account?.address === taskData.creator,
          user_is_assignee: account?.address === taskData.assignee,
          user_is_validator: account?.address ? taskData.validators.includes(account.address) : false,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching DAO tasks:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [account?.address]);

  // Get tasks created by user
  const getUserCreatedTasks = useCallback(async (): Promise<TaskInfo[]> => {
    if (!account) return [];

    try {
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_USER_CREATED_TASKS,
          typeArguments: [],
          functionArguments: [account.address],
        },
      });

      if (response && response.length > 0) {
        const tasksData = response[0] as any[];
        return tasksData.map((taskData: any) => ({
          id: Number(taskData.id),
          dao_id: Number(taskData.dao_id),
          title: taskData.title,
          description: taskData.description,
          creator: taskData.creator,
          assignee: taskData.assignee === "0x0" ? null : taskData.assignee,
          bounty_amount: Number(taskData.bounty_amount),
          required_skills: taskData.required_skills as string[],
          deadline: Number(taskData.deadline),
          state: Number(taskData.state),
          submission_hash: taskData.submission_hash === "0x0" ? null : taskData.submission_hash,
          validators: taskData.validators as string[],
          validation_results: taskData.validation_results as Record<string, boolean>,
          completion_proof: taskData.completion_proof === "0x0" ? null : taskData.completion_proof,
          created_at: Number(taskData.created_at),
          user_is_creator: true,
          user_is_assignee: account.address === taskData.assignee,
          user_is_validator: account?.address ? taskData.validators.includes(account.address) : false,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching user created tasks:", error);
      return [];
    }
  }, [account?.address]);

  // Get task status
  const getTaskStatus = useCallback(async (taskId: number): Promise<number> => {
    try {
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_TASK_STATUS,
          typeArguments: [],
          functionArguments: [taskId],
        },
      });

      if (response && response.length > 0) {
        return Number(response[0]);
      }
      return TASK_STATUS.OPEN;
    } catch (error) {
      console.error("Error fetching task status:", error);
      return TASK_STATUS.OPEN;
    }
  }, []);

  // Helper function to format APT amount
  const formatAPTAmount = useCallback((amount: number): string => {
    return (amount / 100000000).toFixed(2); // Convert from octas to APT
  }, []);

  // Helper function to format deadline
  const formatDeadline = useCallback((timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  }, []);

  // Helper function to check if task is expired
  const isTaskExpired = useCallback((deadline: number): boolean => {
    return Date.now() > deadline * 1000;
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    assignTask,
    submitTask,
    validateTask,
    distributeBounty,
    getTask,
    getDAOTasks,
    getUserCreatedTasks,
    getTaskStatus,
    formatAPTAmount,
    formatDeadline,
    isTaskExpired,
  };
}; 