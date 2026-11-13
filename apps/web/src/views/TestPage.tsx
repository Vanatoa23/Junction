import { useEffect, useState } from "react";
import type { TestNoticeState } from "@secondsource/shared";
import { api } from "../lib/api";
import { DEMO_TRIGGER_TEXT, QUIET_NOTICE } from "../lib/demo";
import { useStore } from "../lib/store";
import { ModeBadge, SourceLink, TestBadge, when } from "../components/ui";

export function TestPageView() {
  const { health, publishNotice, mode, mockRoutes } = useStore();
  const [state, setState] = useState<TestNoticeState | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api.noticeState().then((s) => { setState(s); setText(s.text); }).catch((e: Error) => setErr(e.message)); }, []);

  const publish = async (t: string) => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      await publishNotice(t);
      setState(await api.noticeState());
      setMsg("Published. The next poll (every 30 to 60 s) will see the change; watch the Live feed.");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const mocked = mockRoutes.some((r) => r.includes("test-notice"));
  const url = state?.url ?? health?.testNoticeUrl ?? "";
  const pollMode = health?.providers.local ? health.providers.local.mode : "LOCAL";

  return (
    <>
      <div className="page-head">
        <h2>TEST notice page</h2>
        <p>This is the page the system watches. It is our own page, clearly labelled TEST, so a live change can be shown on demand. It is not a real-world source.</p>
      </div>
      <div className="grid2">
        <section className="card" aria-labelledby="w-h">
          <h3 id="w-h">The watched page <TestBadge /></h3>
          <dl className="kv">
            <dt>URL</dt><dd>{url ? <SourceLink url={url} /> : "unknown"}</dd>
            <dt>How it is watched</dt><dd><span className="badge b-neutral">poll</span> <ModeBadge mode={pollMode} /> scrape-and-diff every 30 to 60 s. Context.dev monitors have a 10-minute minimum, so the poll is the default live path.</dd>
            <dt>Last edited</dt><dd>{state ? when(state.updatedAt) : "loading…"}</dd>
          </dl>
          {url && <p><a className="btn" href={url} target="_blank" rel="noreferrer noopener">Open the TEST page<span className="sr"> (opens in a new tab)</span></a></p>}
          <h3 style={{ marginTop: 14 }}>How to trigger the live change</h3>
          <ol className="hint">
            <li>Open the Live feed in one window so the timer chips are visible.</li>
            <li>Edit the TEST page: use the editor here, or open the page on a phone and use its own editor.</li>
            <li>Within one poll interval an event appears, then the classifier card with the verbatim quote, then an alert for each affected supplier.</li>
            <li>Open the incident, then Alternatives, and approve a fully verified candidate.</li>
          </ol>
        </section>

        <section className="card" aria-labelledby="e-h">
          <h3 id="e-h">Edit the page</h3>
          {mocked || mode === "mock"
            ? <p className="note" role="note">Mock mode: publishing here only drives the in-browser mock pipeline (about 2.5 s instead of a real poll). Nothing is fetched.</p> : null}
          <label className="field" htmlFor="notice">Page text</label>
          <textarea id="notice" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="primary" onClick={() => publish(text)} disabled={busy || !text.trim()}>{busy ? "Publishing…" : "Publish to TEST page"}</button>
            <button onClick={() => setText(DEMO_TRIGGER_TEXT)} type="button">Load demo trigger text</button>
            <button onClick={() => setText(QUIET_NOTICE)} type="button">Load quiet text</button>
          </div>
          <div aria-live="polite">
            {msg && <p className="badge b-good" style={{ marginTop: 10, whiteSpace: "normal" }}>{msg}</p>}
            {err && <p className="badge b-bad" role="alert" style={{ marginTop: 10, whiteSpace: "normal" }}>{err}</p>}
          </div>
          <p className="note">The demo trigger text announces a strike at the Port of Rotterdam. In the seeded demo it reaches three suppliers.</p>
        </section>
      </div>
    </>
  );
}
