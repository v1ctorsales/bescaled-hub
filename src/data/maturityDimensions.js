// ---------------------------------------------------------------------------
// AI Maturity Test — Responsible AI (RAI) rubric.
//
// Each of the 9 dimensions is broken into 5 independent stages (Conceptual,
// Implementation, Evaluation & Reflection, Ready to Monitor Practices,
// Monitoring & Sharing). Every stage gets its OWN 0-4 score, comment and
// "I don't understand" flag — a company might score high on "Conceptual"
// awareness for a dimension while scoring low on "Monitoring & Sharing" for
// that same dimension, so scores are not a single value per dimension.
// ---------------------------------------------------------------------------

export const MATURITY_STAGES = [
  { id: "conceptual", label: "Conceptual" },
  { id: "implementation", label: "Implementation" },
  { id: "evaluation-reflection", label: "Evaluation & Reflection" },
  { id: "ready-to-monitor", label: "Ready to Monitor Practices" },
  { id: "monitoring-sharing", label: "Monitoring & Sharing" },
];

export function getStageLabel(stageId) {
  return MATURITY_STAGES.find((s) => s.id === stageId)?.label ?? stageId;
}

export const maturityDimensions = [
  {
    id: "human-agency-oversight",
    title: "Human Agency & Oversight",
    stages: {
      conceptual: ["Awareness of need for human-in-the-loop", "Understanding roles in AI oversight"],
      implementation: [
        "Evidence of human-in-the-loop practices",
        "Clear assignment of roles for ethical AI oversight",
        "Ability for users to opt out of automated decisions",
      ],
      "evaluation-reflection": ["Escalation procedures when AI errors are detected"],
      "ready-to-monitor": ["Continuous training for staff on ethical AI practices"],
      "monitoring-sharing": ["Documenting & sharing oversight structures with external partners"],
    },
  },
  {
    id: "transparency-explainability",
    title: "Transparency & Explainability",
    stages: {
      conceptual: ["Basic awareness of transparency and explainability principles"],
      implementation: [
        "Documentation of AI models (model cards, datasheets)",
        "Clear user-friendly explanations of system logic",
      ],
      "evaluation-reflection": [
        "Disclosure of limitations, assumptions, and risks",
        "Decision logs available for audit",
      ],
      "ready-to-monitor": ["Regular reporting on AI decisions and outcomes"],
      "monitoring-sharing": [
        "External transparency statements / reports",
        "Public model documentation updates",
      ],
    },
  },
  {
    id: "fairness-inclusion",
    title: "Fairness & Inclusion",
    stages: {
      conceptual: ["Awareness of bias issues and inclusivity needs"],
      implementation: [
        "Proactive bias testing across datasets and outputs",
        "Women inclusion in design, testing & leadership",
      ],
      "evaluation-reflection": [
        "Bias mitigation strategies implemented & reviewed",
        "Engagement with affected communities",
      ],
      "ready-to-monitor": [
        "Regular fairness audits conducted",
        "Continuous demographic performance analysis",
      ],
      "monitoring-sharing": [
        "Sharing fairness testing methodologies",
        "Publishing fairness impact summaries",
      ],
    },
  },
  {
    id: "privacy-data-governance",
    title: "Privacy & Data Governance",
    stages: {
      conceptual: ["Awareness of privacy risks & data governance principles"],
      implementation: [
        "Data minimization practices",
        "Consent management",
        "Secure data storage processes",
      ],
      "evaluation-reflection": ["Regular privacy reviews", "Assessing data quality & integrity"],
      "ready-to-monitor": [
        "Audit logs for data access & handling",
        "Strong data-retention & deletion policies",
      ],
      "monitoring-sharing": ["External privacy certifications", "Publishing data-handling guidelines"],
    },
  },
  {
    id: "technical-robustness-safety",
    title: "Technical Robustness & Safety",
    stages: {
      conceptual: ["Understanding AI reliability, safety & robustness"],
      implementation: ["Basic testing of model performance", "Risk identification processes"],
      "evaluation-reflection": [
        "Stress testing, failure mode analysis",
        "Validation processes in place",
      ],
      "ready-to-monitor": [
        "Incident tracking and resolution logs",
        "Regular system robustness checks",
      ],
      "monitoring-sharing": ["Sharing safety benchmarks", "Transparent safety-incident reporting"],
    },
  },
  {
    id: "accountability",
    title: "Accountability",
    stages: {
      conceptual: ["Awareness of responsibility structures"],
      implementation: [
        "Clear assignment of accountable roles",
        "Beginning documentation of decisions",
      ],
      "evaluation-reflection": ["Internal audits of AI decisions", "Review of governance processes"],
      "ready-to-monitor": [
        "Dashboards & KPIs for accountability",
        "Governance framework fully operational",
      ],
      "monitoring-sharing": ["External audits", "Participation in accountability consortiums"],
    },
  },
  {
    id: "traceability",
    title: "Traceability",
    stages: {
      conceptual: ["Awareness of need for traceable systems"],
      implementation: ["Documentation of data pipelines", "Version tracking for models"],
      "evaluation-reflection": [
        "Ability to trace decisions back to data sources",
        "Audit logs of model updates",
      ],
      "ready-to-monitor": ["Replicability & reproducibility mechanisms in place"],
      "monitoring-sharing": ["Publishing traceability practices", "External traceability audits"],
    },
  },
  {
    id: "innovation-scalability",
    title: "Innovation & Scalability",
    stages: {
      conceptual: ["Awareness of need for sustainable RAI innovation"],
      implementation: ["Novel solutions for RAI challenges", "RAI included in product planning"],
      "evaluation-reflection": [
        "Scalability assessment of RAI practices",
        "Cross-industry feasibility analysis",
      ],
      "ready-to-monitor": ["Integration of RAI into business growth strategy"],
      "monitoring-sharing": [
        "Ecosystem leadership / setting benchmarks",
        "Sharing scalable RAI practices externally",
      ],
    },
  },
  {
    id: "knowledge-sharing",
    title: "Knowledge Sharing",
    stages: {
      conceptual: ["Awareness of value of knowledge exchange"],
      implementation: ["Internal sharing of datasets, documentation"],
      "evaluation-reflection": [
        "Peer mentoring programs inside company",
        "Participation in collaborations",
      ],
      "ready-to-monitor": [
        "Contribution to open-source platforms",
        "Structured internal learning systems",
      ],
      "monitoring-sharing": ["Public case studies", "Publishing RAI practices to the wider ecosystem"],
    },
  },
];
