// ---------------------------------------------------------------------------
// PROTOTYPE FLAG — TEMPORARY
// ---------------------------------------------------------------------------
// This boolean is a stand-in for real role/permission logic that will
// eventually come from the backend (e.g. a `role` field on the authenticated
// user, or a proper admin check against the database).
//
// It only sets the DEFAULT state of the "Log in as admin" checkbox on the
// login screen (see src/pages/Login.jsx) — from there it can be toggled per
// session without touching code.
//
// TODO(backend): remove this flag and the login-screen toggle entirely once
// authentication/authorization exists; the destination panel should be
// decided by a real `user.role === 'admin'` check instead.
// ---------------------------------------------------------------------------
export const IS_ADMIN_VIEW = false;

export const READINESS_METRICS = ["CRL", "TRL", "BRL", "IPRL", "TmRL", "FRL"];

export const READINESS_METRIC_LABELS = {
  CRL: "Customer Readiness Level",
  TRL: "Technology Readiness Level",
  BRL: "Business Readiness Level",
  IPRL: "IP Readiness Level",
  TmRL: "Team Readiness Level",
  FRL: "Funding Readiness Level",
};

export const READINESS_YEARS = ["09/2026", "02/2027", "09/2027"];

// Matches the KTH Innovation Readiness Level model (1-9 scale per metric).
export const READINESS_SCALE_MIN = 1;
export const READINESS_SCALE_MAX = 9;
