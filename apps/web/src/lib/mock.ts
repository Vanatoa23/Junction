/**
 * MOCK API LAYER (UI-only). Clearly flagged in the UI ("MOCK UI" banner) and easy to switch off:
 *   - `?mock=0` (or the toggle in the top bar) = real backend only, never use this file's data
 *   - `?mock=1` = mock only
 *   - default "auto": every route tries the real API first and falls back to this mock only when the
 *     route is unreachable or still a 501 stub. The banner lists exactly which routes are mocked.
 *
 * Honesty: nothing here claims to be LIVE or REC. Facts are mode SEED (hand-made / rule-based) and the TEST
 * page poll is mode LOCAL. All companies are fictional (.example domains), mirroring the backend seed.
 * Mock ids start with MOCK_ID_PREFIX so the facade can route follow-up calls (approve, choose) to the mock.
 */
import type {
  Alert, ApprovalAudit, Candidate, CheckResult, Company, Event, FootprintKey, HealthResponse, Incident,
  KeyState, FootprintType, SourceMode, SseEnvelope, SsePayload, SupplierRow, Verdict,
  IncidentDetailResponse, AlternativesResponse, ResolveSuppliersRequest, ChooseSupplierRequest,
  ApproveCandidateRequest, TestNoticeState, ResolveOption, SupplierInput,
} from "@secondsource/shared";

export const MOCK_ID_PREFIX = "00000000-0000-4000-8000-";
export const isMockId = (id: string) => id.startsWith(MOCK_ID_PREFIX);
const mid = (kind: string, n: number) => `${MOCK_ID_PREFIX}${kind}${String(n).padStart(12 - kind.length, "0")}`;
const now = () => new Date().toISOString();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(x: T): T => structuredClone(x);
const NOTICE_URL = "http://localhost:3001/test-notice";

import { DEMO_TRIGGER_TEXT, QUIET_NOTICE } from "./demo";

type K = [FootprintType, string, KeyState?];
const key = ([type, value, state = "CONFIRMED"]: K): FootprintKey => ({
  type, value: state === "UNKNOWN" ? "?" : value, state, sourceUrl: null, sourceQuote: null, seeded: true,
});

