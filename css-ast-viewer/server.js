import express from 'express';
import postcss from 'postcss';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: 'text/css', limit: '5mb' }));

function nodeToJSON(node) {
  const result = { type: node.type };

  if (node.type === 'root') {
    result.children = node.nodes?.map(nodeToJSON) || [];
  } else if (node.type === 'atrule') {
    result.name = `@${node.name}`;
    result.params = node.params || '';
    if (node.nodes) {
      result.children = node.nodes.map(nodeToJSON);
    }
  } else if (node.type === 'rule') {
    result.selector = node.selector;
    result.children = node.nodes?.map(nodeToJSON) || [];
  } else if (node.type === 'decl') {
    result.prop = node.prop;
    result.value = node.value;
    result.important = node.important || false;
  } else if (node.type === 'comment') {
    result.text = node.text;
  }

  if (node.source) {
    result.source = {
      start: node.source.start,
      end: node.source.end,
    };
  }

  return result;
}

app.post('/api/parse', (req, res) => {
  try {
    const css = typeof req.body === 'string' ? req.body : req.body.css;
    if (!css) {
      return res.status(400).json({ error: 'No CSS provided' });
    }
    const root = postcss.parse(css, { from: 'input.css' });
    const ast = nodeToJSON(root);
    res.json(ast);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 3334;
app.listen(PORT, () => {
  console.log(`CSS parser API running on http://localhost:${PORT}`);
});
