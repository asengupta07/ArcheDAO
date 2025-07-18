// Contract configuration constants
export const CONTRACT_CONFIG = {
  // Replace these with your actual deployed contract addresses
  MODULE_ADDRESS: process.env.NEXT_PUBLIC_MODULE_ADDRESS || "0x692906717ffbfc458c597613e0dd42c8f18577d28c03d2fdb768a07aa0fee713",
  MODULE_NAME: process.env.NEXT_PUBLIC_MODULE_NAME || "core",
  ADMIN_ADDRESS: process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "0x692906717ffbfc458c597613e0dd42c8f18577d28c03d2fdb768a07aa0fee713",
  
  // Network configuration
  NETWORK: process.env.NEXT_PUBLIC_NETWORK || "devnet",
  NODE_URL: process.env.NEXT_PUBLIC_NODE_URL || "https://api.devnet.aptoslabs.com/v1",
} as const;

// User types from the smart contract
export const USER_TYPES = {
  MEMBER: 0,
  DELEGATE: 1,
  DAO_CREATOR: 2,
  GOVERNOR: 3,
} as const;

// Proposal status from the smart contract
export const PROPOSAL_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
  CANCELED: 5,
} as const;

// Task status from the smart contract
export const TASK_STATUS = {
  OPEN: 0,
  ASSIGNED: 1,
  SUBMITTED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

// Vote types from the smart contract
export const VOTE_TYPES = {
  FOR: 0,
  AGAINST: 1,
  ABSTAIN: 2,
} as const;

// Function names from the smart contract
export const CONTRACT_FUNCTIONS = {
  // View functions
  GET_USER_PROFILE: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_profile`,
  GET_DAO_BY_ID: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_by_id`,
  GET_DAO_BY_CODE: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_by_code`,
  GET_COMPLETE_USER_DAO_ECOSYSTEM: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_complete_user_dao_ecosystem`,
  GET_DAO_INFO: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_by_id`,
  GET_TASK: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_task`,
  GET_DAO_TASKS: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_tasks`,
  GET_USER_CREATED_TASKS: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_created_tasks`,
  GET_TASK_STATUS: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_task_status`,
  
  // Proposal view functions
  GET_DAO_PROPOSALS: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_proposals`,
  GET_PROPOSAL: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_proposal`,
  GET_PROPOSAL_RESULTS: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_proposal_results`,
  HAS_VOTED: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::has_voted`,
  
  // AIP view functions
  GET_USER_AIPS: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_aips`,
  GET_AIP: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_aip`,
  
  // Staking and voting power view functions
  GET_USER_VOTING_POWER: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_voting_power`,
  CALCULATE_VOTING_POWER: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::calculate_voting_power`,
  GET_USER_STAKE_AMOUNT: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_stake_amount`,
  GET_USER_STAKING_INFO: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_staking_info`,
  GET_USER_VOTING_POWER_BREAKDOWN: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_voting_power_breakdown`,
  GET_USER_DAO_MEMBERSHIP_INFO: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_dao_membership_info`,
  GET_DAO_TOTAL_STAKED: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_total_staked`,
  CAN_USER_VOTE: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::can_user_vote`,
  IS_ELIGIBLE_FOR_RESERVED_POWER: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::is_eligible_for_reserved_power`,
  GET_DAO_VOTING_POWER_OVERVIEW: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_voting_power_overview`,
  GET_MINIMUM_STAKE_AMOUNT: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_minimum_stake_amount`,
  
  // Entry functions
  INITIALIZE: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::initialize`,
  JOIN_DAO_BY_CODE: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::join_dao_by_code`,
  JOIN_DAO_BY_ID: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::join_dao_by_id`,
  PROMOTE_TO_GOVERNOR: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::promote_to_governor`,
  DEMOTE_GOVERNOR: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::demote_governor`,
  TRANSFER_DAO_OWNERSHIP: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::transfer_dao_ownership`,
  CREATE_DAO: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::create_dao`,
  CREATE_PROPOSAL: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::create_proposal`,
  VOTE_ON_PROPOSAL: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::vote`,
  
  // Staking functions
  STAKE_FOR_VOTING_POWER: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::stake_for_voting_power`,
  UNSTAKE_VOTING_POWER: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::unstake_voting_power`,
  
  // Task functions
  CREATE_TASK: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::create_task`,
  ASSIGN_TASK: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::assign_task`,
  SUBMIT_TASK: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::submit_task`,
  VALIDATE_TASK: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::validate_task`,
  DISTRIBUTE_BOUNTY: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::distribute_bounty`,
} as const;

// Resource types
export const RESOURCE_TYPES = {
  USER_PROFILE: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::UserProfile`,
  DAO_REGISTRY: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::DAORegistry`,
  PLATFORM_CONFIG: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::PlatformConfig`,
} as const;

// Helper functions
export const getUserTypeLabel = (userType: number): string => {
  switch (userType) {
    case USER_TYPES.DAO_CREATOR:
      return "DAO Creator";
    case USER_TYPES.GOVERNOR:
      return "Governor";
    case USER_TYPES.DELEGATE:
      return "Delegate";
    case USER_TYPES.MEMBER:
      return "Member";
    default:
      return "Unknown";
  }
};

export const getUserTypeColor = (userType: number): string => {
  switch (userType) {
    case USER_TYPES.DAO_CREATOR:
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case USER_TYPES.GOVERNOR:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case USER_TYPES.DELEGATE:
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case USER_TYPES.MEMBER:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

// Proposal status helper functions
export const getProposalStatusLabel = (status: number): string => {
  switch (status) {
    case PROPOSAL_STATUS.PENDING:
      return "Pending";
    case PROPOSAL_STATUS.ACTIVE:
      return "Active";
    case PROPOSAL_STATUS.PASSED:
      return "Passed";
    case PROPOSAL_STATUS.REJECTED:
      return "Rejected";
    case PROPOSAL_STATUS.EXECUTED:
      return "Executed";
    case PROPOSAL_STATUS.CANCELED:
      return "Canceled";
    default:
      return "Unknown";
  }
};

export const getProposalStatusColor = (status: number): string => {
  switch (status) {
    case PROPOSAL_STATUS.PENDING:
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case PROPOSAL_STATUS.ACTIVE:
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case PROPOSAL_STATUS.PASSED:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case PROPOSAL_STATUS.REJECTED:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case PROPOSAL_STATUS.EXECUTED:
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case PROPOSAL_STATUS.CANCELED:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

// Task status helper functions
export const getTaskStatusLabel = (status: number): string => {
  switch (status) {
    case TASK_STATUS.OPEN:
      return "Open";
    case TASK_STATUS.ASSIGNED:
      return "Assigned";
    case TASK_STATUS.SUBMITTED:
      return "Submitted";
    case TASK_STATUS.COMPLETED:
      return "Completed";
    case TASK_STATUS.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export const getTaskStatusColor = (status: number): string => {
  switch (status) {
    case TASK_STATUS.OPEN:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case TASK_STATUS.ASSIGNED:
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case TASK_STATUS.SUBMITTED:
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case TASK_STATUS.COMPLETED:
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case TASK_STATUS.CANCELLED:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

// Vote type helper functions
export const getVoteTypeLabel = (voteType: number): string => {
  switch (voteType) {
    case VOTE_TYPES.FOR:
      return "For";
    case VOTE_TYPES.AGAINST:
      return "Against";
    case VOTE_TYPES.ABSTAIN:
      return "Abstain";
    default:
      return "Unknown";
  }
};

export const getVoteTypeColor = (voteType: number): string => {
  switch (voteType) {
    case VOTE_TYPES.FOR:
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case VOTE_TYPES.AGAINST:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case VOTE_TYPES.ABSTAIN:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

// Environment setup instructions
export const SETUP_INSTRUCTIONS = `
To set up your environment variables:

1. Create a .env.local file in the project root
2. Add the following variables:

NEXT_PUBLIC_MODULE_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_MODULE_NAME=contracts
NEXT_PUBLIC_ADMIN_ADDRESS=your_admin_wallet_address
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_NODE_URL=https://api.devnet.aptoslabs.com/v1

3. Replace the placeholder values with your actual deployment details
4. Make sure your contract is deployed and initialized on the specified network
`;