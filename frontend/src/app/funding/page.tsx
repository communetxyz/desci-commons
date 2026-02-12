"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ADDRESSES, ResearchFundingABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function FundingPage() {
  const [roundId, setRoundId] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [amount, setAmount] = useState("");

  const { data: roundCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "roundCount",
  });

  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposalCount",
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    writeContract({
      address: ADDRESSES.funding,
      abi: ResearchFundingABI,
      functionName: "contribute",
      args: [BigInt(roundId), BigInt(proposalId)],
      value: parseEther(amount),
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Research Funding</h1>
        <Link href="/funding/create">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Create Proposal</Button>
        </Link>
      </div>
      <div className="flex gap-4">
        <Card className="bg-gray-900 border-gray-800 flex-1">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{proposalCount ? Number(proposalCount) : 0}</div>
            <div className="text-sm text-gray-400">Proposals</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800 flex-1">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{roundCount ? Number(roundCount) : 0}</div>
            <div className="text-sm text-gray-400">Funding Rounds</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Contribute to a Proposal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleContribute} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Round ID</label>
              <Input type="number" value={roundId} onChange={(e) => setRoundId(e.target.value)} className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Proposal ID</label>
              <Input type="number" value={proposalId} onChange={(e) => setProposalId(e.target.value)} className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Amount (ETH)</label>
              <Input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.1" className="bg-gray-800 border-gray-700" required />
            </div>
            <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Contribute"}
            </Button>
            {isSuccess && <p className="text-emerald-400 text-center">✅ Contribution sent!</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
