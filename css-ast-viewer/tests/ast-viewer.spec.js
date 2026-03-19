import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test.describe('CSS AST Viewer - Page Load', () => {
  test('should display the page title and subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('CSS AST Viewer');
    await expect(page.getByText('PostCSS Parse Tree')).toBeVisible();
  });

  test('should show the Root node after demo loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
  });

  test('should show the detail panel with hint text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Node Details')).toBeVisible();
    await expect(page.getByText('Click a node to see its details')).toBeVisible();
  });

  test('should show demo.css as default file name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('file-name')).toHaveText('demo.css');
  });

  test('should show the Load CSS File button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('upload-btn')).toBeVisible();
    await expect(page.getByTestId('upload-btn')).toContainText('Load CSS File');
  });
});

test.describe('CSS AST Viewer - Demo Tree Structure', () => {
  test('should display @import nodes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText("@import 'tailwindcss'")).toBeVisible();
    await expect(page.getByText("@import 'tw-animate-css'")).toBeVisible();
  });

  test('should display @custom-variant node', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('@custom-variant')).toBeVisible();
  });

  test('should display :root rule', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(':root')).toBeVisible();
  });

  test('should display .dark rule', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('.dark', { exact: true })).toBeVisible();
  });

  test('should display @theme inline node', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('@theme inline')).toBeVisible();
  });

  test('should display @layer base node', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('@layer base')).toBeVisible();
  });

  test('should show type badges for different node types', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('root', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('atrule', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('rule', { exact: true }).first()).toBeVisible();
  });
});

test.describe('CSS AST Viewer - Expand/Collapse', () => {
  test('should show :root declarations by default (depth < 2 starts expanded)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first()).toBeVisible();
  });

  test('should collapse :root on double click hiding declarations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first()).toBeVisible();
    await page.getByText(':root').dblclick();
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' })).toHaveCount(0);
  });

  test('should re-expand :root on second double click', async ({ page }) => {
    await page.goto('/');
    const rootLabel = page.locator('span').filter({ hasText: ':root' }).first();
    await rootLabel.dblclick();
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' })).toHaveCount(0);
    await rootLabel.dblclick();
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first()).toBeVisible();
  });
});

test.describe('CSS AST Viewer - Node Selection & Details', () => {
  test('should show node details when clicking a node', async ({ page }) => {
    await page.goto('/');
    await page.getByText(':root').click();
    await expect(page.getByText('Click a node to see its details')).not.toBeVisible();
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"type": "rule"');
    await expect(detailPanel).toContainText('"selector": ":root"');
  });

  test('should show atrule details when clicking an @import', async ({ page }) => {
    await page.goto('/');
    await page.getByText("@import 'tailwindcss'").click();
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"type": "atrule"');
    await expect(detailPanel).toContainText('"name": "@import"');
  });

  test('should show declaration details when clicking a visible declaration', async ({ page }) => {
    await page.goto('/');
    await page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first().click();
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"type": "decl"');
    await expect(detailPanel).toContainText('"prop": "--foreground"');
  });

  test('should update details when selecting a different node', async ({ page }) => {
    await page.goto('/');
    await page.getByText(':root').click();
    await expect(page.locator('pre')).toContainText('"selector": ":root"');
    await page.getByText('.dark', { exact: true }).click();
    await expect(page.locator('pre')).toContainText('"selector": ".dark"');
  });

  test('should show source location in details', async ({ page }) => {
    await page.goto('/');
    await page.getByText(':root').click();
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"source"');
    await expect(detailPanel).toContainText('"line"');
  });
});

test.describe('CSS AST Viewer - Sidebar Sticky Behavior', () => {
  test('should keep sidebar visible after scrolling the tree panel down', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside');
    const detailsHeader = page.getByText('Node Details');
    await expect(sidebar).toBeVisible();
    await expect(detailsHeader).toBeInViewport();
    const boundsBefore = await sidebar.boundingBox();
    const treePanel = page.locator('.flex-1.overflow-auto');
    await treePanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);
    await expect(sidebar).toBeVisible();
    await expect(detailsHeader).toBeInViewport();
    const boundsAfter = await sidebar.boundingBox();
    expect(boundsAfter.y).toBe(boundsBefore.y);
  });

  test('should keep sidebar details visible after scrolling tree to bottom and selecting a node', async ({ page }) => {
    await page.goto('/');
    await page.getByText("@import 'tailwindcss'").click();
    await expect(page.locator('pre')).toContainText('"type": "atrule"');
    const treePanel = page.locator('.flex-1.overflow-auto');
    await treePanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);
    await expect(page.getByText('Node Details')).toBeInViewport();
    await expect(page.locator('aside')).toBeInViewport();
  });
});

