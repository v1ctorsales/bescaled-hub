// Minimal server-side mirror of the readiness constants the frontend keeps
// in src/config.js — only what's needed to shape a brand-new company's
// record in createCompany. The KTH level guide's display content
// (src/data/readinessLevelGuide.js) and the AI Maturity rubric
// (src/data/maturityDimensions.js) stay frontend-only: the backend just
// stores whatever keys/values the frontend sends, it never needs to know
// what a "CRL" or a maturity dimension means.
export const READINESS_METRICS = ["CRL", "TRL", "BRL", "IPRL", "TmRL", "FRL"];
export const READINESS_YEARS = ["10/2026", "02/2027", "09/2027"];
