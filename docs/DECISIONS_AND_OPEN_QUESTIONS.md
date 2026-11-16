# CtrlPass — Decisions & Open Questions

**Version:** 1.0  
**Status:** 🟢 BASELINE ACTIVE  
**Last Updated:** 2026-10-25  

This document tracks unresolved decisions, pending confirmations, research-required items, and deferred scope across CtrlPass specifications.

---

## Status Key

| Status | Meaning |
| :--- | :--- |
| 🟢 CONFIRMED | Approved baseline rule |
| 🟡 PENDING | Awaiting operational or technical confirmation |
| 🔵 RESEARCH_REQUIRED | Legal, technical, or provider investigation required |
| ⚪ DEFERRED | Explicitly postponed past MVP |
| 🔴 REJECTED | Considered and dismissed |
| 🟠 CHANGED | Superseded by subsequent architecture decisions |

---

## 1. Payments & Settlement

### 1.1 Cashfree Easy Split Live Behavior & Automation
- **Status:** 🟡 PENDING / 🔵 RESEARCH_REQUIRED
- **Source Documents:** `docs/PAYMENTS_AND_FINANCE.md`, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/DEPLOYMENT_AND_RELEASE.md`
- **Description:** Automated post-event settlement execution remains unconfirmed pending live Cashfree Easy Split verification. Real-world behavior regarding dispute holdbacks, refund deductions from unpaid splits, gateway fee splits, and transfer settlement timelines must be validated in sandbox/production before production settlement automation.
- **Resolution Gate:** Pre-release payment gate / provider onboarding verification.

### 1.2 Early Organizer Payouts
- **Status:** ⚪ DEFERRED
- **Source Documents:** `docs/PAYMENTS_AND_FINANCE.md`, `docs/DEPLOYMENT_AND_RELEASE.md`
- **Description:** Early or rolling organizer payouts prior to event completion are deferred. The MVP baseline holds organizer payouts until event completion plus dispute/refund clearance.
- **Resolution Gate:** Post-launch operational feature phase.

---

## 2. Check-In & Scanner

### 2.1 Offline QR Check-in & Cache Synchronization
- **Status:** ⚪ DEFERRED
- **Source Documents:** `docs/TICKETS_AND_QR_CHECKIN.md`, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/AI_BUILD_RULES.md`
- **Description:** Offline cryptographic ticket scanning, local ticket caching, and asynchronous check-in reconciliation are deferred for MVP. The initial scanner implementation is strictly online-only against the Supabase backend.
- **Resolution Gate:** Post-MVP scalability phase.

---

## 3. Privacy, Data Protection & Legal Compliance

### 3.1 DPDP Minor-Data & Verifiable Parental Consent Policy
- **Status:** 🔵 RESEARCH_REQUIRED
- **Source Documents:** `docs/PRIVACY_AND_COMPLIANCE.md`
- **Description:** Specific implementation mechanism for verifiable parental consent and processing restrictions for children's personal data under the Digital Personal Data Protection (DPDP) Act 2023 requires formal legal guidance.
- **Resolution Gate:** Pre-production legal review.

### 3.2 Custom Sensitive Form Field Policy
- **Status:** 🔵 RESEARCH_REQUIRED
- **Source Documents:** `docs/PRIVACY_AND_COMPLIANCE.md`
- **Description:** Rules and data-protection controls for custom event registration fields created by organizers that might solicit sensitive personal data (e.g., identity IDs, health data) require policy and database constraint determination.
- **Resolution Gate:** Event creation & schema freeze gate.

### 3.3 Cross-Border Provider Residency & Cashfree DPA Review
- **Status:** 🔵 RESEARCH_REQUIRED
- **Source Documents:** `docs/PRIVACY_AND_COMPLIANCE.md`
- **Description:** Formal verification of data residency, cross-border data transfer limitations, and Data Processing Agreements (DPA) with third-party providers (Supabase, Cashfree, push/email providers) under DPDP rules.
- **Resolution Gate:** Production readiness gate.

---

## 4. Architecture & Repository Foundation

### 4.1 Expo Router Structure vs. Bare React Native Layout
- **Status:** 🟡 PENDING
- **Source Documents:** `docs/ARCHITECTURE_AND_TECH_STACK.md`, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/DEPLOYMENT_AND_RELEASE.md`
- **Description:** Specifications define the mobile project structure using Expo and Expo Router (`mobile/app/(auth)/...`), whereas the active workspace contains a bare React Native CLI project (`YtReactNative`). Structural reconciliation between current repo setup and roadmap targets is pending execution.
- **Resolution Gate:** Phase 0 (Audit) and Phase 1 (Repository Foundation).
