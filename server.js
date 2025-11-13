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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
