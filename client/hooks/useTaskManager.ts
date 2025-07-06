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
  required_validations: number;
  total_validations: number;
  positive_validations: number;
  user_is_creator: boolean;
  user_is_assignee: boolean;
  user_is_validator: boolean;
}

export interface ProposalInfo {
  id: number;
  dao_id: number;
  title: string;
  description: string;
  creator: string;
  start_time: number;
  end_time: number;
  execution_time: number;
  state: number;
  for_votes: number;
  against_votes: number;
  abstain_votes: number;
  quorum: number;
  user_vote_type: number | null;
  user_voting_power: number;
  created_at: number;
}

export interface CreateTaskData {
  dao_id: number;
  title: string;
  description: string;
  bounty_amount: number;
  required_skills: string[];
  deadline: number;
  required_validations: number;
}

export interface UserDAOEcosystem {
  user_address: string;
  total_daos_joined: number;
  total_voting_power: number;
  total_proposals_created: number;
  total_tasks_created: number;
  total_votes_cast: number;
  daos: CompleteDAOData[];
  generated_at: number;
}

export interface CompleteDAOData {
  dao_info: DAOInfo;
  user_membership: UserDAOMembership;
  proposals: ProposalInfo[];
  tasks: TaskInfo[];
  user_proposals_created: number;
  user_tasks_created: number;
  user_votes_cast: number;
  total_voting_power_used: number;
  user_aip: any; // We'll type this properly later
}

export interface DAOInfo {
  id: number;
  dao_code: string;
  name: string;
  description: string;
  creator: string;
  governors: string[];
  members: string[];
  total_staked: number;
  governance_token: string;
  minimum_proposal_threshold: number;
  voting_period: number;
  execution_delay: number;
  proposal_count: number;
  task_count: number;
  treasury_balance: number;
  is_active: boolean;
  created_at: number;
  member_count: number;
  settings: DAOSettings;
}

export interface DAOSettings {
  proposal_creation_fee: number;
  task_creation_fee: number;
  minimum_voting_power: number;
  delegation_enabled: boolean;
  ai_delegates_enabled: boolean;
  public_membership: boolean;
  require_verification: boolean;
}

export interface UserDAOMembership {
  is_member: boolean;
  voting_power: number;
  is_governor: boolean;
  is_creator: boolean;
  join_date: number;
}

