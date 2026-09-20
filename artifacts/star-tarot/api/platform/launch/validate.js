export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const launchToken = typeof body.launchToken === "string" ? body.launchToken.trim() : "";
  if (!launchToken) return res.status(400).json({ error: "MISSING_LAUNCH_TOKEN" });

  const validationApiUrl = process.env.STAR_KEY_VALIDATION_API_URL?.replace(/\/$/, "")
    || "https://yuceluopan-star-key-api-server-five.vercel.app";

  try {
    const upstream = await fetch(`${validationApiUrl}/api/platform/launch/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ launchToken }),
    });
    const data = await upstream.json().catch(() => ({ error: "INVALID_UPSTREAM_RESPONSE" }));
    const profile = data?.data?.activeProfile ?? data?.activeProfile ?? null;
    console.log("STAR_KEY_LAUNCH_SHAPE", {
      upstreamStatus: upstream.status,
      responseStatus: data?.status ?? null,
      hasProfile: Boolean(profile),
      profileKeys: profile && typeof profile === "object" ? Object.keys(profile).sort() : [],
      birthPlaceKeys: profile?.birthPlace && typeof profile.birthPlace === "object" ? Object.keys(profile.birthPlace).sort() : [],
      latitudeType: typeof profile?.birthPlace?.latitude,
      longitudeType: typeof profile?.birthPlace?.longitude,
    });
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error("STAR_KEY_VALIDATION_API_FETCH_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(502).json({ error: "LAUNCH_VALIDATE_UPSTREAM_UNAVAILABLE" });
  }
}
