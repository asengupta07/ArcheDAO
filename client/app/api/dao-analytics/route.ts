import { NextResponse } from 'next/server';
import { generate } from '@/components/func/generate';
import { Aptos, AptosConfig, Network as AptosNetwork, AccountAddress } from '@aptos-labs/ts-sdk';
import { CONTRACT_CONFIG } from '@/config/contract';
import { parseUntilJson } from '@/components/func/parseUntilJson';

interface AnalyticsRequest {
  userAddress: string | { address: string } | { data: { [key: number]: number } };
}

export async function POST(request: Request) {
  try {
    const body: AnalyticsRequest = await request.json();
    const { userAddress } = body;
    console.log('Received request:', {
      userAddressType: typeof userAddress,
      userAddressValue: userAddress,
    });

    // Handle different address formats
    let addressString: string;
    if (typeof userAddress === 'string') {
      addressString = userAddress;
    } else if (typeof userAddress === 'object' && userAddress !== null) {
      if ('address' in userAddress) {
        addressString = userAddress.address;
      } else if ('data' in userAddress) {
        // Convert Uint8Array-like object to hex string
        const bytes = Object.values(userAddress.data);
        addressString = '0x' + Buffer.from(bytes).toString('hex');
      } else {
        throw new Error('Invalid address format');
      }
    } else {
      throw new Error('Invalid address format');
    }

    // Validate address format
    if (!addressString || typeof addressString !== 'string') {
      throw new Error('Invalid address string');
    }

    // Ensure address has 0x prefix
    if (!addressString.startsWith('0x')) {
      addressString = '0x' + addressString;
    }

    // Ensure address is the correct length (32 bytes = 64 hex chars + '0x' prefix = 66 chars)
    if (addressString.length !== 66) {
      throw new Error(`Invalid address length: ${addressString.length} (expected 66)`);
    }

    console.log('Processed address:', addressString);

    // Convert userAddress to AccountAddress
    const userAccountAddress = AccountAddress.fromString(addressString);

    // Initialize Aptos client
    const config = new AptosConfig({ network: AptosNetwork.DEVNET });
    const aptosClient = new Aptos(config);

    // Get complete ecosystem data
    const ecosystemData = await aptosClient.view({
      payload: {
        function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULE_NAME}::get_complete_user_dao_ecosystem`,
        functionArguments: [userAccountAddress],
      },
    });

    // Create a prompt for AI analysis
    const prompt = `
      You are an expert DAO analyst. Analyze this DAO ecosystem data and provide insights in a structured JSON format.
      Format the response as a valid JSON object with the following structure:

      {
        "overview": {
          "summary": "Brief text summary of overall health",
          "totalDaos": number,
          "totalVotingPower": number,
          "governanceScore": number (0-100),
          "participationRate": number (0-100)
        },
        "trends": {
          "proposalActivity": {
            "total": number,
            "byUser": number,
            "successRate": number,
            "categories": [{"name": string, "count": number}]
          },
          "taskCompletion": {
            "total": number,
            "byUser": number,
            "completionRate": number,
            "categories": [{"name": string, "count": number}]
          },
          "votingPatterns": {
            "totalVotes": number,
            "averageParticipation": number,
            "consistencyScore": number
          }
        },
        "daoSpecificMetrics": [{
          "name": string,
          "memberCount": number,
          "treasuryBalance": number,
          "userRole": string,
          "votingPower": number,
          "proposalCount": number,
          "taskCount": number,
          "healthScore": number (0-100)
        }],
        "recommendations": {
          "governance": string[],
          "participation": string[],
          "growth": string[]
        }
      }

      Analyze this data and provide insights:
      ${JSON.stringify(ecosystemData, null, 2)}
    `;

    // Generate AI analysis
    const analysisText = await generate(prompt);
    
    // Parse the AI response into JSON
    let analysis;
    try {
      // Find the JSON object in the response (it might have additional text)
      if (analysisText) {
        analysis = parseUntilJson(analysisText);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Analysis:', analysis);

    // Return the structured analysis
    return NextResponse.json({
      success: true,
      data: {
        rawEcosystem: ecosystemData[0],
        analysis
      }
    });

  } catch (error) {
    console.error('Error in DAO analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate DAO analytics'
      },
      { status: 500 }
    );
  }
} 