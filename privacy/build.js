#!/usr/bin/env node

/**
 * Per-app Privacy Policy build script
 *
 * Renders privacy/generated/<slug>.html from the `privacy` block of eula/configs/<slug>.json.
 * Fixed wording lives in clauses.js (from the iubenda privacy-policy.html in this repo); the
 * config supplies only the app's facts.
 *
 * Usage:
 *   node privacy/build.js              # Build every config that has a privacy block
 *   node privacy/build.js bin-rota     # Build one app
 *
 * Environment (used by tests):
 *   PRIVACY_CONFIGS_DIR  where <slug>.json is read from (default eula/configs)
 *   PRIVACY_OUT_DIR      where <slug>.html is written (default privacy/generated)
 */

const fs = require('fs');
const path = require('path');
const C = require('./clauses');

const ROOT = path.join(__dirname, '..');
const CONFIGS_DIR = process.env.PRIVACY_CONFIGS_DIR || path.join(ROOT, 'eula', 'configs');
const OUT_DIR = process.env.PRIVACY_OUT_DIR || path.join(__dirname, 'generated');

const DATA_FIELDS = ['type', 'purpose', 'lawful_basis', 'storage', 'retention'];
const PROCESSOR_FIELDS = ['name', 'purpose', 'location'];
const SERVICE_FIELDS = ['name', 'purpose', 'data_sent'];
const PERMISSION_FIELDS = ['name', 'reason'];
const ADVERTISING_FIELDS = ['provider', 'withdraw_consent'];
const ICO_COMPLAINT_URL = 'https://ico.org.uk/make-a-complaint/';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const isBlank = (value) => typeof value !== 'string' || value.trim() === '';

function requireString(obj, field, where) {
  if (!obj || isBlank(obj[field])) {
    throw new Error(`${where}.${field} is required`);
  }
}

function requireItems(list, fields, where) {
  if (list === undefined) return;
  if (!Array.isArray(list)) throw new Error(`${where} must be a list`);
  list.forEach((item, i) => fields.forEach((f) => requireString(item, f, `${where}[${i}]`)));
}

function validatePrivacyConfig(config) {
  const privacy = config && config.privacy;
  if (!privacy || typeof privacy !== 'object') {
    throw new Error('privacy block is required');
  }
  requireString(config.app, 'name', 'app');
  requireString(config.company, 'name', 'company');
  requireString(config, 'last_updated', 'config');
  requireString(privacy, 'contact_email', 'privacy');
  if (!Array.isArray(privacy.data) || privacy.data.length === 0) {
    throw new Error('privacy.data must list at least one data item');
  }
  requireItems(privacy.data, DATA_FIELDS, 'privacy.data');
  requireItems(privacy.processors, PROCESSOR_FIELDS, 'privacy.processors');
  requireItems(privacy.third_party_services, SERVICE_FIELDS, 'privacy.third_party_services');
  requireItems(privacy.permissions, PERMISSION_FIELDS, 'privacy.permissions');
  if (privacy.advertising !== undefined) {
    ADVERTISING_FIELDS.forEach((f) => requireString(privacy.advertising, f, 'privacy.advertising'));
  }
  return config;
}

const link = (url, text) => `<a href="${escapeHtml(url)}">${escapeHtml(text || url)}</a>`;
const mailto = (email) => link(`mailto:${email}`, email);
const section = (title, body) => `<h2>${escapeHtml(title)}</h2>\n${body}`;
const para = (text) => `<p>${text}</p>`;
const list = (items) => `<ul>\n${items.map((i) => `  <li>${i}</li>`).join('\n')}\n</ul>`;

function controllerSection(config) {
  const { company, privacy } = config;
  const tradingAs = company.trading_as ? `, trading as ${escapeHtml(company.trading_as)}` : '';
  const location = company.location ? `, ${escapeHtml(company.location)}` : '';
  return section(
    'Owner and Data Controller',
    para(`${escapeHtml(company.name)}${tradingAs}${location}.`) +
      '\n' +
      para(`Owner contact email: ${mailto(privacy.contact_email)}`) +
      '\n' +
      para(
        `This policy covers the ${escapeHtml(config.app.name)} app ("this Application"). ` +
          'In this policy "Users" means the people who use it.'
      )
  );
}