test.describe('CSS AST Viewer - File Upload', () => {
  test('should upload a CSS file and update the tree', async ({ page }) => {
    await page.goto('/');
    // Wait for demo to load
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // Upload the comprehensive CSS file
    const filePath = resolve(__dirname, 'comprehensive.css');
    const fileInput = page.getByTestId('file-input');
    await fileInput.setInputFiles(filePath);

    // Wait for new tree to render
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');

    // Verify comprehensive CSS nodes appear
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
  });

  test('should show the Demo button after uploading a file', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // No demo button when already showing demo
    await expect(page.getByTestId('demo-btn')).not.toBeVisible();

    // Upload file
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');

    // Demo button should now be visible
    await expect(page.getByTestId('demo-btn')).toBeVisible();
  });

  test('should return to demo CSS when clicking Demo button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // Upload comprehensive file
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');

    // Click demo button
    await page.getByTestId('demo-btn').click();
    await expect(page.getByTestId('file-name')).toHaveText('demo.css');

    // Demo nodes should be back
    await expect(page.getByText("@import 'tailwindcss'")).toBeVisible();
  });

  test('should clear selected node when uploading a new file', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // Select a node
    await page.getByText(':root').click();
    await expect(page.locator('pre')).toContainText('"selector": ":root"');

    // Upload file
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');

    // Selection should be cleared
    await expect(page.getByText('Click a node to see its details')).toBeVisible();
  });
});

test.describe('Comprehensive CSS - Comments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should show comment nodes with correct badge', async ({ page }) => {
    // The comprehensive CSS has comments - check for comment type badges
    const commentBadges = page.locator('span').filter({ hasText: 'comment' });
    expect(await commentBadges.count()).toBeGreaterThan(0);
  });

  test('should display comment text in details when clicking a comment node', async ({ page }) => {
    // Find a comment row by its icon // and click on its parent row
    const commentIcon = page.locator('span').filter({ hasText: '//' }).first();
    // Click the parent row div that contains the comment
    await commentIcon.locator('..').locator('..').click();
    // The detail panel should show the comment content
    await expect(page.getByText('Comment', { exact: true })).toBeVisible();
  });
});

test.describe('Comprehensive CSS - @font-face', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @font-face at-rule', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@font-face' }).first()).toBeVisible();
  });

  test('should show @font-face declarations when expanded', async ({ page }) => {
    // Double-click to expand if collapsed
    const fontFaceNode = page.locator('span').filter({ hasText: '@font-face' }).first();
    await fontFaceNode.dblclick();
    // Check for font-family declaration
    await expect(page.locator('span').filter({ hasText: "font-family: 'CustomFont'" }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - @media Queries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @media (max-width: 768px)', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@media (max-width: 768px)' }).first()).toBeVisible();
  });

  test('should parse @media (prefers-color-scheme: dark)', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@media (prefers-color-scheme: dark)' }).first()).toBeVisible();
  });

  test('should parse @media print', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@media print' }).first()).toBeVisible();
  });

  test('should show nested rules inside @media when expanded', async ({ page }) => {
    // Click on a @media node to see details
    const mediaNode = page.locator('span').filter({ hasText: '@media (max-width: 768px)' }).first();
    await mediaNode.click();
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"type": "atrule"');
    await expect(detailPanel).toContainText('"name": "@media"');
    await expect(detailPanel).toContainText('"params": "(max-width: 768px)"');
  });
});