export const useTaskManager = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize state update functions
  const updateTasks = useCallback((newTasks: TaskInfo[]) => {
    setTasks(newTasks);
  }, []);

  const updateLoading = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const updateError = useCallback((newError: string | null) => {
    setError(newError);
  }, []);

  // Get complete DAO ecosystem data
  const getCompleteDAOEcosystem = useCallback(async (): Promise<UserDAOEcosystem | null> => {
    if (!account) return null;

    try {
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_COMPLETE_USER_DAO_ECOSYSTEM,
          typeArguments: [],
          functionArguments: [account.address.toString()],
        },
      });

      if (response && response.length > 0) {
        const ecosystemData = response[0] as any;
        return {
          user_address: ecosystemData.user_address,
          total_daos_joined: Number(ecosystemData.total_daos_joined),
          total_voting_power: Number(ecosystemData.total_voting_power),
          total_proposals_created: Number(ecosystemData.total_proposals_created),
          total_tasks_created: Number(ecosystemData.total_tasks_created),
          total_votes_cast: Number(ecosystemData.total_votes_cast),
          daos: ecosystemData.daos.map((dao: any) => ({
            dao_info: {
              ...dao.dao_info,
              id: Number(dao.dao_info.id),
              total_staked: Number(dao.dao_info.total_staked),
              minimum_proposal_threshold: Number(dao.dao_info.minimum_proposal_threshold),
              voting_period: Number(dao.dao_info.voting_period),
              execution_delay: Number(dao.dao_info.execution_delay),
              proposal_count: Number(dao.dao_info.proposal_count),
              task_count: Number(dao.dao_info.task_count),
              treasury_balance: Number(dao.dao_info.treasury_balance),
              created_at: Number(dao.dao_info.created_at),
              member_count: Number(dao.dao_info.member_count),
              settings: {
                ...dao.dao_info.settings,
                proposal_creation_fee: Number(dao.dao_info.settings.proposal_creation_fee),
                task_creation_fee: Number(dao.dao_info.settings.task_creation_fee),
                minimum_voting_power: Number(dao.dao_info.settings.minimum_voting_power),
              },
            },
            user_membership: {
              ...dao.user_membership,
              voting_power: Number(dao.user_membership.voting_power),
              join_date: Number(dao.user_membership.join_date),
            },
            proposals: dao.proposals,
            tasks: dao.tasks.map((task: any) => ({
              id: Number(task.id),
              dao_id: Number(task.dao_id),
              title: task.title,
              description: task.description,
              creator: task.creator,
              assignee: task.assignee?.vec?.length > 0 ? task.assignee.vec[0] : null,
              bounty_amount: Number(task.bounty_amount),
              required_skills: task.required_skills || [],
              deadline: Number(task.deadline),
              state: Number(task.state),
              submission_hash: task.submission_hash === "0x0" ? null : task.submission_hash,
              validators: task.validators || [],
              validation_results: task.validation_results || {},
              completion_proof: task.completion_proof === "0x0" ? null : task.completion_proof,
              created_at: Number(task.created_at),
              required_validations: Number(task.required_validations),
              total_validations: Number(task.total_validations),
              positive_validations: Number(task.positive_validations),
              user_is_creator: account.address === task.creator,
              user_is_assignee: account.address === task.assignee?.vec?.[0],
              user_is_validator: account.address ? (task.validators || []).includes(account.address) : false,
            })),
            user_proposals_created: Number(dao.user_proposals_created),
            user_tasks_created: Number(dao.user_tasks_created),
            user_votes_cast: Number(dao.user_votes_cast),
            total_voting_power_used: Number(dao.total_voting_power_used),
            user_aip: dao.user_aip,
          })),
          generated_at: Number(ecosystemData.generated_at),
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching DAO ecosystem:", error);
      return null;
    }
  }, [account?.address]);

  // Update getTask to use ecosystem data
  const getTask = useCallback(async (taskId: number): Promise<TaskInfo | null> => {
    try {
      updateLoading(true);
      const ecosystem = await getCompleteDAOEcosystem();
      if (!ecosystem) return null;

      // Search for the task in all DAOs
      for (const dao of ecosystem.daos) {
        const task = dao.tasks.find(t => t.id === taskId);
        if (task) {
          return task;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching task:", error);
      return null;
    } finally {
      updateLoading(false);
    }
  }, [account?.address, getCompleteDAOEcosystem, updateLoading]);

  // Create a new task
  const createTask = async (taskData: CreateTaskData) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      updateLoading(true);
      updateError(null);

      // Ensure required validations is at least 2
      if (taskData.required_validations < 2) {
        throw new Error("At least 2 validations are required");
      }

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.CREATE_TASK,
          typeArguments: [],
          functionArguments: [
            taskData.dao_id,
            taskData.title,
            taskData.description,
            taskData.bounty_amount,
            taskData.required_skills,
            taskData.deadline,
            taskData.required_validations,
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
      updateError(errorMessage);
      toast({
        title: "Error Creating Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      updateLoading(false);
    }
  };

  // Assign task to user
  const assignTask = async (taskId: number) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      updateLoading(true);
      updateError(null);

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
      updateError(errorMessage);
      toast({
        title: "Error Assigning Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      updateLoading(false);
    }
  };

  // Submit task completion
  const submitTask = async (taskId: number, submissionHash: string, completionProof: string) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      updateLoading(true);
      updateError(null);

      // Validate inputs
      if (!submissionHash.trim() || !completionProof.trim()) {
        throw new Error("Both submission hash and completion proof are required");
      }

      // Convert submission hash to vector<u8> using UTF-8 encoding
      const submissionBytes = Array.from(new TextEncoder().encode(submissionHash));

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.SUBMIT_TASK,
          typeArguments: [],
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
      updateError(errorMessage);
      toast({
        title: "Error Submitting Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      updateLoading(false);
    }
  };

  // Validate task submission
  const validateTask = async (taskId: number, isValid: boolean) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      updateLoading(true);
      updateError(null);

      // Verify task exists and is in submitted state
      const task = await getTask(taskId);
      if (!task) {
        throw new Error("Task not found");
      }
      if (task.state !== TASK_STATUS.SUBMITTED) {
        throw new Error("Task must be in submitted state to validate");
      }

      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.VALIDATE_TASK,
          typeArguments: [],
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
      updateError(errorMessage);
      toast({
        title: "Error Validating Task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      updateLoading(false);
    }
  };

  // Distribute bounty for completed task
  const distributeBounty = async (taskId: number) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      updateLoading(true);
      updateError(null);

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
      updateError(errorMessage);
      toast({
        title: "Error Distributing Bounty",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      updateLoading(false);
    }
  };

  // Update getDAOTasks to use memoized state updates
  const getDAOTasks = useCallback(async (daoId: number): Promise<TaskInfo[]> => {
    try {
      updateLoading(true);
      const ecosystem = await getCompleteDAOEcosystem();
      if (!ecosystem) return [];

      const dao = ecosystem.daos.find(dao => dao.dao_info.id === daoId);
      const daoTasks = dao?.tasks || [];
      updateTasks(daoTasks);
      return daoTasks;
    } catch (error) {
      console.error("Error fetching DAO tasks:", error);
      return [];
    } finally {
      updateLoading(false);
    }
  }, [account?.address, getCompleteDAOEcosystem, updateLoading, updateTasks]);

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
          required_validations: Number(taskData.required_validations),
          total_validations: Number(taskData.total_validations),
          positive_validations: Number(taskData.positive_validations),
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
    getCompleteDAOEcosystem,
  };
}; 