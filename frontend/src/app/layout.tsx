import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Nav } from "@/components/nav";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeSci Commons",
  description: "Decentralized science platform for open research",
  keywords: "decentralized science, research, peer review, academic publishing, blockchain",
  authors: [{ name: "DeSci Commons" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen antialiased`}>
        <ErrorBoundary>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Nav />
              <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <footer className="border-t border-gray-800 py-8 px-4">
                <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
                  <div className="mb-4">
                    <span className="font-semibold text-emerald-400">🔬 DeSci Commons</span> - 
                    Science as a Public Good
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
                    <span>Built on Ethereum • Open Source • Decentralized</span>
                  </div>
                </div>
              </footer>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
