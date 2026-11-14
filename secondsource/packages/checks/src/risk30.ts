/** Deterministic reference model; probabilities require calibration before production use. */
export type Range = { low: number; estimate: number; high: number };
export type Evidence = { url: string; label: string; quote?: string };
export type EventType = 'strike' | 'port_closure' | 'fire' | 'sanction' | 'bankruptcy';
export interface Baseline {
  id: string;
  description: string;
  /** Residual annual delivery-failure hazard, not raw event frequency. */
  annualHazard: Range;
  evidence: Evidence[];
}
export interface RiskNode {
  id: string;
  name: string;
  kind: 'supplier' | 'site' | 'port' | 'route';
  baseline: Baseline[];
  /** Completeness/freshness of the investigated footprint, independently audited. */
  coverage: number;
  evidence: Evidence[];
}
export interface Dependency {
  /** Consumer -> upstream dependency. DAG only. */
  from: string;
  to: string;
  /** Effective fraction of delivery exposure, accounting for buffers and rerouting.
   * For an indispensable input, use 1 even if its spend share is small. */
  transmission: Range;
  evidence: Evidence[];
}
export interface LiveEvent {
  /** Same physical cause across feeds, locations and syndicated articles. */
  causeId: string;
  nodeId: string;
  type: EventType;
  state: 'rumor' | 'confirmed' | 'resolved';
  observedAt: number;
  /** Persistent sanctions/bankruptcy must be reviewed, not silently decayed. */
  persistent?: boolean;
  halfLifeDays: number;
  sourceCredibility: number;
  extractionConfidence: number;
  /** P(at least one delivery due in the next 30 days misses its promised date | event).
   * Derived from duration, lead time, buffers and recovery; not from the LLM alone. */
  conditionalFailure: Range;
  evidence: Evidence[];
}
export interface RiskGraph { nodes: RiskNode[]; edges: Dependency[] }
export interface BuyerImpact {
  criticality: number;
  /** Only approved alternatives able to supply within the horizon. */
  readyAlternatives: number;
  evidence: Evidence[];
}
export interface RiskPolicy {
  version: string;
  missingAnnualHazard: Range;
  rumorWeight: number;
  yellowProbability: number;
  redProbability: number;
  yellowExpectedLoss: number;
  redExpectedLoss: number;
  confirmedActionExposure: number;
  confirmedActionImpact: number;
}
export const DEFAULT_POLICY: RiskPolicy = {
  version: 'risk30-provisional-v1',
  missingAnnualHazard: { low: 0, estimate: 0.25, high: 1 },
  rumorWeight: 0.35,
  yellowProbability: 0.15, redProbability: 0.4,
  yellowExpectedLoss: 0.075, redExpectedLoss: 0.2,
  confirmedActionExposure: 0.25, confirmedActionImpact: 0.5,
};
export interface Reason {
  text: string;
  /** Exact additive share of -log(1-P); order independent, not percentage points. */
  hazard: number;
  evidence: Evidence[];
}
export interface RiskResult {
  supplierId: string;
  status: 'green' | 'yellow' | 'red';
  riskFactor: number;
  scenarioRange: Range;
  confidence: { score: number; label: 'low' | 'medium' | 'high' };
  impact: number;
  expectedLoss: number;
  reasons: Reason[];
  warnings: string[];
  policyVersion: string;
}
const DAY = 86_400_000;
const keys = ['low', 'estimate', 'high'] as const;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const probability = (h: number) => -Math.expm1(-h);
const hazard = (p: number) => -Math.log1p(-Math.min(p, 1 - 1e-12));
function nonnegative(x: number): void {
  if (!Number.isFinite(x) || x < 0) throw new Error('Expected finite nonnegative number');
}
function unit(x: number): void { nonnegative(x); if (x > 1) throw new Error('Expected probability in [0,1]'); }
function range(r: Range, bounded: boolean): void {
  for (const k of keys) (bounded ? unit : nonnegative)(r[k]);
  if (r.low > r.estimate || r.estimate > r.high) throw new Error('Unordered range');
}
function evidence(items: Evidence[]): void {
  if (!items.length || items.some(e => !e.url.trim() || !e.label.trim())) throw new Error('Evidence required');
}

