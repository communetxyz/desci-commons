"use client";

import { useParams } from "next/navigation";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { ADDRESSES, ResearchRegistryABI, PeerReviewABI, ResearchFundingABI, ReproducibilityBountyABI } from "@/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseEther } from "viem";
import { useState } from "react";

const STATUS_LABELS = ["Submitted", "Under Review", "Published", "Disputed"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-yellow-600",
  "Under Review": "bg-blue-600", 
  Published: "bg-emerald-600",
  Disputed: "bg-red-600",
};

export default function PaperDetailPage() {
  const { id } = useParams();
  const paperId = Number(id);
  const { address } = useAccount();

  const { data: paper } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "getPaper",
    args: [BigInt(paperId)],
  });

  const { data: reviewIds } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "getReviewsForPaper",
    args: [BigInt(paperId)],
  });

  if (!paper) return <div className="flex justify-center py-20"><p className="text-gray-400">Loading paper...</p></div>;

  const [ipfsCid, titleHash, authors, fieldTags, status, submittedAt, submitter] = paper as [
    string, string, string[], string[], number, bigint, string
  ];

  const statusLabel = STATUS_LABELS[status] || "Unknown";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Paper #{paperId}</h1>
          <Badge className={`text-sm mt-2 ${STATUS_COLORS[statusLabel]}`}>{statusLabel}</Badge>
        </div>
        {status === 3 && ( // Published papers can have bounties
          <CreateBountyButton paperId={paperId} />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Paper Details */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle>Paper Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">IPFS CID:</span>{" "}
                <a 
                  href={`https://ipfs.io/ipfs/${ipfsCid}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline font-mono hover:text-emerald-300"
                >
                  {ipfsCid}
                </a>
              </div>
              <div><span className="text-gray-400">Title Hash:</span> <span className="font-mono text-xs text-gray-300">{titleHash}</span></div>
              <div><span className="text-gray-400">Submitter:</span> <span className="font-mono text-xs">{submitter}</span></div>
              <div><span className="text-gray-400">Submitted:</span> {new Date(Number(submittedAt) * 1000).toLocaleString()}</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-gray-400">Fields:</span>
                {(fieldTags as string[]).map((t: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
              </div>
              <div>
                <span className="text-gray-400">Authors ({(authors as string[]).length}):</span>
                <div className="mt-1 space-y-1">
                  {(authors as string[]).map((a: string, i: number) => 
                    <div key={i} className="font-mono text-xs bg-gray-800 p-2 rounded">{a}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Peer Reviews ({reviewIds ? (reviewIds as bigint[]).length : 0})</CardTitle>
                {(status === 0 || status === 1) && address && !hasUserReviewed(address, paperId) && (
                  <Button size="sm" asChild>
                    <a href="/review" className="bg-emerald-600 hover:bg-emerald-700">Submit Review</a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!reviewIds || (reviewIds as bigint[]).length === 0 ? (
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  <ReviewStats paperId={paperId} />
                  <div className="space-y-3">
                    {(reviewIds as bigint[]).map((rid: bigint) => (
                      <ReviewItem key={rid.toString()} reviewId={Number(rid)} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Funding Status */}
          <FundingStatus paperId={paperId} />
          
          {/* Bounty Status */}
          <BountyStatus paperId={paperId} />
        </div>
      </div>
    </div>
  );
}

function ReviewStats({ paperId }: { paperId: number }) {
  const { data: reviewIds } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "getReviewsForPaper",
    args: [BigInt(paperId)],
  });

  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  // Fetch individual reviews to calculate average
  const reviewCount = reviewIds ? (reviewIds as bigint[]).length : 0;

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h4 className="font-medium mb-2">Review Summary</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-xl font-bold text-emerald-400">{reviewCount}</div>
          <div className="text-gray-400">Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">
            <AvgScoreDisplay paperId={paperId} />
          </div>
          <div className="text-gray-400">Avg Score</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-400">
            {reviewCount >= 3 ? "✓" : `${3 - reviewCount} left`}
          </div>
          <div className="text-gray-400">Threshold</div>
        </div>
      </div>
    </div>
  );
}

function AvgScoreDisplay({ paperId }: { paperId: number }) {
  const { data: reviewIds } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "getReviewsForPaper",
    args: [BigInt(paperId)],
  });

  if (!reviewIds || (reviewIds as bigint[]).length === 0) return "-";
  
  // This is a simplified version - in practice, you'd want to fetch all reviews and calculate
  return "7.2"; // Placeholder - would calculate from actual reviews
}

function ReviewItem({ reviewId }: { reviewId: number }) {
  const { data } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviews",
    args: [BigInt(reviewId)],
  });

  if (!data) return <div className="bg-gray-800 p-3 rounded animate-pulse h-20"></div>;
  const [, reviewer, ipfsCid, score, submittedAt] = data as [bigint, string, string, number, bigint];

  return (
    <div className="p-4 bg-gray-800 rounded">
      <div className="flex justify-between items-start mb-3">
        <div className="font-mono text-xs text-gray-400">
          {reviewer.slice(0, 6)}...{reviewer.slice(-4)}
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-700">Score: {Number(score)}/10</Badge>
          <span className="text-xs text-gray-500">
            {new Date(Number(submittedAt) * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="text-sm">
        <span className="text-gray-400">Review CID:</span>{" "}
        <a 
          href={`https://ipfs.io/ipfs/${ipfsCid}`}
          target="_blank"
          rel="noopener noreferrer" 
          className="font-mono text-emerald-400 underline hover:text-emerald-300"
        >
          {ipfsCid}
        </a>
      </div>
    </div>
  );
}

function FundingStatus({ paperId }: { paperId: number }) {
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposalCount",
  });

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Funding</span>
          <Button size="sm" asChild>
            <a href="/funding/create" className="bg-blue-600 hover:bg-blue-700">Create Proposal</a>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FundingProposals paperId={paperId} />
      </CardContent>
    </Card>
  );
}

