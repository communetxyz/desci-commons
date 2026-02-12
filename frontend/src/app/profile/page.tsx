"use client";

import { useAccount, useReadContract } from "wagmi";
import { ADDRESSES, PeerReviewABI } from "@/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

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
    <div className="max-w-2xl mx-auto space-y-6">
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
    </div>
  );
}
