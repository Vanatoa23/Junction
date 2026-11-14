import { verdictOf } from "@secondsource/checks";
import type { ApprovalAudit, Candidate } from "@secondsource/shared";
import { tx } from "../db/pool";
import { loadCandidates } from "./mappers";

export type ApproveResult =
  | { ok: true; candidate: Candidate; audit: ApprovalAudit }
  | { ok: false; status: 404 | 409; error: string; detail: string };

/**
 * Approve a candidate. Allowed ONLY if it is PROPOSED and fully passing. The verdict is RECOMPUTED here from
 * the stored C1..C5 results (never trusted from the candidate.verdict column or the client), and a stored
 * LIVE_NEWS FAIL also blocks. Writes one approval_audit row (snapshot of verdict + checks) in the same
 * transaction. A rejected attempt writes nothing.
 */
export async function approveCandidate(clientId: string, candidateId: string, body: { actor: string; note: string | null }): Promise<ApproveResult> {
  return tx(async (c) => {
    const locked = await c.query(`SELECT id, status FROM candidate WHERE id = $1 AND client_id = $2 FOR UPDATE`, [candidateId, clientId]);
    if (!locked.rows[0]) return { ok: false, status: 404, error: "not_found", detail: "candidate not found" } as const;
    if (locked.rows[0].status !== "PROPOSED") {
      return { ok: false, status: 409, error: "not_proposed", detail: `candidate is already ${locked.rows[0].status}` } as const;
    }
    const [cand] = await loadCandidates(clientId, { id: candidateId }, c);
    const core = cand!.checks.filter((r) => r.check !== "LIVE_NEWS");
    const news = cand!.checks.find((r) => r.check === "LIVE_NEWS");
    const verdict = news?.status === "FAIL" ? "FAILED" : verdictOf(core);
    if (core.length < 5 || verdict !== "VERIFIED") {
      return { ok: false, status: 409, error: "not_verified", detail: `only fully passing candidates can be approved (verdict ${verdict}; ${core.filter((r) => r.status !== "PASS").map((r) => `${r.check} ${r.status}`).join(", ") || "incomplete checks"})` } as const;
    }
    await c.query(`UPDATE candidate SET status = 'APPROVED' WHERE id = $1`, [candidateId]);
    const audit = await c.query(
      `INSERT INTO approval_audit (client_id, candidate_id, actor, decision, note, snapshot) VALUES ($1,$2,$3,'APPROVE',$4,$5) RETURNING id, created_at`,
      [clientId, candidateId, body.actor, body.note, JSON.stringify({ verdict, checks: cand!.checks })],
    );
    return {
      ok: true,
      candidate: { ...cand!, status: "APPROVED" },
      audit: {
        id: audit.rows[0].id, candidateId, actor: body.actor, decision: "APPROVE", note: body.note,
        snapshot: { verdict, checks: cand!.checks }, createdAt: new Date(audit.rows[0].created_at).toISOString(),
      },
    } as const;
  });
}