interface MC { n: number; name: string; legal: string; domain: string; country: string; category: string; supplier?: boolean; pool?: boolean; keys: K[] }
const MC_LIST: MC[] = [
  { n: 1, name: "Nordpack Packaging", legal: "Nordpack Packaging GmbH", domain: "nordpack.example", country: "DE", category: "packaging", supplier: true, keys: [["REGION", "DE-NW"], ["PORT", "NLRTM"], ["PLANT", "nordpack-duesseldorf-1"], ["PARENT", "seed:pack-holding"]] },
  { n: 2, name: "Baltic Carton", legal: "Baltic Carton Oy", domain: "balticcarton.example", country: "FI", category: "packaging", supplier: true, keys: [["REGION", "FI-UUS"], ["PORT", "FIHEL"], ["PLANT", "balticcarton-vantaa-1"], ["PARENT", "seed:baltic-group"]] },
  { n: 3, name: "Rhine Foils", legal: "Rhine Foils B.V.", domain: "rhinefoils.example", country: "NL", category: "packaging", supplier: true, keys: [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "rhinefoils-rotterdam-1"], ["PARENT", "seed:rhine-group"]] },
  { n: 4, name: "Fennia Cultures", legal: "Fennia Cultures Oy", domain: "fenniacultures.example", country: "FI", category: "ingredients", supplier: true, keys: [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "fennia-tampere-1"], ["PARENT", "seed:fennia-bio"]] },
  { n: 5, name: "Danish Enzymes", legal: "Danish Enzymes A/S", domain: "danishenzymes.example", country: "DK", category: "ingredients", supplier: true, keys: [["REGION", "DK-84"], ["PORT", "DKCPH"], ["PLANT", "danishenzymes-ballerup-1"], ["PARENT", "seed:enzyme-holding"]] },
  { n: 6, name: "Hansa Labels", legal: "Hansa Labels GmbH", domain: "hansalabels.example", country: "DE", category: "labels", supplier: true, keys: [["REGION", "DE-HH"], ["PORT", "DEHAM"], ["PLANT", "hansalabels-hamburg-1"], ["PARENT", "seed:hansa-print"]] },
  { n: 7, name: "Oulu Plastics", legal: "Oulu Plastics Oy", domain: "ouluplastics.example", country: "FI", category: "packaging", supplier: true, keys: [["REGION", "FI-POS"], ["PORT", "FIOUL"], ["PLANT", "ouluplastics-oulu-1"], ["PARENT", "seed:oulu-group"]] },
  { n: 8, name: "Antwerp Resins", legal: "Antwerp Resins NV", domain: "antwerpresins.example", country: "BE", category: "materials", supplier: true, keys: [["REGION", "BE-VAN"], ["PORT", "BEANR"], ["PORT", "NLRTM", "INFERRED"], ["PLANT", "antwerpresins-antwerp-1"], ["PARENT", "seed:resin-holding"]] },
  { n: 9, name: "Gothenburg Crates", legal: "Gothenburg Crates AB", domain: "gbgcrates.example", country: "SE", category: "logistics", supplier: true, keys: [["REGION", "SE-O"], ["PORT", "SEGOT"], ["PLANT", "gbgcrates-molndal-1"], ["PARENT", "seed:crate-holding"]] },
  { n: 10, name: "Tallinn Caps", legal: "Tallinn Caps OÜ", domain: "tallinncaps.example", country: "EE", category: "packaging", supplier: true, keys: [["REGION", "EE-37"], ["PORT", "?", "UNKNOWN"], ["PLANT", "tallinncaps-tallinn-1"], ["PARENT", "seed:caps-holding"]] },
  { n: 101, name: "Karlstad Pack", legal: "Karlstad Pack AB", domain: "karlstadpack.example", country: "SE", category: "packaging", pool: true, keys: [["REGION", "SE-S"], ["PORT", "SEGOT"], ["PLANT", "karlstadpack-karlstad-1"], ["PARENT", "seed:karlstad-group"]] },
  { n: 102, name: "Maasvlakte Wrap", legal: "Maasvlakte Wrap B.V.", domain: "maasvlaktewrap.example", country: "NL", category: "packaging", pool: true, keys: [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "maasvlaktewrap-rotterdam-1"], ["PARENT", "seed:maas-group"]] },
  { n: 103, name: "Tampere Board", legal: "Tampere Board Oy", domain: "tampereboard.example", country: "FI", category: "packaging", pool: true, keys: [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "tampereboard-tampere-1"], ["PARENT", "?", "UNKNOWN"]] },
  { n: 104, name: "Lodz Pack", legal: "Lodz Pack Sp. z o.o.", domain: "lodzpack.example", country: "PL", category: "packaging", pool: true, keys: [["REGION", "PL-LD"], ["PORT", "PLGDN"], ["PLANT", "lodzpack-lodz-1"], ["PARENT", "seed:pack-holding"]] },
];

const company = (m: MC): Company => ({
  id: mid("c", m.n), name: m.name, legalName: m.legal, domain: m.domain, country: m.country, category: m.category,
  calaId: null, parentCompanyId: null, inCandidatePool: !!m.pool, seeded: true, mode: "SEED", sourceUrls: [],
});
const byN = (n: number) => MC_LIST.find((m) => m.n === n)!;

function supplierRow(m: MC, status: SupplierRow["status"] = "RESOLVED", over: Partial<SupplierRow> = {}): SupplierRow {
  return {
    edgeId: mid("e", m.n), input: { name: m.name, domain: m.domain, country: m.country }, status, company: company(m),
    resolveScore: 1, options: [], footprint: m.keys.map(key), monitors: [], seeded: true, mode: "SEED", sourceUrls: [], updatedAt: now(), ...over,
  };
}

// ---------------------------------------------------------------- checks for the demo candidates
const ok = (check: CheckResult["check"], reason: string): CheckResult => ({ check, status: "PASS", reason, evidence: [] });
const bad = (check: CheckResult["check"], reason: string): CheckResult => ({ check, status: "FAIL", reason, evidence: [] });
const unk = (check: CheckResult["check"], reason: string): CheckResult => ({ check, status: "UNKNOWN", reason, evidence: [] });
const seedEv = (n: number) => [{ url: `https://${byN(n).domain}/locations`, quote: null, mode: "SEED" as SourceMode, provider: null }];
const withEv = (r: CheckResult, n: number): CheckResult => ({ ...r, evidence: seedEv(n) });