/** Validate once, retain the compiled graph, rescore ancestors on event changes. */
export function compileRiskGraph(graph: RiskGraph) {
  const nodes = new Map<string, RiskNode>();
  const outgoing = new Map<string, Dependency[]>();
  const parents = new Map<string, string[]>();
  for (const n of graph.nodes) {
    if (!n.id || nodes.has(n.id)) throw new Error('Duplicate/empty node ID');
    unit(n.coverage); evidence(n.evidence);
    const ids = new Set<string>();
    for (const b of n.baseline) {
      if (ids.has(b.id)) throw new Error('Duplicate baseline cause');
      ids.add(b.id); range(b.annualHazard, false); evidence(b.evidence);
    }
    nodes.set(n.id, n); outgoing.set(n.id, []); parents.set(n.id, []);
  }
  const edgeIds = new Set<string>();
  for (const e of graph.edges) {
    const id = JSON.stringify([e.from, e.to]);
    if (!nodes.has(e.from) || !nodes.has(e.to) || edgeIds.has(id)) throw new Error('Invalid/duplicate edge');
    edgeIds.add(id); range(e.transmission, true); evidence(e.evidence);
    outgoing.get(e.from)!.push(e); parents.get(e.to)!.push(e.from);
  }
  const order: string[] = [], active = new Set<string>(), done = new Set<string>();
  function visit(id: string) {
    if (active.has(id)) throw new Error('Cyclic dependency graph');
    if (done.has(id)) return;
    active.add(id);
    for (const e of outgoing.get(id)!) visit(e.to);
    active.delete(id); done.add(id); order.push(id);
  }
  for (const id of nodes.keys()) visit(id);
  return { nodes, outgoing, parents, order };
}
export type CompiledRiskGraph = ReturnType<typeof compileRiskGraph>;

/** Reverse index for incremental invalidation, including resolutions and baseline changes. */
export function affectedSuppliers(graph: CompiledRiskGraph, changed: string[]): string[] {
  const seen = new Set<string>(), pending = [...changed];
  while (pending.length) {
    const id = pending.pop()!;
    if (!graph.nodes.has(id)) throw new Error('Unknown changed node');
    if (seen.has(id)) continue;
    seen.add(id); pending.push(...graph.parents.get(id)!);
  }
  return [...seen].filter(id => graph.nodes.get(id)!.kind === 'supplier').sort();
}

