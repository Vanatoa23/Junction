# Junction 2026 Partner Intelligence — IronShard

Research cutoff: **10 October 2026**. Recommendation: **Tier 2 — learn enough to activate quickly**. Allocate one developer an hour; prioritize storage integration over governance promises. This report assesses documentation, not a tested account.

## 1. Exact identity

**Identity confidence: High.** Junction’s official 2026 partner section lists **IronShard under Tech Partners**, linking directly to `https://ironshard.ai/` (verified in the rendered page). Its role is Technology Partner, not a confirmed challenge owner. Junction describes Tech Partners as bringing platforms, APIs and tools to participants. [Official Junction partners](https://2026.hackjunction.com/#partners)

The product is **IronShard**, S3-compatible object storage for AI agents, a spin-off of **Chocolate Cloud ApS**, Denmark. The official site establishes this relationship; a separate incorporated IronShard legal entity is not established here. Category: storage/data infrastructure, with MCP integration and security controls—not model inference. [Official identity](https://www.ironshard.ai/about)

## 2. What developers can use

Use hosted buckets for documents, datasets, agent artifacts and pipeline outputs. Encryption, erasure coding, distribution across providers and residency geo-fencing are documented as available. [Control status](https://www.ironshard.ai/docs/compliance-controls)

The crucial qualification: **per-agent access control, signed audit logs, lineage/reproducibility and isolated production branches are in development**, despite stronger homepage language. Public MCP supports bucket creation, listing, object metadata, deletion and presigned upload/download URLs; snapshots, branching, merging and audit retrieval are planned. [Agent Buckets](https://www.ironshard.ai/docs/agent-buckets)

Do not pitch those planned features as implemented. IronShard provides object storage; your team still builds retrieval, evaluation and application logic.

## 3. Junction-specific benefit

- **CONFIRMED:** Technology Partner listing. Separately, ordinary public access advertises a free tier without a credit card; this is not a Junction entitlement. [Builder access](https://www.ironshard.ai/solutions/technology)
- **INFERENCE:** The role suggests developer enablement, but proves no specific support arrangement.
- **UNKNOWN:** Junction credits, expanded quotas, licenses, dedicated API access, workshops, mentors, Hackerpack inclusion and special prizes. No IronShard-specific public offer was found. Junction’s overall prize pool does not establish an IronShard prize.

## 4. Developer experience

Human setup starts in the console, then S3 access keys; production MCP uses OAuth at `https://mcp.ironshard.ai/mcp`. Public sandbox MCP at `https://agents-mcp.ironshard.ai/mcp` requires no account/OAuth and returns bucket credentials. Preserve the token; it is unrecoverable. MCP transfers object bytes through presigned HTTP URLs, not inline tool payloads. [MCP documentation](https://www.ironshard.ai/docs/agent-buckets)

The HTTP S3 API has Python/boto3, JavaScript/AWS SDK (usable from TypeScript), and AWS CLI examples. No GraphQL interface, proprietary SDK/CLI or supported Docker deployment was established. Endpoint: `https://s3.ironshard.ai`; use SigV4 and path-style addressing. [S3 quickstart](https://www.ironshard.ai/docs/s3-quickstart)

The site links an [official GitHub organization](https://github.com/IronShardAI), but its contents could not be retrieved; no usable open-source server or example repository was verified. **First useful integration: 1 h estimated**, possibly 15 minutes for an existing MCP client; governance integration is risky.

## 5. Why choose it?

The nearest practical choices are ordinary filesystem/open-source storage tooling and **Modal Volumes**. Local files minimize prototype setup; IronShard adds hosted, S3-accessible storage and public MCP provisioning without operating a storage server. Modal Volumes already supply shared persistent files for Modal applications, so an entirely Modal-based workflow may need no additional storage service. [Modal Volumes](https://modal.com/docs/guide/volumes)

IronShard’s compelling current distinction is **agent-provisioned hosted buckets plus encrypted multi-provider storage**. Standard pricing advertises $0.018/GB/month and zero egress; Custom may charge egress. At hackathon scale, cost savings rarely justify integration alone. [Pricing](https://www.ironshard.ai/pricing)

## 6. Direction in 2025–2026

Current priorities are MCP provisioning, S3 compatibility, agent governance and multi-cloud privacy. The Trust Center was updated **8 October 2026** and distinguishes provider certifications from IronShard’s own posture. [Trust Center](https://www.ironshard.ai/trust-center)

The team reports ongoing cloud-edge storage research through MLSysOps (2023–2026), EMPYREAN (2024–2027) and O-CEI (2025–2028). These establish technical direction, not IronShard feature release dates. No reliable dated launch chronology was found. [Research context](https://www.ironshard.ai/about)

**Why Junction now?** Its agent-storage focus matches Junction’s stated emphasis on AI/agent projects; developer adoption is a reasonable inference, not a disclosed participation motive.

## 7. Previous hackathon evidence

Targeted searches for IronShard with Junction 2025/2024, hackathons, workshops and developer projects found **no verifiable previous participation, completed hackathon project or independent developer feedback**. Do not confuse similarly named music/gaming entities or unrelated Junction organizations with this partner. Research pilots are not hackathon evidence.

## 8. Best Junction uses

| Problem | IronShard role | Why it helps | Estimated effort |
|---|---|---|---|
| Agents need somewhere to save reports | MCP-created artifact bucket | Provision storage without account setup | 15–60 min |
| Several services share a document corpus | S3 source-document storage | Common object interface across workers | 1 h, plus retrieval logic |
| Dataset processing overwrites inputs | Versioned raw/output objects | Retain earlier object versions | 1–2 h for recovery UI |
| Challenge specifies storage jurisdiction | Geo-fenced bucket | Placement controls are documented available | Several hours; verify policy |

These are proposed uses of documented capabilities, not established partner integrations. Use synthetic data until access and residency behavior are checked.

## 9. Preparation recommendation

### Definitely prepare

Read the S3 quickstart and availability tables; assign one developer ownership. Keep a storage adapter so you can switch providers.

### Worth preparing

Create a free account, securely save a workload key and complete upload/read-back. Bookmark the MCP endpoints and test sandbox provisioning if your client supports it.

### Wait for challenge

Large imports, residency policies, paid plans, advanced governance and sponsor-specific benefits. Recheck availability shortly before November 13.

## 10. Quick practice exercise

**60 minutes:** create a test bucket; upload synthetic CSV data and a JSON report; list and download both; verify matching hashes. Overwrite the report, then retrieve its earlier version. Optionally repeat basic object operations through public MCP. Record setup time, latency and failure messages. Success means reproducible storage access—not a simulated audit/branch demo.

## 11. Risks

Early-access positioning and conflicting marketing/status pages make roadmap dependency the largest risk. Free quotas, sandbox lifetime and rate limits remain unspecified; confirm them before relying on persistence. No CORS configuration means browser clients need a backend. Object tagging is unavailable. Versioning is always on: deletion creates a marker and old versions persist, affecting cleanup and costs. S3 reduces basic migration friction; proprietary MCP/governance features increase lock-in. [Compatibility limits](https://www.ironshard.ai/docs/s3-quickstart)

## 12. Final cheat sheet

**Partner:** IronShard  
**Exact company:** IronShard product; Chocolate Cloud ApS spin-off  
**Identity confidence:** High  
**Junction role:** Technology Partner  
**What it fundamentally provides:** Hosted S3-compatible, multi-cloud object storage  
**Best reason to use:** MCP-provisioned agent artifact storage  
**When not to use:** Storage adds no challenge value, or branching/audit is essential  
**Fastest integration:** Public MCP sandbox; S3 SDK for application code  
**Best partner combination:** None required; Modal worker using boto3 is a plausible unverified pairing  
**Best preparation:** One-hour storage/versioning exercise  
**Preparation tier:** Tier 2  
**Biggest uncertainty:** Governance availability and Junction-specific offer  
**Hackathon relevance: 5/10**

### Five things to remember

1. IronShard stores objects rather than running models.
2. Junction confirms the partner identity, not free event credits.
3. MCP bucket provisioning is documented available today.
4. Branches and signed audit logs remain development dependencies.
5. Spend one hour preparing, then activate only when storage helps the challenge.

