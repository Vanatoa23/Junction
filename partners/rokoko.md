# Rokoko — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Confirmed partner and product

Rokoko is listed as a Challenge Partner. Its products include motion-capture hardware, Rokoko Studio and video-based Rokoko Vision. The public site also links text-to-motion and third-party integrations. This does not confirm that any specific suit, glove, API or export entitlement will be available at Junction. [Junction](https://2026.hackjunction.com/#partners) · [Rokoko](https://www.rokoko.com/) · [Vision](https://www.rokoko.com/products/vision)

**Assessment:** investigate a video-first prototype before committing to unfamiliar hardware. Motion data creates an immediately understandable demo, but animation retargeting, capture quality and calibration can consume the weekend. The 2026 challenge scope remains unverified.

## Project hypotheses

| Candidate | Smallest demonstration | Evaluation |
|---|---|---|
| Motion capture quality assistant | Flag incomplete/occluded clips before expensive processing | Bad clips detected and false rejections |
| Searchable motion library | Retrieve a relevant movement from a small labelled set | Retrieval relevance and search time |
| Motion-driven interaction | One captured gesture controls a clear application action | Recognition reliability and response time |

Choose the first if the partner supplies sample captures and quality labels. The second fits a software-heavy team; the third can be visually strong but should be limited to a few well-separated actions. Do not pitch a generic skeleton animation as a complete user benefit.

## Workflow and architecture

Separate capture, conversion, storage, interpretation and playback. Verify the supported export format and skeleton convention before building the viewer. A “motion file” can differ in coordinate system, frame rate, bone hierarchy and units. Retargeting should be tested on the exact avatar and engine chosen.

Keep original recordings and derived motion linked by stable IDs. Store consent and permitted-use notes for human recordings. Start with one consenting teammate and one sample clip; avoid collecting a large dataset before the pipeline is reliable.

The frontend can show source video and animation side by side, with problematic frames highlighted. If an algorithm estimates quality, describe what is measured—missing joints, implausible jumps or manual reviewer labels—rather than using an unexplained confidence score.

## Demonstration and evaluation

Use several distinct clips: straightforward movement, partial occlusion, poor framing and a deliberately unsupported action. Record processing time and whether the output is useful for the intended workflow. A saved capture is an appropriate fallback, but label it as prerecorded.

For movement search, define the relevant answers before tuning embeddings or descriptions. For interaction, measure false activations as well as successful gestures. Repeated retries until a demo works should not be presented as one-shot reliability.

One developer owns capture/export, one processing/data and one playback/interface. Markus defines the workflow and evaluation and builds the pitch. Do not add a new 3D engine unless someone can get an official sample running quickly.

## Access, preparation and risks

Check account setup, export restrictions, processing quotas, permitted reuse of motion and whether an API is available. Browser access to a product does not imply programmable access. Rokoko published a mandatory Studio update in July 2026 covering its updated service terms; install the supported version and review the actual current terms before relying on an older tutorial. [Official update](https://support.rokoko.com/hc/en-us/articles/48470600017553-Mandatory-Rokoko-Studio-Update-16-July-2026)

Ask mentors whether hardware is shared, whether captured motion can be included with an open-source submission and whether live capture is expected. Do not assume a motion estimate is suitable for medical assessment, worker certification or physical robot control.

Cloudinary could handle permitted recordings, while Modal/Verda could process them if compute is genuinely necessary. XR Creator Con may be useful for domain feedback but is listed separately as a supporter, not a guaranteed integration service.

**Go:** a verified capture-to-playback path and a concrete user task. **No-go:** export access or calibration remains unresolved. **Pitch:** demonstrate how the workflow saves iteration or prevents unusable capture, using measured examples.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