const CAND_CHECKS: Record<number, { verdict: Verdict; checks: CheckResult[] }> = {
  101: { verdict: "VERIFIED", checks: [
    withEv(ok("C1", "SE-S does not overlap NL-ZH"), 101), withEv(ok("C2", "SEGOT is not NLRTM"), 101),
    withEv(ok("C3", "Tier-2 supplier Varmland Pulp (SE-S) does not touch the incident"), 101),
    ok("C4", "No sanctions programme on the incident"), withEv(ok("C5", "seed:karlstad-group differs from the affected supplier's parent"), 101) ] },
  102: { verdict: "FAILED", checks: [
    withEv(bad("C1", "NL-ZH is the incident region"), 102), withEv(bad("C2", "Ships via NLRTM, the closed port"), 102),
    withEv(ok("C3", "No tier-2 plant overlaps"), 102), ok("C4", "No sanctions programme on the incident"), withEv(ok("C5", "seed:maas-group is a different owner"), 102) ] },
  103: { verdict: "UNVERIFIED", checks: [
    withEv(ok("C1", "FI-PIR does not overlap NL-ZH"), 103), withEv(ok("C2", "FIHEL is not NLRTM"), 103), withEv(ok("C3", "Tier-2 supplier Kymi Pulp is clear"), 103),
    ok("C4", "No sanctions programme on the incident"), unk("C5", "No ownership data for this company: unknown never counts as a pass") ] },
  104: { verdict: "FAILED", checks: [
    withEv(ok("C1", "PL-LD does not overlap NL-ZH"), 104), withEv(ok("C2", "PLGDN is not NLRTM"), 104), ok("C3", "No tier-2 data conflicts"),
    ok("C4", "No sanctions programme on the incident"), withEv(bad("C5", "Same parent as the affected supplier (seed:pack-holding)"), 104) ] },
};

// ---------------------------------------------------------------- state
export interface MockState {
  suppliers: SupplierRow[];
  events: Event[];
  alerts: Alert[];
  incidents: Map<string, IncidentDetailResponse>;
  candidates: Map<string, Candidate>; // by id
  audits: Map<string, ApprovalAudit>;
  notice: TestNoticeState;
}

const listeners = new Set<(e: SseEnvelope) => void>();
let seq = 0;
export const mockBus = {
  subscribe(fn: (e: SseEnvelope) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  emit(p: SsePayload) {
    const env = { id: `mock-${++seq}`, at: now(), ...p } as SseEnvelope;
    for (const fn of listeners) fn(env);
  },
};

const incidentFootprint = (): FootprintKey[] => [
  { type: "PORT", value: "NLRTM", state: "CONFIRMED", sourceUrl: NOTICE_URL, sourceQuote: "Strike action at the Port of Rotterdam (NLRTM, region NL-ZH).", seeded: false },
  { type: "REGION", value: "NL-ZH", state: "CONFIRMED", sourceUrl: NOTICE_URL, sourceQuote: "NLRTM, region NL-ZH", seeded: false },
];

let counter = 0;
const uuid = (kind: string) => mid(kind, 1000 + ++counter);

function buildIncident(text: string, tReceived: Date, preset?: { eventId: string; incidentId: string }) {
  const eventId = preset?.eventId ?? uuid("v");
  const incidentId = preset?.incidentId ?? uuid("i");
  const sentence = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).find((s) => /strike|closed|fire|recall|sanction|insolven|closure/i.test(s)) ?? text.trim();
  const type: Incident["type"] = /strike/i.test(text) ? "STRIKE" : /closure|closed/i.test(text) ? "PORT_CLOSURE" : /fire/i.test(text) ? "FIRE" : "OTHER";
  const hit = /rotterdam|nlrtm|nl-zh/i.test(text);
  const t = (ms: number) => new Date(tReceived.getTime() + ms).toISOString();
  const event: Event = {
    id: eventId, via: "POLL", sourceUrl: NOTICE_URL, mode: "LOCAL", status: "INCIDENT", dropReason: null, isTest: true,
    latency: { tSource: null, tReceived: t(0), tClassified: t(940), tAlert: t(1310) }, createdAt: t(0),
  };
  const incident: Incident = {
    id: incidentId, eventId, type, severity: /until further notice|closed/i.test(text) ? "HIGH" : "MEDIUM",
    title: hit ? "Port of Rotterdam: strike, terminals closed" : "Disruption notice on the TEST page", quote: sentence, sourceUrl: NOTICE_URL,
    confirmation: "CONFIRMED", footprint: hit ? incidentFootprint() : [], unmappedNames: hit ? [] : ["(no gazetteer match)"], mode: "SEED", isTest: true, createdAt: t(940),
  };
  return { event, incident };
}

