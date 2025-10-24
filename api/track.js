// api/track.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { tracking_number, courier_code } = req.body || {};
  if (!tracking_number) return res.status(400).json({ error: "tracking_number required" });

  const SHIPRESOLVE_API_KEY = process.env.SHIPRESOLVE_API_KEY;
  if (!SHIPRESOLVE_API_KEY) {
    return res.status(500).json({ error: "Server not configured: missing SHIPRESOLVE_API_KEY" });
  }

  try {
    // <-- CHANGE THIS URL if ShipResolved docs show a different base URL.
    // This is a common REST pattern; if their docs require a different endpoint/path or header name, update accordingly.
    const apiUrl = "https://api.shipresolve.com/v1/trackings/realtime"; // adjust if docs differ

    // Example POST body used by many aggregators: tracking_number + carrier (optional)
    const body = {
      tracking_number,
      ...(courier_code ? { carrier_code: courier_code } : {})
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Common auth header pattern; if ShipResolved requires "API-Key" or "Authorization: Bearer <key>", change this.
        "Authorization": `Bearer ${SHIPRESOLVE_API_KEY}`
      },
      body: JSON.stringify(body),
      timeout: 15000
    });

    if (!response.ok) {
      // surface body for debugging if possible
      const txt = await response.text().catch(()=>"");
      return res.status(response.status).json({ error: "Upstream error", status: response.status, body: txt });
    }

    const data = await response.json();
    // Normalize response into {status, events, raw} for frontend convenience
    const result = {
      success: true,
      provider: "shipresolve",
      raw: data,
      // Try to map common fields if present (these keys vary by provider)
      tracking_number,
      events: data?.events || data?.tracking_events || data?.checkpoints || [],
      status: data?.status || (data?.delivered ? "Delivered" : "In Transit")
    };

    return res.status(200).json(result);

  } catch (err) {
    console.error("track error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
