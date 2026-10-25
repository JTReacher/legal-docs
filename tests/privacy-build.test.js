// Assumption: privacy/build.js honours two environment variables so the CLI can be
// tested without touching real files: PRIVACY_CONFIGS_DIR (where <slug>.json is read
// from, default eula/configs) and PRIVACY_OUT_DIR (where <slug>.html is written,
// default privacy/generated). The module is loaded lazily so every test fails on its
// own while privacy/build.js does not yet exist.
// Note: criterion 10 checks the existing key `privacy_policy_url` in eula/configs/*.json.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const BUILD_JS = path.join(ROOT, 'privacy', 'build.js');
const REAL_CONFIGS_DIR = path.join(ROOT, 'eula', 'configs');
const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-app.json'), 'utf8')
);

const load = () => require(BUILD_JS);

// assert.throws matcher: an Error naming `field`, and not a failure to load the module.
const namesField = (field) => (err) => {
  assert.ok(err instanceof Error);
  assert.notStrictEqual(err.code, 'MODULE_NOT_FOUND', 'module failed to load');
  assert.ok(err.message.includes(field), `message should name "${field}": ${err.message}`);
  return true;
};
const clone = (obj) => JSON.parse(JSON.stringify(obj));

function withConfig(mutate) {
  const config = clone(FIXTURE);
  if (mutate) mutate(config);
  return config;
}

function render(mutate) {
  return load().renderPrivacy(withConfig(mutate));
}

function tmpDirs() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-build-'));
  const configs = path.join(base, 'configs');
  const out = path.join(base, 'out');
  fs.mkdirSync(configs);
  fs.mkdirSync(out);
  return { base, configs, out };
}

function runCli(dirs, args) {
  return spawnSync(process.execPath, [BUILD_JS, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      PRIVACY_CONFIGS_DIR: dirs.configs,
      PRIVACY_OUT_DIR: dirs.out,
    },
  });
}

function writeConfig(dirs, slug, config) {
  fs.writeFileSync(path.join(dirs.configs, `${slug}.json`), JSON.stringify(config, null, 2));
}

// Returns true if some <p> or <li> block contains every given pattern.
function blockContainsAll(html, patterns) {
  const blocks = html.match(/<(p|li)\b[^>]*>[\s\S]*?<\/\1>/gi) || [];
  return blocks.some((b) => patterns.every((p) => (p instanceof RegExp ? p.test(b) : b.includes(p))));
}

