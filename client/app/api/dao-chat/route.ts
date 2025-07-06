import { NextResponse } from 'next/server';
import { generate } from '@/components/func/generate';
import { Aptos, AptosConfig, Network as AptosNetwork, MoveValue, AccountAddress } from '@aptos-labs/ts-sdk';
import { CONTRACT_CONFIG } from '@/config/contract';

interface DAOChatRequest {
  userAddress: string | { address: string };
  daoId: string;
  message: string;
}

interface DAOInfo {
  id: string;
  name: string;
  description: string;
  analytics: {
    memberCount: number;
    proposalCount: number;
    taskCount: number;
    totalStaked: number;
    treasuryBalance: number;
  };
  userRole: {
    isMember: boolean;
    votingPower: number;
    isGovernor: boolean;
    isCreator: boolean;
  };
  staking: {
    stakeAmount: number;
    votingPower: number;
    votingPercentage: number;
    canVote: boolean;
  };
}

interface DAOEcosystemData {
  total_daos_joined: MoveValue;
  total_voting_power: MoveValue;
  total_proposals_created: MoveValue;
  total_tasks_created: MoveValue;
  total_votes_cast: MoveValue;
  daos: Array<{
    dao_info: {
      name: MoveValue;
      member_count: MoveValue;
      proposal_count: MoveValue;
      task_count: MoveValue;
    };
    user_membership: {
      is_creator: MoveValue;
      is_governor: MoveValue;
      voting_power: MoveValue;
    };
    user_proposals_created: MoveValue;
    user_tasks_created: MoveValue;
    user_votes_cast: MoveValue;
  }>;
}

const moveValueToString = (value: MoveValue): string => {
  if (value === undefined || value === null) return '';
  return value.toString();
};

const moveValueToNumber = (value: MoveValue): number => {
  if (value === undefined || value === null) return 0;
  return Number(value.toString());
};

const moveValueToBoolean = (value: MoveValue): boolean => {
  if (value === undefined || value === null) return false;
  return Boolean(value);
};

