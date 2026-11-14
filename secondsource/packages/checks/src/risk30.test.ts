import { describe, expect, it } from 'vitest';
import { affectedSuppliers, compileRiskGraph, DEFAULT_POLICY, scoreRisk30,
  type BuyerImpact, type LiveEvent, type RiskGraph, type RiskNode } from './risk30';

const evidence = [{ url: 'https://example.test/fixture', label: 'Synthetic test evidence' }];
const exact = (estimate: number) => ({ low: estimate, estimate, high: estimate });
const node = (id: string, kind: RiskNode['kind'] = 'supplier', annual = 0): RiskNode => ({
  id, name: id, kind, coverage: 1, evidence,
  baseline: [{ id: 'residual', description: 'residual delivery failures', annualHazard: exact(annual), evidence }],
});
const edge = (from: string, to: string, share = 1) => ({ from, to, transmission: exact(share), evidence });
const now = Date.UTC(2026, 10, 15);
const buyer: BuyerImpact = { criticality: 0.8, readyAlternatives: 0, evidence };
const event = (overrides: Partial<LiveEvent> = {}): LiveEvent => ({
  causeId: 'closure-1', nodeId: 'port', type: 'port_closure', state: 'confirmed', observedAt: now,
  halfLifeDays: 7, sourceCredibility: 0.95, extractionConfidence: 0.9,
  conditionalFailure: exact(0.8), evidence, ...overrides,
});
const fixture = (): RiskGraph => ({ nodes: [node('direct', 'supplier', 0.12), node('tier2'), node('port', 'port')],
  edges: [edge('direct', 'tier2', 0.6), edge('tier2', 'port', 0.8)] });
const score = (events: LiveEvent[] = [], graph = fixture(), impact: BuyerImpact | null = buyer) =>
  scoreRisk30(compileRiskGraph(graph), 'direct', events, now, impact);

