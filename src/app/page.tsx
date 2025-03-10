"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { JsonViewer } from "@textea/json-viewer";
import {
  Loader2,
  RotateCcw,
  ExternalLink,
  FileJson,
  Hash,
  FileText,
  Coins,
} from "lucide-react";
import DiagramPreview from "../components/DiagramPreview";
import SkeletonCard from "@/components/SkeletonCard";
import MarkdownExplanation from "@/components/MarkdownExplanation";

// 솔라나 샘플 데이터
const SOLANA_SAMPLE = {
  transaction: {
    signatures: [
      "3vZ67CGoRYkuT76TtpP2VrtTPBfnvG2xCxHzrZgLJQqKtZUsDc7V14sp4p1qRnnkXXXXXX",
    ],
    blockTime: 1674394532,
    slot: 178234842,
    transaction: {
      signatures: [
        "3vZ67CGoRYkuT76TtpP2VrtTPBfnvG2xCxHzrZgLJQqKtZUsDc7V14sp4p1qRnnkXXXXXX",
      ],
      message: {
        accountKeys: [
          "3Katmm9dhiv6JFxnYVuArNfEjFjGF9K8Tbm8npwGZ5X3",
          "ARjxR3dJ3UXbKqG5yiMpTffzuhfLSYFvAe1TZen9o1P7",
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "11111111111111111111111111111111",
        ],
        instructions: [
          {
            programIdIndex: 2,
            accounts: [0, 1],
            data: "3DdGGhkhJbjm",
          },
        ],
      },
    },
    meta: {
      fee: 5000,
      postBalances: [10000000, 2039280, 1, 1],
      preBalances: [15000000, 2039280, 1, 1],
      status: { Ok: null },
      logMessages: [
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
        "Program log: Transfer 5 SOL from 3Katmm9dhiv6JFxnYVuArNfEjFjGF9K8TbmXXXXXX to ARjxR3dJ3UXbKqG5yiMpTffzuhfLSYFvAe1TXXXXXX",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      ],
    },
  },
  explanation:
    "## Solana Token Transfer\n\nThis transaction represents a token transfer on the Solana blockchain.\n\n### Transaction Details:\n- **Type**: Token transfer\n- **Amount**: 5 SOL\n- **From**: 3Katmm9dhiv6JFxnYVuArNfEjFjGF9K8TbmXXXXXX\n- **To**: ARjxR3dJ3UXbKqG5yiMpTffzuhfLSYFvAe1TXXXXXX\n- **Fee**: 0.000005 SOL (5000 lamports)\n- **Timestamp**: January 22, 2023\n\n### Program Involved:\n- **Token Program**: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\n\nThis transaction was successfully executed and the tokens were transferred to the destination address.",
  diagram:
    "graph TD\n    A[3Katmm...pGZ5X3] -->|5 SOL| B[ARjxR...en9o1P7]\n    A -->|0.000005 SOL| C[Transaction Fee]\n    D[Token Program] -->|Executed| E[Token Transfer]\n    E -->|Success| F[Balance Updated]\n    style A fill:#9945FF,color:white\n    style B fill:#9945FF,color:white\n    style C fill:#14F195,color:black\n    style D fill:#9945FF,color:white\n    style E fill:#14F195,color:black\n    style F fill:#14F195,color:black",
};

// 솔라나 익스플로러 URL
const SOLANA_EXPLORER_URL = "https://explorer.solana.com/tx";

