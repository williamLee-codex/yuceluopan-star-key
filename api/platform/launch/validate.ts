export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const launchToken = typeof body.launchToken === "string" ? body.launchToken.trim() : "";
  if (!launchToken) return res.status(400).json({ error: "MISSING_LAUNCH_TOKEN" });

  const env = (globalThis as any).process?.env ?? {};
  const validationApiUrl = typeof env.STAR_KEY_VALIDATION_API_URL === "string"
    ? env.STAR_KEY_VALIDATION_API_URL.replace(/\/$/, "")
    : "https://yuceluopan-star-key-api-server-five.vercel.app";

  try {
    const upstream = await (globalThis as any).fetch(`${validationApiUrl}/api/platform/launch/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ launchToken }),
    });
    const data = await upstream.json().catch(() => ({ error: "INVALID_UPSTREAM_RESPONSE" }));
    return res.status(upstream.status).json(data);
  } catch (error) {
    const safeError = error instanceof Error
      ? { name: error.name, message: error.message, cause: String((error as any).cause?.code ?? "") }
      : { name: "UnknownError", message: String(error), cause: "" };
    (globalThis as any).console?.error?.("STAR_KEY_VALIDATION_API_FETCH_FAILED", safeError);
    return res.status(502).json({ error: "LAUNCH_VALIDATE_UPSTREAM_UNAVAILABLE" });
  }
}