describe('30-day delivery probability', () => {
  it('converts annual hazard and calculates the tier-2 closure example', () => {
    const result = score([event()]);
    const live = 0.6 * 0.8 * 0.95 * 0.9 * 0.8;
    expect(result.riskFactor).toBeCloseTo(1 - Math.exp(-0.12 * 30 / 365) * (1 - live), 12);
    expect(result.status).toBe('red');
    expect(result.reasons.every(r => r.evidence.length > 0)).toBe(true);
    expect(1 - Math.exp(-result.reasons.reduce((s, r) => s + r.hazard, 0))).toBeCloseTo(result.riskFactor, 12);
  });
  it('decays by a half-life, treats rumors cautiously, resolves events, and retains persistent events', () => {
    const base = score().riskFactor;
    const fresh = score([event()]).riskFactor;
    const old = score([event({ observedAt: now - 7 * 86400000 })]).riskFactor;
    expect(old - base).toBeCloseTo((fresh - base) / 2, 12);
    expect(score([event({ state: 'rumor' })]).riskFactor).toBeLessThan(fresh);
    expect(score([event({ state: 'rumor' })]).confidence.label).toBe('low');
    expect(score([event({ state: 'resolved' })]).riskFactor).toBe(base);
    expect(score([event({ persistent: true, observedAt: now - 365 * 86400000 })]).riskFactor).toBe(fresh);
  });
  it('does not count syndicated reports or a regional match twice', () => {
    const first = event();
    expect(score([first, first, event({ nodeId: 'tier2', conditionalFailure: exact(0.1) })]).riskFactor)
      .toBe(score([first]).riskFactor);
  });
  it('aggregates paths to a shared hub before counting its cause once', () => {
    const graph: RiskGraph = { nodes: [node('direct'), node('a'), node('b'), node('port', 'port')],
      edges: [edge('direct', 'a', 0.5), edge('direct', 'b', 0.5), edge('a', 'port'), edge('b', 'port')] };
    expect(score([event()], graph).riskFactor).toBeCloseTo(0.95 * 0.9 * 0.8, 12);
    expect(score([event(), event()], graph).riskFactor).toBe(score([event()], graph).riskFactor);
  });
  it('combines independent causes and is insensitive to report order', () => {
    const a = event(), b = event({ causeId: 'fire-2', type: 'fire', conditionalFailure: exact(0.3) });
    expect(score([a, b]).riskFactor).toBeCloseTo(score([b, a]).riskFactor, 12);
    expect(score([a, b]).riskFactor).toBeGreaterThan(score([a]).riskFactor);
  });
  it('ignores disconnected events and blocks zero transmission', () => {
    const graph = fixture(); graph.nodes.push(node('remote', 'port'));
    expect(score([event({ nodeId: 'remote' })], graph).riskFactor).toBe(score([], graph).riskFactor);
    graph.edges[0] = edge('direct', 'tier2', 0);
    expect(score([event()], graph).riskFactor).toBe(score([], graph).riskFactor);
  });
  it('reports unknowns as a prior and low confidence, not zero risk', () => {
    const graph: RiskGraph = { nodes: [{ ...node('direct'), coverage: 0, baseline: [] }], edges: [] };
    const result = score([], graph, null);
    expect(result.riskFactor).toBeGreaterThan(0);
    expect(result.scenarioRange.low).toBe(0);
    expect(result.scenarioRange.high).toBeGreaterThan(result.riskFactor);
    expect(result.confidence.label).toBe('low');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it('changes urgency with buyer impact without changing delivery probability', () => {
    const critical = score([event()]);
    const replaceable = score([event()], fixture(), { ...buyer, criticality: 0.1, readyAlternatives: 3 });
    expect(critical.riskFactor).toBe(replaceable.riskFactor);
    expect(critical.status).toBe('red'); expect(replaceable.status).toBe('yellow');
  });
  it('does not mark every confirmed event red', () => {
    expect(score([event({ conditionalFailure: exact(0.01) })]).status).toBe('yellow');
    expect(score().status).toBe('green');
  });
  it('uses strict probability thresholds and an inclusive material confirmed-event rule', () => {
    const graph = compileRiskGraph({ nodes: [node('direct')], edges: [] });
    const neutral = { ...buyer, criticality: 0 };
    const policy = { ...DEFAULT_POLICY, rumorWeight: 1 };
    const at = (p: number) => scoreRisk30(graph, 'direct', [event({ nodeId: 'direct', state: 'rumor',
      sourceCredibility: 1, extractionConfidence: 1, conditionalFailure: exact(p) })], now, neutral, policy);
    expect(at(0.4).status).toBe('yellow'); expect(at(0.40001).status).toBe('red');
    const confirmed = scoreRisk30(graph, 'direct', [event({ nodeId: 'direct', sourceCredibility: 1,
      extractionConfidence: 1, conditionalFailure: exact(0.25) })], now, { ...buyer, criticality: 0.5 });
    expect(confirmed.status).toBe('red');
  });
  it('keeps scenarios ordered and outputs finite probabilities at extremes', () => {
    const result = score([event({ conditionalFailure: { low: 0, estimate: 0.5, high: 1 } })]);
    expect(result.scenarioRange.low).toBeLessThanOrEqual(result.riskFactor);
    expect(result.scenarioRange.high).toBeGreaterThanOrEqual(result.riskFactor);
    const graph = fixture(); graph.nodes[0]!.baseline[0]!.annualHazard = exact(10000);
    expect(score([event()], graph).riskFactor).toBeLessThanOrEqual(1);
    expect(Number.isFinite(score([event()], graph).riskFactor)).toBe(true);
  });
  it('rejects cycles, dangling/duplicate edges, invalid ranges, missing evidence and future events', () => {
    const graph = fixture(); graph.edges.push(edge('port', 'direct'));
    expect(() => compileRiskGraph(graph)).toThrow(/Cyclic/);
    expect(() => compileRiskGraph({ ...fixture(), edges: [edge('absent', 'port')] })).toThrow();
    expect(() => compileRiskGraph({ ...fixture(), edges: [edge('direct', 'port'), edge('direct', 'port')] })).toThrow();
    expect(() => score([event({ conditionalFailure: { low: 0.8, estimate: 0.1, high: 1 } })])).toThrow();
    expect(() => score([event({ sourceCredibility: NaN })])).toThrow();
    expect(() => score([event({ evidence: [] })])).toThrow();
    expect(() => score([event({ observedAt: now + 1 })])).toThrow();
  });
  it('finds only ancestors for event invalidation and never mutates inputs', () => {
    const graph = fixture(); graph.nodes.push(node('other'));
    const before = JSON.stringify(graph), events = [event()], eventBefore = JSON.stringify(events);
    expect(affectedSuppliers(compileRiskGraph(graph), ['port'])).toEqual(['direct', 'tier2']);
    score(events, graph); expect(JSON.stringify(graph)).toBe(before); expect(JSON.stringify(events)).toBe(eventBefore);
  });
});
