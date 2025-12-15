import { Router } from "express";
import { repairAgent } from "../services/ifixit";

const router = Router();

router.post("/stream", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Simulate streaming token-by-token
  const generator = repairAgent(query);

  for await (const chunk of generator) {
    res.write(`data: ${chunk}\n\n`);
  }

  res.end();
});

export default router;
