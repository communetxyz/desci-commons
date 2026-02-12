"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from "viem";
import { ADDRESSES, ResearchRegistryABI, PeerReviewABI } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";

const STATUS_LABELS = ["Submitted", "Under Review", "Published", "Disputed"];

export default function ReviewPage() {
  const { address } = useAccount();
  
  const { data: paperCount } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "paperCount",
  });

  const { data: reputation } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviewerReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Peer Review</h1>
          <p className="text-gray-400">{paperCount ? Number(paperCount) : 0} papers available for review</p>
        </div>
        {address && (
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-400">{reputation ? Number(reputation) : 0}</div>
            <div className="text-sm text-gray-400">Your Reputation</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="browse">Papers to Review</TabsTrigger>
          <TabsTrigger value="submit">Submit Review</TabsTrigger>
          <TabsTrigger value="guidelines">Review Guidelines</TabsTrigger>
          <TabsTrigger value="rewards">Reviewer Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <PapersToReview />
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <SubmitReviewForm />
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <ReviewGuidelines />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <ReviewerRewards />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PapersToReview() {
  const { data: paperCount } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "paperCount",
  });

  const count = paperCount ? Number(paperCount) : 0;

  if (count === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold mb-2">No papers to review</h2>
        <p className="text-gray-400 mb-6">Papers will appear here once they are submitted.</p>
        <Button asChild>
          <Link href="/submit" className="bg-emerald-600 hover:bg-emerald-700">
            Submit a Paper
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Papers Awaiting Review</h2>
        <Badge variant="outline">{count} total papers</Badge>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: count }, (_, i) => (
          <PaperReviewCard key={i} paperId={i} />
        ))}
      </div>
    </div>
  );
}

