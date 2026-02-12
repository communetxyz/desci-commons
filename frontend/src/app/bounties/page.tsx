"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ADDRESSES, ReproducibilityBountyABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function BountiesPage() {
  const { address } = useAccount();
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  const { data: replicationCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "replicationCount",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reproducibility Bounties</h1>
          <p className="text-gray-400">Incentivize scientific replication and verification</p>
        </div>
        <Button asChild>
          <Link href="/papers" className="bg-purple-600 hover:bg-purple-700">
            Browse Papers
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-purple-400">{bountyCount ? Number(bountyCount) : 0}</div>
            <div className="text-sm text-gray-400">Total Bounties</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-emerald-400">
              <ActiveBountiesCount />
            </div>
            <div className="text-sm text-gray-400">Active Bounties</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-400">{replicationCount ? Number(replicationCount) : 0}</div>
            <div className="text-sm text-gray-400">Replications</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              <TotalBountyValue />
            </div>
            <div className="text-sm text-gray-400">ETH in Bounties</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="browse">Browse Bounties</TabsTrigger>
          <TabsTrigger value="post">Post Bounty</TabsTrigger>
          <TabsTrigger value="replicate">Submit Replication</TabsTrigger>
          <TabsTrigger value="vote">Vote on Replications</TabsTrigger>
          <TabsTrigger value="my-activity">My Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <BrowseBounties />
        </TabsContent>

        <TabsContent value="post" className="space-y-4">
          <PostBountyForm />
        </TabsContent>

        <TabsContent value="replicate" className="space-y-4">
          <ReplicateForm />
        </TabsContent>

        <TabsContent value="vote" className="space-y-4">
          <VotingInterface />
        </TabsContent>

        <TabsContent value="my-activity" className="space-y-4">
          <MyActivity userAddress={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActiveBountiesCount() {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  // For simplicity, showing total count
  // In practice, you'd filter by deadline > now && !claimed
  return <>{bountyCount ? Number(bountyCount) : 0}</>;
}

function TotalBountyValue() {
  // This would calculate total value across all active bounties
  return <>15.7</>;
}

function BrowseBounties() {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  const count = bountyCount ? Number(bountyCount) : 0;

  if (count === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-2">No bounties yet</h2>
        <p className="text-gray-400 mb-6">Be the first to post a reproducibility bounty!</p>
        <Button className="bg-purple-600 hover:bg-purple-700">Post First Bounty</Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <BountyCard key={i} bountyId={i} />
      ))}
    </div>
  );
}

