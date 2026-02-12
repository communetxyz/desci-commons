# DeSci Commons

Decentralized science platform enabling open research beyond market constraints and institutional barriers.

## Architecture

### Smart Contracts (Sepolia)
| Contract | Address |
|----------|---------|
| ResearchRegistry | `0xa46252949d41CB62B24647D8975f56a19DB036A1` |
| PeerReview | `0x647E5E4b7a48c0a608f92845A380fF182aff317E` |
| ResearchFunding | `0x1FCA220289b4F2AD050C38b3470778a5deCa8A3e` |
| ReproducibilityBounty | `0xE69289ae3311c0497e972CBA6988De9Ba278aEe0` |

### Contracts
- **ResearchRegistry** — Submit papers (IPFS CID, title hash, authors, field tags), track status
- **PeerReview** — Submit reviews (score 1-10), auto-publish at 3+ reviews with avg ≥ 5
- **ResearchFunding** — Quadratic funding with matching pools, milestone-based release
- **ReproducibilityBounty** — Post bounties on published papers, community vote to release

### Frontend (Next.js 15)
- `/papers` — Browse research, `/papers/[id]` — Paper detail with reviews
- `/submit` — Submit paper, `/review` — Submit peer review
- `/funding` — Contribute to rounds, `/funding/create` — Create proposals
- `/bounties` — Post bounties, submit replications, vote
- `/profile` — Researcher profile with reputation

## Development

```bash
# Contracts
cd contracts && forge build && forge test

# Frontend
cd frontend && npm install && npm run build && npm run dev
```
