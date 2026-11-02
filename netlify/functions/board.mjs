// K7 Warriors board storage: everyone can read, only the coach PIN can write.
// Set the COACH_PIN environment variable in Netlify (Site configuration → Environment variables).
import { getStore } from "@netlify/blobs";

const MATCHES = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
const KEYS = ["roster", ...MATCHES];
const MAX_LOG = 1000;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  const store = getStore({ name: "k7-board", consistency: "strong" });

  if (req.method === "GET") {
    const [roster, log, ...ms] = await Promise.all([
      store.get("roster", { type: "json" }),
      store.get("log", { type: "json" }),
      ...MATCHES.map((k) => store.get(k, { type: "json" })),
    ]);
    const matches = {};
    MATCHES.forEach((k, i) => { if (ms[i]) matches[k] = ms[i]; });
    return json({ ok: true, roster: roster || null, matches, log: log || [] });
  }

  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const pin = process.env.COACH_PIN;
  if (!pin) return json({ ok: false, error: "COACH_PIN is not set on the site" }, 500);
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  if (String(body.pin || "") !== pin) {
    await new Promise((r) => setTimeout(r, 800)); // slow down PIN guessing
    return json({ ok: false, error: "wrong_pin" }, 401);
  }

  if (body.op === "check") return json({ ok: true });

  if (body.op === "put") {
    if (!KEYS.includes(body.key) || typeof body.value !== "object" || !body.value) return json({ ok: false, error: "bad_key" }, 400);
    if (JSON.stringify(body.value).length > 2_000_000) return json({ ok: false, error: "too_large" }, 413);
    await store.setJSON(body.key, body.value);
    return json({ ok: true });
  }

  if (body.op === "log") {
    const e = body.entry || {};
    const entry = {
      match: String(e.match || "").slice(0, 10),
      at: String(e.at || new Date().toISOString()).slice(0, 40),
      text: String(e.text || "").slice(0, 500),
      kind: String(e.kind || "change").slice(0, 12),
    };
    const log = (await store.get("log", { type: "json" })) || [];
    log.unshift(entry);
    await store.setJSON("log", log.slice(0, MAX_LOG));
    return json({ ok: true });
  }

  if (body.op === "replace") {
    if (body.roster) await store.setJSON("roster", body.roster);
    for (const k of MATCHES) if (body.matches && body.matches[k]) await store.setJSON(k, body.matches[k]);
    if (Array.isArray(body.log)) await store.setJSON("log", body.log.slice(0, MAX_LOG));
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown_op" }, 400);
};

export const config = { path: "/api/board" };
