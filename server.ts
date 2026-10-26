import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs/promises';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = true;
const port = 3000;

async function startServer() {
  console.log('Starting server...');
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post('/api/gemini', async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      const response = await ai.models.generateContent({
        model: model || 'gemini-3.8-flash',
        contents,
        config
      });
      res.json(response);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'custom',
    });

    // Provide a comprehensive Vite client mock to satisfy HMR imports
    app.get('/@vite/client', (req, res) => {
      res.type('application/javascript').send(`
        export const createHotContext = (ownerPath) => ({
          accept: (deps, callback) => {},
          dispose: (callback) => {},
          decline: () => {},
          invalidate: () => {},
          on: (event, callback) => {},
          send: (event, data) => {},
          prune: (callback) => {},
          data: {}
        });
        export const updateStyle = (id, content) => {};
        export const removeStyle = (id) => {};
        export const injectQuery = (url) => url;
        export default { createHotContext, updateStyle, removeStyle, injectQuery };
      `);
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server started at http://0.0.0.0:${port}`);
  });
}

startServer().catch(console.error);
