import postcss from 'postcss';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { nodeToJSON } from './lib/node-to-json.ts';

const inputFile = process.argv[2] || 'input.css';

if (!existsSync(inputFile)) {
  console.error(`Error: "${inputFile}" no existe. Usa: node parse-css.ts [archivo.css]`);
  process.exit(1);
}

try {
  const css = readFileSync(inputFile, 'utf-8');
  const root = postcss.parse(css, { from: inputFile });
  const ast = nodeToJSON(root);
  const output = 'src/ast-data.json';
  writeFileSync(output, JSON.stringify(ast, null, 2));
  console.log(`AST escrito en ${output} (${root.nodes.length} nodos raiz)`);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error(`Error al parsear "${inputFile}": ${message}`);
  process.exit(1);
}
