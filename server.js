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

// SEARCH
app.get("/api/search", async (req, res) => {
  try {
    let keyword = req.query.q;
    if (!keyword) return res.json({ error: "Missing q" });

    const data = await ZingMp3.search(keyword);
    res.json(data);
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

// GET SONG STREAMING
app.get("/api/song", async (req, res) => {
  try {
    let id = req.query.id;
    if (!id) return res.json({ error: "Missing id" });

    const data = await ZingMp3.getSong(id);
    res.json(data);
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

// GET LYRICS
app.get("/api/lyric", async (req, res) => {
  try {
    let id = req.query.id;
    if (!id) return res.json({ error: "Missing id" });

    const data = await ZingMp3.getLyric(id);
    res.json(data);
  } catch (e) {
    res.json({ error: e.toString() });
  }
  // STREAM MP3: convert HLS (m3u8) -> MP3
app.get("/api/stream", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    console.log("[STREAM] Request id =", id);

    // Lấy info bài hát từ Zing
    const songInfo = await ZingMp3.getSong(id);
    if (!songInfo || !songInfo.data) {
      return res.status(500).json({ error: "No data from Zing" });
    }

    const data = songInfo.data;
    // ưu tiên 128 cho nhẹ, muốn 320 thì đảo lại
    const hlsUrl = data["128"] || data["320"];
    if (!hlsUrl) {
      return res.status(500).json({ error: "No HLS url" });
    }

    console.log("[STREAM] HLS URL =", hlsUrl);

    // Thiết lập header MP3
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    // Dùng ffmpeg chuyển HLS -> MP3 và pipe thẳng cho client (ESP32)
    const command = ffmpeg(hlsUrl)
      .format("mp3")
      .audioBitrate(128)
      .on("start", cmd => {
        console.log("[STREAM] ffmpeg started:", cmd);
      })
      .on("error", err => {
        console.error("[STREAM] ffmpeg error:", err.message);
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      })
      .on("end", () => {
        console.log("[STREAM] ffmpeg finished");
        res.end();
      });

    command.pipe(res, { end: true });
  } catch (e) {
    console.error("[STREAM] Exception:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.toString() });
    } else {
      res.end();
    }
  }
});

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
