# Cloudinary — Junction 2026 partner intelligence

> **Roster update — 24 October 2026:** independently confirmed in the official page's partner section as **Tech**. This update supersedes earlier uncertainty about the listing/tier below. The original product research date remains as stated; API versions, prices and access in the older report have not all been re-tested or re-researched. Challenge briefs remain TBA. [Current coverage and source record](README.md).

**Research date: 8 October 2026. Team: three full-stack developers plus research/AI/product/pitch lead.**

**Verdict: Tier 2 overall; Tier 1 for a media-heavy challenge.** Learn signed uploads and optimized delivery now; activate advanced features only when the challenge needs them. Cloudinary should own media ingestion, transformations, asset storage and delivery; your backend should own users, permissions and business decisions.

## 1. Junction role and benefits

**Confirmed:** Cloudinary’s [developer community calendar](https://cloudinary.com/developers/community) lists Hack Junction, 13–15 November. [Junction](https://2026.hackjunction.com/) confirms the dates and distinguishes Tech Partners from Challenge Partners.

**Provided in the brief, not independently verified from accessible page text:** Cloudinary’s specific Technology Partner designation. **Unconfirmed:** Hackerpack credits, account upgrades, allowances, workshops, named mentors, promoted APIs and Cloudinary prize eligibility. An event listing does not establish these benefits. No verified previous Junction project or Cloudinary prize precedent was found in this research. Ask organizers before depending on an offer; challenge tracks and the full prize breakdown remain unpublished on the reviewed Junction page.

## 2–3. Platform and developer interfaces

Cloudinary goes beyond file hosting: [image transformations](https://cloudinary.com/documentation/image_transformations), video processing, CDN delivery, asset metadata/search, moderation integrations and workflows. Access to individual AI operations and DAM features depends on product, plan and add-ons.

| Interface | Best hackathon use | Authentication | Estimated setup |
|---|---|---|---|
| [Upload API](https://cloudinary.com/documentation/image_upload_api_reference) | Ingest images/video | Backend credentials or signed browser request; restricted unsigned option | 1 hour |
| Transformation URLs | Resize, crop, optimize, overlay | Public delivery; signatures for protected cases | 15 min |
| [Admin/Search API](https://cloudinary.com/documentation/admin_api) | Manage/query assets and metadata | Backend API key/secret | 1 hour |
| [Upload Widget](https://cloudinary.com/documentation/upload_widget) | Ready-made picker and progress UX | Signed or unsigned setup | 1 hour |
| React / Next.js helpers | Responsive images and video UI | Delivery URLs; backend signing separately | 1 hour |
| Node.js / Python SDK | Sign requests; manage/delete assets | Server credentials | 1 hour |
| Java / mobile SDKs | Existing Java/mobile stack | Operation-dependent | Unnecessary otherwise |
| CLI | Seed/inspect/clean test assets | Local credentials | 15 min |
| Assets/DAM APIs; Media Library widget | Editorial/catalogue workflows | Product/client-specific authorized access | Several hours |
| Video Player | Playback, captions, streaming | Asset access configuration | 1 hour |

Estimates are team planning judgments, not vendor guarantees. See the [SDK catalogue](https://cloudinary.com/documentation/cloudinary_sdks); do not introduce a new language just for Cloudinary.

## 4. Upload architecture

| Pattern | Tradeoff | Recommendation |
|---|---|---|
| Client → backend → Cloudinary | Backend handles bytes; easiest place for strict byte validation | Use when inspection is essential |
| Client → signature endpoint → Cloudinary | Keeps large files off app server; secret stays server-side | **Default for this team** |
| Client → unsigned preset → Cloudinary | Fast; exposed preset can be abused | Controlled prototype only |
| Upload Widget | Implements upload UX; still needs a signing/preset design | Fastest polished interface |

Authenticate and rate-limit the signature endpoint; sign only server-approved parameters. The signature is not proof of file contents. Keep the API secret server-side ([signature docs](https://cloudinary.com/documentation/authentication_signatures)).

Restrict formats, public-ID behavior and incoming normalization. **Presets do not support per-preset file-size limits**; widget limits are client checks and can be bypassed ([presets](https://cloudinary.com/documentation/upload_presets)). Where a hard byte limit is necessary, verify enforcement server-side or use the proxy pattern. Choose a conservative application limit, such as 10 MB images and 30-second demo videos.

## 5. Image pipeline

Original → transformation parameters → derived asset → CDN. Use resize/crop, automatic gravity, face-aware framing, overlays/text, masks, effects and chained actions to replace backend image-processing code. Preserve the original for evidence.

Start with `c_fill,g_auto,w_800,h_600/q_auto,f_auto` as a delivery transformation. Use responsive widths, `srcset`, suitable DPR and lazy loading for offscreen media. Apply `f_auto` at delivery, not incoming or inside a named transformation ([optimization](https://cloudinary.com/documentation/image_optimization)). Limit permitted sizes to avoid derivative proliferation.

## 6. Generative image transformations

[Generative transformations](https://cloudinary.com/documentation/generative_ai_transformations) support natural-language image edits; assess fill, removal/replacement and background editing against the actual account. These are not all interchangeable with unlimited free standard transforms.

Generative fill has special metering, excludes transparent/animated/fetched images, and can return **423 while a derivative is processing**, or **420/pending** for incoming work ([reference](https://cloudinary.com/documentation/transformation_reference)). Build waiting, retry and original-image fallback states; precompute pitch assets.

## 7–9. Video, analysis and multimodal models

Cloudinary can deliver [HLS/DASH adaptive streaming](https://cloudinary.com/documentation/adaptive_bitrate_streaming), trim clips, overlay images and display subtitles. [Audio transcription](https://cloudinary.com/documentation/video_transcription) yields transcript/subtitle files; confirm service access, languages and charging before relying on it.

[AI Video Analysis is beta](https://cloudinary.com/documentation/ai_video_analysis): it produces timestamped visual descriptions, not spoken-audio transcription. The [Analyze API is also beta](https://cloudinary.com/documentation/analyze_api_reference), with AI Vision questions, moderation and tagging endpoints; OCR and other provider integrations have separate feature/access conditions. A documented endpoint is not proof it is enabled on your account. No deprecated feature is recommended here.

**Suggested architecture:** upload → resize/crop or selected video frames → OpenAI/Gemini/self-hosted VLM → validated structured result → frontend. NVIDIA-backed inference is another deployment choice, not a Cloudinary requirement. Cloudinary handles pixels and delivery; the model handles semantic interpretation. Native AI may suffice for descriptions/tagging; task-specific reasoning needs evaluation and potentially another model.

## 10–12. Agents, MCP and MediaFlows

[Agent tooling](https://cloudinary.com/documentation/cloudinary_llm_mcp) includes Skills, local/remote MCP servers and assistant plugins. Documented marketplace integrations include Claude, Cursor, ChatGPT and Codex. Generic MCP clients need compatible transport/authentication; do not assume identical one-click support for Gemini CLI or Copilot without checking their current client instructions.

Skills guide coding; MCP performs account operations. Asset-management tooling can upload/manage media; MediaFlows tooling supports workflows. Cloudinary also documents agent provisioning through `npx @cloudinary/cloud`. Delegate SDK setup, signing endpoint, URL builders and fixtures to Claude Code/Codex, then inspect credential handling and permissions. This report did not execute an integration or authenticate an account.

[MediaFlows](https://cloudinary.com/documentation/mediaflows) provides visual/natural-language workflows, integrations and approval/enrichment steps; its [Workflow Agent](https://cloudinary.com/documentation/mediaflows_user_guide) can construct flows. Candidate: upload → analyze → metadata → transform → notify. Use only after a small end-to-end trial confirms access, billing and recovery; a simple backend job is a reasonable default for experienced developers. Keep agent writes scoped to a disposable environment and require review for destructive operations.

## 13–14. DAM and search

Use tags, contextual/structured metadata, folders, versions and moderation states when managing many assets. Keep ownership/authorization in your application database. Useful searches: unresolved municipal reports; product photos missing approval; evaluation images by label/date; clips awaiting processing. Full editorial DAM is unnecessary for a handful of demo uploads. Consult [Admin/Search](https://cloudinary.com/documentation/admin_api) for available filters and account limits.

## 15–16. Performance and costs

Benchmark raw versus transformed delivery under the same browser/network: transferred bytes, cold/warm latency, LCP and video startup. Record visual quality too; smaller files alone do not demonstrate better task outcomes.

The [free plan](https://cloudinary.com/pricing) lists **25 monthly credits, three users and one account**—relevant to a four-person team. It includes core image/video APIs. Paid tiers and AI add-ons require separate checking; no hackathon upgrade is established.

[Billing rules](https://cloudinary.com/documentation/billing_and_plans): one credit corresponds to 1,000 standard transformations, 1 GB storage or 1 GB image bandwidth; consumption adds across categories. Video bandwidth is 1 GB/credit free, 2 GB/credit on listed self-service paid plans. Video processing is duration/resolution-dependent; advanced AI has special counts. Cached derivatives avoid repeated transformation work but still consume delivery bandwidth.

Planning example: 100 × 2 MB originals ≈ 0.2 storage credits; 300 standard derivatives ≈ 0.3; 1,000 × 200 KB image deliveries ≈ 0.2. Roughly 0.7 credits **before** derivative storage, backups, video and AI. Monitor actual usage; this is not a quote.

## 17–18. Security and UGC

[Private delivery protects originals but can leave derivatives public](https://cloudinary.com/documentation/control_access_to_media). Authenticated delivery protects both, with documented eager-generation restrictions. A signed URL can be shared; it does not establish user-level authorization.

Recommended controls: consented synthetic fixtures, authenticated uploads, restricted transformations, approval before publication, webhook verification, quotas and cleanup. Deletion must cover originals, derived outputs, analysis/transcript assets and relevant caches/backups; do not promise immediate global erasure. Treat moderation output as fallible evidence, with review for uncertain cases.

## 19–23. Alternatives and strategic direction

| Alternative | Choose it when |
|---|---|
| Object storage | You need inexpensive opaque-file storage and little processing |
| Own Sharp/FFmpeg stack | Custom processing or deployment control outweighs setup time |
| Dedicated image-generation provider | New-image generation/model choice is the central requirement |
| Cloudinary | Many user assets need consistent transformation and reliable delivery |

Cloudinary is visibly expanding toward agents, media workflows and AI analysis. Its [2026 blog archive](https://cloudinary.com/blog/archives) also announces a multi-model Image Generation API. Thus it is not solely an editor of existing images; compare current generation access/costs rather than assuming equivalence to a specialist provider. Marketing direction does not prove hackathon judging preference.

## 24–29. Partner combinations, patterns and project seeds

All combinations below are **inferences**, not announced challenges or verified cross-partner integrations.

| Partner | Useful hypothesis |
|---|---|
| Aalto | Research media collection and labeled evaluation examples |
| Arduino | Capture snapshots at the edge; Cloudinary serves review evidence |
| Espoo | Citizen photos → issue triage → searchable evidence |
| Valio Aimo | Product photography, visual inspection or catalogue enrichment |
| Hostinger | Host application; Cloudinary owns its media pipeline |
| Exa/Cala | Retrieved context plus user media; verify Cala’s actual interface first |

Reusable patterns: UGC → approval → delivery; image → VLM → result; video → frames/transcript → reasoning; original → generated edit → comparison; upload → workflow → publish.

Project seeds: municipal repair triage; product-photo readiness assistant; searchable visual maintenance clips. Pick one user and one measurable bottleneck. Cloudinary becomes essential when the solution repeatedly ingests, transforms and serves media; adding a logo to a text-only app adds little.

Pitch with a before/after media comparison, evidence provenance and measured latency/bytes or review time. Mark generated edits explicitly; never use them as factual inspection evidence.

## 30–33. Preparation, exercise and risks

**Definitely:** create account, secure credentials, Node SDK, signed upload, two delivery transformations, quota visibility and deletion. **Worth preparing:** one Python/VLM trial, Skills, short-video upload. **Wait:** generative fill, MCP account writes and MediaFlows until relevant. Review event rules before reusing prewritten submission code.

**1–2 hour generic exercise:** build a disposable upload page; add an authenticated signature endpoint; upload five consented images; generate square and landscape crops with optimized delivery; ask one model for structured descriptions; show originals/results; measure delivered bytes and cold/warm latency; delete all resulting assets. Record failure behavior and actual usage. This is practice, not a proposed submission.

Main traps: exposed secrets; reusable unsigned presets; unenforced client file limits; huge videos; arbitrary transformation variants; premium features missing; pending AI work; fragile beta endpoints; mistaken privacy; incomplete cleanup. Mitigate with server policy, fixed variants, short fixtures, fallback rendering, access trials and explicit retention.

**Team verdict:** spend one focused preparation session, then prioritize the eventual challenge. Use Cloudinary to remove media engineering work when it matters.

## 34. Cheat sheet

| Item | Recommendation |
|---|---|
| Partner / role | Cloudinary; Tech Partner stated in brief, event presence verified |
| Fundamental capability | Programmable media processing and delivery |
| Best reason / when to skip | Repeated image/video workflows / media-light app |
| Fastest upload architecture | Signed direct upload with Upload Widget |
| Most useful transformation | Crop/resize + `q_auto,f_auto` |
| Interesting AI capability | Timestamped visual video analysis, beta |
| Agent integration | Relevant Cloudinary Skills; MCP after access review |
| Video capability | Adaptive streaming with prepared renditions |
| Best combination | Espoo photo evidence + model triage, hypothetical |
| Metric | End-to-end processing time plus delivered bytes |
| Preparation | Complete the disposable signed-upload exercise |
| Security / cost trap | Public derivatives / video and AI usage |
| Tier / relevance / confidence | Tier 2; 8/10 media-heavy, 3/10 otherwise; 8/10 platform, 4/10 event benefits |

### Five things to remember

1. Put Cloudinary in charge of media processing and delivery.
2. Sign browser uploads without exposing secrets.
3. Validate feature access and actual metering before choosing advanced AI.
4. Warm expensive derivatives and provide pending/error states.
5. Event presence does not confirm free credits or prize eligibility.