export function scoreRisk30(
  graph: CompiledRiskGraph, supplierId: string, events: LiveEvent[], now: number,
  buyer: BuyerImpact | null, policy: RiskPolicy = DEFAULT_POLICY,
): RiskResult {
  if (graph.nodes.get(supplierId)?.kind !== 'supplier') throw new Error('Unknown supplier');
  nonnegative(now); range(policy.missingAnnualHazard, false);
  for (const k of ['rumorWeight', 'yellowProbability', 'redProbability', 'yellowExpectedLoss',
    'redExpectedLoss', 'confirmedActionExposure', 'confirmedActionImpact'] as const) unit(policy[k]);
  if (policy.yellowProbability >= policy.redProbability || policy.yellowExpectedLoss >= policy.redExpectedLoss) throw new Error('Invalid thresholds');
  if (buyer) {
    unit(buyer.criticality); nonnegative(buyer.readyAlternatives); evidence(buyer.evidence);
    if (!Number.isInteger(buyer.readyAlternatives)) throw new Error('Alternatives must be an integer');
  }
  // Sum attenuated paths, cap at 1. A shared cause is combined BEFORE noisy-OR.
  const exposure = new Map<string, Range>();
  exposure.set(supplierId, { low: 1, estimate: 1, high: 1 });
  const pathEvidence = new Map<string, Evidence[]>([[supplierId, []]]);
  for (const id of [...graph.order].reverse()) {
    const x = exposure.get(id);
    if (!x) continue;
    for (const e of graph.outgoing.get(id)!) {
      const y = exposure.get(e.to) ?? { low: 0, estimate: 0, high: 0 };
      for (const k of keys) y[k] = clamp(y[k] + x[k] * e.transmission[k]);
      exposure.set(e.to, y);
      pathEvidence.set(e.to, [...new Map([...(pathEvidence.get(e.to) ?? []), ...(pathEvidence.get(id) ?? []), ...e.evidence].map(link => [link.url, link])).values()]);
    }
  }
  const reasons: Reason[] = [], warnings: string[] = [];
  const totals: Range = { low: 0, estimate: 0, high: 0 };
  let coverage = 1, eventConfidence = 1, liveWarning = false, confirmedAction = false;
  function add(text: string, h: Range, links: Evidence[]) {
    for (const k of keys) totals[k] += h[k];
    reasons.push({ text, hazard: h.estimate, evidence: [...new Map(links.map(e => [e.url, e])).values()] });
  }
  const impact = buyer ? buyer.criticality * (0.5 + 0.5 / (1 + buyer.readyAlternatives)) : 0.75;
  if (!buyer) warnings.push('Part importance and ready alternatives are unknown; using provisional high impact.');
  for (const [id, x] of exposure) {
    if (x.high === 0) continue;
    const n = graph.nodes.get(id)!;
    coverage = Math.min(coverage, n.coverage);
    const links = [...n.evidence, ...(pathEvidence.get(id) ?? [])];
    const components = [...n.baseline];
    if (n.coverage < 1 || !components.length) {
      const missing = components.length ? 1 - n.coverage : 1;
      const h = { low: 0, estimate: 0, high: 0 };
      for (const k of keys) h[k] = hazard(probability(policy.missingAnnualHazard[k] * missing * 30 / 365) * x[k]);
      add(`${n.name}: some risk information is unknown; a provisional prior is included.`, h, links);
      warnings.push(`${n.name}: incomplete baseline or footprint.`);
      if (!components.length) coverage = 0;
    }
    for (const b of components) {
      const h = { low: 0, estimate: 0, high: 0 };
      for (const k of keys) h[k] = hazard(probability(b.annualHazard[k] * 30 / 365) * x[k]);
      add(`${n.name}: ${b.description}.`, h, [...links, ...b.evidence]);
    }
  }
  const causes = new Map<string, { p: Range; links: Evidence[]; names: Set<string> }>();
  for (const e of events) {
    if (!graph.nodes.has(e.nodeId)) throw new Error('Event references unknown node');
    if (!e.causeId) throw new Error('Event cause ID required');
    nonnegative(e.observedAt); nonnegative(e.halfLifeDays);
    if (!e.halfLifeDays || e.observedAt > now) throw new Error('Invalid event time/half life');
    unit(e.sourceCredibility); unit(e.extractionConfidence); range(e.conditionalFailure, true); evidence(e.evidence);
    const x = exposure.get(e.nodeId);
    if (!x || e.state === 'resolved') continue;
    const decay = e.persistent ? 1 : 2 ** (-(now - e.observedAt) / DAY / e.halfLifeDays);
    const support = e.sourceCredibility * e.extractionConfidence * (e.state === 'rumor' ? policy.rumorWeight : 1) * decay;
    if (x.high > 0 && decay > 0.01) eventConfidence = Math.min(eventConfidence,
      e.sourceCredibility * e.extractionConfidence * (e.state === 'rumor' ? policy.rumorWeight : 1));
    const p = { low: 0, estimate: 0, high: 0 };
    for (const k of keys) p[k] = support * e.conditionalFailure[k] * x[k];
    if (p.estimate > 0) liveWarning = true;
    if (e.state === 'confirmed' && p.estimate >= policy.confirmedActionExposure && impact >= policy.confirmedActionImpact) confirmedAction = true;
    const c = causes.get(e.causeId) ?? { p: { low: 0, estimate: 0, high: 0 }, links: [], names: new Set<string>() };
    // Multiple reports or matches for one cause never compound independently.
    for (const k of keys) c.p[k] = Math.max(c.p[k], p[k]);
    c.links.push(...e.evidence, ...(pathEvidence.get(e.nodeId) ?? []));
    c.names.add(`${e.type.replace('_', ' ')} at ${graph.nodes.get(e.nodeId)!.name} (${e.state})`);
    causes.set(e.causeId, c);
  }
  for (const c of causes.values()) add(`Delivery exposure through ${[...c.names].sort().join('; ')}.`,
    { low: hazard(c.p.low), estimate: hazard(c.p.estimate), high: hazard(c.p.high) }, c.links);
  const scenarioRange: Range = { low: probability(totals.low), estimate: probability(totals.estimate), high: probability(totals.high) };
  const riskFactor = scenarioRange.estimate, expectedLoss = riskFactor * impact;
  const confidenceScore = Math.min(coverage, eventConfidence, buyer ? 1 : 0.5) * (1 - (scenarioRange.high - scenarioRange.low));
  const status = confirmedAction || riskFactor > policy.redProbability || expectedLoss > policy.redExpectedLoss ? 'red'
    : liveWarning || riskFactor > policy.yellowProbability || expectedLoss > policy.yellowExpectedLoss ? 'yellow' : 'green';
  add(`Buyer impact is ${Math.round(impact * 100)}%; ${status === 'red' ? 'act now' : status === 'yellow' ? 'review this warning' : 'no current warning detected'}.`,
    { low: 0, estimate: 0, high: 0 }, buyer?.evidence ?? graph.nodes.get(supplierId)!.evidence);
  add(confirmedAction ? 'A confirmed disruption has material delivery exposure; act now.'
    : `30-day delivery risk is ${(riskFactor * 100).toFixed(1)}%; impact-weighted risk is ${(expectedLoss * 100).toFixed(1)}%.${liveWarning ? ' An upstream or direct live warning is active.' : ''}`,
    { low: 0, estimate: 0, high: 0 }, [...causes.values()].flatMap(c => c.links).concat(graph.nodes.get(supplierId)!.evidence));
  if (confidenceScore < 0.5) warnings.push('Limited confidence: green does not mean verified safe. Review missing data.');
  return { supplierId, status, riskFactor, scenarioRange,
    confidence: { score: confidenceScore, label: confidenceScore < 0.5 ? 'low' : confidenceScore < 0.8 ? 'medium' : 'high' },
    impact, expectedLoss, reasons, warnings, policyVersion: policy.version };
}
