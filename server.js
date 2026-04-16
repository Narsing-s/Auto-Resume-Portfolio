import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const history = {}; // in‑memory resume version history

app.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(req.file.path);
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        path: req.file.path
      });
      text = result.value;
    } else {
      text = fs.readFileSync(req.file.path, "utf8");
    }

    if (!text.trim()) {
      return res.status(400).json({ error: "Resume text could not be read" });
    }

    const prompt = `
You are an ATS resume parser.

Extract and return ONLY valid JSON:

{
  "name": "",
  "role": "",
  "summary": "",
  "skills": [],
  "projects": "",
  "education": ""
}

Resume text:
${text}
    `;

    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });

    const parsed = JSON.parse(ai.choices[0].message.content);

    // ✅ Resume version history
    const emailKey = parsed.name || "anonymous";
    history[emailKey] = history[emailKey] || [];
    history[emailKey].push({
      date: new Date().toISOString(),
      data: parsed
    });

    res.json({
      ...parsed,
      versions: history[emailKey].length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Resume parsing failed" });
  }
});

app.listen(5000, () =>
  console.log("✅ Backend running at http://localhost:5000")
);