// Test: running the CLI with a slug writes <out>/<slug>.html
// Pins: the CLI builds one app's policy to the output directory under its slug
// Green when: exit code is 0 and <out>/sample-app.html exists and is non-empty HTML
// Benefit: publishing works at the predictable URL each app's privacy_policy_url points to
test('CLI with a slug writes <out>/<slug>.html', () => {
  const dirs = tmpDirs();
  writeConfig(dirs, 'sample-app', FIXTURE);

  const result = runCli(dirs, ['sample-app']);

  assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`);
  const file = path.join(dirs.out, 'sample-app.html');
  assert.ok(fs.existsSync(file), 'expected sample-app.html to be written');
  assert.match(fs.readFileSync(file, 'utf8'), /<html/i);
});

// Test: output names the app, company, trading name, contact email and last-updated date
// Pins: the policy identifies who is responsible and when it was last changed
// Green when: all five config values appear in the rendered HTML
// Benefit: users and regulators can tell who the data controller is and how current the policy is
test('output names app, company, trading name, contact email and last_updated', () => {
  const html = render();

  assert.ok(html.includes(FIXTURE.app.name), 'app.name');
  assert.ok(html.includes(FIXTURE.company.name), 'company.name');
  assert.ok(html.includes(FIXTURE.company.trading_as), 'company.trading_as');
  assert.ok(html.includes(FIXTURE.privacy.contact_email), 'privacy.contact_email');
  assert.ok(html.includes(FIXTURE.last_updated), 'last_updated');
});

// Test: every data item's five fields appear in the output
// Pins: the policy discloses all data collected, with purpose, basis, storage and retention
// Green when: type, purpose, lawful_basis, storage and retention of every data item are in the HTML
// Benefit: UK GDPR transparency; nothing declared in config is silently dropped
test('every data item type, purpose, lawful_basis, storage and retention appear', () => {
  const html = render();

  for (const item of FIXTURE.privacy.data) {
    for (const key of ['type', 'purpose', 'lawful_basis', 'storage', 'retention']) {
      assert.ok(html.includes(item[key]), `data item "${item.type}" missing ${key}: ${item[key]}`);
    }
  }
});

// Test: every processor's name, purpose and location appear in the output
// Pins: third-party processors are disclosed in full
// Green when: name, purpose and location of every processor are in the HTML
// Benefit: users can see who else handles their data and where it is processed
test('every processor name, purpose and location appear', () => {
  const html = render();

  for (const proc of FIXTURE.privacy.processors) {
    for (const key of ['name', 'purpose', 'location']) {
      assert.ok(html.includes(proc[key]), `processor "${proc.name}" missing ${key}: ${proc[key]}`);
    }
  }
});

// Test: health_data true adds Article 9 and explicit consent wording
// Pins: special category data is flagged with its lawful condition
// Green when: output contains "Article 9" and "explicit consent"
// Benefit: apps handling health data state the correct UK GDPR basis
test('health_data true -> output contains "Article 9" and "explicit consent"', () => {
  const html = render((c) => {
    c.features.health_data = true;
  });

  assert.ok(html.includes('Article 9'), 'missing "Article 9"');
  assert.ok(/explicit consent/i.test(html), 'missing "explicit consent"');
});

// Test: health_data false omits Article 9 and explicit consent wording
// Pins: special category language only appears for apps that process health data
// Green when: output contains neither "Article 9" nor "explicit consent"
// Benefit: a non-health app's policy does not make false claims about its data
test('health_data false -> output has neither "Article 9" nor "explicit consent"', () => {
  const html = render((c) => {
    c.features.health_data = false;
    c.privacy.data = c.privacy.data.map((d) => ({ ...d, lawful_basis: 'Contract' }));
  });

  assert.ok(!html.includes('Article 9'), 'unexpected "Article 9"');
  assert.ok(!/explicit consent/i.test(html), 'unexpected "explicit consent"');
});

// Test: subscriptions true adds a payments section naming Google Play and the App Store
// Pins: paid apps explain who handles billing
// Green when: output has a Payments/Subscriptions heading and mentions "Google Play" and "App Store"
// Benefit: users know card details are handled by the store, not the developer
test('subscriptions true -> payments section mentions Google Play and App Store billing', () => {
  const html = render((c) => {
    c.features.subscriptions = true;
  });

  assert.match(html, /<h[1-6][^>]*>[^<]*(Payments|Subscriptions)[^<]*<\/h[1-6]>/i);
  assert.ok(html.includes('Google Play'), 'missing "Google Play"');
  assert.ok(html.includes('App Store'), 'missing "App Store"');
});

// Test: subscriptions false omits the Subscriptions heading
// Pins: free apps do not get a payments section
// Green when: no heading containing "Subscriptions" is in the output
// Benefit: the policy only describes things the app actually does
test('subscriptions false -> no "Subscriptions" heading', () => {
  const html = render((c) => {
    c.features.subscriptions = false;
  });

  assert.doesNotMatch(html, /<h[1-6][^>]*>[^<]*Subscriptions/i);
});

// Test: the five data subject rights are always listed
// Pins: access, rectification, erasure, portability and objection are stated for every app
// Green when: output mentions each of the five rights
// Benefit: UK GDPR requires users to be told their rights
test('always lists access, rectification, erasure, portability and objection rights', () => {
  const html = render();

  for (const right of ['access', 'rectification', 'erasure', 'portability', 'objection']) {
    assert.ok(new RegExp(right, 'i').test(html), `missing right: ${right}`);
  }
});

// Test: the ICO complaint link is always present
// Pins: users are told how to complain to the regulator
// Green when: output contains https://ico.org.uk/make-a-complaint/
// Benefit: UK GDPR requires users to be told of their right to complain
test('always links to the ICO complaint page', () => {
  assert.ok(render().includes('https://ico.org.uk/make-a-complaint/'));
});

// Test: with deletion_url set, the delete instruction includes that URL
// Pins: users are sent to the app's own deletion page when one exists
// Green when: a paragraph or list item mentions deleting and contains deletion_url
// Benefit: users can find the fastest way to erase their data
test('delete instruction includes deletion_url when given', () => {
  const html = render();

  assert.ok(
    blockContainsAll(html, [/delet/i, FIXTURE.privacy.deletion_url]),
    'no delete instruction containing deletion_url'
  );
});

// Test: without deletion_url, the delete instruction gives the contact email
// Pins: users always have a route to delete their data
// Green when: a paragraph or list item mentions deleting and contains contact_email, and no deletion_url appears
// Benefit: apps without a self-service page still honour erasure requests
test('delete instruction falls back to contact email when deletion_url is absent', () => {
  const html = render((c) => {
    delete c.privacy.deletion_url;
  });

  assert.ok(
    blockContainsAll(html, [/delet/i, FIXTURE.privacy.contact_email]),
    'no delete instruction containing contact_email'
  );
  assert.ok(!html.includes('delete-my-data'), 'deletion URL should not appear');
});

// Test: the output states the configured minimum age
// Pins: the age restriction in the policy follows features.minimum_age
// Green when: for minimum_age 13 and 16, the HTML mentions that age next to age wording
// Benefit: the policy never states a different age from the one the app enforces
for (const age of [13, 16]) {
  test(`states minimum age ${age}`, () => {
    const html = render((c) => {
      c.features.minimum_age = age;
    });

    assert.match(html, new RegExp(`(aged?|under|at least|minimum|over)[^<]{0,80}\\b${age}\\b`, 'i'));
  });
}

// Test: validatePrivacyConfig rejects a config with no privacy block
// Pins: a missing privacy block is an error that names "privacy"
// Green when: it throws an Error whose message contains "privacy"
// Benefit: a config that cannot produce a policy fails loudly at build time
test('validatePrivacyConfig throws naming privacy when the block is missing', () => {
  const config = withConfig((c) => {
    delete c.privacy;
  });

  assert.throws(() => load().validatePrivacyConfig(config), namesField('privacy'));
});

// Test: validatePrivacyConfig rejects a missing contact_email
// Pins: users must always have a contact address
// Green when: it throws an Error whose message contains "contact_email"
// Benefit: the author sees exactly which field to fix
test('validatePrivacyConfig throws naming contact_email when it is missing', () => {
  const config = withConfig((c) => {
    delete c.privacy.contact_email;
  });

  assert.throws(() => load().validatePrivacyConfig(config), namesField('contact_email'));
});

// Test: validatePrivacyConfig rejects an empty data list
// Pins: a policy must declare at least one data item
// Green when: it throws an Error whose message contains "data"
// Benefit: an app cannot publish a policy claiming to collect nothing by accident
test('validatePrivacyConfig throws naming data when the list is empty', () => {
  const config = withConfig((c) => {
    c.privacy.data = [];
  });

  assert.throws(() => load().validatePrivacyConfig(config), namesField('data'));
});

// Test: validatePrivacyConfig rejects a data item without lawful_basis
// Pins: every declared data item needs a lawful basis
// Green when: it throws an Error whose message contains "lawful_basis"
// Benefit: UK GDPR requires a lawful basis for each processing purpose
test('validatePrivacyConfig throws naming lawful_basis when a data item lacks it', () => {
  const config = withConfig((c) => {
    delete c.privacy.data[0].lawful_basis;
  });

  assert.throws(() => load().validatePrivacyConfig(config), namesField('lawful_basis'));
});

// Test: validatePrivacyConfig accepts a complete config
// Pins: validation does not reject valid input
// Green when: calling it with the sample config does not throw
// Benefit: guards against a validator that rejects everything
test('validatePrivacyConfig accepts a complete config', () => {
  assert.doesNotThrow(() => load().validatePrivacyConfig(clone(FIXTURE)));
});

// Test: the CLI on an invalid config exits non-zero and writes no file
// Pins: a bad config never produces a published policy
// Green when: exit status is not 0, stderr names contact_email and the output directory is empty
// Benefit: CI stops before an incomplete policy is deployed
test('CLI on invalid config exits non-zero and writes no file', () => {
  const dirs = tmpDirs();
  const bad = withConfig((c) => {
    delete c.privacy.contact_email;
  });
  writeConfig(dirs, 'bad-app', bad);

  const result = runCli(dirs, ['bad-app']);

  assert.notStrictEqual(result.status, 0, 'expected non-zero exit');
  assert.match(result.stderr, /contact_email/);
  assert.deepStrictEqual(fs.readdirSync(dirs.out), []);
});

// Test: the CLI with no arguments builds every config that has a privacy block and skips others
// Pins: bulk build covers privacy-enabled apps only
// Green when: exit is 0, out holds a-app.html and b-app.html, and no file exists for the config without privacy
// Benefit: apps not yet migrated do not break the build
test('CLI with no args builds configs with a privacy block and skips the rest', () => {
  const dirs = tmpDirs();
  writeConfig(dirs, 'a-app', FIXTURE);
  writeConfig(dirs, 'b-app', FIXTURE);
  writeConfig(dirs, 'no-privacy-app', withConfig((c) => { delete c.privacy; }));

  const result = runCli(dirs, []);

  assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`);
  assert.deepStrictEqual(fs.readdirSync(dirs.out).sort(), ['a-app.html', 'b-app.html']);
});

