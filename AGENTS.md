# AGENTS.md - 11Hopem Personal Finance Advisor & Debt Optimization Platform

## Project Overview
- **Name:** `finans-asistani` (11Hopem Finansör)
- **Scope:** Personal finance management, intelligent debt payoff strategies (Avalanche and Snowball methods), credit loan timing and eligibility advisor, cashflow modeling, and asset diversification engine.
- **Brand Identity:** Exclusively `11Hopem` with redirect to `https://11hopem.com`.
- **Live URL:** `https://finans-asistani-ebon.vercel.app`
- **GitHub Repository:** Private repo `umutocguder/finans-asistani`
- **Antigravity Project ID:** `7de8582d-e3a4-481b-81aa-13ced53a98f1`

---

## Architecture & Tech Stack
- **Core Engine:** Vanilla ES Modules (`src/engines/`):
  - `debtEngine.js`: Avalanche, Snowball, and Consolidation calculators.
  - `loanAdvisorEngine.js`: Debt-to-Income (DTI) and loan borrowing timing decision rules.
  - `investmentEngine.js`: Toxic debt vs investment returns, asset allocation models.
  - `financeAdvisorEngine.js`: High-level AI advisor answering direct financial questions.
- **Data Custody, Backend & Security:**
  - `supabase/schema.sql`: PostgreSQL relational persistence (`financial_profiles`, `debts`, `debt_payoff_simulations`, `financial_advisor_queries`) with Row Level Security (RLS).
  - `src/services/supabaseService.js`: Direct PostgREST client eliminating browser localStorage for persistent financial data (Rule: veri-localstorage-yasagi).
  - `src/services/backupService.js`: Rotating local SHA-256 cryptographic backups in `data/backups/`.
  - `src/telemetry/telemetryService.js`: Non-blocking Firebase telemetry with 100% financial PII stripping.
- **Frontend Vitrine:** Vanilla HTML5, Tailwind CSS CDN, Lucide Icons, Glassmorphism UI in `public/index.html`.
- **Testing:** Node.js native test runner (`node --test tests/*.test.js`).
- **Build / Packaging:** `scripts/build.js` synchronizes assets into `public/`.
- **Hosting & CI/CD:** Vercel Production Deployment + GitHub Actions CI/CD.

---

## Development & Verification Commands
- **Install Dependencies:** `npm install`
- **Run Unit Tests:** `npm test`
- **Build Production Assets:** `npm run build`
- **Create Local Backup:** `npm run backup`
- **Start Local Dev Server:** `npm start`
- **Deploy to Vercel:** `npx -y vercel --prod --yes`

---

## Engineering & Governance Rules
1. **100% English Code Standard:** All code, test definitions, scripts, commit messages, and configs must be in English. User-facing UI can be in Turkish.
2. **Strict Brand Compliance:** All links to brand must point directly to `https://11hopem.com`. Never use 'Software Ltd. Şti.'.
3. **1:1 Favicon & Brand Asset Rule:** All favicon and social graph assets (`favicon.svg`, `favicon.ico`, `logo.svg`, `apple-touch-icon.png`, `og-image.png`) must be present in both `assets/` and `public/`.
4. **Git Branching Policy:** `master` represents production deployment; `dev` represents staging/UAT.
5. **Zero Data Leakage:** Personal financial figures must never leave local storage or be logged into cloud services.
