import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Only POST allowed" });

  const { tracking_number } = req.body;
  if (!tracking_number) return res.status(400).json({ success: false, message: "Tracking number missing" });

  // Validate AWB
  const filePath = path.join(process.cwd(), "valid_awbs.json");
  let awbData;
  try {
    awbData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error reading AWB list" });
  }

  if (!Array.isArray(awbData.valid_awbs) || !awbData.valid_awbs.includes(tracking_number)) {
    return res.status(400).json({ success: false, message: "AWB number not valid" });
  }

  try {
    const response = await fetch("https://service-api.shipresolve.com/track/tracking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.SHIPRESOLVE_API_KEY
      },
      body: JSON.stringify({ tracking_number })
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Tracking API error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}
