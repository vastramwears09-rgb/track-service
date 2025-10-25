import { promises as fs } from "fs";
import path from "path";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({
      success: false,
      message: "Only POST allowed"
    });

  const { tracking_number } = req.body;
  if (!tracking_number)
    return res.status(400).json({
      success: false,
      message: "Tracking number missing"
    });

  try {
    // Load valid AWBs from JSON
    const filePath = path.join(process.cwd(), "valid_awbs.json");
    const fileData = await fs.readFile(filePath, "utf-8");
    const { valid_awbs } = JSON.parse(fileData);

    if (!valid_awbs.includes(tracking_number)) {
      return res.status(403).json({
        success: false,
        message: "Invalid AWB — You didn't ship this order"
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "AWB database missing or corrupted",
      error: err.message
    });
  }

  try {
    const response = await fetch("https://api.shipment.com/api/v1/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SHIPRESOLVE_API_KEY}`
      },
      body: JSON.stringify({ tracking_number })
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || "Unknown server error");
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Tracking API error",
      error: error.message
    });
  }
}
