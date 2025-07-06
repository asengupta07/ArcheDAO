import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { 
  Aptos, 
  AptosConfig, 
  Network,
} from "@aptos-labs/ts-sdk";
import { CONTRACT_CONFIG, CONTRACT_FUNCTIONS, PROPOSAL_STATUS, USER_TYPES } from "@/config/contract";

const aptosConfig = new AptosConfig({
  network: CONTRACT_CONFIG.NETWORK as Network,
});
const aptos = new Aptos(aptosConfig);

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

export interface UserStakingInfo {
  staked_apt: string;
  calculated_voting_power: string;
  voting_percentage: string;
  can_vote: boolean;
  is_governor: boolean;
  is_creator: boolean;
  dao_id: string;
  total_dao_staked: string;
  reserved_power: string;
  staked_power: string;
}

export interface UserProfile {
  address: string;
  user_type: number;
  reputation_score: string;
  contribution_score: string;
  is_premium: boolean;
  premium_expires: string;
  voting_power: string;
}

export interface DAOInfo {
  id: string;
  dao_code: string;
  name: string;
  description: string;
  creator: string;
  total_staked: string;
  treasury_balance: string;
  is_active: boolean;
}

export interface UserDAOMembership {
  is_member: boolean;
  voting_power: string;
  is_governor: boolean;
  is_creator: boolean;
  join_date: string;
}

export interface AIPInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
}

