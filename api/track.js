export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { tracking_number } = req.body;
  if (!tracking_number) {
    return res.status(400).json({ success: false, message: "Tracking number missing" });
  }

  try {
    const response = await fetch("https://api.shipment.com/api/v1/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `YOUR-SHIP-RESOLVED-KEY`
      },
      body: JSON.stringify({
        tracking_number
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
}

