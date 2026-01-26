# Changelog

## [1.1.0] - 2026-01-26

### Added
- EULA template system with Handlebars-style conditionals
- Master EULA template (`eula/EULA-MASTER.md`) with 23 comprehensive sections
- App-specific configs for UC Tracker, UPF Scanner, and Strong Clone
- Build script (`eula/build.js`) for generating HTML EULAs from templates
- Modular reference components in `eula/modules/`:
  - App Store third-party beneficiaries (Apple and Google)
  - Subscription and auto-renewal disclosure
  - Health and medical disclaimer
  - UK liability caps (GBP 50 / 12-month)
  - UK GDPR data protection rights

### Key EULA Features
- Apple/Google third-party beneficiary clauses (App Store required)
- Auto-renewal disclosure with 24-hour cancellation notice
- UK liability caps with consumer rights carve-outs
- UK GDPR rights with ICO contact information
- 30-day informal dispute resolution
- Conditional sections for health apps, subscriptions, and user-generated content

## [1.0.0] - 2026-01-16

Initial release of legal documents.

- Privacy Policy
- Terms and Conditions (includes medical/health disclaimer)
- Cookie Policy