function alertsFor(incident: Incident, event: Event, state: MockState): Alert[] {
  const hit = (s: SupplierRow) => s.footprint.filter((k) => incident.footprint.some((i) => i.type === k.type && i.value === k.value));
  const seen = new Set<string>();
  return state.suppliers
    .filter((s) => s.company && (s.status === "RESOLVED" || s.status === "MONITORED") && incident.footprint.length && hit(s).length)
    .filter((s) => !seen.has(s.company!.id) && !!seen.add(s.company!.id))
    .map((s, i) => ({
      id: uuid("a"), incidentId: incident.id, edgeId: s.edgeId, supplierName: s.input.name, incidentType: incident.type, severity: incident.severity,
      matchedKeys: hit(s).flatMap((sk) => incident.footprint.filter((ik) => ik.type === sk.type && ik.value === sk.value).map((ik) => ({ incident: ik, supplier: sk }))),
      sourceUrl: incident.sourceUrl, quote: incident.quote,
      latency: { ...event.latency, tAlert: new Date(Date.parse(event.latency.tAlert!) + i * 40).toISOString() }, via: event.via, mode: "SEED" as SourceMode, isTest: true, createdAt: event.latency.tAlert!,
    }));
}

function candidatesFor(incidentId: string, edgeId: string): Candidate[] {
  const cands = [101, 102, 103, 104].map((n): Candidate => {
    const m = byN(n); const spec = CAND_CHECKS[n]!;
    return {
      id: uuid("k"), incidentId, forEdgeId: edgeId, company: company(m), footprint: m.keys.map(key),
      checks: clone(spec.checks), verdict: spec.verdict, rank: null, status: "PROPOSED", mode: "SEED", seeded: true,
    };
  });
  const order: Verdict[] = ["VERIFIED", "UNVERIFIED", "FAILED"];
  cands.sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
  cands.forEach((c, i) => (c.rank = i + 1));
  return cands;
}

function freshState(): MockState {
  const suppliers = MC_LIST.filter((m) => m.supplier).map((m) => supplierRow(m));
  const state: MockState = { suppliers, events: [], alerts: [], incidents: new Map(), candidates: new Map(), audits: new Map(), notice: { text: QUIET_NOTICE, updatedAt: now(), url: NOTICE_URL } };
  // one earlier dropped event so the "dropped and logged" path is visible
  const t0 = new Date(Date.now() - 20 * 60_000);
  state.events.push({
    id: uuid("v"), via: "POLL", sourceUrl: NOTICE_URL, mode: "LOCAL", status: "DROPPED", dropReason: "quote not found in fetched text (event dropped and logged)", isTest: true,
    latency: { tSource: null, tReceived: t0.toISOString(), tClassified: new Date(t0.getTime() + 800).toISOString(), tAlert: null }, createdAt: t0.toISOString(),
  });
  // one earlier sample incident (SEED) so every screen renders on first load
  const { event, incident } = buildIncident(DEMO_TRIGGER_TEXT, new Date(Date.now() - 6 * 60_000));
  register(state, event, incident);
  return state;
}

function register(state: MockState, event: Event, incident: Incident | null) {
  state.events.unshift(event);
  if (!incident) return;
  const alerts = alertsFor(incident, event, state);
  state.alerts.unshift(...alerts);
  state.incidents.set(incident.id, { incident, event, alerts });
  for (const a of alerts) for (const c of candidatesFor(incident.id, a.edgeId)) state.candidates.set(c.id, c);
}

const state = freshState();

