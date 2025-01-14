// to run ts-node testGenerator.ts
import * as fs from 'fs';
import * as path from 'path';

interface Snippet {
  prefix: string;
  body: string[];
  description: string;
  scope?: string;
}

interface SnippetFile {
  [key: string]: Snippet;
}

function generateTestFile(snippets: SnippetFile, outputPath: string) {
  let testContent = `
import { test, expect } from '@playwright/test';

// Auto-generated test file - Do not modify directly

async function insertSnippet(page, prefix: string) {
  await page.keyboard.type(prefix);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
}

test.describe('VS Code Snippets', () => {
  test.beforeEach(async ({ page }) => {
    // Set up new file based on snippet scope
    await page.goto('vscode://file/test.html');
    await page.waitForLoadState('domcontentloaded');
  });
`;

  // Generate a test for each snippet
  Object.entries(snippets).forEach(([name, snippet]) => {
    // Count placeholders in the snippet body
    const placeholders = snippet.body.join('\n').match(/\${\d+:/g)?.length || 0;

    testContent += `
  test('${name} snippet - ${snippet.prefix}', async ({ page }) => {
    await insertSnippet(page, '${snippet.prefix}');
    
    // Verify basic structure
    const content = await page.content();
    ${generateContentChecks(snippet.body)}
    
    // Test tabstops
    ${generateTabStopTests(placeholders)}
    
    // Verify final structure
    const finalContent = await page.content();
    expect(finalContent).toBeTruthy();
  });
`;
  });

  testContent += `
});
`;

  fs.writeFileSync(outputPath, testContent);
}

function generateContentChecks(body: string[]): string {
  return body
    .filter(line => line.trim())
    .map(line => {
      // Remove placeholders for the check
      const cleanLine = line.replace(/\${\d+:([^}]*)}/g, '$1');
      return `expect(content).toContain(\`${cleanLine.trim()}\`);`;
    })
    .join('\n    ');
}

function generateTabStopTests(placeholderCount: number): string {
  if (placeholderCount === 0) return '';

  return `
    // Test ${placeholderCount} placeholders
    ${Array.from({ length: placeholderCount }, (_, i) => `
    await page.keyboard.type('test-content-${i + 1}');
    await page.keyboard.press('Tab');`).join('')}`;
}

// Example usage
const snippetsPath = './snippets.code-snippets';
const outputPath = './tests/snippets.spec.ts';

const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
generateTestFile(snippets, outputPath);