function PaperReviewCard({ paperId }: { paperId: number }) {
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

  const { data: hasReviewed } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "hasReviewed",
    args: [BigInt(paperId), address!],
    query: { enabled: !!address },
  });

  if (!paper) return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardContent className="pt-6 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );

  const [ipfsCid, , authors, fieldTags, status, submittedAt] = paper as [string, string, string[], string[], number, bigint, string];
  const statusLabel = STATUS_LABELS[status] || "Unknown";
  const reviewCount = reviewIds ? (reviewIds as bigint[]).length : 0;
  const canReview = (status === 0 || status === 1) && !hasReviewed;
  const userHasReviewed = !!hasReviewed;

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-emerald-600 transition">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Paper #{paperId}</CardTitle>
            <p className="text-sm text-gray-400">{reviewCount} reviews • {(authors as string[]).length} authors</p>
          </div>
          <Badge className={
            status === 0 ? "bg-yellow-600" : 
            status === 1 ? "bg-blue-600" : 
            status === 2 ? "bg-emerald-600" : 
            "bg-red-600"
          }>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <span className="text-gray-400">IPFS CID:</span>{" "}
          <a 
            href={`https://ipfs.io/ipfs/${ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline font-mono hover:text-emerald-300 text-xs"
          >
            {ipfsCid.slice(0, 20)}...
          </a>
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {(fieldTags as string[]).slice(0, 3).map((tag: string, i: number) => (
            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
          ))}
          {(fieldTags as string[]).length > 3 && (
            <Badge variant="outline" className="text-xs">+{(fieldTags as string[]).length - 3}</Badge>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          Submitted: {new Date(Number(submittedAt) * 1000).toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" asChild className="flex-1">
            <Link href={`/papers/${paperId}`}>View Paper</Link>
          </Button>
          {userHasReviewed ? (
            <Button size="sm" disabled className="bg-gray-600">
              Already Reviewed
            </Button>
          ) : canReview ? (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              Review
            </Button>
          ) : (
            <Button size="sm" disabled className="bg-gray-600">
              {status === 2 ? "Published" : "Not Available"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmitReviewForm() {
  const [paperId, setPaperId] = useState("");
  const [reviewCid, setReviewCid] = useState("");
  const [score, setScore] = useState([7]);
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [reviewText, setReviewText] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: paper } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "getPaper",
    args: paperId ? [BigInt(paperId)] : undefined,
    query: { enabled: !!paperId },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    writeContract({
      address: ADDRESSES.peerReview,
      abi: PeerReviewABI,
      functionName: "submitReview",
      args: [BigInt(paperId), reviewCid, score[0]],
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Submit Peer Review</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
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
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Stake Amount (ETH)</label>
                <Input 
                  value={stakeAmount} 
                  onChange={(e) => setStakeAmount(e.target.value)} 
                  placeholder="0.01" 
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional stake to increase review credibility
                </p>
              </div>
            </div>

            {paper && (
              <Alert className="bg-gray-800 border-gray-700">
                <AlertDescription>
                  <strong>Reviewing Paper #{paperId}:</strong> {(paper as any)[0]}
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <label className="text-sm text-gray-400 block mb-2">Review Score: {score[0]}/10</label>
              <Slider
                value={score}
                onValueChange={setScore}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (Poor)</span>
                <span>5 (Average)</span>
                <span>10 (Excellent)</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 block mb-2">Detailed Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Provide detailed feedback on methodology, results, significance..."
                className="bg-gray-800 border-gray-700 min-h-[120px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be uploaded to IPFS automatically
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 block mb-2">Or provide existing IPFS CID</label>
              <Input 
                value={reviewCid} 
                onChange={(e) => setReviewCid(e.target.value)} 
                placeholder="QmReview... (optional if review text provided above)"
                className="bg-gray-800 border-gray-700" 
              />
            </div>

            <div className="bg-gray-800 p-4 rounded">
              <h4 className="font-medium mb-2">Review Checklist:</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" required />
                  I have thoroughly read the paper
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" required />
                  I understand the methodology and results
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" required />
                  My review is constructive and professional
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" required />
                  I have no conflicts of interest
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isPending || isConfirming || (!reviewText && !reviewCid)} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? "Confirm in Wallet..." : isConfirming ? "Confirming..." : "Submit Review"}
            </Button>
            
            {isSuccess && (
              <Alert className="bg-emerald-900 border-emerald-600 text-emerald-400">
                <AlertDescription>
                  ✅ Review submitted successfully! Your reputation will increase once the paper is processed.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewGuidelines() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Review Guidelines</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🎯 What Makes a Good Review</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• <strong>Thoroughness:</strong> Read the entire paper carefully</li>
              <li>• <strong>Constructive feedback:</strong> Point out strengths and areas for improvement</li>
              <li>• <strong>Technical accuracy:</strong> Verify methodology and statistical analysis</li>
              <li>• <strong>Clarity:</strong> Check if the paper is well-written and understandable</li>
              <li>• <strong>Significance:</strong> Assess the contribution to the field</li>
              <li>• <strong>Reproducibility:</strong> Can others replicate this work?</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">⭐ Scoring Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800 p-3 rounded">
                <strong className="text-red-400">1-3: Poor</strong>
                <p className="text-gray-400 text-xs mt-1">Major flaws, incorrect methodology, unsubstantiated claims</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <strong className="text-yellow-400">4-6: Average</strong>
                <p className="text-gray-400 text-xs mt-1">Solid work but with significant limitations or minor errors</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <strong className="text-emerald-400">7-8: Good</strong>
                <p className="text-gray-400 text-xs mt-1">Well-executed study with clear contributions</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <strong className="text-purple-400">9-10: Excellent</strong>
                <p className="text-gray-400 text-xs mt-1">Outstanding work that advances the field significantly</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🚫 Review Ethics</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Maintain confidentiality of unpublished work</li>
              <li>• Declare any conflicts of interest</li>
              <li>• Be respectful and professional in feedback</li>
              <li>• Focus on the work, not the authors</li>
              <li>• Don't delay reviews unnecessarily</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Staking & Reputation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-900 border-blue-600 text-blue-400">
            <AlertDescription>
              <strong>Coming Soon:</strong> Stake ETH with your reviews to increase their weight and earn higher rewards. 
              Accurate reviews get stake returned plus bonuses; poor reviews may forfeit stake.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-gray-400 space-y-2">
            <p><strong>How it works:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Higher stakes = more influence on paper acceptance</li>
              <li>• Consensus reviews earn reputation and potential rewards</li>
              <li>• Outlier reviews may be penalized if they're clearly inaccurate</li>
              <li>• Build reputation over time to become a trusted reviewer</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewerRewards() {
  const { address } = useAccount();
  
  const { data: reputation } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviewerReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Reviewer Rewards System</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded text-center">
              <div className="text-2xl font-bold text-emerald-400">{reputation ? Number(reputation) : 0}</div>
              <div className="text-sm text-gray-400">Your Reputation</div>
            </div>
            <div className="bg-gray-800 p-4 rounded text-center">
              <div className="text-2xl font-bold text-blue-400">-</div>
              <div className="text-sm text-gray-400">Rewards Earned</div>
            </div>
            <div className="bg-gray-800 p-4 rounded text-center">
              <div className="text-2xl font-bold text-purple-400">-</div>
              <div className="text-sm text-gray-400">Avg Review Score</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">🏆 Reputation Benefits</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-700">0-5 Reviews</Badge>
                  <span className="text-gray-400">New Reviewer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">6-20 Reviews</Badge>
                  <span className="text-gray-400">Regular Reviewer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600">21-50 Reviews</Badge>
                  <span className="text-gray-400">Expert Reviewer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600">51+ Reviews</Badge>
                  <span className="text-gray-400">Senior Reviewer</span>
                </div>
              </div>
              <div className="space-y-2 text-gray-400">
                <p>• Higher reputation = more review weight</p>
                <p>• Access to special reviewer-only features</p>
                <p>• Potential for future governance tokens</p>
                <p>• Recognition in the community</p>
              </div>
            </div>
          </div>

          <Alert className="bg-yellow-900 border-yellow-600 text-yellow-400">
            <AlertDescription>
              <strong>Future Feature:</strong> Reviewers will earn tokens for quality reviews, 
              with higher rewards for consensus building and accurate evaluations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Recent Review Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p>Connect your wallet to see your review history and earnings.</p>
            {!address && (
              <Button className="mt-4">Connect Wallet</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}