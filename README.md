# Data Security Assessment & Mitigation Plan — Zava Corp

An interactive web report addressing Microsoft 365 data oversharing risks in preparation for **M365 Copilot & Agents** deployment.

## 🔗 Live Demo

**[View the report →](https://ahouaidia.github.io/Oversharing-Public/)**

## Overview

This assessment identifies, ranks, and provides actionable mitigation steps for oversharing risks across a Microsoft 365 tenant. It is structured around Microsoft's **Identify → Switch → Configure → Deploy** methodology.

### Risk Areas Covered

| # | Risk | Severity |
|---|------|----------|
| 1 | Membership, Permissions & Site-Level Controls | Critical |
| 2 | Content Leakage from Highly Sensitive Sites | Critical |
| 3 | Misplaced, Mislabeled or Overshared Site Content | High |
| 4 | Insufficient Link Governance & Practices | High |
| 5 | Stale / Unused Content Surfacing | Medium |

### Key Features

- **26 security recommendations** with filtering by category, phase, complexity, and status
- **5 expandable risk cards** ranked by severity with detailed analysis
- **KPI dashboard** summarizing the assessment
- **Interactive canvas visualization** (animated data-flow network in the hero section)
- **Scroll-reveal animations** and responsive design
- **LocalStorage persistence** for tracking recommendation status and notes

## Technology Stack

- HTML5 / CSS3 / Vanilla JavaScript
- [Tailwind CSS](https://tailwindcss.com/) (CDN)
- Google Fonts (Libre Baskerville + Montserrat)
- Canvas API for particle/network animation
- Node.js build script for standalone report generation

## Standalone Report

A fully self-contained single HTML file (all CSS, JS, images, and data embedded inline) is available at:

📄 **[dist/DataSecurity-Report.html](dist/DataSecurity-Report.html)**

To regenerate it:

```bash
node build.js
```

Output: `dist/DataSecurity-Report.html` (~19 MB — includes all images as base64 data URIs)

## Project Structure

```
├── index.html              # Main report page
├── css/styles.css          # Custom styles & brand tokens
├── js/app.js               # Interactive features (particles, accordion, filters)
├── data/findings.js        # Findings data (JS module)
├── data/findings.json      # Findings data (JSON)
├── assets/                 # Images (logos, risk illustrations, recommendation screenshots)
├── build.js                # Build script → generates standalone HTML
└── dist/                   # Generated standalone report
    └── DataSecurity-Report.html
```

## Author

**Anis HOUAIDIA** — Cybersecurity Architect

## License

This project is provided for demonstration and educational purposes.
