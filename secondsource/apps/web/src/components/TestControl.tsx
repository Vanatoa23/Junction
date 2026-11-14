import { useState } from "react";
import { api } from "../lib/api";

const TRIGGER =
  "NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed.";
const QUIET = "Supplier and port notices. No active disruptions are listed. All monitored ports operate normally.";

/** Presenter control: publish a notice on our own demo page. Small, grey, out of the way, clearly marked TEST. */
export function TestControl() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(TRIGGER);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const publish = async (t: string) => {
    setBusy(true);
    try {
      await api.publishNotice(t);
      setMsg("Published. We check for new notices every few seconds.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="testctl">
      {open && (
        <div className="testbox">
          <div className="row between"><b>Demo control</b><span className="tag">TEST</span></div>
          <p className="muted small">Publishes a notice on our own demo page, not a real-world source.</p>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row">
            <button className="primary small" disabled={busy} onClick={() => publish(text)}>Publish notice</button>
            <button className="small" disabled={busy} onClick={() => { setText(QUIET); void publish(QUIET); }}>Back to quiet</button>
          </div>
          {msg && <div className="muted small">{msg}</div>}
        </div>
      )}
      <button className="link subtle" onClick={() => setOpen(!open)}>{open ? "Close" : "Test a disruption"}</button>
    </div>
  );
}
