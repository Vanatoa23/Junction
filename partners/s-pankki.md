# S-Pankki (S-Bank) — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Identity and confirmed opportunity

**Confirmed:** Junction lists S-Pankki as a Challenge Partner and links to the Finnish bank. This is S-Bank, not a generic S Group retail technology challenge. Its customer site covers accounts, payments, cards, lending, saving and investment, with S-mobiili among its digital channels. The specific 2026 challenge, internal owner and dataset are not established. [Junction roster](https://2026.hackjunction.com/#partners) · [Bank](https://www.s-pankki.fi/)

**Assessment:** this deserves an early mentor conversation. Markus can translate banking workflows into concrete controls and evaluation criteria while the developers build a polished decision interface. That advantage is strongest for explainable cash-flow analysis, operational triage or customer support—not a generic finance chatbot. Do not commit to credit scoring simply because the team knows risk modelling; the brief may address a different customer problem.

## What can actually be integrated?

The bank's Open Banking page points developers to Crosskey's Open Banking Market for documentation and a test environment. It also documents account-information and payment-initiation functions and their dependence on customer authorisation/authentication. This is evidence of an integration route, not evidence that our team has production access or that Junction will provide credentials. [Official developer entry point](https://www.s-pankki.fi/fi/yhtiot/open-banking/)

Build an adapter around a small transaction schema: account pseudonym, transaction ID, booking date, amount, currency, description and category. The adapter should accept a sponsor fixture or synthetic CSV initially. Keep original descriptions alongside normalized categories; make missing dates, refunds and transfers explicit. Use deterministic arithmetic for balances and scenario calculations. An LLM may explain an already-computed result or extract a proposed category, with corrections visible to the user.

**Unverified:** access to S Group purchase-level receipts, customer profiles, live S-mobiili integration, production banking credentials, challenge-specific datasets and any sponsor model. Bank account transactions and item-level retail purchases are different data products; do not silently substitute one for the other.

## Project hypotheses and proof

| Candidate | Smallest convincing demo | Evaluation |
|---|---|---|
| Household cash-flow warning | A recurring bill and delayed income produce a visible shortfall; user explores a scenario | Calculation correctness, missed warnings, unnecessary warnings |
| Bank-service case preparation | Convert a messy customer question and permitted documents into a sourced case summary | Required-field completeness, unsupported claims, review time |
| Transaction explanation | Explain an unfamiliar transaction using only supplied evidence and ask when uncertain | Classification accuracy, abstention, correction effort |

**Assessment:** prefer the first or second if the challenge permits. A transparent scenario engine gives judges something to inspect and is feasible without confidential training data. Label all synthetic histories. A demonstration on twenty hand-built cases is a functional evaluation, not evidence of real customer performance.

## Architecture and execution

Use a normal web frontend, a small backend, SQL storage, a deterministic rules/calculation layer and an optional explanation model. Keep all bank/API keys server-side. Separate raw input, derived values and generated prose in the data model. Record which source rows support each claim. Do not let the language model execute payments or edit account balances.

Divide work into ingestion/calculation, interface/scenarios and backend/evaluation. Markus defines cases and costs of mistakes, checks economic logic and prepares the story. In the first evening, demonstrate one transaction file through to a correct result. Add model-generated explanations only after that path works.

A good pitch shows the original uncertainty, one actionable insight, its evidence and the user's correction or approval. Report measured review time and error counts. Avoid claiming regulatory compliance or customer financial benefit from a weekend test.

## Preparation and mentor questions

Prepare synthetic cases for refunds, internal transfers, irregular salary, duplicate bookings and multiple currencies. Establish what the bank considers a useful decision and which mistakes are unacceptable. Ask whether the target is consumers, service staff or another internal team; whether transactions are real or synthetic; and whether external model processing is allowed.

**Go:** a concrete workflow, usable data and measurable outcomes. **No-go:** success depends on production-bank onboarding or unavailable confidential labels. Aiven could host the application data; MariaDB is an alternative if its challenge is relevant. Choose one database. External web-search partners are useful only for public context, never as a substitute for an account's authoritative records.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