export async function POST(request: Request) {
  try {
    const body: DAOChatRequest = await request.json();
    const { userAddress, daoId, message } = body;

    console.log('Received request:', {
      userAddressType: typeof userAddress,
      userAddressValue: userAddress,
      daoId,
    });

    // Handle userAddress whether it's a string or an object
    const addressString = typeof userAddress === 'string' ? userAddress : userAddress.address;
    
    console.log('Processed address:', {
      addressString,
      isString: typeof addressString === 'string',
      length: addressString?.length,
    });

    // Validate address format
    if (!addressString || typeof addressString !== 'string') {
      throw new Error('Invalid user address format');
    }

    // Validate address format looks like an Aptos address
    if (!addressString.startsWith('0x') || addressString.length !== 66) {
      throw new Error(`Invalid Aptos address format: ${addressString}`);
    }

    // Convert userAddress to AccountAddress
    const userAccountAddress = AccountAddress.fromString(addressString);

    // Initialize Aptos client
    const config = new AptosConfig({ network: AptosNetwork.DEVNET });
    const aptosClient = new Aptos(config);

    // Get complete ecosystem data first
    const ecosystemData = await aptosClient.view({
      payload: {
        function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_complete_user_dao_ecosystem`,
        functionArguments: [userAccountAddress],
      },
    });

    // Cast ecosystem data to our interface
    const ecosystem = ecosystemData[0] as DAOEcosystemData;

    // Then get specific DAO data
    const [
      daoInfo,
      analytics,
      membershipInfo,
      stakingInfo
    ] = await Promise.all([
      aptosClient.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_by_id`,
          functionArguments: [BigInt(daoId)],
        },
      }),
      aptosClient.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_dao_analytics`,
          functionArguments: [BigInt(daoId)],
        },
      }),
      aptosClient.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_dao_membership_info`,
          functionArguments: [userAccountAddress, BigInt(daoId)],
        },
      }),
      aptosClient.view({
        payload: {
          function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_user_staking_info`,
          functionArguments: [userAccountAddress, BigInt(daoId)],
        },
      }),
    ]);

    // Structure the DAO data
    const structuredData: DAOInfo = {
      id: daoId,
      name: moveValueToString(daoInfo[2]),
      description: moveValueToString(daoInfo[3]),
      analytics: {
        memberCount: moveValueToNumber(analytics[0]),
        proposalCount: moveValueToNumber(analytics[1]),
        taskCount: moveValueToNumber(analytics[2]),
        totalStaked: moveValueToNumber(analytics[3]),
        treasuryBalance: moveValueToNumber(analytics[4]),
      },
      userRole: {
        isMember: moveValueToBoolean(membershipInfo[0]),
        votingPower: moveValueToNumber(membershipInfo[1]),
        isGovernor: moveValueToBoolean(membershipInfo[2]),
        isCreator: moveValueToBoolean(membershipInfo[3]),
      },
      staking: {
        stakeAmount: moveValueToNumber(stakingInfo[0]),
        votingPower: moveValueToNumber(stakingInfo[1]),
        votingPercentage: moveValueToNumber(stakingInfo[2]),
        canVote: moveValueToBoolean(stakingInfo[3]),
      },
    };

    // Create a context-rich prompt for Gemini
    const prompt = `
      You are an AI assistant for the DAO "${structuredData.name}". Here is the current state of the DAO ecosystem:

      Overall Ecosystem Stats:
      - Total DAOs Joined: ${moveValueToNumber(ecosystem.total_daos_joined)}
      - Total Voting Power Across DAOs: ${moveValueToNumber(ecosystem.total_voting_power)}
      - Total Proposals Created: ${moveValueToNumber(ecosystem.total_proposals_created)}
      - Total Tasks Created: ${moveValueToNumber(ecosystem.total_tasks_created)}
      - Total Votes Cast: ${moveValueToNumber(ecosystem.total_votes_cast)}

      All DAOs (${ecosystem.daos.length}):
      ${ecosystem.daos.map((dao) => `
      - ${moveValueToString(dao.dao_info.name)}:
        * Members: ${moveValueToNumber(dao.dao_info.member_count)}
        * Your Role: ${moveValueToBoolean(dao.user_membership.is_creator) ? 'Creator' : 
                     moveValueToBoolean(dao.user_membership.is_governor) ? 'Governor' : 'Member'}
        * Your Voting Power: ${moveValueToNumber(dao.user_membership.voting_power)}
        * Proposals: ${moveValueToNumber(dao.dao_info.proposal_count)} (You created: ${moveValueToNumber(dao.user_proposals_created)})
        * Tasks: ${moveValueToNumber(dao.dao_info.task_count)} (You created: ${moveValueToNumber(dao.user_tasks_created)})
        * Your Votes Cast: ${moveValueToNumber(dao.user_votes_cast)}
      `).join('')}

      Current DAO (${structuredData.name}) Details:
      Description: ${structuredData.description}
      
      Analytics:
      - Member Count: ${structuredData.analytics.memberCount}
      - Proposal Count: ${structuredData.analytics.proposalCount}
      - Task Count: ${structuredData.analytics.taskCount}
      - Total Staked: ${structuredData.analytics.totalStaked}
      - Treasury Balance: ${structuredData.analytics.treasuryBalance}
      
      Your Role:
      - Member: ${structuredData.userRole.isMember}
      - Governor: ${structuredData.userRole.isGovernor}
      - Creator: ${structuredData.userRole.isCreator}
      - Voting Power: ${structuredData.userRole.votingPower}
      
      Staking Info:
      - Stake Amount: ${structuredData.staking.stakeAmount}
      - Voting Power: ${structuredData.staking.votingPower}
      - Voting Percentage: ${structuredData.staking.votingPercentage}%
      - Can Vote: ${structuredData.staking.canVote}

      With all this context, please answer the following question as a conversational and concise response.
      Answer this question: ${message}
    `;

    // Generate response using Gemini
    const response = await generate(prompt);

    // Return structured response with both specific DAO and ecosystem data
    return NextResponse.json({
      success: true,
      data: {
        daoInfo: structuredData,
        ecosystem: ecosystem,
        response,
      },
    });
  } catch (error) {
    console.error('Error in DAO chat:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process DAO chat request'
      },
      { status: 500 }
    );
  }
} 