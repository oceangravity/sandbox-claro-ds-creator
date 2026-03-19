import express, { type Request, type Response } from 'express';
import postcss from 'postcss';
import { nodeToJSON } from './lib/node-to-json.ts';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: 'text/css', limit: '5mb' }));

interface ParseRequestBody {
  css?: string;
}

app.post('/api/parse', (req: Request, res: Response) => {
  try {
    const body = req.body as string | ParseRequestBody;
    const css = typeof body === 'string' ? body : body.css;
    if (!css || typeof css !== 'string') {
      res.status(400).json({ error: 'No CSS provided. Send { "css": "..." } in the request body.' });
      return;
    }
    const root = postcss.parse(css, { from: 'input.css' });
    const ast = nodeToJSON(root);
    res.json(ast);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

const PORT = 3334;
app.listen(PORT, () => {
  console.log(`CSS parser API running on http://localhost:${PORT}`);
});