export default function SolanaTransactionParser() {
  const [inputType, setInputType] = useState<"json" | "hash">("json");
  const [input, setInput] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] = useState<any>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [diagramDefinition, setDiagramDefinition] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchDiagram = async (txData: any) => {
    try {
      const response = await fetch(`/api/tx-diagram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: txData,
          type: inputType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate diagram");
      }

      const data = await response.json();
      return data.diagram;
    } catch (error) {
      console.error("Error fetching diagram:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setDiagramDefinition("");

    try {
      let response: Response;
      let transactionData;

      if (inputType === "json") {
        try {
          const parsedJson = JSON.parse(input);
          setParsedTransaction(parsedJson);
          transactionData = parsedJson;

          response = await fetch(`/api/tx-parse`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ transaction: parsedJson }),
          });
        } catch (err) {
          throw new Error("Invalid JSON format");
        }
      } else {
        // Hash input
        response = await fetch(`/api/tx-parse?hash=${input}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse transaction");
      }

      if (data.transaction) {
        transactionData = data.transaction;
        setParsedTransaction(data.transaction);
      }
      setExplanation(data.explanation);

      const diagram = await fetchDiagram(transactionData);
      if (diagram) {
        setDiagramDefinition(diagram);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setParsedTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParsedTransaction(null);
    setExplanation("");
    setError("");
    setInput("");
    setDiagramDefinition("");
  };

  const getExplorerUrl = (transaction: any): string => {
    const hash =
      transaction.transaction?.signatures?.[0] || transaction.signatures?.[0];
    return `${SOLANA_EXPLORER_URL}/${hash}`;
  };

  return (
    <main className="w-full h-full min-h-screen relative">
      {/* 솔라나 컬러 테마의 배경 그라디언트 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(153,69,255,0.05),rgba(20,241,149,0.08))]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-gray-50/50 to-purple-100/40" />
      <div className="absolute inset-0 bg-gradient-to-tr from-green-100/30 via-white/40 to-purple-50/30" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="max-w-7xl mx-auto w-full h-full min-h-screen flex flex-col p-8 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-xl">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] text-transparent bg-clip-text">
                Solana Transaction Parser
              </h1>
              <p className="text-sm text-gray-600">
                AI-powered specialized transaction parser using Mixture of
                Experts for SPL tokens, DeFi, NFTs, and Governance
              </p>
            </div>
          </div>
        </div>
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 rounded-xl border-red-200 bg-red-50"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
          {/* Left Column */}
          <div className="h-full flex flex-col">
            <Card className="flex-1 flex flex-col rounded-xl border-purple-200 shadow-xl shadow-purple-200/20 overflow-hidden backdrop-blur-sm bg-white/80">
              <CardHeader className="flex flex-col space-y-4 bg-gradient-to-br from-purple-50 to-white border-b border-purple-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {parsedTransaction ? (
                      <FileJson className="h-5 w-5 text-[#9945FF]" />
                    ) : (
                      <Hash className="h-5 w-5 text-[#9945FF]" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-800">
                      {parsedTransaction
                        ? "Solana Transaction Data"
                        : "Input Solana Transaction"}
                    </h2>
                  </div>
                  <Button
                    onClick={parsedTransaction ? handleReset : handleSubmit}
                    disabled={loading || (!input && !parsedTransaction)}
                    variant={parsedTransaction ? "outline" : "default"}
                    className={`min-w-32 rounded-lg transition-all duration-200 ${
                      parsedTransaction
                        ? "hover:bg-purple-100 border-purple-200"
                        : "bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 text-white border-none"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : parsedTransaction ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </>
                    ) : (
                      "Analyze Transaction"
                    )}
                  </Button>
                </div>
                {!parsedTransaction && (
                  <div className="space-y-4">
                    <RadioGroup
                      defaultValue="json"
                      value={inputType}
                      onValueChange={(value) => {
                        setInputType(value as "json" | "hash");
                        setInput("");
                      }}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="json"
                          id="json"
                          className="text-[#9945FF]"
                        />
                        <Label
                          htmlFor="json"
                          className="font-medium cursor-pointer text-gray-800"
                        >
                          JSON Input
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="hash"
                          id="hash"
                          className="text-[#9945FF]"
                        />
                        <Label
                          htmlFor="hash"
                          className="font-medium cursor-pointer text-gray-800"
                        >
                          Transaction Hash
                        </Label>
                      </div>
                    </RadioGroup>
                    <div className="flex gap-4 pt-2">
                      <div className="text-xs text-gray-500">
                        Specialized experts analyze your transaction for: SPL
                        Token, DeFi, NFT/Metaplex, and Governance instructions
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0 relative">
                {parsedTransaction ? (
                  <div className="h-full overflow-auto p-4 bg-purple-50/50">
                    <JsonViewer
                      value={parsedTransaction}
                      defaultInspectDepth={2}
                      rootName={false}
                      enableClipboard
                      theme="light"
                    />
                  </div>
                ) : inputType === "json" ? (
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your Solana transaction JSON here..."
                    className="h-full resize-none rounded-none border-0 focus-visible:ring-1 focus-visible:ring-[#9945FF] focus-visible:ring-offset-0 bg-white/90"
                  />
                ) : (
                  <div className="p-4">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter Solana transaction hash..."
                      className="w-full rounded-lg border-purple-200 focus:border-[#9945FF] bg-white/90"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Right Column */}
          <div className="h-full">
            <Card className="h-full flex flex-col rounded-xl border-green-200 shadow-xl shadow-green-200/20 backdrop-blur-sm bg-white/80">
              <CardHeader className="bg-gradient-to-br from-green-50 to-white border-b border-green-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#14F195]" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Analysis
                  </h2>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-6">
                  {explanation ? (
                    <>
                      {diagramDefinition && (
                        <div className="mb-6">
                          <DiagramPreview
                            diagramDefinition={diagramDefinition}
                          />
                        </div>
                      )}
                      <MarkdownExplanation content={explanation} />
                      {parsedTransaction && (
                        <div className="pt-4 border-t border-green-200">
                          <a
                            href={getExplorerUrl(parsedTransaction)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#9945FF] hover:text-[#14F195] transition-colors group"
                          >
                            <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                            View on Solana Explorer
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <SkeletonCard />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
