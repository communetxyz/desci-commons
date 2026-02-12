"use client";

import { useAccount, useReadContract } from "wagmi";
import { ADDRESSES, PeerReviewABI, ResearchRegistryABI, ResearchFundingABI, ReproducibilityBountyABI } from "@/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState } from "react";

const STATUS_LABELS = ["Submitted", "Under Review", "Published", "Disputed"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-yellow-600",
  "Under Review": "bg-blue-600",
  Published: "bg-emerald-600",
  Disputed: "bg-red-600",
};

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"papers" | "reviews" | "funding" | "bounties">("papers");

  const { data: reputation } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviewerReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-3xl font-bold">Researcher Profile</h1>
        <p className="text-gray-400">Connect your wallet to view your profile.</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Researcher Profile</h1>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Your Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-gray-400">Address:</span>{" "}
            <span className="font-mono text-sm">{address}</span>
          </div>
          <div>
            <span className="text-gray-400">Reviewer Reputation:</span>{" "}
            <span className="text-emerald-400 font-bold text-xl">{reputation ? Number(reputation) : 0}</span>
            <span className="text-gray-500 text-sm ml-2">reviews completed</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 border-b border-gray-800">
        {(["papers", "reviews", "funding", "bounties"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab 
                ? "text-emerald-400 border-emerald-400" 
                : "text-gray-400 border-transparent hover:text-gray-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === "papers" && <UserPapers userAddress={address!} />}
        {activeTab === "reviews" && <UserReviews userAddress={address!} />}
        {activeTab === "funding" && <UserFunding userAddress={address!} />}
        {activeTab === "bounties" && <UserBounties userAddress={address!} />}
      </div>
    </div>
  );
}

function UserPapers({ userAddress }: { userAddress: string }) {
  const { data: paperCount } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "paperCount",
  });

  const papers = [];
  const count = paperCount ? Number(paperCount) : 0;
  
  for (let i = 0; i < count; i++) {
    papers.push(<UserPaperItem key={i} paperId={i} userAddress={userAddress} />);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Submitted Papers</h3>
      {papers.length === 0 ? (
        <p className="text-gray-500">No papers submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {papers}
        </div>
      )}
    </div>
  );
}

function UserPaperItem({ paperId, userAddress }: { paperId: number; userAddress: string }) {
  const { data: paper } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "getPaper",
    args: [BigInt(paperId)],
  });

  if (!paper) return null;
  const [ipfsCid, , authors, fieldTags, status, submittedAt, submitter] = paper as [string, string, string[], string[], number, bigint, string];
  
  if (submitter.toLowerCase() !== userAddress.toLowerCase()) return null;
  const statusLabel = STATUS_LABELS[status] || "Unknown";

  return (
    <Link href={`/papers/${paperId}`}>
      <Card className="bg-gray-800 border-gray-700 hover:border-emerald-600 transition cursor-pointer">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium">Paper #{paperId}</h4>
            <Badge className={STATUS_COLORS[statusLabel]}>{statusLabel}</Badge>
          </div>
          <p className="text-sm text-gray-400 mb-2 truncate">CID: {ipfsCid}</p>
          <div className="flex gap-2 flex-wrap mb-1">
            {(fieldTags as string[]).map((tag: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Submitted: {new Date(Number(submittedAt) * 1000).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function UserReviews({ userAddress }: { userAddress: string }) {
  const { data: reviewCount } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviewCount",
  });

  const reviews = [];
  const count = reviewCount ? Number(reviewCount) : 0;
  
  for (let i = 0; i < count; i++) {
    reviews.push(<UserReviewItem key={i} reviewId={i} userAddress={userAddress} />);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Reviews</h3>
      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews}
        </div>
      )}
    </div>
  );
}