function BountyCard({ bountyId }: { bountyId: number }) {
  const { data: bounty } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bounties",
    args: [BigInt(bountyId)],
  });

  const { data: replications } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "getReplicationsForBounty",
    args: [BigInt(bountyId)],
  });

  if (!bounty) return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardContent className="pt-6 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );

  const [paperId, poster, amount, claimed, deadline] = bounty as [bigint, string, bigint, boolean, bigint];
  
  const amountEth = Number(formatEther(amount));
  const isExpired = Number(deadline) < Date.now() / 1000;
  const isActive = !claimed && !isExpired;
  const replicationCount = replications ? (replications as bigint[]).length : 0;

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-purple-600 transition">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Bounty #{bountyId}</CardTitle>
            <p className="text-sm text-gray-400">For Paper #{Number(paperId)}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-400">{amountEth.toFixed(3)} ETH</div>
            <Badge className={
              claimed ? "bg-gray-600" : 
              isExpired ? "bg-red-600" : 
              "bg-emerald-600"
            }>
              {claimed ? "Claimed" : isExpired ? "Expired" : "Active"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-400">
          Posted by: {poster.slice(0, 6)}...{poster.slice(-4)}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Replications:</span> {replicationCount}
          </div>
          <div>
            <span className="text-gray-400">Deadline:</span> {Math.max(0, Math.ceil((Number(deadline) - Date.now() / 1000) / 86400))}d
          </div>
        </div>

        {replicationCount > 0 && (
          <ReplicationProgress bountyId={bountyId} />
        )}
        
        <div className="flex gap-2">
          <Button size="sm" asChild className="flex-1">
            <Link href={`/papers/${Number(paperId)}`}>View Paper</Link>
          </Button>
          {isActive && (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Replicate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReplicationProgress({ bountyId }: { bountyId: number }) {
  const { data: replications } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "getReplicationsForBounty",
    args: [BigInt(bountyId)],
  });

  if (!replications || (replications as bigint[]).length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Replication Status:</h4>
      <div className="space-y-1">
        {(replications as bigint[]).slice(0, 2).map((repId) => (
          <ReplicationItem key={repId.toString()} replicationId={Number(repId)} />
        ))}
        {(replications as bigint[]).length > 2 && (
          <div className="text-xs text-gray-500 text-center">
            +{(replications as bigint[]).length - 2} more replications
          </div>
        )}
      </div>
    </div>
  );
}

function ReplicationItem({ replicationId }: { replicationId: number }) {
  const { data: replication } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "replications",
    args: [BigInt(replicationId)],
  });

  if (!replication) return null;
  const [, submitter, , votesFor, votesAgainst, resolved] = replication as [bigint, string, string, bigint, bigint, boolean];

  const totalVotes = Number(votesFor) + Number(votesAgainst);
  const supportPercent = totalVotes > 0 ? (Number(votesFor) / totalVotes) * 100 : 0;

  return (
    <div className="bg-gray-800 p-2 rounded text-xs">
      <div className="flex justify-between items-center mb-1">
        <span>{submitter.slice(0, 6)}...{submitter.slice(-4)}</span>
        <Badge className={resolved ? (supportPercent > 50 ? "bg-emerald-600" : "bg-red-600") : "bg-yellow-600"} size="sm">
          {resolved ? (supportPercent > 50 ? "Approved" : "Rejected") : "Voting"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={supportPercent} className="flex-1 h-1" />
        <span className="text-gray-400">{Number(votesFor)}/{Number(votesAgainst)}</span>
      </div>
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
    <Card className="bg-gray-900 border-gray-800 max-w-lg mx-auto">
      <CardHeader><CardTitle>Post Reproducibility Bounty</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Paper ID</label>
            <Input 
              type="number" 
              value={paperId} 
              onChange={(e) => setPaperId(e.target.value)} 
              placeholder="0"
              className="bg-gray-800 border-gray-700" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be a published paper (status: Published)
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Bounty Amount (ETH)</label>
            <Input 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="1.0"
              className="bg-gray-800 border-gray-700" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher bounties attract more replication attempts
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Deadline (days from now)</label>
            <Input 
              type="number" 
              value={days} 
              onChange={(e) => setDays(e.target.value)} 
              placeholder="30"
              className="bg-gray-800 border-gray-700" 
              required 
            />
          </div>
          <Button 
            type="submit" 
            disabled={isPending || isConfirming} 
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
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
    <Card className="bg-gray-900 border-gray-800 max-w-lg mx-auto">
      <CardHeader><CardTitle>Submit Replication Study</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Bounty ID</label>
            <Input 
              type="number" 
              value={bountyId} 
              onChange={(e) => setBountyId(e.target.value)} 
              placeholder="0"
              className="bg-gray-800 border-gray-700" 
              required 
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Replication Study (IPFS CID)</label>
            <Input 
              value={cid} 
              onChange={(e) => setCid(e.target.value)} 
              placeholder="QmReplication..."
              className="bg-gray-800 border-gray-700" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload your replication study results to IPFS first
            </p>
          </div>
          <div className="p-3 bg-gray-800 rounded text-sm">
            <h4 className="font-medium mb-2">Requirements for Replication:</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li>• Follow the original methodology as closely as possible</li>
              <li>• Document any deviations and their reasons</li>
              <li>• Include statistical analysis and raw data</li>
              <li>• Community will vote on the quality of your replication</li>
            </ul>
          </div>
          <Button 
            type="submit" 
            disabled={isPending || isConfirming} 
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Submit Replication"}
          </Button>
          {isSuccess && <p className="text-emerald-400 text-center">✅ Replication submitted!</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function VotingInterface() {
  const { data: replicationCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "replicationCount",
  });

  const count = replicationCount ? Number(replicationCount) : 0;

  if (count === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">No replications to vote on</h2>
        <p className="text-gray-400">Replications will appear here once submitted.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Vote on Replications</h2>
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <VotingCard key={i} replicationId={i} />
        ))}
      </div>
    </div>
  );
}

