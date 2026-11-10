import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint for Mia's personalized encouraging feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { target, recognized, missingWords, attempt, isSuccess, hasSmallWordMissingOnly } = req.body;

    if (!ai) {
      return res.json({ feedback: null, fallbackReason: 'no_api_key' });
    }

    const missingWordsStr = Array.isArray(missingWords) ? missingWords.join(', ') : (missingWords || 'none');

    let promptContext = '';
    if (isSuccess && hasSmallWordMissingOnly) {
      promptContext = `The student succeeded in getting their order across, but omitted small words: "${missingWordsStr}". Praise them for clear ordering, then gently remind them that adding that word makes it even more polite. Keep it in very simple, encouraging English. Max 2 sentences.`;
    } else if (isSuccess) {
      promptContext = `The student succeeded! Praise what they ordered clearly and cheer them on warmly. Max 2 sentences in very simple English.`;
    } else {
      promptContext = `The student missed key words: "${missingWordsStr}".
Attempt number: ${attempt}.
Attempt 1 rule: recast (say the correct sentence naturally).
Attempt 2 rule: give a first-letter hint for the missing word.
Attempt 3 rule: suggest saying the sentence in short parts.`;
    }

    const prompt = `You are Mia, a gentle, friendly barista in a cozy café. A student is practicing ordering in English (CEFR A1–A2 level).
Target sentence: "${target}"
What the student said (speech recognition result): "${recognized || '(No speech)'}"
Missing words: ${missingWordsStr}
Attempt number: ${attempt}

Specific instruction:
${promptContext}

Rules:
- Write strictly in simple, natural English ONLY. Do NOT include any Korean or other languages.
- Start with one specific warm praise sentence (praise their clear voice, great effort, or words spoken well).
- Mention only ONE thing to improve.
- Maximum 2 sentences in total.
- Never say "wrong" or "bad", and never give scores or percentages.
- Judge by whether you understood the order, not by native-like pronunciation.
- Do not describe tongue, lips, or mouth positions.
- Keep the tone very warm, gentle, patient, and cozy. Return ONLY Mia's feedback text.`;

    let feedbackText: string | null = null;
    const modelsToTry = [
      { name: 'gemini-3.1-flash-lite', config: { temperature: 0.7 } },
      { name: 'gemini-3.8-flash', config: { temperature: 0.7, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } },
    ];

    for (const modelItem of modelsToTry) {
      try {
        const generatePromise = ai.models.generateContent({
          model: modelItem.name,
          contents: prompt,
          config: modelItem.config,
        });
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Model timeout')), 8000)
        );
        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        if (response?.text) {
          feedbackText = response.text.trim();
          break;
        }
      } catch (genErr: any) {
        console.info(`Model ${modelItem.name} skipped: ${genErr?.message || genErr}`);
      }
    }

    return res.json({ feedback: feedbackText });
  } catch (err: unknown) {
    console.error('Gemini feedback error:', err);
    return res.json({ feedback: null, error: 'Gemini request failed' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Order Up! — Café Talk' });
});

// Forward student practice tap frequency to Google Sheets (Google Apps Script Web App)
app.post('/api/sheets/save', async (req, res) => {
  try {
    const { scriptUrl, data } = req.body;
    const targetUrl =
      scriptUrl ||
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
      process.env.GOOGLE_SHEETS_WEBAPP_URL;


    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'No Google Apps Script Web App URL provided',
      });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      redirect: 'follow',
    });

    const text = await response.text();
    let jsonResult = null;
    try {
      jsonResult = JSON.parse(text);
    } catch {
      jsonResult = { status: 'success', raw: text };
    }

    return res.json({ success: true, result: jsonResult });
  } catch (err: unknown) {
    console.error('Google Sheets forwarding error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to forward data to Google Sheets',
    });
  }
});

// OAuth popup callback handler to prevent iframe 403 errors
app.get(['/auth/callback', '/auth/callback/'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>로그인 처리 중...</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #FFFDF9;
        color: #431407;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        text-align: center;
      }
      .card {
        background: white;
        padding: 32px;
        border-radius: 24px;
        border: 2px solid #FCD8C1;
        box-shadow: 0 10px 30px rgba(251,146,60,0.12);
        max-width: 360px;
      }
      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #FFEDD5;
        border-top-color: #EA580C;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner"></div>
      <h2 style="font-size: 18px; margin: 0 0 8px;">로그인 처리 중입니다</h2>
      <p style="font-size: 14px; color: #7D665E; margin: 0;">잠시만 기다려주세요. 창이 자동으로 닫힙니다.</p>
    </div>
    <script>
      (function() {
        var hash = window.location.hash || '';
        var search = window.location.search || '';
        if (window.opener) {
          try {
            window.opener.postMessage({
              type: 'SUPABASE_AUTH_SUCCESS',
              hash: hash,
              search: search
            }, '*');
          } catch(e) {}
          setTimeout(function() { window.close(); }, 400);
        } else {
          window.location.href = '/' + hash;
        }
      })();
    </script>
  </body>
</html>`);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Order Up! — Café Talk server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
