export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const launchToken = typeof body.launchToken === "string" ? body.launchToken.trim() : "";
  if (!launchToken) return res.status(400).json({ error: "MISSING_LAUNCH_TOKEN" });
  const coreUrl = process.env.IMPERIAL_COMPASS_CORE_URL?.replace(/\/$/, "");
  const sharedSecret = process.env.REPLIT_APP_SHARED_SECRET;
  if (!coreUrl || !sharedSecret) return res.status(503).json({ error: "LAUNCH_VALIDATE_NOT_CONFIGURED" });
  try {
    const upstream = await fetch(`${coreUrl}/api/replit/launch/validate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-replit-shared-secret": sharedSecret },
      body: JSON.stringify({ launchToken }),
    });
    const data = await upstream.json().catch(() => ({ error: "INVALID_UPSTREAM_RESPONSE" }));
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(502).json({ error: "LAUNCH_VALIDATE_UPSTREAM_UNAVAILABLE" });
  }
}