// Test: every eula config's privacy_policy_url points at the generated GitHub Pages file for its slug
// Pins: apps link to the per-app policy this repo publishes
// Green when: privacy_policy_url === https://jtreacher.github.io/legal-docs/privacy/generated/<slug>.html for each config
// Benefit: store listings and in-app links never point at a dead host
for (const file of fs.readdirSync(REAL_CONFIGS_DIR).filter((f) => f.endsWith('.json'))) {
  const slug = file.replace(/\.json$/, '');
  test(`eula config ${slug} has the per-app privacy_policy_url`, () => {
    const config = JSON.parse(fs.readFileSync(path.join(REAL_CONFIGS_DIR, file), 'utf8'));

    assert.strictEqual(
      config.privacy_policy_url,
      `https://jtreacher.github.io/legal-docs/privacy/generated/${slug}.html`
    );
  });
}

// Test: the rendered output contains no unrendered template braces
// Pins: every template placeholder is filled for feature-on and feature-off configs
// Green when: output has neither "{{" nor "}}"
// Benefit: users never see raw template syntax in a legal document
test('output has no unrendered {{ or }}', () => {
  const featuresOff = (c) => {
    c.features.health_data = false;
    c.features.subscriptions = false;
    delete c.privacy.deletion_url;
    c.privacy.processors = [];
  };

  for (const html of [render(), render(featuresOff)]) {
    assert.ok(!html.includes('{{'), 'found {{');
    assert.ok(!html.includes('}}'), 'found }}');
  }
});

