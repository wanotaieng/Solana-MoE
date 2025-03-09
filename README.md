# Solana Transaction Parser Application
## https://multichain-tx-parser.vercel.app/solana

This repository hosts a specialized transaction parser for Solana, built on a Mixture of Experts (MoE) approach. Each expert model is fine-tuned to handle distinct Solana modules—such as SPL tokens, DeFi protocols, NFTs (Metaplex), and Governance—while a routing model determines which expert is best suited for any given transaction.

## Overview

Solana's rich and rapidly expanding ecosystem makes transaction parsing non-trivial. Different dApps and protocols often use custom instructions, spl-token flows, or advanced program logic. A single large model frequently struggles to cover all of these domains without hallucinating or losing precision. To address this, we employ a two-stage fine-tuning methodology on top of [Qwen1.5-MoE-A2.7B](https://huggingface.co/Qwen/Qwen1.5-MoE-A2.7B) and integrate a routing mechanism—ModernBERT—to direct incoming transactions to the right expert.

## Key Features

1. **Two-Stage Fine-Tuning**  
   - **Stage 1**: Fine-tune the base model on Solana Program Library (SPL) and Rust-specific documentation to build a robust foundational understanding of Solana’s core mechanics.  
   - **Stage 2**: Further fine-tune using a curated Q&A dataset of real Solana transactions, ensuring each expert can generate clear, human-readable explanations.

2. **Modular Experts**  
   - **SPL Expert**: Analyzes token transfers, token account creations, and various SPL interactions.  
   - **DeFi Expert**: Handles instructions from Raydium, Orca, Jupiter, and other DeFi platforms.  
   - **NFT/Metaplex Expert**: Decodes minting, listing, and Metaplex-specific transaction instructions.  
   - **Governance Expert**: Provides insights into DAO voting, proposal creation, and treasury management.

3. **ModernBERT Routing**  
   A specialized routing model inspects raw transaction data (e.g., program IDs, instruction layouts) and directs it to the most relevant expert. This system reduces confusion and boosts accuracy by leaning on domain-specific knowledge.

4. **Context Enhancement**  
   - **Vector Database**: Stores relevant Solana docs, user histories, and feedback to provide extra context and avoid hallucinations.  
   - **Account Resolution**: Incorporates address-to-name lookups (e.g., via Helius or other APIs) for more readable explanations.

5. **Human-Readable Outputs**  
   - **Mermaid Diagrams**: Visualize token flows and state transitions in an easy-to-read diagram.  
   - **Transaction Summaries**: Provide concise text summaries with details on slippage, final outcomes, and potential risk factors.

## Architecture

1. **ModernBERT Router**  
   Takes the raw transaction hash or instruction data and classifies which Solana module(s) it pertains to.  
2. **Expert Modules**  
   - _SPL Expert_  
   - _DeFi Expert_ (Raydium, Orca, Jupiter, etc.)  
   - _NFT/Metaplex Expert_  
   - _Governance Expert_  
   These experts are specialized models, each having been through two-stage fine-tuning.  
3. **Vector Database**  
   Stores program documentation, transaction history, and user feedback. The selected expert can query it to enrich responses with extra context.  
4. **SLM Explanation Layer**  
   Generates final transaction summaries and optional Mermaid diagrams, combining the logic from the expert model with any retrieved contextual documents.

Below is a simplified diagram describing the training process for each expert:

```
+---------------------------------------+
| Qwen1.5-MoE-A2.7B Base Model          |
+----------------------+-----------------+
                       |
                       v
            (Stage 1) Fine-Tune on
       SPL/Rust Docs & Program Modules
                       |
                       v
            (Stage 2) Fine-Tune on
      Transaction Q&A Dataset (per expert)
                       |
      +----------------+------------------+
      |                |                 |
      v                v                 v
   SPL Expert      DeFi Expert     NFT Expert ...
```

## Example Usage

**1. Jupiter Swap Transaction**

```json
{
  "chain": "solana",
  "transaction_hash": "4Qbvb2cUQhAmpEGUQMQA49qc8UvDmwCnGUFDLMRQFG9sp",
  "program_id": "JUPITER_PROGRAM_ID",
  "raw_instructions": [...],
  "detected_expert": "jupiter_dex_expert",
  "confidence": 0.95
}
```

- The router inspects the program ID and identifies a Jupiter swap transaction.  
- The “jupiter_dex_expert” is called to decode the instructions, reference relevant Jupiter docs in the vector store, and produce a final explanation.  
- Output includes a summary of swapped tokens, slippage, and route details.

**2. Metaplex NFT Minting Transaction**

```json
{
  "selected_expert": "SolanaMetaplexExpert",
  "transaction_data": {
    "version": "legacy",
    "hash": "4Qbvb2cUQhAmpEGUQMQA49qc8UvDmwCnGUFDLMRQFG9spj1vvuW5TsRsHdvs6uzw",
    "payload": {
      "function": "mint_new_edition_from_master_edition_via_token",
      "arguments": [
        "MasterEditionMintAddress",
        "5",
        "DestinationOwner"
      ]
    }
  },
  "user_id": "nftcollector21",
  "retrieved_contexts": [
    {
      "metadata_id": "doc_metaplex_basics",
      "content": "mint_new_edition_from_master_edition_via_token creates limited editions from a master NFT..."
    }
  ]
}
```

- The system routes the transaction to the Metaplex expert.  
- A final text explanation addresses the NFT edition minting process, referencing possible permission or supply issues.  
- A Mermaid diagram outlines the flow between the master edition and the newly minted edition.