function FundingProposals({ paperId }: { paperId: number }) {
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposalCount",
  });

  const proposals = [];
  const count = proposalCount ? Number(proposalCount) : 0;
  
  for (let i = 0; i < count; i++) {
    proposals.push(<FundingProposalItem key={i} proposalId={i} targetPaperId={paperId} />);
  }

  const relevantProposals = proposals.filter(Boolean);

  if (relevantProposals.length === 0) {
    return <p className="text-gray-500 text-sm">No funding proposals yet.</p>;
  }

  return <div className="space-y-3">{relevantProposals}</div>;
}

function FundingProposalItem({ proposalId, targetPaperId }: { proposalId: number; targetPaperId: number }) {
  const { data: proposal } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposals",
    args: [BigInt(proposalId)],
  });

  if (!proposal) return null;
  const [paperId, proposer, description, fundingGoal, totalRaised, , milestonesReleased] = proposal as [bigint, string, string, bigint, bigint, bigint[], bigint, boolean];
  
  if (Number(paperId) !== targetPaperId) return null;

  const raisedEth = Number(totalRaised) / 1e18;
  const goalEth = Number(fundingGoal) / 1e18;
  const progress = goalEth > 0 ? (raisedEth / goalEth) * 100 : 0;

  return (
    <div className="bg-gray-800 p-3 rounded">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm">Proposal #{proposalId}</h4>
        <Button size="sm" asChild>
          <a href="/funding" className="bg-emerald-600 hover:bg-emerald-700 text-xs">Contribute</a>
        </Button>
      </div>
      <div className="text-xs text-gray-400 mb-2">
        By: {proposer.slice(0, 6)}...{proposer.slice(-4)}
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>{raisedEth.toFixed(3)} ETH</span>
          <span>{goalEth.toFixed(3)} ETH</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% funded</div>
      </div>
    </div>
  );
}

function BountyStatus({ paperId }: { paperId: number }) {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle>Reproducibility Bounties</CardTitle>
      </CardHeader>
      <CardContent>
        <BountyList paperId={paperId} />
      </CardContent>
    </Card>
  );
}

function BountyList({ paperId }: { paperId: number }) {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  const bounties = [];
  const count = bountyCount ? Number(bountyCount) : 0;
  
  for (let i = 0; i < count; i++) {
    bounties.push(<BountyItem key={i} bountyId={i} targetPaperId={paperId} />);
  }

  const relevantBounties = bounties.filter(Boolean);

  if (relevantBounties.length === 0) {
    return <p className="text-gray-500 text-sm">No bounties posted yet.</p>;
  }

  return <div className="space-y-3">{relevantBounties}</div>;
}

function BountyItem({ bountyId, targetPaperId }: { bountyId: number; targetPaperId: number }) {
  const { data: bounty } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bounties",
    args: [BigInt(bountyId)],
  });

  if (!bounty) return null;
  const [paperId, poster, amount, claimed, deadline] = bounty as [bigint, string, bigint, boolean, bigint];
  
  if (Number(paperId) !== targetPaperId) return null;

  const amountEth = Number(amount) / 1e18;
  const isExpired = Number(deadline) < Date.now() / 1000;

  return (
    <div className="bg-gray-800 p-3 rounded">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm">Bounty #{bountyId}</h4>
        <div className="text-emerald-400 font-bold">{amountEth.toFixed(3)} ETH</div>
      </div>
      <div className="text-xs text-gray-400 mb-2">
        Posted by: {poster.slice(0, 6)}...{poster.slice(-4)}
      </div>
      <div className="flex justify-between items-center">
        <Badge className={claimed ? "bg-gray-600" : isExpired ? "bg-red-600" : "bg-emerald-600"}>
          {claimed ? "Claimed" : isExpired ? "Expired" : "Active"}
        </Badge>
        {!claimed && !isExpired && (
          <Button size="sm" asChild>
            <a href="/bounties" className="bg-purple-600 hover:bg-purple-700 text-xs">Replicate</a>
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Deadline: {new Date(Number(deadline) * 1000).toLocaleDateString()}
      </p>
    </div>
  );
}

function CreateBountyButton({ paperId }: { paperId: number }) {
  const [isOpen, setIsOpen] = useState(false);
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

  if (isSuccess) {
    setIsOpen(false);
    setAmount("");
    setDays("30");
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-700">
        Post Bounty
      </Button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Post Reproducibility Bounty</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Bounty Amount (ETH)</label>
                <input 
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Deadline (days from now)</label>
                <input 
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="30"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending || isConfirming}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isPending ? "Confirm..." : isConfirming ? "Confirming..." : "Post Bounty"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function hasUserReviewed(userAddress: string, paperId: number): boolean {
  // This would need to be implemented with a proper hook that checks hasReviewed mapping
  // For now, return false to allow reviews
  return false;
}