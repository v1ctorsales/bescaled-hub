import { maturityDimensions, MATURITY_STAGES } from "./maturityDimensions";

// ---------------------------------------------------------------------------
// MOCK DATA — in-memory only, resets on page reload.
// TODO(backend): replace this module with real API calls once a backend
// and database exist (e.g. GET /api/companies).
//
// `maturityAnswers` maps a dimension id (from src/data/maturityDimensions.js)
// to an object keyed by stage id, each holding { score, comment,
// dontUnderstand }. It is only populated for companies that have
// `filledMaturityTest: true`. `buildMaturityAnswers` below just saves us
// from hand-writing all 9 x 5 = 45 entries per company.
// ---------------------------------------------------------------------------

function buildMaturityAnswers(scoresByDimension, overrides = {}) {
  const answers = {};
  maturityDimensions.forEach((dimension, di) => {
    answers[dimension.id] = {};
    MATURITY_STAGES.forEach((stage, si) => {
      answers[dimension.id][stage.id] = {
        score: scoresByDimension[di][si],
        comment: "",
        dontUnderstand: false,
        ...(overrides[dimension.id]?.[stage.id] || {}),
      };
    });
  });
  return answers;
}

// Stage order: [Conceptual, Implementation, Evaluation & Reflection,
// Ready to Monitor Practices, Monitoring & Sharing]
const LOW_PROFILE = [2, 1, 1, 0, 0];
const MID_PROFILE = [3, 2, 2, 1, 1];
const HIGH_PROFILE = [4, 4, 3, 3, 2];

export const mockCompanies = [
  {
    id: 1,
    name: "Company A",
    contactEmail: "innovation@companya.com",
    subscribed: true,
    filledReadinessForm: true,
    filledMaturityTest: true,
    readinessLevels: {
      2026: { CRL: 2, TRL: 4, BRL: 2, IPRL: 2, TmRL: 1, FRL: 2 },
      2027: { CRL: 3, TRL: 5, BRL: 3, IPRL: 3, TmRL: 2, FRL: 3 },
      2028: { CRL: 4, TRL: 6, BRL: 4, IPRL: 4, TmRL: 3, FRL: 4 },
    },
    maturityAnswers: buildMaturityAnswers(
      Array(maturityDimensions.length).fill(LOW_PROFILE),
      {
        "transparency-explainability": {
          implementation: { comment: "We publish basic model cards internally." },
        },
        accountability: {
          "evaluation-reflection": { dontUnderstand: true },
        },
      }
    ),
  },
  {
    id: 2,
    name: "Company B",
    contactEmail: "contact@companyb.io",
    subscribed: true,
    filledReadinessForm: true,
    filledMaturityTest: false,
    readinessLevels: {
      2026: { CRL: 1, TRL: 2, BRL: 1, IPRL: 1, TmRL: 2, FRL: 1 },
      2027: { CRL: 2, TRL: 3, BRL: 2, IPRL: 2, TmRL: 3, FRL: 2 },
      2028: { CRL: 3, TRL: 4, BRL: 3, IPRL: 3, TmRL: 4, FRL: 3 },
    },
    maturityAnswers: {},
  },
  {
    id: 3,
    name: "Company C",
    contactEmail: "hello@companyc.com",
    subscribed: true,
    filledReadinessForm: false,
    filledMaturityTest: false,
    readinessLevels: {
      2026: { CRL: 0, TRL: 0, BRL: 0, IPRL: 0, TmRL: 0, FRL: 0 },
      2027: { CRL: 0, TRL: 0, BRL: 0, IPRL: 0, TmRL: 0, FRL: 0 },
      2028: { CRL: 0, TRL: 0, BRL: 0, IPRL: 0, TmRL: 0, FRL: 0 },
    },
    maturityAnswers: {},
  },
  {
    id: 4,
    name: "Company D",
    contactEmail: "team@companyd.co",
    subscribed: true,
    filledReadinessForm: true,
    filledMaturityTest: true,
    readinessLevels: {
      2026: { CRL: 5, TRL: 6, BRL: 4, IPRL: 3, TmRL: 5, FRL: 4 },
      2027: { CRL: 6, TRL: 7, BRL: 5, IPRL: 4, TmRL: 6, FRL: 5 },
      2028: { CRL: 7, TRL: 8, BRL: 6, IPRL: 5, TmRL: 7, FRL: 6 },
    },
    maturityAnswers: buildMaturityAnswers(
      Array(maturityDimensions.length).fill(HIGH_PROFILE),
      {
        "human-agency-oversight": {
          "ready-to-monitor": { comment: "Staff complete annual ethical AI training." },
        },
        accountability: {
          "monitoring-sharing": { comment: "Dashboards reviewed monthly by the governance board." },
        },
      }
    ),
  },
  {
    id: 5,
    name: "Company E",
    contactEmail: "info@companye.com",
    subscribed: true,
    filledReadinessForm: true,
    filledMaturityTest: true,
    readinessLevels: {
      2026: { CRL: 3, TRL: 3, BRL: 3, IPRL: 3, TmRL: 3, FRL: 3 },
      2027: { CRL: 3, TRL: 4, BRL: 4, IPRL: 3, TmRL: 4, FRL: 3 },
      2028: { CRL: 4, TRL: 5, BRL: 4, IPRL: 4, TmRL: 5, FRL: 4 },
    },
    maturityAnswers: buildMaturityAnswers(
      Array(maturityDimensions.length).fill(MID_PROFILE),
      {
        "privacy-data-governance": {
          "evaluation-reflection": { comment: "GDPR-aligned retention policy in place." },
        },
      }
    ),
  },
  {
    id: 6,
    name: "Company F",
    contactEmail: "founders@companyf.dev",
    subscribed: false,
    filledReadinessForm: false,
    filledMaturityTest: false,
    readinessLevels: {
      2026: { CRL: 0, TRL: 0, BRL: 0, IPRL: 0, TmRL: 0, FRL: 0 },
      2027: { CRL: 0, TRL: 0, BRL: 0, IPRL: 0, TmRL: 0, FRL: 0 },
      2028: { CRL: 0, TRL: 0, BRL: 0, IPRL: 0, TmRL: 0, FRL: 0 },
    },
    maturityAnswers: {},
  },
];