// Test: config strings are HTML-escaped
// Pins: markup in a data item type is rendered as text, not as a tag
// Green when: a type of "<script>alert(1)</script>" appears as &lt;script&gt; and no raw <script> tag is present
// Benefit: a hostile or careless config value cannot inject script into the published page
test('HTML-escapes config strings', () => {
  const html = render((c) => {
    c.privacy.data[0].type = '<script>alert(1)</script>';
  });

  assert.ok(html.includes('&lt;script&gt;'), 'expected escaped script tag');
  assert.ok(!html.includes('<script>'), 'raw <script> must not appear');
});

// Test: automated_decisions false states that no automated decision-making takes place
// Pins: Article 13(2)(f) disclosure is made when the app makes no automated decisions
// Green when: output mentions "automated decision-making" only when privacy.automated_decisions is false
// Benefit: the policy covers every Article 13 item without claiming it for apps that have not checked
test('automated_decisions false -> states no automated decision-making; absent -> silent', () => {
  const on = render((c) => {
    c.privacy.automated_decisions = false;
  });
  const off = render((c) => {
    delete c.privacy.automated_decisions;
  });

  assert.ok(/no automated decision-making/i.test(on), 'missing automated decision-making statement');
  assert.ok(!/automated decision-making/i.test(off), 'statement should be absent when not configured');
});

