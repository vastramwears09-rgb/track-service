export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { tracking_number, carrier } = req.body;

  if (!tracking_number) {
    return res.status(400).json({ success: false, message: "tracking_number is required" });
  }

  const apiKey = process.env.SHIPRESOLVE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, message: "API Key missing" });
  }

  try {
    const response = await fetch("https://service-api.shipresolve.com/track/tracking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        tracking_number,
        carrier: carrier || 0 // auto-detect if not provided
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
