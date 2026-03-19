import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { nodeToJSON } from '../lib/node-to-json.ts';

function parse(css) {
  return nodeToJSON(postcss.parse(css, { from: 'test.css' }));
}

describe('nodeToJSON', () => {
  it('should return root type for empty CSS', () => {
    const ast = parse('');
    assert.equal(ast.type, 'root');
    assert.deepEqual(ast.children, []);
  });

  it('should parse a simple rule', () => {
    const ast = parse('body { color: red; }');
    assert.equal(ast.children.length, 1);
    assert.equal(ast.children[0].type, 'rule');
    assert.equal(ast.children[0].selector, 'body');
    assert.equal(ast.children[0].children.length, 1);
  });

  it('should parse a declaration with prop and value', () => {
    const ast = parse('a { color: blue; }');
    const decl = ast.children[0].children[0];
    assert.equal(decl.type, 'decl');
    assert.equal(decl.prop, 'color');
    assert.equal(decl.value, 'blue');
    assert.equal(decl.important, false);
  });

  it('should parse !important declarations', () => {
    const ast = parse('.x { color: red !important; }');
    const decl = ast.children[0].children[0];
    assert.equal(decl.important, true);
  });

  it('should parse an @import atrule without children', () => {
    const ast = parse("@import 'reset.css';");
    const atrule = ast.children[0];
    assert.equal(atrule.type, 'atrule');
    assert.equal(atrule.name, '@import');
    assert.equal(atrule.params, "'reset.css'");
    assert.equal(atrule.children, undefined);
  });

  it('should parse @media with nested rules', () => {
    const ast = parse('@media (max-width: 768px) { .card { padding: 8px; } }');
    const media = ast.children[0];
    assert.equal(media.type, 'atrule');
    assert.equal(media.name, '@media');
    assert.equal(media.params, '(max-width: 768px)');
    assert.equal(media.children.length, 1);
    assert.equal(media.children[0].type, 'rule');
    assert.equal(media.children[0].selector, '.card');
  });

  it('should parse @keyframes with keyframe stops', () => {
    const ast = parse('@keyframes fade { from { opacity: 0; } to { opacity: 1; } }');
    const kf = ast.children[0];
    assert.equal(kf.name, '@keyframes');
    assert.equal(kf.params, 'fade');
    assert.equal(kf.children.length, 2);
    assert.equal(kf.children[0].selector, 'from');
    assert.equal(kf.children[1].selector, 'to');
  });

  it('should parse @font-face', () => {
    const ast = parse("@font-face { font-family: 'X'; src: url('x.woff2'); }");
    const ff = ast.children[0];
    assert.equal(ff.type, 'atrule');
    assert.equal(ff.name, '@font-face');
    assert.equal(ff.params, '');
    assert.equal(ff.children.length, 2);
  });

  it('should parse @supports', () => {
    const ast = parse('@supports (display: grid) { .x { display: grid; } }');
    const sup = ast.children[0];
    assert.equal(sup.name, '@supports');
    assert.equal(sup.params, '(display: grid)');
    assert.equal(sup.children.length, 1);
  });

  it('should parse @layer', () => {
    const ast = parse('@layer utilities { .sr-only { position: absolute; } }');
    const layer = ast.children[0];
    assert.equal(layer.name, '@layer');
    assert.equal(layer.params, 'utilities');
  });

  it('should parse @container', () => {
    const ast = parse('@container (min-width: 400px) { .x { flex-direction: row; } }');
    const container = ast.children[0];
    assert.equal(container.name, '@container');
    assert.equal(container.params, '(min-width: 400px)');
  });

  it('should parse comments', () => {
    const ast = parse('/* hello world */');
    assert.equal(ast.children.length, 1);
    assert.equal(ast.children[0].type, 'comment');
    assert.equal(ast.children[0].text, 'hello world');
  });

  it('should parse multiline comments', () => {
    const ast = parse('/* line 1\n   line 2 */');
    assert.equal(ast.children[0].type, 'comment');
    assert.ok(ast.children[0].text.includes('line 1'));
    assert.ok(ast.children[0].text.includes('line 2'));
  });

  it('should include source positions', () => {
    const ast = parse('a { color: red; }');
    const rule = ast.children[0];
    assert.ok(rule.source);
    assert.ok(rule.source.start);
    assert.equal(rule.source.start.line, 1);
    assert.equal(rule.source.start.column, 1);
  });

  it('should handle complex selectors', () => {
    const ast = parse('.nav > ul > li:nth-child(2n+1) a[href^="https"] { color: blue; }');
    const rule = ast.children[0];
    assert.equal(rule.selector, '.nav > ul > li:nth-child(2n+1) a[href^="https"]');
  });

  it('should handle CSS custom properties', () => {
    const ast = parse(':root { --color-primary: #3b82f6; }');
    const decl = ast.children[0].children[0];
    assert.equal(decl.prop, '--color-primary');
    assert.equal(decl.value, '#3b82f6');
  });

  it('should handle native CSS nesting', () => {
    const ast = parse('.parent { color: red; & .child { color: blue; } }');
    const parent = ast.children[0];
    assert.equal(parent.selector, '.parent');
    assert.equal(parent.children.length, 2);
    const nested = parent.children[1];
    assert.equal(nested.type, 'rule');
    assert.equal(nested.selector, '& .child');
  });

  it('should handle multiple rules at root level', () => {
    const ast = parse('a { color: red; } b { color: blue; } c { color: green; }');
    assert.equal(ast.children.length, 3);
    assert.equal(ast.children[0].selector, 'a');
    assert.equal(ast.children[1].selector, 'b');
    assert.equal(ast.children[2].selector, 'c');
  });

  it('should handle node without source gracefully', () => {
    const fakeNode = { type: 'decl', prop: 'x', value: 'y' };
    const result = nodeToJSON(fakeNode);
    assert.equal(result.type, 'decl');
    assert.equal(result.source, undefined);
  });

  it('should handle unknown node type without crashing', () => {
    const fakeNode = { type: 'unknown' };
    const result = nodeToJSON(fakeNode);
    assert.equal(result.type, 'unknown');
  });
});