export const useProposals = (daoId?: string) => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [proposals, setProposals] = useState<ProposalInfo[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStakingInfo, setUserStakingInfo] = useState<UserStakingInfo | null>(null);
  const [userAIPs, setUserAIPs] = useState<AIPInfo[]>([]);
  const [daoInfo, setDaoInfo] = useState<DAOInfo | null>(null);
  const [userMembership, setUserMembership] = useState<UserDAOMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch DAO information
  const fetchDAOInfo = async () => {
    if (!daoId) return;

    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_DAO_BY_ID,
          typeArguments: [],
          functionArguments: [Number(daoId)],
        },
      });

      const daoData = result as [string, string, string, string, string, string, string, boolean];
      
      setDaoInfo({
        id: daoData[0],
        dao_code: daoData[1],
        name: daoData[2],
        description: daoData[3],
        creator: daoData[4],
        total_staked: daoData[5],
        treasury_balance: daoData[6],
        is_active: daoData[7],
      });
    } catch (error) {
      console.error("Error fetching DAO info:", error);
      setError("Failed to fetch DAO information");
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!account?.address) return;

    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_USER_PROFILE,
          typeArguments: [],
          functionArguments: [account.address],
        },
      });

      const profileData = result as [string, number, string, string, boolean, string, string];
      
      setUserProfile({
        address: profileData[0],
        user_type: profileData[1],
        reputation_score: profileData[2],
        contribution_score: profileData[3],
        is_premium: profileData[4],
        premium_expires: profileData[5],
        voting_power: profileData[6],
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // User might not have a profile yet
      setUserProfile(null);
    }
  };

  // Fetch user membership in DAO
  const fetchUserMembership = async () => {
    if (!account?.address || !daoId) return;

    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_dao_membership_info`,
          typeArguments: [],
          functionArguments: [account.address, Number(daoId)],
        },
      });

      const membershipData = result as [boolean, string, boolean, boolean];
      
      setUserMembership({
        is_member: membershipData[0],
        voting_power: membershipData[1],
        is_governor: membershipData[2],
        is_creator: membershipData[3],
        join_date: "0", // Not tracked in current contract
      });
    } catch (error) {
      console.error("Error fetching user membership:", error);
      setUserMembership(null);
    }
  };

  // Fetch user staking info
  const fetchUserStakingInfo = async () => {
    if (!account?.address || !daoId) return;

    try {
      // Get user's staking info
      const stakingResult = await aptos.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_staking_info`,
          typeArguments: [],
          functionArguments: [account.address, Number(daoId)],
        },
      });

      const stakingData = stakingResult as [string, string, string, boolean];
      
      // Get voting power breakdown
      const breakdownResult = await aptos.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_voting_power_breakdown`,
          typeArguments: [],
          functionArguments: [account.address, Number(daoId)],
        },
      });

      const breakdownData = breakdownResult as [string, string, string, string, boolean];
      
      // Get total staked in DAO
      const totalStakedResult = await aptos.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_total_staked`,
          typeArguments: [],
          functionArguments: [Number(daoId)],
        },
      });

      const totalStaked = totalStakedResult[0] as string;
      
      setUserStakingInfo({
        staked_apt: stakingData[0],
        calculated_voting_power: stakingData[1],
        voting_percentage: stakingData[2],
        can_vote: stakingData[3],
        is_governor: breakdownData[4],
        is_creator: userMembership?.is_creator || false,
        dao_id: daoId,
        total_dao_staked: totalStaked,
        reserved_power: breakdownData[0],
        staked_power: breakdownData[1],
      });
    } catch (error) {
      console.error("Error fetching user staking info:", error);
      setUserStakingInfo(null);
    }
  };

  // Fetch DAO proposals
  const fetchProposals = async () => {
    if (!daoId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_DAO_PROPOSALS,
          typeArguments: [],
          functionArguments: [Number(daoId)],
        },
      });

      const proposalsData = result[0] as any[];
      
      const proposalsList: ProposalInfo[] = proposalsData.map((proposal: any) => ({
        id: proposal.id.toString(),
        dao_id: proposal.dao_id.toString(),
        title: proposal.title,
        description: proposal.description,
        proposer: proposal.proposer,
        start_time: proposal.start_time.toString(),
        end_time: proposal.end_time.toString(),
        execution_time: proposal.execution_time.toString(),
        yes_votes: proposal.yes_votes.toString(),
        no_votes: proposal.no_votes.toString(),
        abstain_votes: proposal.abstain_votes.toString(),
        total_votes: proposal.total_votes.toString(),
        state: Number(proposal.state),
        linked_aip: proposal.linked_aip?.vec?.[0] || null,
        created_at: proposal.created_at.toString(),
        user_voted: proposal.user_voted,
        user_vote: proposal.user_vote?.vec?.[0] || null,
      }));

      // If user is connected, check their voting status for each proposal
      if (account?.address) {
        const proposalsWithVotingStatus = await Promise.all(
          proposalsList.map(async (proposal) => {
            try {
              const hasVotedResult = await aptos.view({
                payload: {
                  function: CONTRACT_FUNCTIONS.HAS_VOTED,
                  typeArguments: [],
                  functionArguments: [Number(proposal.id), account.address],
                },
              });
              
              return {
                ...proposal,
                user_voted: hasVotedResult[0] as boolean,
              };
            } catch (error) {
              console.error(`Error checking vote status for proposal ${proposal.id}:`, error);
              return proposal;
            }
          })
        );
        
        setProposals(proposalsWithVotingStatus);
      } else {
        setProposals(proposalsList);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setError("Failed to fetch proposals");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user AIPs
  const fetchUserAIPs = async () => {
    if (!account?.address) return;

    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_USER_AIPS,
          typeArguments: [],
          functionArguments: [account.address],
        },
      });

      const aipsData = result[0] as any[];
      
      const aipsList: AIPInfo[] = aipsData.map((aip: any) => ({
        id: aip.id.toString(),
        title: aip.title,
        description: aip.description,
        category: aip.category,
        status: aip.status,
        created_at: aip.created_at.toString(),
      }));

      setUserAIPs(aipsList);
    } catch (error) {
      console.error("Error fetching user AIPs:", error);
      setUserAIPs([]);
    }
  };

  // Create proposal
  const createProposal = async (
    title: string,
    description: string,
    category: string,
    linkedAip?: string
  ) => {
    if (!account?.address || !daoId) {
      throw new Error("Wallet not connected or DAO ID missing");
    }

    try {
      const result = await signAndSubmitTransaction({
        data: {
          function: CONTRACT_FUNCTIONS.CREATE_PROPOSAL,
          typeArguments: [],
          functionArguments: [
            Number(daoId),
            title,
            description,
            new Uint8Array(), // execution_payload - empty for now
            linkedAip ? Number(linkedAip) : null, // Optional linked AIP
          ],
        },
      });
      
      await aptos.waitForTransaction({ transactionHash: result.hash });
      
      // Refresh data after creation
      await fetchProposals();
      
      return result;
    } catch (error) {
      console.error("Error creating proposal:", error);
      throw error;
    }
  };

  // Vote on proposal
  const voteOnProposal = async (proposalId: string, vote: number) => {
    if (!account?.address) {
      throw new Error("Wallet not connected");
    }

    if (!userStakingInfo?.can_vote) {
      throw new Error("You don't have sufficient voting power to vote");
    }

    try {
      const result = await signAndSubmitTransaction({
        data: {
          function: CONTRACT_FUNCTIONS.VOTE_ON_PROPOSAL,
          typeArguments: [],
          functionArguments: [Number(proposalId), vote],
        },
      });
      
      await aptos.waitForTransaction({ transactionHash: result.hash });
      
      // Refresh data after voting
      await fetchProposals();
      
      return result;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      throw error;
    }
  };

  // Stake for voting power
  const stakeForVotingPower = async (amount: string) => {
    if (!account?.address || !daoId) {
      throw new Error("Wallet not connected or DAO ID missing");
    }

    try {
      const result = await signAndSubmitTransaction({
        data: {
          function: CONTRACT_FUNCTIONS.STAKE_FOR_VOTING_POWER,
          typeArguments: [],
          functionArguments: [Number(daoId), Number(amount)],
        },
      });
      
      await aptos.waitForTransaction({ transactionHash: result.hash });
      
      // Refresh data after staking
      await fetchAll();
      
      return result;
    } catch (error) {
      console.error("Error staking for voting power:", error);
      throw error;
    }
  };

  // Unstake voting power
  const unstakeVotingPower = async (amount: string) => {
    if (!account?.address || !daoId) {
      throw new Error("Wallet not connected or DAO ID missing");
    }

    try {
      const result = await signAndSubmitTransaction({
        data: {
          function: CONTRACT_FUNCTIONS.UNSTAKE_VOTING_POWER,
          typeArguments: [],
          functionArguments: [Number(daoId), Number(amount)],
        },
      });
      
      await aptos.waitForTransaction({ transactionHash: result.hash });
      
      // Refresh data after unstaking
      await fetchAll();
      
      return result;
    } catch (error) {
      console.error("Error unstaking voting power:", error);
      throw error;
    }
  };

  // Check if user can create proposals
  const canCreateProposal = () => {
    if (!userProfile) return false;
    return (
      userProfile.user_type === USER_TYPES.DAO_CREATOR ||
      userProfile.user_type === USER_TYPES.GOVERNOR ||
      userMembership?.is_creator ||
      userMembership?.is_governor
    );
  };

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchDAOInfo(),
        fetchUserProfile(),
        fetchUserMembership(),
        fetchProposals(),
        fetchUserAIPs(),
      ]);

      // Fetch staking info after membership is loaded
      await fetchUserStakingInfo();
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account?.address && daoId) {
      fetchAll();
    }
  }, [account?.address, daoId]);

  return {
    proposals,
    userProfile,
    userStakingInfo,
    userAIPs,
    daoInfo,
    userMembership,
    loading,
    error,
    createProposal,
    voteOnProposal,
    stakeForVotingPower,
    unstakeVotingPower,
    canCreateProposal,
    refetch: fetchAll,
  };
};
