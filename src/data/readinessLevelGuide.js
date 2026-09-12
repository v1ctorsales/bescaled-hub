// ---------------------------------------------------------------------------
// KTH Innovation Readiness Level (KTH IRL) — reference content shown in the
// level guide below the readiness table/chart. Source: KTH IRL model
// (Central Baltic Programme / BeScaled materials). Level 0 is our own
// "not started yet" placeholder so the guide still covers the full 0-9
// thermometer used in the UI.
// ---------------------------------------------------------------------------

const NOT_STARTED = {
  title: "Not started yet",
  bullets: ["No work has begun on this dimension yet."],
};

export const READINESS_LEVEL_GUIDE = {
  CRL: {
    label: "Customer Readiness Level",
    intro:
      "How well you understand your customers and can sell to them — from an early hypothesis to widespread, repeatable sales.",
    stages: {
      1: {
        title: "Hypothesis of possible needs in the market",
        bullets: [
          "Thinking (yourself) that a possible need/problem or opportunity might exist in a market.",
          "No clear hypotheses on who customers are, what problems exist, etc. — hypotheses (if any) are unclear and speculative, with no proof or analysis to support them.",
          "Limited or non-existing knowledge of the market and customers/users (who they are, etc.).",
        ],
      },
      2: {
        title: "Identified specific needs in market",
        bullets: [
          "Some market research is performed, typically derived from secondary sources.",
          "Brief familiarity with the market, possible customers and their problems/needs, and alternatives.",
          "There is a first, reasonably clear description of the problem/need hypothesis.",
        ],
      },
      3: {
        title: "First market feedback established",
        bullets: [
          "Received feedback from primary market research — direct contacts with a few possible users/customers or industry/market experts.",
          "A more developed understanding of possible customers and possible customer segments.",
          "The problem/need hypothesis is clear and updated after customer/user/expert feedback.",
        ],
      },
      4: {
        title: "Confirmed problem/needs from several customers or users",
        bullets: [
          "The problem/need and its importance is confirmed from multiple customers or users (numbers vary by B2B/B2C and market structure — e.g. 5–10 in B2B, 2–5 market-leading customers if concentrated, higher in B2C).",
          "Customer segmentation with initial basic customer profiles in place.",
          "Identified who the user, paying customer, and decision maker is.",
          "A product/service hypothesis with clear positioning against customer alternatives, based on customer/user feedback.",
        ],
      },
      5: {
        title: "Established interest and relations with customers",
        bullets: [
          "Customers/users have expressed interest for the product/service and confirmed it can solve their problems/needs (initial problem-solution fit).",
          "Established relationships with potential target customers/users providing input.",
          "Decided which target customers/segments to focus on first.",
          "Defined first sales pitch and value proposition adapted to the target customer/segment.",
        ],
      },
      6: {
        title: "Benefits confirmed by first customer testing",
        bullets: [
          "Testing of the product/service by customers/users has confirmed the customer value and benefits.",
          "Updated sales pitch and value proposition based on customer/user feedback.",
          "Defined first sales/user acquisition process and initiated structured sales activities.",
          "Identified possible partners or key stakeholders relevant to reach customers/users.",
        ],
      },
      7: {
        title: "Customers in extended testing or first test sales",
        bullets: [
          "Customer agreements in place — first sales/test sales of early versions of the product/service, or customers/users engaged in qualifications or extended testing.",
          "Small number of active users of early versions of the product/service.",
          "Discussions initiated with partners to reach customers/users (when relevant).",
        ],
      },
      8: {
        title: "First commercial sales and implemented sales process",
        bullets: [
          "Market-ready product/service sold to customers at/near target market price.",
          "Substantial number of active users of the market-ready product/service (initial customer traction).",
          "Sales/user acquisition process implemented with dedicated people and support systems (CRM, etc.).",
          "Agreements in place with first partners to reach customers (when relevant).",
        ],
      },
      9: {
        title: "Widespread sales that scale",
        bullets: [
          "Widespread product deployment — sales to several customers in a repeatable and scalable way (including through partners when relevant).",
          "Large number of active users with substantial growth (significant customer traction).",
          "Company focuses on business development, customer acquisition, growth of sales, and building user/customer demand.",
        ],
      },
    },
  },

  TRL: {
    label: "Technology Readiness Level",
    intro:
      "Maturity of the technology itself — from an initial idea to a technology proven in real-world operations. Based on the NASA TRL scale (1974–1989).",
    stages: {
      1: {
        title: "Interesting research results or initial technology idea identified",
        bullets: [
          "Research results with potential benefits or useful applications identified.",
          "Vague idea of a technology to be developed.",
        ],
      },
      2: {
        title: "Technology concept and/or application formulated",
        bullets: [
          "A potential technology concept is defined and described.",
          "Practical applications can be defined/researched but are speculative — no proof or detailed analysis that the technology will work.",
        ],
      },
      3: {
        title: "Proof-of-concept of critical functions and/or characteristics in laboratory",
        bullets: [
          "Tests in the laboratory environment (analytical and/or experimental) of important parameters/features/functions show the technology concept could work and be feasible.",
          "Laboratory environment = the environment where technology is typically developed, often not the same as where it will be used.",
          "Active R&D is initiated to develop the technology further.",
          "There is a first idea of end-user requirements/specifications and/or use cases.",
        ],
      },
      4: {
        title: "Technology validation in laboratory",
        bullets: [
          "Basic components are integrated and shown to work together, producing desired results in the laboratory environment.",
          "Test results give initial evidence indicating the technology concept will work (initial validation).",
        ],
      },
      5: {
        title: "Technology validation in relevant environment",
        bullets: [
          "Basic components are integrated and tested in a more realistic form in a relevant environment.",
          "Test results give evidence indicating that the technology will work (validation).",
          "Relevant environment = a lab or other controlled environment that simulates the most important and stressing aspects of the operational environment.",
          "More defined end-user requirements/specifications and/or use cases based on feedback from users.",
        ],
      },
      6: {
        title: "Technology prototype demonstration in relevant environment",
        bullets: [
          "A representative model or prototype of the technology has been shown to actually work in a relevant environment.",
          "Representative model = a functional form of the technology, generally reduced in scale, near or at operational specification.",
          "Prototype = the technology in a form that can be used to evaluate technical and/or manufacturing feasibility or utility of the final product.",
          "Shown to actually work (demonstration) = meets most of the important performance requirements.",
        ],
      },
      7: {
        title: "Technology prototype demonstration in operational environment",
        bullets: [
          "A prototype near or at the complete technology has been shown to actually work in an operational environment.",
          "Operational environment = the environment that addresses all operational requirements and specifications where the technology will be used by end-users.",
          "Complete end-user requirements/specifications and/or use cases in place.",
        ],
      },
      8: {
        title: "Technology complete and demonstrated in actual operations",
        bullets: [
          "Complete technology has been proven to work in actual operations by first users.",
          "Complete technology = complete (contains everything the user needs), functional (works the way it should), compatible (with people, processes, systems at the user), and producible (at a reasonable cost).",
          "Proven to work = meets all performance requirements/specifications.",
          "Actual operations = implemented by end-users on their own in their day-to-day operations.",
        ],
      },
      9: {
        title: "Technology complete and proven in actual operations over time",
        bullets: [
          "Complete technology is scalable and proven to work in actual operations by several users over time.",
          "Continuous development, improvement, and optimization of technology and production is ongoing.",
        ],
      },
    },
  },

  BRL: {
    label: "Business Readiness Level",
    intro:
      "Maturity of the business model — from a first description to a model proven to meet profit, growth and sustainability targets.",
    stages: {
      1: {
        title: "No or unclear description of business idea, market potential and competition",
        bullets: [
          "Business model: vague/unspecified description of business idea/value proposition/business model.",
          "Market opportunity: little insight into the market and its potential and size.",
          "Competition: little insight into competition and/or alternative solutions.",
          "Sustainability: none or very low awareness of how sustainability aspects could affect the business idea.",
        ],
      },
      2: {
        title: "Description of possible business concept, market opportunity and competition",
        bullets: [
          "Business model: business concept described in structured form, e.g. value proposition (NABC). Some insight into sustainability aspects of business.",
          "Market opportunity: initial overview of markets and their potential market size.",
          "Competition: listed some competitors and/or alternative solutions.",
        ],
      },
      3: {
        title: "Description of business model, target market(s) and competitive landscape",
        bullets: [
          "Business model: draft of business model described, e.g. in canvas format.",
          "Market opportunity: first description of possible target market(s) with estimates of market size (TAM, SAM).",
          "Competition: description of competition/competitive landscape, e.g. in a matrix or positioning map.",
          "Sustainability: first description of which SDG(s) the business could target.",
        ],
      },
      4: {
        title: "First calculations indicate economically viable business model",
        bullets: [
          "Business model: first calculations of main costs and revenues (including pricing) show possible economic viability.",
          "Market opportunity: well-defined possible target market(s) description (TAM, SAM, SOM, value chain, geographical scope).",
          "Competition: suggested own positioning in competitive landscape.",
          "Sustainability: first sustainability assessment of the proposed business model — SDG assessment outlining positive and negative impact.",
        ],
      },
      5: {
        title: "Market feedback on key assumptions of business model",
        bullets: [
          "Business model: key assumptions (specifically willingness to pay and pricing) validated by market feedback.",
          "Market opportunity: target market description(s) updated based on market feedback (incl. own positioning in the value chain).",
          "Competition: updated own positioning in the competitive landscape based on market feedback.",
          "Sustainability: considered how sustainability could be integrated into the business to achieve positive impact.",
        ],
      },
      6: {
        title: "Business model validated by target customers (pilot/test sales)",
        bullets: [
          "Business model: validated by target customers in a realistic business scenario (pilot, test sales, pre-order, etc.).",
          "Market opportunity: decided on first target market (incl. geographical focus) based on relevant market input.",
          "Competition: key market differentiators/USPs defined and added to pitch/presentation.",
          "Sustainability: key sustainability metrics proposed (e.g. carbon footprint, social impact, circularity).",
        ],
      },
      7: {
        title: "Business model validated by commercial sales",
        bullets: [
          "Business model: validated by first sales on commercial terms to several customers.",
          "Market opportunity: target market and sales estimates validated by market feedback.",
          "Competition: market differentiators/USPs validated by market feedback and implemented in marketing and communication.",
          "Sustainability: sustainability metrics defined (incl. how to monitor and report).",
        ],
      },
      8: {
        title: "Sales and metrics show that business model is viable",
        bullets: [
          "Business model: sales and other metrics show the business model is viable (e.g. regarding profit, growth).",
          "Market opportunity: future additional target markets described, including international possibilities.",
          "Competition: implemented continuous competitor monitoring.",
          "Sustainability: integrated into the business and used as a way to create business value and positive impact.",
        ],
      },
      9: {
        title: "Business model proven to meet expectations on profit, growth and sustainability",
        bullets: [
          "Business model: operational and proven — business meets/exceeds expectations on profit, growth and scalability.",
          "Market opportunity: actively pursuing additional target markets; internationalization strategy in place.",
          "Competition: expanded competitor monitoring covering new markets and future scenarios.",
          "Sustainability: operations, growth and sustainability are balanced (validated by sustainability metrics).",
        ],
      },
    },
  },

  IPRL: {
    label: "IP Readiness Level",
    intro:
      "Maturity of intellectual property protection — from early hypotheses about possible IP to a strategy proven to protect and create value. All new ideas rely on IP to some extent, so IPRL is relevant to every type of idea.",
    stages: {
      1: {
        title: "Hypothesizing on your possible IPR",
        bullets: [
          "Hypothesizing that results or ideas might contain some possible form of IPR.",
          "No description or documentation of the possible IPR.",
          "Limited knowledge or unclarity regarding relevant legal aspects (ownership, use-rights, etc.).",
          "Limited knowledge of uniqueness and the technical field, state-of-the-art, publications, etc.",
        ],
      },
      2: {
        title: "Identified different forms of possible IPR that you have/create",
        bullets: [
          "Ownership is clarified and you can use relevant IPR — different forms of IPR that exist or could come up during development are mapped (see IPR list).",
          "Specific ideas for IPR exist, but are not yet well described or defined.",
          "Agreements related to IP are identified and ownership clarified; inventors/creators are clarified; aware of applicable IP policies and potential contract restrictions.",
        ],
      },
      3: {
        title: "Description of possible key IPR in some detail",
        bullets: [
          "Initial evaluation of potential to protect key IPR — considered what forms of IPR are key/most important and could/should be protected.",
          "Sufficiently detailed description of possible IPR to evaluate the possibility for protection.",
          "Evaluation of protection possibilities via own searches of publications, state-of-the-art solutions, etc. in the field.",
          "Possibly initial searches or analysis by a professional of relevant prior art or conflicting IPR.",
        ],
      },
      4: {
        title: "Confirmed that IPR protection is possible and for what",
        bullets: [
          "Decided why to protect certain IPR (business relevance) — confirmed possibilities for protection of key IPR through searches/analysis by a professional.",
          "Analyzed (ideally with a professional) the key IPR and what the priorities should be for what to protect to create business value.",
          'Possibly filed a first IPR application/registration in a less elaborate form (e.g. own trademark filing, "provisional" patent application).',
        ],
      },
      5: {
        title: "Draft of IPR strategy to create business value is in place",
        bullets: [
          "Filed first formal application/registration of key IPR — draft strategy in place with first analysis and plan (preferably by a professional) on how different IPR can protect and add value (see e.g. the KTH IPR Strategy tool).",
          "First complete formal application/registration of key IPR filed in cooperation with a professional.",
          "Basic agreements in place to ascertain control of key IPR (e.g. assignments, ownership, etc.).",
        ],
      },
      6: {
        title: "First complete IPR strategy in place considering different IPR",
        bullets: [
          "Positive response on filed applications/registrations — complete IPR strategy elaborated (validated by a professional) that supports the business strategy.",
          "Identified possible complementary/additional IPR to protect.",
          "Initial assessment of freedom-to-operate to understand the IPR landscape (who is active, what key IPR exists) and dependency on/restriction by other IPR.",
          "Positive response on applications from authorities, with analysis performed (or, if not positive, analysis performed with a professional with good prospects).",
        ],
      },
      7: {
        title: "Filed formal applications/registrations of key IPR in relevant countries/regions according to IPR strategy",
        bullets: [
          "Entered into national/regional phase (US, EU, JP, etc.) with key IPR application/registration.",
          "More complete assessment of freedom-to-operate and clear understanding of dependency on/restriction by other IPR.",
        ],
      },
      8: {
        title: "IPR strategy and management practices fully implemented",
        bullets: [
          "Filed formal applications/registrations of complementary IPR — strategy fully implemented, proactively used to support/protect the business, IPR agreements professionally managed, and a process for securing new IPR is in place.",
          "Key IPR is granted in the first country/region with relevant scope for the business.",
          "Filed complementary or additional IPR application(s)/registration(s).",
        ],
      },
      9: {
        title: "Strong IPR support and protection for business",
        bullets: [
          "IPR protection granted and maintained in relevant countries — IPR strategy is proven to support and create value for the business.",
          "Key and complementary IPR is granted and maintained in several countries relevant to the business.",
          "Agreements in place to access all necessary external IPR.",
        ],
      },
    },
  },

  TmRL: {
    label: "Team Readiness Level",
    intro:
      "Maturity of the team and organization — from a single founder to a high-performing, well-structured organization.",
    stages: {
      1: {
        title: "Lack of necessary competencies/resources to verify idea",
        bullets: [
          "Little insight into team needs (typically an individual) — typically an individual lacking necessary competencies in key areas such as tech, business, etc.",
          "Little insight into needed/necessary competencies and other resources (e.g. partners, service providers) to verify and develop the idea.",
        ],
      },
      2: {
        title: "Limited competencies in place to start verifying the idea",
        bullets: [
          "First idea of additional necessary competencies or resources — limited competencies and/or capacity present, typically 1–2 persons.",
          "First idea of which additional persons/competencies could be needed to verify/develop the idea.",
          "First idea of the overall goal for the project.",
        ],
      },
      3: {
        title: "Some of the necessary competencies in place to verify/develop idea",
        bullets: [
          "Defined needed competencies (and a plan for finding them) — one or several individuals possess some, but not all, of the necessary competencies and capacity to start verifying the idea.",
          "Needs and gaps in competencies, capacity, and team diversity are identified.",
          "Initial plan defined for how to find needed prioritized competencies (near-term, <1 year).",
        ],
      },
      4: {
        title: "A champion is present with a clear idea of direction",
        bullets: [
          "Several needed competencies in place, with an initiated plan to complement them — the team (or individual) has a clear idea of how to take the idea to market (startup, IP deal, etc.).",
          "At least one champion (driver, committed to taking the idea forward) is present.",
          "Several, but not all, necessary competencies are present, typically across multiple individuals.",
          "A plan is in place and initiated to find necessary additional competencies and capacity, keeping team diversity in mind.",
          "The team has started discussions on roles, commitment, ownership, etc. going forward.",
        ],
      },
      5: {
        title: "Initial founding team with main needed competencies and capacity",
        bullets: [
          "Team agrees on ownership, roles, goals, and visions — an initial founding team is working together, all spending significant time, jointly having the main needed competencies and capacity to start building the startup.",
          "Aligned team with clarified roles, shared goals and visions, and clear commitment (e.g. time spent).",
          "The team has agreed on their respective shares (signed agreement); ownership is balanced, incentivizing, and reflects historical and future commitment.",
          "Activities to get additional competencies and capacity are in progress, keeping team diversity in mind.",
          "Initial systems/processes/tools in place to share knowledge and information within the team.",
        ],
      },
      6: {
        title:
          "Complementary, diverse, and committed founding team with all necessary competencies and capacity to start building a business",
        bullets: [
          "A complementary and diverse founding team is in place, capable of starting to build the business.",
          "All key competencies and capacity necessary for the near term are present, including a clear CEO.",
          "Committed team where everyone feels responsibility and accountability.",
          "Started recruitment of advisors and/or board members, keeping board diversity in mind.",
          "Awareness of risks to team performance (conflicts, burn-out/mental health, politics, conflicting agendas/priorities).",
        ],
      },
      7: {
        title: "Well-functioning team and culture in place, with a growth plan",
        bullets: [
          "A well-functioning team with clear roles, plus a plan for expanding the team and building the organization over time.",
          "Goals, vision, purpose, and culture are clearly articulated and documented to support team and organizational development.",
          "Plan in place for how to build the necessary organization and grow the team over the longer term (~2 years).",
          "Processes/systems and a plan for continuous learning and staff development are implemented.",
          "Board and advisors are operational and supporting business and organizational development.",
        ],
      },
      8: {
        title: "Professional organization in place (board, CEO, management, staff)",
        bullets: [
          "There is a clear leadership and management team with relevant professional experience.",
          "Competent and diverse board, and relevant advisors, in place and professionally used.",
          "HR policies/processes/responsibilities in place to assure good HR practices and team diversity.",
          "Necessary recruitments according to the longer-term plan are ongoing to ensure relevant competencies, capacity, and diversity.",
          "All levels of the organization are properly trained and motivated.",
        ],
      },
      9: {
        title: "High performing, well-structured organization at all levels, maintained over time",
        bullets: [
          "The organization is high performing and well-functioning (cooperation, social environment, etc.), maintained, developed, and performing over time.",
          "All levels of the organization are actively engaged in continuous learning and development.",
          "Organizational culture, structure, and processes are continuously improved and developed.",
          "Incentives/rewards are aligned to motivate the whole organization to reach goals and perform well.",
          "The management team is maintained, developed, and performs over time.",
        ],
      },
    },
  },

  FRL: {
    label: "Funding Readiness Level",
    intro:
      "Maturity of your funding — from little insight into funding needs to a long-term funding strategy with active investor relationships.",
    stages: {
      1: {
        title: "Little insight into funding needs and funding options",
        bullets: [
          "Need: little insight into costs and relevant activities for validation of the idea; little insight into overall funding needs. No funding or plan for validation of the idea.",
          "Options: little insight into different funding options.",
          "Status: no funding available or secured.",
          "Pitch: an initial description that can be used for seeking initial funding (incl. business concept, e.g. NABC), but lacking aspects relevant for funding such as market potential.",
        ],
      },
      2: {
        title: "Identified funding needs and funding options for validation",
        bullets: [
          "Need: insight into costs and relevant activities for initial validation (e.g. 1–6 months). Initiated efforts to secure funding for validation.",
          "Options: identified funding sources for initial validation.",
          "Status: initiated efforts to secure funding.",
        ],
      },
      3: {
        title: "Insight into overall funding options and their requirements",
        bullets: [
          "Need: draft of costs and activities in a development/project plan (e.g. 6–12 months); insight into overall funding needs. Secured initial funding for validation.",
          "Options: understanding of overall funding options, e.g. sources and types (own, soft, equity, loans) and their requirements.",
          "Status: secured sufficient funding to initiate validation, typically soft funding (grants).",
          "Pitch: a first presentation for funding, incl. description of key aspects relevant for funding, e.g. market potential.",
        ],
      },
      4: {
        title: "Pitch/presentation in place for next-stage funding",
        bullets: [
          "Need: defined development/project plan (e.g. 6–12 months) with cost budget, key risks, value-driving milestones, etc. Secured funding to initiate development.",
          "Options: identified relevant funding sources for next stages of the development/project plan.",
          "Status: secured sufficient funding to initiate at least the first step(s) of the development/project plan.",
          "Pitch: presentation for funding (oral and written), such as an investor pitch deck or funding application.",
        ],
      },
      5: {
        title: "Pitch for funding tested on relevant audience",
        bullets: [
          "Need: funding needs over time outlined with initial financial projections (P&L, budget).",
          "Options: defined possible funding roadmap with desirable funding sources/investors and impact on cap table.",
          "Status: possibly secured additional funding for next step(s) of the development plan, but still requiring more for the next stage.",
          "Pitch: tested on a relevant audience (e.g. pitched to an investor, submitted a funding application).",
        ],
      },
      6: {
        title: "Improved pitch for funding based on feedback",
        bullets: [
          "Need: funding needs clarified with more detailed financial projections (incl. cash-flow).",
          "Options: funding roadmap updated based on feedback and extended over time (e.g. seed, A-round, etc.).",
          "Status: discussions initiated with relevant funding sources (typically investors) on the ask (how much, for what, valuation).",
          "Pitch: improved presentation for funding based on feedback from a relevant audience.",
        ],
      },
      7: {
        title: "Term sheet level discussions with funding source(s)",
        bullets: [
          "Need: basic accounting in place shows financial status; different scenarios of funding needs outlined. All material in place to pass a due diligence for funding.",
          "Options: funding roadmap includes more detail on target sources over time and backup alternatives/scenarios.",
          "Status: concrete discussions (term sheet level) with one or several funding sources that are clearly interested.",
          "Pitch: presentation for funding also includes compiled supporting material to pass due diligence.",
        ],
      },
      8: {
        title: "Secured funding for at least 12 months of operations",
        bullets: [
          "Need: financial monitoring and accounting system enables control of financial status and forecasting of funding needs.",
          "Options: updated funding roadmap based on forecasts and business progress.",
          "Status: secured funding for at least ca. 12 months runway (funding received) or predictable recurring revenue.",
          "Pitch: presentation/pitch for funding developed to include a complete business plan.",
        ],
      },
      9: {
        title: "Long term funding strategy in place",
        bullets: [
          "Need: defined next needed funding reflecting scale-up plans, company performance, and financial status/forecast.",
          "Options: long-term funding strategy in place, covering e.g. scale-up of operations.",
          "Status: identified and established interest from suitable next-step funding sources for a longer runway.",
          "Pitch: presentation, business plan, and all necessary supporting material continuously updated.",
        ],
      },
    },
  },
};

export function getStageForLevel(metric, level) {
  if (level <= 0) return NOT_STARTED;
  return READINESS_LEVEL_GUIDE[metric]?.stages?.[level] ?? NOT_STARTED;
}
