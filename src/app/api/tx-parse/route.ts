import { openai, modelName } from "@/lib/openai";
import { NextResponse } from "next/server";

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

interface ApiResponse {
  transaction?: any;
  explanation: string;
  error?: string;
}

async function fetchSolanaTransaction(hash: string) {
  const response = await fetch(SOLANA_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        hash,
        {
          encoding: "json",
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch transaction: ${response.status} ${error}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to fetch transaction: ${data.error.message}`);
  }

  if (!data.result) {
    throw new Error("Transaction not found or not confirmed yet");
  }

  return data.result;
}

async function detectExpertModel(transaction: any): Promise<string> {
  const programIds = extractProgramIds(transaction);

  if (programIds.includes("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")) {
    return "SPL_TOKEN";
  } else if (
    programIds.includes("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  ) {
    return "NFT_METAPLEX";
  } else if (
    programIds.includes("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4") || // Jupiter
    programIds.includes("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8") || // Raydium
    programIds.includes("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc") // Orca
  ) {
    return "DEFI";
  } else if (
    programIds.includes("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw")
  ) {
    return "GOVERNANCE";
  }

  return "SPL_TOKEN";
}

function extractProgramIds(transaction: any): string[] {
  const programIds: string[] = [];

  try {
    const accountKeys = transaction?.transaction?.message?.accountKeys || [];
    if (Array.isArray(accountKeys)) {
      accountKeys.forEach((account) => {
        if (account?.programId) {
          programIds.push(account.pubkey);
        }
      });
    }

    const instructions = transaction?.transaction?.message?.instructions || [];
    if (Array.isArray(instructions)) {
      instructions.forEach((instruction) => {
        if (instruction?.programId) {
          programIds.push(instruction.programId);
        }
      });
    }

    const innerInstructions = transaction?.meta?.innerInstructions || [];
    if (Array.isArray(innerInstructions)) {
      innerInstructions.forEach((inner) => {
        const innerInsts = inner?.instructions || [];
        innerInsts.forEach((inst) => {
          if (inst?.programId) {
            programIds.push(inst.programId);
          }
        });
      });
    }
  } catch (error) {
    console.error("Error extracting program IDs:", error);
  }

  return [...new Set(programIds)];
}

async function analyzeTransaction(transaction: any): Promise<string> {
  const expertType = await detectExpertModel(transaction);
  const systemPrompt = getExpertSystemPrompt(expertType);

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Analyze this Solana transaction in detail: ${JSON.stringify(
          transaction
        )}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 800,
    presence_penalty: 0.1,
  });

  if (!completion.choices[0]?.message?.content) {
    throw new Error("Invalid response from AI model");
  }

  return completion.choices[0].message.content.trim();
}

function getExpertSystemPrompt(expertType: string): string {
  const basePrompt = `You are a Solana transaction analyzer specializing in ${expertType} transactions. Explain the transaction in a clear, structured way using markdown.

Include:
1. A brief summary (2-3 sentences) of what the transaction accomplishes
2. Transaction type and key details
3. Accounts involved (with readable labels when possible)
4. Token amounts with proper decimal places
5. Any fees or price impacts

Make your explanation accessible to both technical and non-technical users.`;

  switch (expertType) {
    case "SPL_TOKEN":
      return `${basePrompt}
      
You specialize in SPL Token transactions. Pay special attention to:
- Token transfers, mints, and burns
- Token account creations
- Authority changes
- Token program interactions (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
- Associated token account program interactions

For token amounts, ensure you convert to the proper decimal places based on the token's decimal field.`;

    case "NFT_METAPLEX":
      return `${basePrompt}
      
You specialize in NFT and Metaplex transactions. Pay special attention to:
- NFT mints, transfers, and burns
- Marketplace interactions (Magic Eden, OpenSea, etc.)
- Metaplex program interactions (metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s)
- Metadata updates and verifications
- Collection assignments and verifications

Identify the NFT name and collection when possible.`;

    case "DEFI":
      return `${basePrompt}
      
You specialize in DeFi transactions. Pay special attention to:
- Swaps, liquidity provision, and staking
- Jupiter, Raydium, Orca or other DEX interactions
- Lending and borrowing on protocols like Solend or Mango
- Yield farming and harvesting
- Price impacts and slippage

For swaps, clearly show the input and output tokens with their amounts and calculate the effective price.`;

    case "GOVERNANCE":
      return `${basePrompt}
      
You specialize in Governance transactions. Pay special attention to:
- Proposal creation, voting, and execution
- DAO treasury management
- Community token distributions
- Realm configurations
- Governance program interactions

Explain the significance of the governance action in context of the DAO when possible.`;

    default:
      return basePrompt;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    const transaction = await fetchSolanaTransaction(hash);
    const explanation = await analyzeTransaction(transaction);

    const response: ApiResponse = {
      transaction,
      explanation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing transaction:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while fetching the transaction";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { transaction } = await req.json();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction data is required" },
        { status: 400 }
      );
    }

    const explanation = await analyzeTransaction(transaction);

    const response: ApiResponse = {
      explanation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing transaction:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while parsing the transaction";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
