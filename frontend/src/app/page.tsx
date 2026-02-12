import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Publish Research",
    desc: "Store papers on IPFS, register on-chain. No gatekeepers, no paywalls.",
    icon: "📄",
    href: "/submit",
  },
  {
    title: "Peer Review",
    desc: "Transparent, incentivized peer review. Reviewers earn reputation on-chain.",
    icon: "🔍",
    href: "/review",
  },
  {
    title: "Quadratic Funding",
    desc: "Community-driven funding with quadratic matching. Small contributions get amplified.",
    icon: "💰",
    href: "/funding",
  },
  {
    title: "Reproducibility Bounties",
    desc: "Post bounties to incentivize replication of studies. Science gets stronger.",
    icon: "🔁",
    href: "/bounties",
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold mb-6">
          Science as a{" "}
          <span className="text-emerald-400">Public Good</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          DeSci Commons is a decentralized platform for publishing, funding, and
          reviewing research — open to everyone, owned by no one.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/papers">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Browse Research
            </Button>
          </Link>
          <Link href="/submit">
            <Button size="lg" variant="outline">
              Submit Paper
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        {features.map((f) => (
          <Link key={f.title} href={f.href}>
            <Card className="bg-gray-900 border-gray-800 hover:border-emerald-600 transition cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-3xl">{f.icon}</span>
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{f.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="text-center py-12 border-t border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8 text-sm text-gray-400">
          <div>
            <div className="text-4xl mb-2">1️⃣</div>
            <p><strong className="text-gray-200">Submit</strong> your paper with IPFS upload</p>
          </div>
          <div>
            <div className="text-4xl mb-2">2️⃣</div>
            <p><strong className="text-gray-200">Review</strong> — community peers evaluate</p>
          </div>
          <div>
            <div className="text-4xl mb-2">3️⃣</div>
            <p><strong className="text-gray-200">Publish</strong> — papers go live on-chain</p>
          </div>
          <div>
            <div className="text-4xl mb-2">4️⃣</div>
            <p><strong className="text-gray-200">Fund & Replicate</strong> — community supports research</p>
          </div>
        </div>
      </section>
    </div>
  );
}