function UserReviewItem({ reviewId, userAddress }: { reviewId: number; userAddress: string }) {
  const { data: review } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviews",
    args: [BigInt(reviewId)],
  });

  if (!review) return null;
  const [paperId, reviewer, ipfsCid, score, submittedAt] = review as [bigint, string, string, number, bigint];
  
  if (reviewer.toLowerCase() !== userAddress.toLowerCase()) return null;

  return (
    <Link href={`/papers/${Number(paperId)}`}>
      <Card className="bg-gray-800 border-gray-700 hover:border-emerald-600 transition cursor-pointer">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium">Review for Paper #{Number(paperId)}</h4>
            <Badge className="bg-emerald-700">Score: {Number(score)}/10</Badge>
          </div>
          <p className="text-sm text-gray-400 mb-2 truncate">CID: {ipfsCid}</p>
          <p className="text-xs text-gray-500">
            Submitted: {new Date(Number(submittedAt) * 1000).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function UserFunding({ userAddress }: { userAddress: string }) {
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposalCount",
  });

  const proposals = [];
  const count = proposalCount ? Number(proposalCount) : 0;
  
  for (let i = 0; i < count; i++) {
    proposals.push(<UserProposalItem key={i} proposalId={i} userAddress={userAddress} />);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Funding Proposals</h3>
      {proposals.length === 0 ? (
        <p className="text-gray-500">No funding proposals created yet.</p>
      ) : (
        <div className="space-y-3">
          {proposals}
        </div>
      )}
    </div>
  );
}

function UserProposalItem({ proposalId, userAddress }: { proposalId: number; userAddress: string }) {
  const { data: proposal } = useReadContract({
    address: ADDRESSES.funding,
    abi: ResearchFundingABI,
    functionName: "proposals",
    args: [BigInt(proposalId)],
  });

  if (!proposal) return null;
  const [paperId, proposer, description, fundingGoal, totalRaised] = proposal as [bigint, string, string, bigint, bigint];
  
  if (proposer.toLowerCase() !== userAddress.toLowerCase()) return null;

  const raisedEth = Number(totalRaised) / 1e18;
  const goalEth = Number(fundingGoal) / 1e18;
  const progress = goalEth > 0 ? (raisedEth / goalEth) * 100 : 0;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">Funding for Paper #{Number(paperId)}</h4>
          <div className="text-sm text-gray-400">
            {raisedEth.toFixed(3)} / {goalEth.toFixed(3)} ETH
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{progress.toFixed(1)}% funded</p>
      </CardContent>
    </Card>
  );
}

function UserBounties({ userAddress }: { userAddress: string }) {
  const { data: bountyCount } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bountyCount",
  });

  const bounties = [];
  const count = bountyCount ? Number(bountyCount) : 0;
  
  for (let i = 0; i < count; i++) {
    bounties.push(<UserBountyItem key={i} bountyId={i} userAddress={userAddress} />);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Bounties</h3>
      {bounties.length === 0 ? (
        <p className="text-gray-500">No bounties posted yet.</p>
      ) : (
        <div className="space-y-3">
          {bounties}
        </div>
      )}
    </div>
  );
}

function UserBountyItem({ bountyId, userAddress }: { bountyId: number; userAddress: string }) {
  const { data: bounty } = useReadContract({
    address: ADDRESSES.bounty,
    abi: ReproducibilityBountyABI,
    functionName: "bounties",
    args: [BigInt(bountyId)],
  });

  if (!bounty) return null;
  const [paperId, poster, amount, claimed, deadline] = bounty as [bigint, string, bigint, boolean, bigint];
  
  if (poster.toLowerCase() !== userAddress.toLowerCase()) return null;

  const amountEth = Number(amount) / 1e18;
  const isExpired = Number(deadline) < Date.now() / 1000;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">Bounty for Paper #{Number(paperId)}</h4>
          <div className="text-sm text-emerald-400">{amountEth.toFixed(3)} ETH</div>
        </div>
        <div className="flex gap-2">
          <Badge className={claimed ? "bg-gray-600" : isExpired ? "bg-red-600" : "bg-emerald-600"}>
            {claimed ? "Claimed" : isExpired ? "Expired" : "Active"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Deadline: {new Date(Number(deadline) * 1000).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}