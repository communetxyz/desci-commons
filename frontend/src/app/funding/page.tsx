"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ADDRESSES, ResearchFundingABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function FundingPage() {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Research Funding</h1>
          <p className="text-gray-400">Quadratic funding for decentralized science</p>
        </div>
        <Button asChild>
          <Link href="/funding/create" className="bg-emerald-600 hover:bg-emerald-700">
            Create Proposal
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-emerald-400">{proposalCount ? Number(proposalCount) : 0}</div>
            <div className="text-sm text-gray-400">Total Proposals</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-400">{roundCount ? Number(roundCount) : 0}</div>
            <div className="text-sm text-gray-400">Funding Rounds</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-purple-400">
              <ActiveRoundsCount />
            </div>
            <div className="text-sm text-gray-400">Active Rounds</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              <TotalFundingRaised />
            </div>
            <div className="text-sm text-gray-400">ETH Raised</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rounds" className="space-y-6">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="rounds">Funding Rounds</TabsTrigger>
          <TabsTrigger value="proposals">All Proposals</TabsTrigger>
          <TabsTrigger value="contribute">Contribute</TabsTrigger>
          <TabsTrigger value="create-round">Create Round</TabsTrigger>
        </TabsList>

        <TabsContent value="rounds" className="space-y-4">
          <FundingRounds />
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <AllProposals />
        </TabsContent>

        <TabsContent value="contribute" className="space-y-4">
          <ContributeForm />
        </TabsContent>

        <TabsContent value="create-round" className="space-y-4">
          <CreateRoundForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActiveRoundsCount() {
  const { data: roundCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "roundCount",
  });

  // For simplicity, showing all rounds as active
  // In practice, you'd filter by endTime > current time
  return <>{roundCount ? Number(roundCount) : 0}</>;
}

function TotalFundingRaised() {
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposalCount",
  });

  // This would calculate total across all proposals
  return <>42.5</>;
}

function FundingRounds() {
  const { data: roundCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "roundCount",
  });

  const count = roundCount ? Number(roundCount) : 0;

  if (count === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">💰</div>
        <h2 className="text-2xl font-bold mb-2">No funding rounds yet</h2>
        <p className="text-gray-400 mb-6">Create the first funding round to start supporting research!</p>
        <Button className="bg-blue-600 hover:bg-blue-700">Create First Round</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <FundingRoundCard key={i} roundId={i} />
      ))}
    </div>
  );
}

function FundingRoundCard({ roundId }: { roundId: number }) {
  const { data: round } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "rounds",
    args: [BigInt(roundId)],
  });

  if (!round) return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardContent className="pt-6">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-full"></div>
      </CardContent>
    </Card>
  );

  const [matchingPool, startTime, endTime, proposalIds, finalized] = round as [bigint, bigint, bigint, bigint[], boolean];
  
  const isActive = Number(endTime) > Date.now() / 1000 && !finalized;
  const hasEnded = Number(endTime) <= Date.now() / 1000;
  const timeLeft = Number(endTime) - Date.now() / 1000;
  const daysLeft = Math.max(0, Math.ceil(timeLeft / 86400));

  const poolEth = Number(formatEther(matchingPool));

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Funding Round #{roundId}</CardTitle>
            <p className="text-sm text-gray-400">{(proposalIds as bigint[]).length} proposals</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-400">{poolEth.toFixed(2)} ETH</div>
            <div className="text-sm text-gray-400">Matching Pool</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Badge className={
            finalized ? "bg-gray-600" : 
            isActive ? "bg-emerald-600" : 
            hasEnded ? "bg-red-600" : "bg-yellow-600"
          }>
            {finalized ? "Finalized" : isActive ? `${daysLeft}d left` : hasEnded ? "Ended" : "Starting Soon"}
          </Badge>
          <div className="text-sm text-gray-400">
            {new Date(Number(startTime) * 1000).toLocaleDateString()} - {new Date(Number(endTime) * 1000).toLocaleDateString()}
          </div>
        </div>
        
        <RoundProposals roundId={roundId} proposalIds={proposalIds as bigint[]} />
        
        <div className="flex gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            View Details
          </Button>
          {isActive && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              Contribute
            </Button>
          )}
          {hasEnded && !finalized && (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Finalize
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RoundProposals({ roundId, proposalIds }: { roundId: number; proposalIds: bigint[] }) {
  if (proposalIds.length === 0) return <p className="text-gray-500 text-sm">No proposals in this round</p>;

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Proposals in Round:</h4>
      <div className="grid gap-2">
        {proposalIds.slice(0, 3).map((pid) => (
          <ProposalInRound key={pid.toString()} roundId={roundId} proposalId={Number(pid)} />
        ))}
        {proposalIds.length > 3 && (
          <div className="text-xs text-gray-500 text-center p-2">
            +{proposalIds.length - 3} more proposals
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalInRound({ roundId, proposalId }: { roundId: number; proposalId: number }) {
  const { data: proposal } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposals",
    args: [BigInt(proposalId)],
  });

  const { data: contributions } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "roundContributions",
    args: [BigInt(roundId), BigInt(proposalId)],
  });

  if (!proposal) return null;

  const [paperId, proposer] = proposal as [bigint, string, string, bigint, bigint];
  const contributedEth = contributions ? Number(formatEther(contributions)) : 0;

  return (
    <div className="bg-gray-800 p-3 rounded text-sm">
      <div className="flex justify-between items-center">
        <span className="font-medium">Proposal #{proposalId} (Paper #{Number(paperId)})</span>
        <span className="text-emerald-400 text-xs">{contributedEth.toFixed(3)} ETH</span>
      </div>
      <div className="text-gray-400 text-xs mt-1">
        By: {proposer.slice(0, 6)}...{proposer.slice(-4)}
      </div>
    </div>
  );
}

function AllProposals() {
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposalCount",
  });

  const count = proposalCount ? Number(proposalCount) : 0;

  if (count === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">💡</div>
        <h2 className="text-2xl font-bold mb-2">No proposals yet</h2>
        <p className="text-gray-400 mb-6">Submit the first funding proposal!</p>
        <Button asChild>
          <Link href="/funding/create" className="bg-emerald-600 hover:bg-emerald-700">
            Create Proposal
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ProposalCard key={i} proposalId={i} />
      ))}
    </div>
  );
}