export const mockApi = {
  state,
  async health(): Promise<HealthResponse> {
    const m = (): { hasKey: boolean; mode: SourceMode } => ({ hasKey: false, mode: "SEED" });
    return { ok: true, db: false, providers: { contextdev: m(), exa: m(), cala: m(), gemini: m(), local: { hasKey: false, mode: "LOCAL" } }, publicBaseUrl: "http://localhost:3001", testNoticeUrl: NOTICE_URL };
  },
  async listSuppliers() { await wait(80); return clone(state.suppliers); },
  async resolve(req: ResolveSuppliersRequest) {
    // already on the grid (same name): do not add a second row
    const fresh = req.suppliers.filter((s) => !state.suppliers.some((x) => x.input.name.toLowerCase() === s.name.trim().toLowerCase()));
    const rows: SupplierRow[] = fresh.map((s, i) => pendingRow(s, i));
    state.suppliers.unshift(...rows);
    rows.forEach((r, i) => void progress(r, i));
    return clone(rows);
  },
  async choose(edgeId: string, body: ChooseSupplierRequest) {
    const row = state.suppliers.find((s) => s.edgeId === edgeId);
    if (!row) throw new Error("unknown supplier");
    const opt = row.options.find((o) => o.companyId === body.companyId);
    const name = opt?.name ?? row.input.name;
    const m = MC_LIST.find((x) => x.name === name) ?? synth(name, body.domain ?? opt?.domain ?? null, opt?.country ?? row.input.country);
    Object.assign(row, { status: "RESOLVED", options: [], company: company(m), footprint: m.keys.map(key), resolveScore: opt?.score ?? 0.9, updatedAt: now() });
    mockBus.emit({ type: "supplier.status", data: { edgeId, status: "RESOLVED", mode: "SEED", note: "chosen by user" } });
    setTimeout(() => arm(row), 900);
    return clone(row);
  },
  async listEvents() { return clone(state.events); },
  async listAlerts() { return clone(state.alerts); },
  async incident(id: string) { const d = state.incidents.get(id); if (!d) throw new Error("unknown incident"); return clone(d); },
  async alternatives(incidentId: string, edgeId: string): Promise<AlternativesResponse> {
    const list = [...state.candidates.values()].filter((c) => c.incidentId === incidentId && c.forEdgeId === edgeId);
    list.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    return clone({ ready: list.length > 0, candidates: list });
  },
  async approve(id: string, body: ApproveCandidateRequest) {
    const c = state.candidates.get(id);
    if (!c) throw new Error("unknown candidate");
    if (c.verdict !== "VERIFIED") throw Object.assign(new Error("only VERIFIED candidates can be approved"), { status: 409 });
    c.status = "APPROVED";
    const audit: ApprovalAudit = { id: uuid("u"), candidateId: id, actor: body.actor ?? "demo-user", decision: "APPROVE", note: body.note ?? null, snapshot: { verdict: c.verdict, checks: clone(c.checks) }, createdAt: now() };
    state.audits.set(id, audit);
    return clone({ candidate: c, audit });
  },
  async noticeState() { return clone(state.notice); },
  async publishNotice(text: string) {
    state.notice = { text, updatedAt: now(), url: NOTICE_URL };
    // The real flow: a poll notices the change within 30-60 s. The mock compresses that to ~2.5 s.
    setTimeout(() => simulateChange(text), 2500);
    return clone(state.notice);
  },
};

