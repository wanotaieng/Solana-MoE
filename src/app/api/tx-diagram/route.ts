import { openai, modelName } from "@/lib/openai";
import { NextResponse } from "next/server";

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

interface ApiResponse {
  diagram: string;
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

function detectTransactionType(transaction: any): string {
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

  return "SYSTEM";
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

    // Extract from instructions
    const instructions = transaction?.transaction?.message?.instructions || [];
    if (Array.isArray(instructions)) {
      instructions.forEach((instruction) => {
        if (instruction?.programId) {
          programIds.push(instruction.programId);
        }
      });
    }

    // Extract from inner instructions if available
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

async function generateDiagram(transaction: any): Promise<string> {
  const transactionType = detectTransactionType(transaction);
  const systemPrompt = getDiagramSystemPrompt(transactionType);

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Convert this Solana transaction into a Mermaid diagram. Return only the diagram code: ${JSON.stringify(
          transaction
        )}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    presence_penalty: 0.1,
  });

  if (!completion.choices[0]?.message?.content) {
    throw new Error("Invalid response from AI model");
  }

  const diagramCode = completion.choices[0].message.content.trim();

  const cleanedCode = diagramCode
    .replace(/^(Here's|This is|Generated|Creating|The).*?\n/i, "")
    .replace(/^```mermaid\n?/, "")
    .replace(/```$/, "")
    .replace(/###.*$/, "")
    .replace(/Explanation:?[\s\S]*$/, "")
    .trim();

  if (
    !cleanedCode.startsWith("graph") &&
    !cleanedCode.startsWith("flowchart") &&
    !cleanedCode.startsWith("sequenceDiagram")
  ) {
    throw new Error("Invalid diagram code generated");
  }

  return cleanedCode;
}

function getDiagramSystemPrompt(transactionType: string): string {
  const basePrompt = `You are an expert in creating Mermaid diagrams for Solana blockchain transactions. Your task is to generate ONLY the Mermaid diagram code without any additional text or explanations. 

Use Solana's branding colors for the diagram:
- Primary Purple: #9945FF
- Primary Green: #14F195
- Secondary colors: white or light gray for backgrounds

IMPORTANT: Return ONLY the Mermaid diagram code without any surrounding text, explanations, or markdown code blocks.`;

  switch (transactionType) {
    case "SPL_TOKEN":
      return `${basePrompt}

For SPL Token transactions, create a FLOWCHART diagram (using flowchart TD or graph TD) showing:
1. Account interactions with arrows representing token transfers
2. Include token amounts and token symbols
3. Show the SPL Token program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA) as a node
4. Use stylized nodes with Solana colors:
   - style sender fill:#9945FF,color:white
   - style receiver fill:#9945FF,color:white
   - style programs fill:#14F195,color:black
   - style tokens/amounts fill:#14F195,color:black
5. Keep addresses short (first 6 chars) for readability`;

    case "NFT_METAPLEX":
      return `${basePrompt}

For NFT/Metaplex transactions, create a FLOWCHART diagram (using flowchart TD or graph TD) showing:
1. NFT movement between accounts
2. Metaplex program interactions
3. Metadata updates or creation
4. Collection relationships if applicable
5. Use stylized nodes with Solana colors:
   - style NFTs fill:#9945FF,color:white
   - style accounts fill:#9945FF,color:white
   - style metadata fill:#14F195,color:black
   - style programs fill:#14F195,color:black
6. Keep addresses short (first 6 chars) for readability`;

    case "DEFI":
      return `${basePrompt}

For DeFi transactions, create a FLOWCHART diagram (using flowchart TD or graph TD) showing:
1. Token swap flows with input and output amounts
2. Liquidity pool interactions
3. Price impact and fees where available
4. DeFi program interactions (Jupiter, Raydium, Orca, etc.)
5. Use stylized nodes with Solana colors:
   - style accounts fill:#9945FF,color:white
   - style tokens fill:#9945FF,color:white
   - style programs fill:#14F195,color:black
   - style amounts/rates fill:#14F195,color:black
6. Keep addresses short (first 6 chars) for readability`;

    case "GOVERNANCE":
      return `${basePrompt}

For Governance transactions, create a FLOWCHART diagram (using flowchart TD or graph TD) showing:
1. Proposal or voting actions
2. Treasury fund movements if applicable
3. Governance program interactions
4. Voting token details if available
5. Use stylized nodes with Solana colors:
   - style governance fill:#9945FF,color:white
   - style accounts fill:#9945FF,color:white
   - style actions fill:#14F195,color:black
   - style programs fill:#14F195,color:black
6. Keep addresses short (first 6 chars) for readability`;

    default:
      return `${basePrompt}

Create a FLOWCHART diagram (using flowchart TD or graph TD) showing:
1. Transaction signers and accounts involved
2. Program interactions with accounts
3. Any balance changes or state updates
4. Fees paid for transaction
5. Use stylized nodes with Solana colors:
   - style accounts fill:#9945FF,color:white
   - style programs fill:#14F195,color:black
   - style actions fill:#14F195,color:black
6. Keep addresses short (first 6 chars) for readability`;
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
    const diagram = await generateDiagram(transaction);

    const response: ApiResponse = {
      diagram,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating diagram:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing the transaction";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || (!body.transaction && !body.hash)) {
      return NextResponse.json(
        { error: "Transaction data or hash is required" },
        { status: 400 }
      );
    }

    let transaction;
    if (body.hash) {
      transaction = await fetchSolanaTransaction(body.hash);
    } else {
      transaction = body.transaction;
    }

    if (!transaction) {
      return NextResponse.json(
        { error: "Valid transaction data is required" },
        { status: 400 }
      );
    }

    const diagram = await generateDiagram(transaction);

    const response: ApiResponse = {
      diagram,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating diagram:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while generating the diagram";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
