import { test, expect } from '@playwright/test';

test.describe('CSS AST Viewer - Page Load', () => {
  test('should display the page title and subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('CSS AST Viewer');
    await expect(page.getByText('PostCSS Parse Tree')).toBeVisible();
  });

  test('should show the Root node', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Root', { exact: true })).toBeVisible();
  });

  test('should show the detail panel with hint text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Node Details')).toBeVisible();
    await expect(page.getByText('Click a node to see its details')).toBeVisible();
  });
});

test.describe('CSS AST Viewer - Tree Structure', () => {
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
    // :root is at depth 1, starts expanded, so its declarations are visible
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first()).toBeVisible();
  });

  test('should collapse :root on double click hiding declarations', async ({ page }) => {
    await page.goto('/');
    // :root starts expanded — verify a declaration is visible
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first()).toBeVisible();
    // Double click to collapse
    await page.getByText(':root').dblclick();
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' })).toHaveCount(0);
  });

  test('should re-expand :root on second double click', async ({ page }) => {
    await page.goto('/');
    const rootLabel = page.locator('span').filter({ hasText: ':root' }).first();
    // Collapse
    await rootLabel.dblclick();
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' })).toHaveCount(0);
    // Re-expand
    await rootLabel.dblclick();
    await expect(page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first()).toBeVisible();
  });

  test('should show @layer base children by default', async ({ page }) => {
    await page.goto('/');
    // @layer base is at depth 1, starts expanded
    // Its child rules (* and body) should be visible as tree labels
    await expect(page.locator('span').filter({ hasText: /^body$/ }).first()).toBeVisible();
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
    // :root declarations are already visible, click one
    await page.locator('span').filter({ hasText: '--foreground: oklch(0.145 0 0)' }).first().click();
    const detailPanel = page.locator('pre');
    await expect(detailPanel).toContainText('"type": "decl"');
    await expect(detailPanel).toContainText('"prop": "--foreground"');
  });

  test('should update details when selecting a different node', async ({ page }) => {
    await page.goto('/');
    await page.getByText(':root').click();
    await expect(page.locator('pre')).toContainText('"selector": ":root"');
    // Click .dark using exact match
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

test.describe('CSS AST Viewer - Visual Elements', () => {
  test('should have dark background theme', async ({ page }) => {
    await page.goto('/');
    const container = page.locator('#root > div');
    await expect(container).toHaveCSS('background-color', /rgb\(10, 14, 20\)/);
  });

  test('should show child count badges for nodes with children', async ({ page }) => {
    await page.goto('/');
    const counts = page.locator('span').filter({ hasText: /^\d+$/ });
    expect(await counts.count()).toBeGreaterThan(0);
  });

  test('should display guide lines for nested nodes', async ({ page }) => {
    await page.goto('/');
    // Guide lines use Tailwind "relative" parent with absolute-positioned w-px children
    const guideLines = page.locator('.relative > .absolute.w-px');
    expect(await guideLines.count()).toBeGreaterThan(0);
  });
});

test.describe('CSS AST Viewer - Sidebar Sticky Behavior', () => {
  test('should keep sidebar visible after scrolling the tree panel down', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside');
    const detailsHeader = page.getByText('Node Details');

    // Verify sidebar is visible initially
    await expect(sidebar).toBeVisible();
    await expect(detailsHeader).toBeInViewport();

    // Get sidebar position before scroll
    const boundsBefore = await sidebar.boundingBox();

    // Scroll the tree panel down significantly
    const treePanel = page.locator('.flex-1.overflow-auto');
    await treePanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);

    // Sidebar and its header must still be visible and in viewport
    await expect(sidebar).toBeVisible();
    await expect(detailsHeader).toBeInViewport();

    // Sidebar top position should not have moved
    const boundsAfter = await sidebar.boundingBox();
    expect(boundsAfter.y).toBe(boundsBefore.y);
  });

  test('should keep sidebar details visible after scrolling tree to bottom and selecting a node', async ({ page }) => {
    await page.goto('/');

    // Click a node first so details are shown
    await page.getByText("@import 'tailwindcss'").click();
    await expect(page.locator('pre')).toContainText('"type": "atrule"');

    // Scroll tree panel to bottom
    const treePanel = page.locator('.flex-1.overflow-auto');
    await treePanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);

    // Detail panel content should still be in viewport
    await expect(page.getByText('Node Details')).toBeInViewport();
    await expect(page.locator('aside')).toBeInViewport();
  });

  test('should keep sidebar fixed while scrolling tree multiple times', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside');
    const treePanel = page.locator('.flex-1.overflow-auto');

    // Get initial sidebar position
    const initialBounds = await sidebar.boundingBox();

    // Scroll down
    await treePanel.evaluate(el => el.scrollTop = 500);
    await page.waitForTimeout(200);
    let bounds = await sidebar.boundingBox();
    expect(bounds.y).toBe(initialBounds.y);

    // Scroll further down
    await treePanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(200);
    bounds = await sidebar.boundingBox();
    expect(bounds.y).toBe(initialBounds.y);

    // Scroll back up
    await treePanel.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(200);
    bounds = await sidebar.boundingBox();
    expect(bounds.y).toBe(initialBounds.y);

    // Sidebar always in viewport
    await expect(page.getByText('Node Details')).toBeInViewport();
  });
});