function synth(name: string, domain: string | null, country: string | null): MC {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cc = (country ?? "FI").toUpperCase().slice(0, 2);
  return { n: 500 + Math.abs([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 400, name, legal: name, domain: domain ?? `${slug}.example`, country: cc, category: "unclassified",
    keys: [["REGION", cc], ["PORT", "?", "UNKNOWN"], ["PLANT", `${slug}-1`, "INFERRED"], ["PARENT", "?", "UNKNOWN"]] };
}

function pendingRow(s: SupplierInput, i: number): SupplierRow {
  return { edgeId: mid("p", 2000 + ++counter + i), input: s, status: "PENDING", company: null, resolveScore: null, options: [], footprint: [], monitors: [], seeded: false, mode: "SEED", sourceUrls: [], updatedAt: now() };
}

async function progress(row: SupplierRow, i: number) {
  const live = state.suppliers.find((s) => s.edgeId === row.edgeId) ?? row;
  await wait(500 + i * 450);
  const known = MC_LIST.find((m) => m.name.toLowerCase() === live.input.name.trim().toLowerCase());
  if (!live.input.domain && /unknown|zzz/i.test(live.input.name)) {
    Object.assign(live, { status: "UNRESOLVED", resolveScore: 0.31, updatedAt: now() });
    mockBus.emit({ type: "supplier.status", data: { edgeId: live.edgeId, status: "UNRESOLVED", mode: "SEED", note: "score 0.31 < 0.6: enter a domain" } });
    return;
  }
  if (!live.input.domain && /^nord/i.test(live.input.name.trim()) && !known) {
    const options: ResolveOption[] = [
      { companyId: mid("c", 1), name: "Nordpack Packaging", domain: "nordpack.example", country: "DE", score: 0.78, sourceUrls: [], mode: "SEED" },
      { companyId: mid("c", 900), name: "Nordic Pack Oy", domain: "nordicpack.example", country: "FI", score: 0.71, sourceUrls: [], mode: "SEED" },
    ];
    Object.assign(live, { status: "AMBIGUOUS", resolveScore: 0.78, options, updatedAt: now() });
    mockBus.emit({ type: "supplier.status", data: { edgeId: live.edgeId, status: "AMBIGUOUS", mode: "SEED", note: "score 0.78: choose one" } });
    return;
  }
  const m = known ?? synth(live.input.name, live.input.domain, live.input.country);
  Object.assign(live, { status: "RESOLVED", company: company(m), footprint: m.keys.map(key), resolveScore: known ? 1 : 0.9, seeded: !!known, updatedAt: now() });
  mockBus.emit({ type: "supplier.status", data: { edgeId: live.edgeId, status: "RESOLVED", mode: "SEED", note: null } });
  setTimeout(() => arm(live), 900);
}

function arm(row: SupplierRow) {
  if (row.status !== "RESOLVED") return;
  row.status = "MONITORED"; row.monitors = [{ url: NOTICE_URL, kind: "POLL" }]; row.updatedAt = now();
  mockBus.emit({ type: "supplier.status", data: { edgeId: row.edgeId, status: "MONITORED", mode: "LOCAL", note: "mock: polling the TEST page" } });
}

function simulateChange(text: string) {
  const tRecv = new Date();
  const incident = /strike|closed|fire|recall|sanction|insolven|closure/i.test(text) && !/no active disruption/i.test(text);
  const base = buildIncident(text, tRecv);
  if (!incident) {
    const ev: Event = { ...base.event, status: "DROPPED", dropReason: "no incident detected in the changed text (rule-based classifier)", latency: { tSource: null, tReceived: tRecv.toISOString(), tClassified: new Date(tRecv.getTime() + 600).toISOString(), tAlert: null } };
    state.events.unshift(ev);
    mockBus.emit({ type: "event.received", data: { event: { ...ev, status: "RECEIVED", latency: { ...ev.latency, tClassified: null } } } });
    setTimeout(() => mockBus.emit({ type: "event.received", data: { event: ev } }), 600);
    return;
  }
  const first: Event = { ...base.event, status: "RECEIVED", latency: { tSource: null, tReceived: tRecv.toISOString(), tClassified: null, tAlert: null } };
  mockBus.emit({ type: "event.received", data: { event: first } });
  setTimeout(() => {
    const ev = { ...base.event, status: "CLASSIFIED" as const, latency: { ...base.event.latency, tAlert: null } };
    mockBus.emit({ type: "event.received", data: { event: ev } });
  }, 900);
  setTimeout(() => {
    const t = Date.now();
    const ev: Event = { ...base.event, latency: { tSource: null, tReceived: tRecv.toISOString(), tClassified: new Date(tRecv.getTime() + 900).toISOString(), tAlert: new Date(t).toISOString() } };
    register(state, ev, base.incident);
    mockBus.emit({ type: "event.received", data: { event: ev } });
    const detail = state.incidents.get(base.incident.id)!;
    for (const a of detail.alerts) mockBus.emit({ type: "alert.created", data: { alert: a } });
    setTimeout(() => {
      for (const a of detail.alerts) {
        const ids = [...state.candidates.values()].filter((c) => c.incidentId === base.incident.id && c.forEdgeId === a.edgeId).map((c) => c.id);
        mockBus.emit({ type: "alternatives.ready", data: { incidentId: base.incident.id, edgeId: a.edgeId, candidateIds: ids } });
      }
    }, 1200);
  }, 1300);
}