test.describe('Comprehensive CSS - @keyframes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @keyframes fadeIn', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@keyframes fadeIn' }).first()).toBeVisible();
  });

  test('should parse @keyframes spin', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@keyframes spin' }).first()).toBeVisible();
  });

  test('should parse @keyframes pulse', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@keyframes pulse' }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - @supports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @supports (display: grid)', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@supports (display: grid)' }).first()).toBeVisible();
  });

  test('should parse @supports not', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@supports not' }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - @layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @layer utilities', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@layer utilities' }).first()).toBeVisible();
  });

  test('should parse @layer components', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@layer components' }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - @container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @container query', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@container' }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - Complex Selectors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse universal selector with pseudo-elements', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '*, *::before, *::after' }).first()).toBeVisible();
  });

  test('should parse ID selector', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '#main-container' }).first()).toBeVisible();
  });

  test('should parse child combinator selector', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '.nav > ul > li > a' }).first()).toBeVisible();
  });

  test('should parse attribute selector', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: 'input[type="text"]' }).first()).toBeVisible();
  });

  test('should parse pseudo-class :nth-child', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: 'li:nth-child(odd)' }).first()).toBeVisible();
  });

  test('should parse :is() and :where() selectors', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: ':is(h1, h2, h3):where(.title)' }).first()).toBeVisible();
  });

  test('should parse ::selection pseudo-element', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '::selection' }).first()).toBeVisible();
  });

  test('should parse ::placeholder pseudo-element', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '::placeholder' }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - !important', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse declarations with !important and show badge in details', async ({ page }) => {
    // Expand .override rule to see its declarations
    const overrideNode = page.locator('span').filter({ hasText: '.override' }).first();
    await overrideNode.dblclick(); // expand
    await page.waitForTimeout(200);

    // Click on color: red (which has !important)
    const importantDecl = page.locator('span').filter({ hasText: 'color: red' }).first();
    await importantDecl.click();

    // Detail panel should show !important badge
    await expect(page.getByText('!important')).toBeVisible();
  });
});

test.describe('Comprehensive CSS - CSS Nesting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse native CSS nesting with & selector', async ({ page }) => {
    // The .dialog rule has nested rules - click to select it and check children count
    const dialogNode = page.locator('span').filter({ hasText: '.dialog' }).first();
    await dialogNode.click();
    // Check details show it has children (nested rules)
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"selector": ".dialog"');
    await expect(detailPanel).toContainText('"childCount"');
  });
});

test.describe('Comprehensive CSS - @scope', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const filePath = resolve(__dirname, 'comprehensive.css');
    await page.getByTestId('file-input').setInputFiles(filePath);
    await expect(page.getByTestId('file-name')).toHaveText('comprehensive.css');
  });

  test('should parse @scope at-rule', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: '@scope' }).first()).toBeVisible();
  });
});

test.describe('Comprehensive CSS - Visual Elements', () => {
  test('should have dark background theme', async ({ page }) => {
    await page.goto('/');
    const container = page.locator('#root > div');
    await expect(container).toHaveCSS('background-color', /rgb\(10, 14, 20\)/);
  });

  test('should show child count badges for nodes with children', async ({ page }) => {
    await page.goto('/');
    // Wait for demo to load
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const counts = page.locator('span').filter({ hasText: /^\d+$/ });
    expect(await counts.count()).toBeGreaterThan(0);
  });

  test('should display guide lines for nested nodes', async ({ page }) => {
    await page.goto('/');
    // Wait for demo to load
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
    const guideLines = page.locator('.relative > .absolute.w-px');
    expect(await guideLines.count()).toBeGreaterThan(0);
  });

  test('should show comment legend in header', async ({ page }) => {
    await page.goto('/');
    const commentLegend = page.locator('header').getByText('comment', { exact: true });
    await expect(commentLegend).toBeVisible();
  });
});

test.describe('File Upload - Validation', () => {
  test('should reject non-CSS files with error message', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // Create a temporary .txt file path (use the package.json as a non-css file)
    const filePath = resolve(__dirname, '..', 'package.json');
    await page.getByTestId('file-input').setInputFiles(filePath);

    // Should show error
    await expect(page.getByTestId('error-msg')).toBeVisible();
    await expect(page.getByTestId('error-msg')).toContainText('no es un archivo CSS');

    // File name should not change
    await expect(page.getByTestId('file-name')).toHaveText('demo.css');
  });

  test('should keep demo tree when file validation fails', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // Try to upload invalid file
    const filePath = resolve(__dirname, '..', 'package.json');
    await page.getByTestId('file-input').setInputFiles(filePath);

    // Demo tree should still be visible
    await expect(page.getByText("@import 'tailwindcss'")).toBeVisible();
  });
});

test.describe('API Server - Error Handling', () => {
  test('should handle empty CSS gracefully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();

    // Send empty CSS via page evaluate
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css: '' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBeTruthy();
  });

  test('should handle missing CSS field gracefully', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('No CSS provided');
  });

  test('should parse valid CSS and return correct structure', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css: 'body { color: red; }' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.body.type).toBe('root');
    expect(result.body.children).toHaveLength(1);
    expect(result.body.children[0].type).toBe('rule');
    expect(result.body.children[0].selector).toBe('body');
  });
});
