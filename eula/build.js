#!/usr/bin/env node

/**
 * EULA Build Script
 *
 * Generates HTML EULA documents from the master template and app-specific configs.
 *
 * Usage:
 *   node build.js                    # Build all configs
 *   node build.js uc-tracker         # Build specific config
 *   node build.js --list             # List available configs
 */

const fs = require('fs');
const path = require('path');

// Paths
const TEMPLATE_PATH = path.join(__dirname, 'EULA-MASTER.md');
const CONFIGS_DIR = path.join(__dirname, 'configs');
const GENERATED_DIR = path.join(__dirname, 'generated');

// Simple Handlebars-like template engine
function compileTemplate(template, data) {
  let result = template;

  // Process conditionals: {{#if feature}}...{{/if}}
  // Handle nested conditionals by processing from innermost to outermost
  let maxIterations = 100;
  let iteration = 0;

  while (iteration < maxIterations) {
    const ifRegex = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/;
    const match = result.match(ifRegex);

    if (!match) break;

    const [fullMatch, condition, content] = match;
    const conditionValue = getNestedValue(data, condition);

    // Handle {{else}} within the block
    const elseParts = content.split('{{else}}');
    const ifContent = elseParts[0];
    const elseContent = elseParts[1] || '';

    const replacement = conditionValue ? ifContent : elseContent;
    result = result.replace(fullMatch, replacement);
    iteration++;
  }

  // Process simple variables: {{variable}} or {{object.property}}
  result = result.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined ? value : match;
  });

  return result;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Convert Markdown to HTML
function markdownToHtml(markdown) {
  let html = markdown;

  // Escape HTML entities in code blocks first (preserve code)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 id="$1">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Clean up header IDs (make them URL-friendly)
  html = html.replace(/id="([^"]+)"/g, (match, id) => {
    const cleanId = id.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return `id="${cleanId}"`;
  });

  // Bold and Italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');

  // Ordered lists
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');

  // Unordered lists
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> elements in <ul> or <ol>
  html = html.replace(/(<li>[\s\S]*?<\/li>(\n|$))+/g, (match) => {
    // Check if it looks like an ordered list (starts with numbers in original)
    return `<ul>\n${match}</ul>\n`;
  });

  // Paragraphs - wrap lines that aren't already wrapped
  const lines = html.split('\n');
  const processedLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('<ul>') || line.startsWith('<ol>')) {
      inList = true;
      processedLines.push(line);
    } else if (line.startsWith('</ul>') || line.startsWith('</ol>')) {
      inList = false;
      processedLines.push(line);
    } else if (line.startsWith('<') || line === '' || inList) {
      processedLines.push(line);
    } else {
      processedLines.push(`<p>${line}</p>`);
    }
  }

  html = processedLines.join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Clean up multiple newlines
  html = html.replace(/\n{3,}/g, '\n\n');

  return html;
}

// Generate HTML document
function generateHtml(content, config) {
  const appName = config.app.name;
  const lastUpdated = config.last_updated;

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Language" content="en-GB">
  <meta name="robots" content="noindex, follow">

  <title>End User Licence Agreement - ${appName}</title>

  <meta name="description" content="End User Licence Agreement for ${appName} mobile application">
  <meta property="og:title" content="EULA - ${appName}">
  <meta property="og:description" content="End User Licence Agreement for ${appName}">
  <meta property="og:type" content="website">

  <style>
    :root {
      --color-primary: #1a1a2e;
      --color-secondary: #16213e;
      --color-accent: #0f3460;
      --color-text: #333;
      --color-text-light: #666;
      --color-bg: #fff;
      --color-bg-alt: #f8f9fa;
      --color-border: #e9ecef;
      --max-width: 800px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: var(--color-text);
      background-color: var(--color-bg);
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--color-border);
    }

    h1 {
      font-size: 2rem;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    h1 + p {
      font-size: 1.25rem;
      color: var(--color-text-light);
      margin: 0;
    }

    .meta {
      font-size: 0.875rem;
      color: var(--color-text-light);
      margin-top: 1rem;
    }

    h2 {
      font-size: 1.5rem;
      color: var(--color-secondary);
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--color-border);
    }

    h3 {
      font-size: 1.25rem;
      color: var(--color-accent);
      margin-top: 2rem;
      margin-bottom: 0.75rem;
    }

    h4 {
      font-size: 1.1rem;
      color: var(--color-text);
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }

    p {
      margin-bottom: 1rem;
    }

    ul, ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    a {
      color: var(--color-accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    strong {
      font-weight: 600;
    }

    code {
      background-color: var(--color-bg-alt);
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 0.875em;
    }

    hr {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 2rem 0;
    }

    .highlight {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
    }

    .important {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
    }

    footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid var(--color-border);
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-text-light);
    }

    @media (max-width: 600px) {
      .container {
        padding: 1rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      h2 {
        font-size: 1.25rem;
      }
    }

    @media print {
      body {
        font-size: 12pt;
      }

      .container {
        max-width: none;
        padding: 0;
      }

      a {
        color: var(--color-text);
      }

      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}

    <footer>
      <p>&copy; ${new Date().getFullYear()} ${config.company.trading_as || config.company.name}. All rights reserved.</p>
      <p>Last updated: ${lastUpdated}</p>
    </footer>
  </div>
</body>
</html>`;
}

// Build a single config
function buildConfig(configName) {
  const configPath = path.join(CONFIGS_DIR, `${configName}.json`);

  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file not found: ${configPath}`);
    return false;
  }

  console.log(`Building EULA for: ${configName}`);

  // Read template and config
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Compile template with config data
  const compiledMarkdown = compileTemplate(template, config);

  // Convert to HTML
  const htmlContent = markdownToHtml(compiledMarkdown);

  // Generate full HTML document
  const fullHtml = generateHtml(htmlContent, config);

  // Ensure generated directory exists
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  // Write output file
  const outputPath = path.join(GENERATED_DIR, `${configName}-eula.html`);
  fs.writeFileSync(outputPath, fullHtml);

  console.log(`  Generated: ${outputPath}`);
  return true;
}

// List available configs
function listConfigs() {
  const files = fs.readdirSync(CONFIGS_DIR);
  const configs = files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  console.log('Available configs:');
  configs.forEach(c => console.log(`  - ${c}`));
  return configs;
}

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    listConfigs();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
EULA Build Script

Usage:
  node build.js                    Build all configs
  node build.js <config-name>      Build specific config
  node build.js --list             List available configs
  node build.js --help             Show this help

Examples:
  node build.js uc-tracker
  node build.js upf-scanner strong-clone
    `);
    return;
  }

  let configs;

  if (args.length > 0) {
    configs = args;
  } else {
    // Build all configs
    const files = fs.readdirSync(CONFIGS_DIR);
    configs = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  console.log('EULA Build Script');
  console.log('=================\n');

  let success = 0;
  let failed = 0;

  for (const config of configs) {
    if (buildConfig(config)) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\nBuild complete: ${success} succeeded, ${failed} failed`);
}

main();
