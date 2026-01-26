# Legal Documents

Privacy Policy, Terms and Conditions, Cookie Policy, and End User Licence Agreements for our applications.

## Documents

| Document | File |
|----------|------|
| Privacy Policy | [privacy-policy.html](privacy-policy.html) |
| Terms and Conditions | [terms-and-conditions.html](terms-and-conditions.html) |
| Cookie Policy | [cookie-policy.html](cookie-policy.html) |

## End User Licence Agreements (EULAs)

App-specific EULAs are generated from a master template with conditional sections.

| App | EULA |
|-----|------|
| UC Tracker | [uc-tracker-eula.html](eula/generated/uc-tracker-eula.html) |
| UPF Scanner | [upf-scanner-eula.html](eula/generated/upf-scanner-eula.html) |
| Strong Clone | [strong-clone-eula.html](eula/generated/strong-clone-eula.html) |

### EULA Template System

The EULA system uses a master template with Handlebars-style conditionals:

```
eula/
├── EULA-MASTER.md           # Master template with conditional sections
├── modules/                 # Reusable modules (reference)
│   ├── app-store.md         # Apple/Google beneficiaries
│   ├── subscriptions.md     # Subscription + auto-renewal
│   ├── health-disclaimer.md # Medical disclaimer
│   ├── liability-uk.md      # UK liability caps
│   └── gdpr-rights.md       # UK GDPR rights
├── configs/                 # App-specific configurations
│   ├── uc-tracker.json
│   ├── upf-scanner.json
│   └── strong-clone.json
├── generated/               # Generated HTML files (auto-generated)
└── build.js                 # Build script
```

### Generating EULAs

```bash
cd eula

# Build all EULAs
node build.js

# Build specific app
node build.js uc-tracker

# List available configs
node build.js --list
```

### Adding a New App

1. Create a new config file in `eula/configs/`:

```json
{
  "app": {
    "name": "My App",
    "description": "does something useful",
    "audience": "target users",
    "ios_version": "15.0",
    "android_version": "8.0"
  },
  "company": {
    "name": "John Theodore Reacher",
    "trading_as": "TeapotSoftware",
    "email": "teapotsoft@outlook.com",
    "location": "United Kingdom",
    "jurisdiction": "England and Wales"
  },
  "features": {
    "subscriptions": true,
    "in_app_purchases": false,
    "health_data": false,
    "user_content": false,
    "minimum_age": 13,
    "parental_consent_required": false
  },
  "subscription": {
    "billing_cycle": "monthly or annual"
  },
  "privacy_policy_url": "https://teapotsoftware.github.io/legal-docs/privacy-policy.html",
  "last_updated": "26 January 2026"
}
```

2. Run the build script:
```bash
node build.js my-app
```

### Conditional Sections

The template includes these conditional sections based on config flags:

| Flag | Section | Description |
|------|---------|-------------|
| `features.subscriptions` | Subscriptions and In-App Purchases | Auto-renewal disclosure, billing terms |
| `features.in_app_purchases` | In-App Purchases subsection | Non-refundable purchases clause |
| `features.health_data` | Health and Medical Disclaimer | Medical advice disclaimer |
| `features.user_content` | User-Generated Contributions | UGC warranties and licence grant |
| `features.parental_consent_required` | Parental consent notice | For apps with younger users |

### Key Features

All generated EULAs include:

- **Apple/Google Third-Party Beneficiaries** (App Store required)
- **Auto-Renewal Disclosure** (24-hour cancellation notice)
- **UK Liability Caps** (GBP 50 / 12-month maximum)
- **UK GDPR Rights** (with ICO contact information)
- **30-Day Informal Dispute Resolution**
- **UK Consumer Rights** carve-outs

## Contact

For questions about these policies, contact: teapotsoft@outlook.com