function summarySection(privacy) {
  if (!Array.isArray(privacy.summary) || privacy.summary.length === 0) return '';
  return section('In short', list(privacy.summary.map(escapeHtml)));
}

function dataSection(privacy) {
  const rows = privacy.data
    .map(
      (d) =>
        `  <tr><td>${DATA_FIELDS.map((f) => escapeHtml(d[f])).join('</td><td>')}</td></tr>`
    )
    .join('\n');
  const table =
    '<table>\n  <tr><th>Data</th><th>Purpose</th><th>Legal basis</th><th>Place of processing</th><th>Retention time</th></tr>\n' +
    `${rows}\n</table>`;
  return section('Types of Data collected and how they are processed', table + '\n' + para(C.PROVISION_OF_DATA) + '\n' + para(C.THIRD_PARTY_DATA));
}

function processingSection() {
  return section(
    'Mode and place of processing the Data',
    para(C.METHODS_OF_PROCESSING) + '\n' + para(C.RETENTION)
  );
}

function legalBasisSection() {
  return section(
    'Legal basis of processing',
    para(C.LEGAL_BASIS_INTRO) + '\n' + list(C.LEGAL_BASES) + '\n' + para(C.LEGAL_BASIS_OUTRO)
  );
}

function healthSection(config) {
  if (!config.features || !config.features.health_data) return '';
  return section(
    'Health data',
    para(
      'Health information is special category data under Article 9 of the UK GDPR. ' +
        'We only process it with your explicit consent, which you can withdraw at any time ' +
        'by deleting the data or contacting us.'
    )
  );
}

function permissionsSection(privacy) {
  if (!Array.isArray(privacy.permissions) || privacy.permissions.length === 0) return '';
  const items = privacy.permissions.map(
    (p) => `<strong>${escapeHtml(p.name)}</strong>: ${escapeHtml(p.reason)}`
  );
  return section(
    'Device permissions for Personal Data access',
    para(C.DEVICE_PERMISSIONS) + '\n' + list(items)
  );
}

function servicesSection(privacy) {
  const services = privacy.third_party_services || [];
  if (services.length === 0) return '';
  const items = services.map((s) => {
    const policy = s.policy_url ? ` (${link(s.policy_url, 'their privacy policy')})` : '';
    const where = s.location ? ` Location: ${escapeHtml(s.location)}.` : '';
    return (
      `<strong>${escapeHtml(s.name)}</strong>: ${escapeHtml(s.purpose)}. ` +
      `What it receives: ${escapeHtml(s.data_sent)}.${where}${policy}`
    );
  });
  return section(
    'Services the app contacts',
    para(
      'This Application connects directly to these services. They are not processors of the Owner; ' +
        'their own privacy policies apply to what they receive. ' +
        C.SYSTEM_LOGS
    ) +
      '\n' +
      list(items)
  );
}

function processorsSection(privacy) {
  const processors = privacy.processors || [];
  if (processors.length === 0) {
    return section('Who we share data with', para('The Owner does not use any Data Processors for this Application.'));
  }
  const items = processors.map((p) => {
    const policy = p.policy_url ? ` (${link(p.policy_url, 'privacy policy')})` : '';
    return `<strong>${escapeHtml(p.name)}</strong>: ${escapeHtml(p.purpose)}. Location: ${escapeHtml(p.location)}.${policy}`;
  });
  return section(
    'Who we share data with',
    para('These Data Processors handle Data on behalf of the Owner:') + '\n' + list(items)
  );
}

function analyticsSection(privacy) {
  if (privacy.analytics !== false) return '';
  const text = privacy.advertising
    ? 'This Application contains no analytics or crash-reporting services. Advertising is described below.'
    : 'This Application contains no analytics, advertising, crash-reporting or tracking services, and uses no Trackers.';
  return section(privacy.advertising ? 'Analytics' : 'Analytics and advertising', para(text));
}

function advertisingSection(privacy) {
  const ads = privacy.advertising;
  if (!ads) return '';
  const policy = ads.policy_url ? ` (${link(ads.policy_url, 'privacy policy')})` : '';
  return section(
    'Advertising',
    para(C.ADVERTISING) +
      '\n' +
      para(`Ad service: <strong>${escapeHtml(ads.provider)}</strong>${policy}.`) +
      '\n' +
      para(`<strong>Withdrawing consent:</strong> ${escapeHtml(ads.withdraw_consent)}`) +
      '\n' +
      para(C.ADVERTISING_ID_RESET)
  );
}