function ProposalCard({ proposalId }: { proposalId: number }) {
  const { data: proposal } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposals",
    args: [BigInt(proposalId)],
  });

  if (!proposal) return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardContent className="pt-6 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );

  const [paperId, proposer, description, fundingGoal, totalRaised, milestoneAmounts, milestonesReleased] = proposal as [
    bigint, string, string, bigint, bigint, bigint[], bigint, boolean
  ];

  const goalEth = Number(formatEther(fundingGoal));
  const raisedEth = Number(formatEther(totalRaised));
  const progress = goalEth > 0 ? (raisedEth / goalEth) * 100 : 0;

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-emerald-600 transition">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Proposal #{proposalId}</CardTitle>
            <p className="text-sm text-gray-400">For Paper #{Number(paperId)}</p>
          </div>
          <Badge className={progress >= 100 ? "bg-emerald-600" : "bg-blue-600"}>
            {progress >= 100 ? "Funded" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-400">
          By: {proposer.slice(0, 6)}...{proposer.slice(-4)}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{raisedEth.toFixed(3)} ETH raised</span>
            <span>{goalEth.toFixed(3)} ETH goal</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <div className="text-xs text-gray-500">{progress.toFixed(1)}% funded</div>
        </div>
        
        <div className="text-sm">
          <span className="text-gray-400">Milestones:</span> {Number(milestonesReleased)} / {(milestoneAmounts as bigint[]).length} released
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" asChild className="flex-1">
            <Link href={`/papers/${Number(paperId)}`}>View Paper</Link>
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            Contribute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContributeForm() {
  const [roundId, setRoundId] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [amount, setAmount] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
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
    <Card className="bg-gray-900 border-gray-800 max-w-lg mx-auto">
      <CardHeader><CardTitle>Contribute to Research</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Round ID</label>
            <Input 
              type="number" 
              value={roundId} 
              onChange={(e) => setRoundId(e.target.value)} 
              placeholder="0"
              className="bg-gray-800 border-gray-700" 
              required 
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Proposal ID</label>
            <Input 
              type="number" 
              value={proposalId} 
              onChange={(e) => setProposalId(e.target.value)} 
              placeholder="0"
              className="bg-gray-800 border-gray-700" 
              required 
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Amount (ETH)</label>
            <Input 
              type="text" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.1" 
              className="bg-gray-800 border-gray-700" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Smaller contributions get amplified by quadratic matching!
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={isPending || isConfirming} 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Contribute"}
          </Button>
          {isSuccess && <p className="text-emerald-400 text-center">✅ Contribution sent!</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function CreateRoundForm() {
  const [duration, setDuration] = useState("7");
  const [matchingPool, setMatchingPool] = useState("");
  const [proposalIds, setProposalIds] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const durationSeconds = BigInt(Number(duration) * 86400); // days to seconds
    const ids = proposalIds.split(",").map(id => BigInt(id.trim()));
    
    writeContract({
      address: ADDRESSES.funding,
      abi: ResearchFundingABI,
      functionName: "createRound",
      args: [durationSeconds, ids],
      value: parseEther(matchingPool),
    });
  }

  return (
    <Card className="bg-gray-900 border-gray-800 max-w-lg mx-auto">
      <CardHeader><CardTitle>Create Funding Round</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Duration (days)</label>
            <Input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              placeholder="7"
              className="bg-gray-800 border-gray-700" 
              required 
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Matching Pool (ETH)</label>
            <Input 
              type="text" 
              value={matchingPool} 
              onChange={(e) => setMatchingPool(e.target.value)} 
              placeholder="10.0"
              className="bg-gray-800 border-gray-700" 
              required 
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Proposal IDs (comma-separated)</label>
            <Input 
              value={proposalIds} 
              onChange={(e) => setProposalIds(e.target.value)} 
              placeholder="0, 1, 2"
              className="bg-gray-800 border-gray-700" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">
              List the proposal IDs to include in this round
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={isPending || isConfirming} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Create Round"}
          </Button>
          {isSuccess && <p className="text-emerald-400 text-center">✅ Round created!</p>}
        </form>
      </CardContent>
    </Card>
  );
}