export const READINESS_METRICS = ["CRL", "TRL", "BRL", "IPRL", "TmRL", "FRL"];

export const READINESS_METRIC_LABELS = {
  CRL: "Customer Readiness Level",
  TRL: "Technology Readiness Level",
  BRL: "Business Readiness Level",
  IPRL: "IP Readiness Level",
  TmRL: "Team Readiness Level",
  FRL: "Funding Readiness Level",
};

export const READINESS_YEARS = ["10/2026", "02/2027", "09/2027"];

// Matches the KTH Innovation Readiness Level model (1-9 scale per metric).
export const READINESS_SCALE_MIN = 1;
export const READINESS_SCALE_MAX = 9;
