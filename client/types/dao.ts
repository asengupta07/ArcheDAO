export interface UserDAOEcosystem {
  user_address: string;
  total_daos_joined: string;
  total_voting_power: string;
  total_proposals_created: string;
  total_tasks_created: string;
  total_votes_cast: string;
  daos: DAOEcosystemEntry[];
  generated_at: string;
}

export interface DAOEcosystemEntry {
  dao_info: {
    id: number;
    dao_code: string;
    name: string;
    description: string;
    creator: string;
    governors: string[];
    members: string[];
    total_staked: string;
    governance_token: string;
    minimum_proposal_threshold: string;
    voting_period: string;
    execution_delay: string;
    proposal_count: string;
    task_count: string;
    treasury_balance: string;
    is_active: boolean;
    created_at: string;
    member_count: number;
  };
  user_membership: {
    is_member: boolean;
    is_governor: boolean;
    is_creator: boolean;
    voting_power: string;
    join_date: string;
  };
  proposals: ProposalInfo[];
  tasks: TaskInfo[];
  user_proposals_created: string;
  user_tasks_created: string;
  user_votes_cast: string;
  total_voting_power_used: string;
}

export interface ProposalInfo {
  id: string;
  dao_id: string;
  title: string;
  description: string;
  proposer: string;
  start_time: string;
  end_time: string;
  execution_time: string;
  yes_votes: string;
  no_votes: string;
  abstain_votes: string;
  total_votes: string;
  state: number;
  linked_aip: string | null;
  created_at: string;
  user_voted: boolean;
  user_vote: number | null;
}

export interface TaskInfo {
  id: string;
  dao_id: string;
  title: string;
  description: string;
  creator: string;
  assignee: string | null;
  bounty_amount: string;
  deadline: string;
  state: number;
  created_at: string;
  user_is_creator: boolean;
  user_is_assignee: boolean;
} 