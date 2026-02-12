"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ADDRESSES, ResearchFundingABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateFundingPage() {
  const [paperId, setPaperId] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [milestones, setMilestones] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ms = milestones.split(",").map((m) => parseEther(m.trim()));

    writeContract({
      address: ADDRESSES.funding,
      abi: ResearchFundingABI,
      functionName: "createProposal",
      args: [BigInt(paperId), description, parseEther(goal), ms],
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Funding Proposal</h1>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Proposal Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Paper ID</label>
              <Input type="number" value={paperId} onChange={(e) => setPaperId(e.target.value)} className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Description (IPFS CID)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="QmDesc..." className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Funding Goal (ETH)</label>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="1.0" className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Milestones (ETH, comma-separated — must sum to goal)</label>
              <Input value={milestones} onChange={(e) => setMilestones(e.target.value)} placeholder="0.5, 0.5" className="bg-gray-800 border-gray-700" required />
            </div>
            <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Create Proposal"}
            </Button>
            {isSuccess && <p className="text-emerald-400 text-center">✅ Proposal created!</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
