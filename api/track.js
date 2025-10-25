export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Only POST allowed" });

  const { tracking_number } = req.body;
  if (!tracking_number)
    return res.status(400).json({ success: false, message: "Tracking number missing" });

  // Validate AWB from env variable
  const validAWBs = process.env.VALID_AWBS?.split(',') || [];
  if (!validAWBs.includes(tracking_number)) {
    return res.status(400).json({ success: false, message: "AWB number not valid" });
  }

  // API key
  const apiKey = process.env.SHIPRESOLVE_API_KEY;
  if (!apiKey)
    return res.status(500).json({ success: false, message: "API Key missing" });

  try {
    const response = await fetch("https://service-api.shipresolve.com/track/tracking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        tracking_number,
        carrier: 0 // auto-detect
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}
