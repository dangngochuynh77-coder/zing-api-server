import express from "express";
import cors from "cors";
import { ZingMp3 } from "zingmp3-api-full";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Zing MP3 API Server is running!");
});

// ================================
// SEARCH API
// ================================
app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "Missing q" });

    const data = await ZingMp3.search(q);
    res.json(data);
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

// ================================
// SONG INFO API
// ================================
app.get("/api/song", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.json({ error: "Missing id" });

    const data = await ZingMp3.getSong(id);
    res.json(data);
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

// ================================
// LYRICS API
// ================================
app.get("/api/lyric", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.json({ error: "Missing id" });

    const data = await ZingMp3.getLyric(id);
    res.json(data);
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

// ================================
// STREAM MP3 (Convert HLS m3u8 -> MP3 realtime)
// ================================
app.get("/api/stream", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    console.log("[STREAM] Request ID =", id);

    const info = await ZingMp3.getSong(id);
    if (!info || !info.data) {
      return res.status(500).json({ error: "Song info not found" });
    }

    const hls = info.data["128"] || info.data["320"];
    if (!hls) {
      return res.status(500).json({ error: "No HLS URL" });
    }

    console.log("[STREAM] HLS =", hls);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    const cmd = ffmpeg(hls)
      .format("mp3")
      .audioBitrate(128)
      .on("start", c => console.log("[ffmpeg] Start:", c))
      .on("error", err => {
        console.error("[ffmpeg] Error:", err);
        res.end();
      })
      .on("end", () => {
        console.log("[ffmpeg] Finished");
        res.end();
      });

    cmd.pipe(res, { end: true });
  } catch (e) {
    console.error("[STREAM] Exception:", e);
    res.json({ error: e.toString() });
  }
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on PORT", PORT);
});
