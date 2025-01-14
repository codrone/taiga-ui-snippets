import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as os from 'os';

const workspaceConfig = {
    // Replace with your actual workspace path
    workspacePath: path.join(os.homedir(), 'Downloads', 'test'),
    // File to test snippets in
    testFilePath: 'src/app/app.component.html'
};

// Helper function to load snippets
async function loadSnippets() {
    const fs = require('fs');
    const snippets = JSON.parse(fs.readFileSync('./snippets.code-snippets', 'utf8'));
    return snippets;
}

// Helper to insert snippet
async function insertSnippet(page, prefix: string) {
    try {
        await page.keyboard.type(prefix);
        await page.keyboard.press('Tab');
        // Wait for snippet to be inserted
        await page.waitForTimeout(500);
    } catch (error) {
        console.error(`Error inserting snippet: ${error.message}`);
        throw error;
    }
}

test.describe('Taiga UI Snippets', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the existing test file
        const testFilePath = path.join(workspaceConfig.workspacePath, workspaceConfig.testFilePath);
        await page.goto(`vscode://file/${encodeURIComponent(testFilePath)}`);
        await page.waitForLoadState('domcontentloaded');
    });

    test('Accordion snippet expands correctly', async ({ page }) => {
        // Insert the accordion snippet
        await insertSnippet(page, 't-accordion-basic');

        // Verify the basic structure
        const content = await page.content();
        expect(content).toContain('<tui-accordion-item');
        expect(content).toContain('tuiAccordionItemContent');

        // Check placeholders are replaced correctly
        await page.keyboard.type('expanded');  // For $1
        expect(await page.content()).toContain('expanded');

        // Test tab stops
        for (let i = 2; i <= 7; i++) {
            await page.keyboard.press('Tab');
            await page.keyboard.type(`content${i}`);
        }
    });

    test('Snippet tabstops work in order', async ({ page }) => {
        await insertSnippet(page, 't-accordion-basic');

        // Map of expected tabstop positions
        const tabStops = [
            { position: 1, content: 'First' },
            { position: 2, content: 'Second' },
            { position: 3, content: 'Third' },
            // ... add more as needed
        ];

        for (const stop of tabStops) {
            await page.keyboard.type(stop.content);
            await page.keyboard.press('Tab');
            const content = await page.content();
            expect(content).toContain(stop.content);
        }
    });

    // Test for HTML validation
    test('Generated HTML is valid', async ({ page }) => {
        await insertSnippet(page, 't-accordion-basic');
        const content = await page.content();

        // Use a HTML validator (you'll need to add one as a dependency)
        const validator = require('html-validator');
        const result = await validator({ data: content });
        expect(result.valid).toBeTruthy();
    });
});
