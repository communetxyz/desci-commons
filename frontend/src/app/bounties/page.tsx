"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ADDRESSES, ReproducibilityBountyABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BountiesPage() {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Reproducibility Bounties</h1>
      <p className="text-gray-400">{bountyCount ? Number(bountyCount) : 0} active bounties</p>

      <Tabs defaultValue="post">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="post">Post Bounty</TabsTrigger>
          <TabsTrigger value="replicate">Submit Replication</TabsTrigger>
          <TabsTrigger value="vote">Vote</TabsTrigger>
        </TabsList>

        <TabsContent value="post"><PostBountyForm /></TabsContent>
        <TabsContent value="replicate"><ReplicateForm /></TabsContent>
        <TabsContent value="vote"><VoteForm /></TabsContent>
      </Tabs>
    </div>
  );
}

function PostBountyForm() {
  const [paperId, setPaperId] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("30");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400);
    writeContract({
      address: ADDRESSES.bounty,
      abi: ReproducibilityBountyABI,
      functionName: "postBounty",
      args: [BigInt(paperId), deadline],
      value: parseEther(amount),
    });
  }

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader><CardTitle>Post a Bounty</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="number" value={paperId} onChange={(e) => setPaperId(e.target.value)} placeholder="Paper ID" className="bg-gray-800 border-gray-700" required />
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Bounty amount (ETH)" className="bg-gray-800 border-gray-700" required />
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Deadline (days)" className="bg-gray-800 border-gray-700" required />
          <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Post Bounty"}
          </Button>
          {isSuccess && <p className="text-emerald-400 text-center">✅ Bounty posted!</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function ReplicateForm() {
  const [bountyId, setBountyId] = useState("");
  const [cid, setCid] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    writeContract({
      address: ADDRESSES.bounty,
      abi: ReproducibilityBountyABI,
      functionName: "submitReplication",
      args: [BigInt(bountyId), cid],
    });
  }

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader><CardTitle>Submit Replication</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="number" value={bountyId} onChange={(e) => setBountyId(e.target.value)} placeholder="Bounty ID" className="bg-gray-800 border-gray-700" required />
          <Input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="Replication IPFS CID" className="bg-gray-800 border-gray-700" required />
          <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Submit Replication"}
          </Button>
          {isSuccess && <p className="text-emerald-400 text-center">✅ Replication submitted!</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function VoteForm() {
  const [replicationId, setReplicationId] = useState("");
  const [support, setSupport] = useState(true);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    writeContract({
      address: ADDRESSES.bounty,
      abi: ReproducibilityBountyABI,
      functionName: "vote",
      args: [BigInt(replicationId), support],
    });
  }

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader><CardTitle>Vote on Replication</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="number" value={replicationId} onChange={(e) => setReplicationId(e.target.value)} placeholder="Replication ID" className="bg-gray-800 border-gray-700" required />
          <div className="flex gap-4">
            <Button type="button" variant={support ? "default" : "outline"} onClick={() => setSupport(true)} className={support ? "bg-emerald-600" : ""}>
              👍 Support
            </Button>
            <Button type="button" variant={!support ? "default" : "outline"} onClick={() => setSupport(false)} className={!support ? "bg-red-600" : ""}>
              👎 Reject
            </Button>
          </div>
          <Button type="submit" disabled={isPending || isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Submit Vote"}
          </Button>
          {isSuccess && <p className="text-emerald-400 text-center">✅ Vote recorded!</p>}
        </form>
      </CardContent>
    </Card>
  );
}
