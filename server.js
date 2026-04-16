import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    let text = "";

    // ✅ PDF
    if (req.file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(req.file.path);
      const data = await pdf(buffer);
      text = data.text;
    }
    // ✅ TXT / DOCX fallback
    else {
      text = fs.readFileSync(req.file.path, "utf8");
    }

    const prompt = `
Convert this resume into JSON ONLY:

{
  "name": "",
  "role": "",
  "summary": "",
  "skills": [],
  "projects": "",
  "education": ""
}

Resume:
${text}
`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });

    const content = aiRes.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

app.listen(5000, () =>
  console.log("✅ Backend running on http://localhost:5000")
);