// Test: the policy says whether providing data is required
// Pins: Article 13(2)(e) disclosure of whether data is mandatory and what happens if it is withheld
// Green when: output contains the template sentence about Users not being obliged to provide Data
// Benefit: users know they can leave fields out and what they lose by doing so
test('always states whether providing Data is required', () => {
  assert.match(render(), /Users are not obliged to provide/);
});

// Test: a one-time in-app purchase adds a Payments section without a Subscriptions heading
// Pins: one-off unlocks (no subscription) still explain that the store handles payment
// Green when: in_app_purchases true and subscriptions false gives a Payments heading naming Google Play, and no Subscriptions heading
// Benefit: a "Pro unlock" app discloses purchase data without describing renewals it does not have
test('in_app_purchases only -> Payments heading, Google Play named, no Subscriptions heading', () => {
  const html = render((c) => {
    c.features.subscriptions = false;
    c.features.in_app_purchases = true;
  });

  assert.match(html, /<h[1-6][^>]*>[^<]*Payments[^<]*<\/h[1-6]>/i);
  assert.ok(html.includes('Google Play'), 'missing "Google Play"');
  assert.doesNotMatch(html, /<h[1-6][^>]*>[^<]*Subscriptions/i);
});

// Test: an advertising block names the ad network, the advertising ID and how to withdraw consent
// Pins: ad-supported apps disclose AdMob, the advertising identifier and the privacy options route
// Green when: output has an Advertising heading, the provider name, "advertising ID", and the consent withdrawal text from config
// Benefit: Play and UK GDPR both require users to be told about ad tracking and how to opt out
test('advertising block -> names provider, advertising ID and consent withdrawal', () => {
  const html = render((c) => {
    c.privacy.advertising = {
      provider: 'Google AdMob',
      policy_url: 'https://policies.google.com/technologies/ads',
      withdraw_consent: 'Open Settings, then Privacy options, to change or withdraw ad consent.',
    };
  });

  assert.match(html, /<h[1-6][^>]*>[^<]*Advertising[^<]*<\/h[1-6]>/i);
  assert.ok(html.includes('Google AdMob'), 'missing provider');
  assert.match(html, /advertising ID/i);
  assert.ok(html.includes('Privacy options, to change or withdraw ad consent'), 'missing withdraw text');
});

// Test: an advertising block without withdraw_consent is rejected
// Pins: an ad-supported policy always says how to withdraw consent
// Green when: validatePrivacyConfig throws naming withdraw_consent
// Benefit: no ad-supported app ships a policy without the opt-out route
test('validatePrivacyConfig throws naming withdraw_consent when advertising lacks it', () => {
  const config = withConfig((c) => {
    c.privacy.advertising = { provider: 'Google AdMob' };
  });

  assert.throws(() => load().validatePrivacyConfig(config), namesField('withdraw_consent'));
});

// Test: with ads, the "no advertising" claim is never made even when analytics is false
// Pins: the no-tracking statement only covers what is actually absent
// Green when: analytics false plus an advertising block gives no "no analytics, advertising" wording
// Benefit: the policy never contradicts itself about ads
test('analytics false with advertising -> does not claim there is no advertising', () => {
  const html = render((c) => {
    c.privacy.analytics = false;
    c.privacy.advertising = { provider: 'Google AdMob', withdraw_consent: 'Use Privacy options.' };
  });

  assert.ok(!/no analytics, advertising/i.test(html), 'claims no advertising while ads are on');
});

// Test: without an advertising block there is no Advertising heading
// Pins: ad wording only appears for apps with ads
// Green when: no heading equal to "Advertising" is in the output
// Benefit: an ad-free app's policy does not describe ad tracking
test('no advertising block -> no Advertising heading', () => {
  assert.doesNotMatch(render(), /<h[1-6][^>]*>\s*Advertising\s*<\/h[1-6]>/i);
});
