"use client";

import { useReadContract } from "wagmi";
import { ADDRESSES, ResearchRegistryABI } from "@/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";

const STATUS_LABELS = ["Submitted", "Under Review", "Published", "Disputed"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-yellow-600",
  "Under Review": "bg-blue-600",
  Published: "bg-emerald-600",
  Disputed: "bg-red-600",
};

interface PaperData {
  id: number;
  ipfsCid: string;
  titleHash: string;
  authors: string[];
  fieldTags: string[];
  status: number;
  submittedAt: bigint;
  submitter: string;
}

function PaperCard({ id, paper }: { id: number; paper: PaperData | null }) {
  if (!paper) return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardHeader>
        <div className="h-6 bg-gray-700 rounded w-3/4"></div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );

  const statusLabel = STATUS_LABELS[paper.status] || "Unknown";

  return (
    <Link href={`/papers/${id}`}>
      <Card className="bg-gray-900 border-gray-800 hover:border-emerald-600 transition cursor-pointer h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Paper #{id}</CardTitle>
            <Badge className={STATUS_COLORS[statusLabel]}>{statusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-400 font-mono truncate">CID: {paper.ipfsCid}</p>
          <div className="flex gap-1 flex-wrap">
            {paper.fieldTags.slice(0, 3).map((tag: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {paper.fieldTags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{paper.fieldTags.length - 3}</Badge>
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{paper.authors.length} author(s)</span>
            <span>{new Date(Number(paper.submittedAt) * 1000).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadPaper({ id, onLoad }: { id: number; onLoad: (id: number, data: PaperData | null) => void }) {
  const { data } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "getPaper",
    args: [BigInt(id)],
  });

  if (data) {
    const [ipfsCid, titleHash, authors, fieldTags, status, submittedAt, submitter] = data as [string, string, string[], string[], number, bigint, string];
    const paperData: PaperData = {
      id,
      ipfsCid,
      titleHash,
      authors,
      fieldTags,
      status,
      submittedAt,
      submitter,
    };
    onLoad(id, paperData);
  } else {
    onLoad(id, null);
  }

  return null;
}

export default function PapersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [papers, setPapers] = useState<Map<number, PaperData | null>>(new Map());

  const { data: count } = useReadContract({
    address: ADDRESSES.registry,
    abi: ResearchRegistryABI,
    functionName: "paperCount",
  });

  const paperCount = count ? Number(count) : 0;

  const handlePaperLoad = (id: number, data: PaperData | null) => {
    setPapers(prev => new Map(prev.set(id, data)));
  };

  // Get unique field tags for filter
  const allFieldTags = useMemo(() => {
    const tags = new Set<string>();
    papers.forEach(paper => {
      if (paper) {
        paper.fieldTags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [papers]);

  // Filter and sort papers
  const filteredPapers = useMemo(() => {
    const paperArray = Array.from(papers.entries())
      .map(([id, paper]) => ({ id, paper }))
      .filter(({ paper }) => paper !== null);

    let filtered = paperArray.filter(({ id, paper }) => {
      if (!paper) return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesCid = paper.ipfsCid.toLowerCase().includes(search);
        const matchesTags = paper.fieldTags.some(tag => tag.toLowerCase().includes(search));
        const matchesSubmitter = paper.submitter.toLowerCase().includes(search);
        if (!matchesCid && !matchesTags && !matchesSubmitter) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const targetStatus = STATUS_LABELS.indexOf(statusFilter);
        if (paper.status !== targetStatus) return false;
      }

      // Field filter
      if (fieldFilter !== "all") {
        if (!paper.fieldTags.includes(fieldFilter)) return false;
      }

      return true;
    });

    // Sort
    filtered.sort(({ paper: a }, { paper: b }) => {
      if (!a || !b) return 0;
      
      let comparison = 0;
      if (sortBy === "date") {
        comparison = Number(a.submittedAt) - Number(b.submittedAt);
      } else if (sortBy === "status") {
        comparison = a.status - b.status;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [papers, searchTerm, statusFilter, fieldFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Research Papers</h1>
          <p className="text-gray-400">{paperCount} papers registered • {filteredPapers.length} shown</p>
        </div>
        <Button asChild>
          <Link href="/submit" className="bg-emerald-600 hover:bg-emerald-700">
            Submit Paper
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_LABELS.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Filter by field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {allFieldTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">📅 Newest First</SelectItem>
                  <SelectItem value="date-asc">📅 Oldest First</SelectItem>
                  <SelectItem value="status-asc">📊 Status (A-Z)</SelectItem>
                  <SelectItem value="status-desc">📊 Status (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {paperCount} total papers
            </Badge>
            {searchTerm && (
              <Badge className="bg-blue-600 text-xs">
                Searching: "{searchTerm}"
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge className="bg-green-600 text-xs">
                Status: {statusFilter}
              </Badge>
            )}
            {fieldFilter !== "all" && (
              <Badge className="bg-purple-600 text-xs">
                Field: {fieldFilter}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load paper data for each paper */}
      {Array.from({ length: paperCount }, (_, i) => (
        <LoadPaper key={i} id={i} onLoad={handlePaperLoad} />
      ))}

      {/* Papers Grid */}
      {paperCount === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold mb-2">No papers yet</h2>
          <p className="text-gray-400 mb-6">Be the first to submit research to the decentralized commons!</p>
          <Button asChild>
            <Link href="/submit" className="bg-emerald-600 hover:bg-emerald-700">
              Submit First Paper
            </Link>
          </Button>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">No papers found</h2>
          <p className="text-gray-400 mb-6">Try adjusting your search or filters.</p>
          <Button onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setFieldFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map(({ id, paper }) => (
            <PaperCard key={id} id={id} paper={paper} />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {paperCount > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {Array.from(papers.values()).filter(p => p?.status === 0).length}
                </div>
                <div className="text-sm text-gray-400">Submitted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {Array.from(papers.values()).filter(p => p?.status === 1).length}
                </div>
                <div className="text-sm text-gray-400">Under Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {Array.from(papers.values()).filter(p => p?.status === 2).length}
                </div>
                <div className="text-sm text-gray-400">Published</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {Array.from(papers.values()).filter(p => p?.status === 3).length}
                </div>
                <div className="text-sm text-gray-400">Disputed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}