function automatedDecisionsSection(privacy) {
  if (privacy.automated_decisions !== false) return '';
  return section('Automated decision-making', para(C.NO_AUTOMATED_DECISIONS));
}

function paymentsSection(config) {
  const features = config.features || {};
  if (!features.subscriptions && !features.in_app_purchases) return '';
  const title = features.subscriptions ? 'Payments and Subscriptions' : 'Payments';
  return section(title, para(C.HANDLING_PAYMENTS));
}

function notesSection(title, text) {
  if (isBlank(text)) return '';
  return section(title, para(escapeHtml(text)));
}

function deletionSection(privacy) {
  const parts = [];
  if (!isBlank(privacy.deletion_note)) parts.push(para(escapeHtml(privacy.deletion_note)));
  const route = privacy.deletion_url
    ? `To delete your data, go to ${link(privacy.deletion_url)}, or email ${mailto(privacy.contact_email)}.`
    : `To ask us to delete any data we hold about you, email ${mailto(privacy.contact_email)}.`;
  parts.push(para(route));
  return section('Deleting your data', parts.join('\n'));
}

function rightsSection(privacy) {
  return section(
    'The rights of Users under the UK GDPR',
    para(C.RIGHTS_INTRO) +
      '\n' +
      list(C.RIGHTS) +
      '\n' +
      para(`${C.EXERCISE_RIGHTS} Contact: ${mailto(privacy.contact_email)}.`) +
      '\n' +
      para(
        `In the UK the competent authority is the Information Commissioner's Office: ${link(ICO_COMPLAINT_URL)}.`
      )
  );
}

function childrenSection(config) {
  const age = config.features && config.features.minimum_age;
  if (!age) return '';
  return section(
    'Children',
    para(`The app is not intended for children under ${escapeHtml(age)}.`)
  );
}

function changesSection() {
  return section('Changes to this privacy policy', para(C.CHANGES)) +
    '\n\n' +
    section('Information not contained in this policy', para(C.NOT_CONTAINED));
}

function renderPrivacy(config) {
  validatePrivacyConfig(config);
  const { privacy } = config;
  const appName = escapeHtml(config.app.name);
  const body = [
    controllerSection(config),
    summarySection(privacy),
    dataSection(privacy),
    processingSection(),
    legalBasisSection(),
    healthSection(config),
    permissionsSection(privacy),
    servicesSection(privacy),
    processorsSection(privacy),
    analyticsSection(privacy),
    advertisingSection(privacy),
    automatedDecisionsSection(privacy),
    paymentsSection(config),
    notesSection('Backups', privacy.backups),
    deletionSection(privacy),
    rightsSection(privacy),
    childrenSection(config),
    changesSection(),
  ]
    .filter(Boolean)
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - ${appName}</title>
  <meta name="description" content="Privacy Policy for the ${appName} app">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; background: #fff; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    h1 { color: #1a1a2e; }
    h2 { color: #16213e; margin-top: 2.5rem; border-bottom: 1px solid #e9ecef; padding-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.875rem; }
    table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; }
    th, td { border: 1px solid #e9ecef; padding: 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f8f9fa; }
    a { color: #0f3460; }
  </style>
</head>
<body>
<div class="container">
<header>
  <h1>Privacy Policy</h1>
  <p>${appName}</p>
  <p class="meta">Last updated: ${escapeHtml(config.last_updated)}</p>
</header>

${body}
</div>
</body>
</html>
`;
}

function readConfig(slug) {
  return JSON.parse(fs.readFileSync(path.join(CONFIGS_DIR, `${slug}.json`), 'utf8'));
}

function main(args) {
  const slugs = args.length
    ? args
    : fs
        .readdirSync(CONFIGS_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
        .filter((slug) => readConfig(slug).privacy);

  // Render everything first so one bad config publishes nothing.
  const pages = slugs.map((slug) => {
    try {
      return { slug, html: renderPrivacy(readConfig(slug)) };
    } catch (err) {
      throw new Error(`${slug}: ${err.message}`);
    }
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const { slug, html } of pages) {
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html);
    console.log(`Built ${path.join(OUT_DIR, `${slug}.html`)}`);
  }
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { renderPrivacy, validatePrivacyConfig, escapeHtml };
