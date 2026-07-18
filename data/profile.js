// This is the data file used by the website. Update this file to change content.

export const profile = {
  name: "Abhimanyu Sheoran",
  role: "Senior AI Analyst | Supply Chain & Inventory Optimization",
  tagline:
    "I build AI-driven supply chain and inventory optimization products that turn complex retail data into decisions that reduce stockouts, excess inventory, and costs.",
  email: "sheoranabhimanyu25@gmail.com",
  location: "Bengaluru, India",

  socials: [
    { label: "LinkedIn", url: "https://bit.ly/3HMPb3a" },
    { label: "Email", url: "mailto:sheoranabhimanyu25@gmail.com" },
  ],

  about: [
    "I'm a Senior AI Analyst at Impact Analytics, building AI-driven supply chain and inventory optimization products for global retail clients. I specialize in MOQ optimization across complex vendor constraints, agentic AI dashboards, and demand forecasting across 10M+ SKUs.",
    "I joined Impact Analytics as a Business Analyst in June 2024 and was promoted to Senior AI Analyst within 17 months, reflecting end-to-end ownership from product design through development and analytics-driven optimization. Earlier, I built quantitative trading algorithms at William O'Neil + Co.",
    "I hold a B.E. (Hons.) in Mechanical Engineering from BITS Pilani, Goa. Outside work, I enjoy sports and previously served as Sports Secretary at BITS Goa, where I led the annual sports fest and grew its revenue fivefold.",
  ],

  skills: [
    "Python",
    "SQL",
    "Excel / Google Sheets",
    "Agentic AI Solutioning",
    "Supply Chain & Inventory Optimization",
    "MOQ & Order Optimization",
    "Demand Forecasting",
    "Product Management",
    "KPI Tracking & Dashboarding",
    "Gap Analysis",
    "Stakeholder Management",
    "Cross-functional Collaboration",
  ],
};

export const achievements = [
  {
    title: "Promoted to Senior AI Analyst in 17 months",
    year: "2025",
    description: "Promoted from Business Analyst in recognition of product ownership and measurable client impact.",
  },
  {
    title: "18% stockout reduction across 10M+ SKUs",
    year: "2024–25",
    description: "Implemented safety-stock strategies for three international retail clients, improving supply chain efficiency.",
  },
  {
    title: "95% demand forecast accuracy",
    year: "2024–25",
    description: "Led Vendor-to-Store product development, contributing to a 20% reduction in excess inventory.",
  },
  {
    title: "12% reduction in operational costs",
    year: "2024–25",
    description: "Streamlined workflows and strategic recommendations while increasing process compliance by 20%.",
  },
  {
    title: "20% portfolio growth in six months",
    year: "2023",
    description: "Built Python-based quantitative trading algorithms using statistical models and technical indicators.",
  },
  {
    title: "Fivefold sports-fest revenue growth",
    year: "2022–23",
    description: "Grew BITS Goa's annual sports fest revenue from INR 3M to INR 15M through sponsorships, marketing, and operations.",
  },
];

export const experience = [
  {
    role: "Senior AI Analyst",
    company: "Impact Analytics, Bengaluru",
    period: "Nov 2025 – Present",
    highlights: [
      "Re-architected MOQ optimization so clients can place cost-optimal orders while satisfying vendor constraints at every supply-hierarchy level.",
      "Redesigned the analytics dashboard around an agentic AI approach, proactively surfacing stockout management, upcoming orders, and pending orders.",
      "Promoted from Business Analyst within 17 months for product ownership and measurable client impact.",
    ],
  },
  {
    role: "Business Analyst",
    company: "Impact Analytics, Bengaluru",
    period: "Jun 2024 – Nov 2025",
    highlights: [
      "Implemented safety-stock strategies across three international clients and 10M+ SKUs, reducing stockouts by 18%.",
      "Led the Vendor-to-Store module from product design through analytics-driven optimization, achieving 95% forecast accuracy and 20% less excess inventory.",
      "Identified 10+ critical process inefficiencies, raised compliance by 20%, cut operational costs by 12%, and resolved 25+ recurring challenges to accelerate delivery by 15%.",
    ],
  },
  {
    role: "Quantitative Analyst Intern",
    company: "William O'Neil + Co, Remote",
    period: "Jul 2023 – Dec 2023",
    highlights: [
      "Developed Python-based quantitative trading algorithms for portfolio management.",
      "Applied statistical models, moving averages, and Bollinger Bands to create signals that increased portfolio value by 20% in six months.",
    ],
  },
  {
    role: "Sports Secretary, Student Council",
    company: "BITS Pilani KK Birla Goa Campus",
    period: "Aug 2022 – Jul 2023",
    highlights: [
      "Elected by a community of 3,000+ students to manage sports activities and organize the annual sports fest.",
      "Grew fest revenue fivefold through sponsorship acquisition, marketing campaigns, and operations leadership.",
    ],
  },
];

export const education = [
  {
    degree: "B.E. (Hons.) Mechanical Engineering",
    institution: "BITS Pilani – KK Birla Goa Campus",
    period: "2020 – 2024",
    detail: "CGPA: 7.47 / 10",
  },
];

export const languages = ["English (fluent)", "Hindi (native)"];

export const milestones = [
  { year: "Nov 2025", title: "Promoted to Senior AI Analyst — Impact Analytics", description: "Took ownership of MOQ optimization and an agentic AI analytics dashboard." },
  { year: "Jun 2024", title: "Joined Impact Analytics as Business Analyst", description: "Began building inventory optimization solutions for global retail clients." },
  { year: "Jul 2023", title: "Quantitative Analyst Intern — William O'Neil + Co", description: "Built Python-based trading algorithms and statistical signal models." },
  { year: "Aug 2022", title: "Elected Sports Secretary — BITS Pilani Goa", description: "Led campus sports activities and the annual sports fest." },
  { year: "2020", title: "Started B.E. (Hons.) Mechanical Engineering", description: "BITS Pilani, KK Birla Goa Campus; graduated in 2024." },
];

export const projects = [
  { title: "MOQ Optimization Engine", description: "Re-architected minimum-order-quantity solutioning for cost-optimal orders that meet vendor constraints across the supply hierarchy.", tags: ["Optimization", "Supply Chain", "Python"], url: "" },
  { title: "Agentic AI Dashboard", description: "Redesigned the client dashboard to proactively surface stockout management, upcoming orders, and pending orders.", tags: ["Agentic AI", "Analytics", "Product Design"], url: "" },
  { title: "Vendor-to-Store Module", description: "End-to-end product development delivering 95% demand forecast accuracy and 20% less excess inventory.", tags: ["Forecasting", "Product Management"], url: "" },
  { title: "Quantitative Trading Strategies", description: "Python algorithms using moving averages and Bollinger Bands to generate trading signals and grow a portfolio 20% in six months.", tags: ["Python", "Quant Finance"], url: "" },
];

export const agents = [
  {
    id: "schema-compare",
    title: "Schema Comparison Agent",
    subtitle: "BigQuery Schema Analyzer",
    description:
      "Compare BigQuery table schemas across multiple GCP projects and datasets. Instantly spot column mismatches, type differences, and missing fields to maintain consistency across client deployments or environments.",
    tags: ["BigQuery", "Schema Analysis", "GCP", "Data Quality"],
    status: "live",
  },
];
