"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, ResearchRegistryABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { keccak256, toBytes } from "viem";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [authors, setAuthors] = useState("");
  const [tags, setTags] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const authorAddrs = authors.split(",").map((a) => a.trim()) as `0x${string}`[];
    const fieldTags = tags.split(",").map((t) => t.trim()).filter(Boolean);

    writeContract({
      address: ADDRESSES.registry,
      abi: ResearchRegistryABI,
      functionName: "submitPaper",
      args: [ipfsCid, keccak256(toBytes(title)), authorAddrs, fieldTags],
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Submit Research Paper</h1>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Paper Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Paper Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your paper title" className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">IPFS CID</label>
              <Input value={ipfsCid} onChange={(e) => setIpfsCid(e.target.value)} placeholder="QmYour..." className="bg-gray-800 border-gray-700" required />
              <p className="text-xs text-gray-500 mt-1">Upload your paper to IPFS first (web3.storage / nft.storage)</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Author Addresses (comma-separated)</label>
              <Input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="0x..., 0x..." className="bg-gray-800 border-gray-700" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Field Tags (comma-separated)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="biology, genetics, ..." className="bg-gray-800 border-gray-700" />
            </div>
            <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isPending ? "Confirm in Wallet..." : isConfirming ? "Confirming..." : "Submit Paper"}
            </Button>
            {isSuccess && <p className="text-emerald-400 text-center">✅ Paper submitted successfully!</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
