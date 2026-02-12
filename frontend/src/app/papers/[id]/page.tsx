"use client";

import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { ADDRESSES, ResearchRegistryABI, PeerReviewABI } from "@/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS = ["Submitted", "Under Review", "Published", "Disputed"];

export default function PaperDetailPage() {
  const { id } = useParams();
  const paperId = Number(id);

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

  if (!paper) return <p className="text-gray-400">Loading...</p>;

  const [ipfsCid, titleHash, authors, fieldTags, status, submittedAt, submitter] = paper as [
    string, string, string[], string[], number, bigint, string
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Paper #{paperId}</h1>
      <Badge className="text-sm">{STATUS_LABELS[status]}</Badge>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><span className="text-gray-400">IPFS CID:</span>{" "}
            <a href={`https://ipfs.io/ipfs/${ipfsCid}`} target="_blank" className="text-emerald-400 underline font-mono">{ipfsCid}</a>
          </div>
          <div><span className="text-gray-400">Title Hash:</span> <span className="font-mono text-xs">{titleHash}</span></div>
          <div><span className="text-gray-400">Submitter:</span> <span className="font-mono text-xs">{submitter}</span></div>
          <div><span className="text-gray-400">Submitted:</span> {new Date(Number(submittedAt) * 1000).toLocaleDateString()}</div>
          <div className="flex gap-2">
            <span className="text-gray-400">Fields:</span>
            {(fieldTags as string[]).map((t: string, i: number) => <Badge key={i} variant="outline">{t}</Badge>)}
          </div>
          <div>
            <span className="text-gray-400">Authors:</span>
            <ul className="mt-1">{(authors as string[]).map((a: string, i: number) => <li key={i} className="font-mono text-xs">{a}</li>)}</ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Reviews ({reviewIds ? (reviewIds as bigint[]).length : 0})</CardTitle></CardHeader>
        <CardContent>
          {!reviewIds || (reviewIds as bigint[]).length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {(reviewIds as bigint[]).map((rid: bigint) => (
                <ReviewItem key={rid.toString()} reviewId={Number(rid)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewItem({ reviewId }: { reviewId: number }) {
  const { data } = useReadContract({
    address: ADDRESSES.peerReview,
    abi: PeerReviewABI,
    functionName: "reviews",
    args: [BigInt(reviewId)],
  });

  if (!data) return null;
  const [, reviewer, ipfsCid, score] = data as [bigint, string, string, number, bigint];

  return (
    <div className="p-3 bg-gray-800 rounded text-sm">
      <div className="flex justify-between">
        <span className="font-mono text-xs text-gray-400">{reviewer}</span>
        <Badge className="bg-emerald-700">Score: {Number(score)}/10</Badge>
      </div>
      <p className="mt-1 text-gray-400">CID: <span className="font-mono">{ipfsCid}</span></p>
    </div>
  );
}