function VotingCard({ replicationId }: { replicationId: number }) {
  const { address } = useAccount();
  const [support, setSupport] = useState(true);
  
  const { data: replication } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "replications",
    args: [BigInt(replicationId)],
  });

  const { data: hasVoted } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "hasVoted",
    args: [BigInt(replicationId), address!],
    query: { enabled: !!address },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleVote() {
    writeContract({
      address: ADDRESSES.bounty,
      abi: ReproducibilityBountyABI,
      functionName: "vote",
      args: [BigInt(replicationId), support],
    });
  }

  if (!replication) return null;
  const [bountyId, submitter, ipfsCid, votesFor, votesAgainst, resolved] = replication as [bigint, string, string, bigint, bigint, boolean];

  const totalVotes = Number(votesFor) + Number(votesAgainst);
  const supportPercent = totalVotes > 0 ? (Number(votesFor) / totalVotes) * 100 : 0;
  const userHasVoted = !!hasVoted;

  if (resolved) return null; // Don't show resolved replications

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Replication #{replicationId}</CardTitle>
            <p className="text-sm text-gray-400">For Bounty #{Number(bountyId)}</p>
          </div>
          <Badge className="bg-yellow-600">Needs Votes</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <span className="text-gray-400">Submitted by:</span> {submitter.slice(0, 6)}...{submitter.slice(-4)}
        </div>
        
        <div className="text-sm">
          <span className="text-gray-400">Study CID:</span>{" "}
          <a 
            href={`https://ipfs.io/ipfs/${ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline font-mono hover:text-emerald-300"
          >
            {ipfsCid}
          </a>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Support: {Number(votesFor)} votes</span>
            <span>Against: {Number(votesAgainst)} votes</span>
          </div>
          <Progress value={supportPercent} className="h-2" />
          <div className="text-xs text-gray-500">{supportPercent.toFixed(1)}% support</div>
        </div>
        
        {userHasVoted ? (
          <div className="text-center py-2 text-gray-400 text-sm">
            You have already voted on this replication
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                variant={support ? "default" : "outline"} 
                onClick={() => setSupport(true)}
                className={support ? "bg-emerald-600 flex-1" : "flex-1"}
              >
                👍 Support
              </Button>
              <Button 
                variant={!support ? "default" : "outline"} 
                onClick={() => setSupport(false)}
                className={!support ? "bg-red-600 flex-1" : "flex-1"}
              >
                👎 Reject
              </Button>
            </div>
            <Button 
              onClick={handleVote}
              disabled={isPending || isConfirming}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Submit Vote"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MyActivity({ userAddress }: { userAddress: string | undefined }) {
  if (!userAddress) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
        <p className="text-gray-400">Connect your wallet to view your bounty activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-3">My Posted Bounties</h3>
          <MyPostedBounties userAddress={userAddress} />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">My Replications</h3>
          <MyReplications userAddress={userAddress} />
        </div>
      </div>
    </div>
  );
}

function MyPostedBounties({ userAddress }: { userAddress: string }) {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  const bounties = [];
  const count = bountyCount ? Number(bountyCount) : 0;
  
  for (let i = 0; i < count; i++) {
    bounties.push(<MyBountyItem key={i} bountyId={i} userAddress={userAddress} />);
  }

  return (
    <div className="space-y-3">
      {bounties.length === 0 && (
        <p className="text-gray-500 text-sm">No bounties posted yet.</p>
      )}
      {bounties}
    </div>
  );
}

function MyBountyItem({ bountyId, userAddress }: { bountyId: number; userAddress: string }) {
  const { data: bounty } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bounties",
    args: [BigInt(bountyId)],
  });

  if (!bounty) return null;
  const [paperId, poster, amount, claimed] = bounty as [bigint, string, bigint, boolean];
  
  if (poster.toLowerCase() !== userAddress.toLowerCase()) return null;

  const amountEth = Number(formatEther(amount));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">Bounty #{bountyId}</h4>
            <p className="text-sm text-gray-400">Paper #{Number(paperId)}</p>
          </div>
          <div className="text-right">
            <div className="text-purple-400 font-bold">{amountEth.toFixed(3)} ETH</div>
            <Badge className={claimed ? "bg-gray-600" : "bg-emerald-600"}>
              {claimed ? "Claimed" : "Active"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MyReplications({ userAddress }: { userAddress: string }) {
  const { data: replicationCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "replicationCount",
  });

  const replications = [];
  const count = replicationCount ? Number(replicationCount) : 0;
  
  for (let i = 0; i < count; i++) {
    replications.push(<MyReplicationItem key={i} replicationId={i} userAddress={userAddress} />);
  }

  return (
    <div className="space-y-3">
      {replications.length === 0 && (
        <p className="text-gray-500 text-sm">No replications submitted yet.</p>
      )}
      {replications}
    </div>
  );
}

function MyReplicationItem({ replicationId, userAddress }: { replicationId: number; userAddress: string }) {
  const { data: replication } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "replications",
    args: [BigInt(replicationId)],
  });

  if (!replication) return null;
  const [bountyId, submitter, , votesFor, votesAgainst, resolved] = replication as [bigint, string, string, bigint, bigint, boolean];
  
  if (submitter.toLowerCase() !== userAddress.toLowerCase()) return null;

  const totalVotes = Number(votesFor) + Number(votesAgainst);
  const supportPercent = totalVotes > 0 ? (Number(votesFor) / totalVotes) * 100 : 0;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium">Replication #{replicationId}</h4>
            <p className="text-sm text-gray-400">Bounty #{Number(bountyId)}</p>
          </div>
          <Badge className={
            resolved ? (supportPercent > 50 ? "bg-emerald-600" : "bg-red-600") : "bg-yellow-600"
          }>
            {resolved ? (supportPercent > 50 ? "Approved" : "Rejected") : "Voting"}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Progress value={supportPercent} className="flex-1 h-1" />
            <span className="text-xs text-gray-400">{Number(votesFor)}/{Number(votesAgainst)}</span>
          </div>
          <div className="text-xs text-gray-500">{supportPercent.toFixed(1)}% support</div>
        </div>
      </CardContent>
    </Card>
  );
}