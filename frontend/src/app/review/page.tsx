"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, ResearchRegistryABI, PeerReviewABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewPage() {
  const [paperId, setPaperId] = useState("");
  const [reviewCid, setReviewCid] = useState("");
  const [score, setScore] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: paperCount } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "paperCount",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    writeContract({
      address: ADDRESSES.peerReview,
      abi: PeerReviewABI,
      functionName: "submitReview",
      args: [BigInt(paperId), reviewCid, Number(score)],
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Peer Review</h1>
      <p className="text-gray-400">{paperCount ? Number(paperCount) : 0} papers available for review</p>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Submit a Review</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Paper ID</label>
              <Input type="number" value={paperId} onChange={(e) => setPaperId(e.target.value)} placeholder="0" className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Review IPFS CID</label>
              <Input value={reviewCid} onChange={(e) => setReviewCid(e.target.value)} placeholder="QmReview..." className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Score (1-10)</label>
              <Input type="number" min={1} max={10} value={score} onChange={(e) => setScore(e.target.value)} placeholder="7" className="bg-gray-800 border-gray-700" required />
            </div>
            <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isPending ? "Confirm in Wallet..." : isConfirming ? "Confirming..." : "Submit Review"}
            </Button>
            {isSuccess && <p className="text-emerald-400 text-center">✅ Review submitted!</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
