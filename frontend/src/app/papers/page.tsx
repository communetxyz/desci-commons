"use client";

import { useReadContract } from "wagmi";
import { ADDRESSES, ResearchRegistryABI } from "@/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const STATUS_LABELS = ["Submitted", "Under Review", "Published", "Disputed"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-yellow-600",
  "Under Review": "bg-blue-600",
  Published: "bg-emerald-600",
  Disputed: "bg-red-600",
};

function PaperCard({ id }: { id: number }) {
  const { data } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "getPaper",
    args: [BigInt(id)],
  });

  if (!data) return null;
  const [ipfsCid, , authors, fieldTags, status] = data as [string, string, string[], string[], number, bigint, string];
  const statusLabel = STATUS_LABELS[status] || "Unknown";

  return (
    <Link href={`/papers/${id}`}>
      <Card className="bg-gray-900 border-gray-800 hover:border-emerald-600 transition cursor-pointer">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Paper #{id}</CardTitle>
            <Badge className={STATUS_COLORS[statusLabel]}>{statusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-400 font-mono truncate">CID: {ipfsCid}</p>
          <div className="flex gap-2 flex-wrap">
            {(fieldTags as string[]).map((tag: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500">{(authors as string[]).length} author(s)</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PapersPage() {
  const { data: count } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "paperCount",
  });

  const paperCount = count ? Number(count) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Research Papers</h1>
      <p className="text-gray-400">{paperCount} papers registered on-chain</p>
      {paperCount === 0 ? (
        <p className="text-gray-500">No papers yet. Be the first to <Link href="/submit" className="text-emerald-400 underline">submit one</Link>!</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: paperCount }, (_, i) => (
            <PaperCard key={i} id={i} />
          ))}
        </div>
      )}
    </div>
  );
}
