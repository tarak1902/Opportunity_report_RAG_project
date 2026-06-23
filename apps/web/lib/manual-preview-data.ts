export type ManualSamplePost = {
  subreddit: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
};

export const manualSamplePosts: ManualSamplePost[] = [
  {
    subreddit: "startups",
    title: "UPI transaction failures are increasing during peak hours",
    selftext:
      "Small businesses lose customers because payments fail and there is no retry or tracking system.",
    score: 320,
    num_comments: 85
  },
  {
    subreddit: "Entrepreneur",
    title: "Running ads on Instagram is getting too expensive",
    selftext:
      "Customer acquisition cost has doubled and small brands cannot sustain paid ads anymore.",
    score: 290,
    num_comments: 70
  },
  {
    subreddit: "smallbusiness",
    title: "Managing orders from WhatsApp, Instagram, and website is chaotic",
    selftext: "Orders come from multiple channels and there is no unified dashboard.",
    score: 310,
    num_comments: 60
  },
  {
    subreddit: "SaaS",
    title: "People are using ChatGPT but dont know how to automate workflows",
    selftext:
      "Non-tech users struggle to integrate AI into their daily business processes.",
    score: 400,
    num_comments: 95
  },
  {
    subreddit: "developersIndia",
    title: "Freelancers struggle to get consistent clients",
    selftext:
      "Platforms are saturated and getting first 10 clients is extremely hard.",
    score: 270,
    num_comments: 55
  },
  {
    subreddit: "startups",
    title: "Logistics delays in Tier 2 cities are still a big problem",
    selftext:
      "Delivery timelines are unreliable and tracking systems are not transparent.",
    score: 350,
    num_comments: 80
  },
  {
    subreddit: "Entrepreneur",
    title: "Small businesses cannot afford good CRM tools",
    selftext:
      "Most CRM tools are too expensive or too complex for small teams.",
    score: 260,
    num_comments: 50
  },
  {
    subreddit: "smallbusiness",
    title: "Hiring skilled employees quickly is difficult",
    selftext:
      "There is no fast hiring platform for small businesses in local areas.",
    score: 280,
    num_comments: 65
  }
];

export const manualPreviewReport = {
  title: "Commerce Ops Copilot For Indian SMBs",
  subtitle:
    "A lightweight operations layer that combines payment recovery, multichannel order management, and shipment visibility.",
  executiveSummary:
    "The strongest repeated signal in the supplied posts is not a single isolated pain point, but a cluster of operational failures that compound for small businesses: payments fail, orders arrive from too many channels, delivery timelines are unreliable, and existing CRM tools are too expensive. This creates a clear opportunity for a low-cost SMB operations product focused on Indian merchants and service businesses that already use WhatsApp, Instagram, UPI, and basic spreadsheets. The initial wedge is payment retry and order consolidation, with logistics visibility and simple CRM workflows layered in after early adoption.",
  whyNow: [
    "More small businesses now sell across WhatsApp, Instagram, and lightweight storefronts, but still operate without an internal ops stack.",
    "UPI dependence means transaction failure and reconciliation issues directly affect revenue, especially during peak periods.",
    "Merchants in Tier 2 cities are underserved by expensive enterprise tools and by fragmented point solutions."
  ],
  opportunitySignals: [
    "UPI payment failure and no retry/tracking system",
    "Multichannel order chaos across WhatsApp, Instagram, and websites",
    "Tier 2 logistics opacity and unreliable delivery timelines",
    "Affordable CRM and hiring workflows missing for small teams",
    "Non-technical business users want AI help but cannot automate workflows alone"
  ],
  targetUser:
    "Indian SMB operators, D2C founders, and local service businesses with 2-30 employees who already sell online but still manage operations manually.",
  productThesis:
    "Build a modular web app that starts as an order and payment recovery dashboard for small merchants. It should ingest order events from simple storefronts and chat-led sales flows, flag failed payments, trigger retry nudges, and give one place to track orders, customer status, and shipment exceptions. Once embedded in daily operations, AI workflow helpers can automate repetitive follow-ups and internal task routing.",
  mvpModules: [
    "Failed payment detection with retry workflows and merchant alerts",
    "Unified inbox for orders captured from WhatsApp, Instagram, and website forms",
    "Shipment delay board for Tier 2 and Tier 3 deliveries",
    "Simple CRM timeline for repeat customers and pending follow-ups",
    "AI-assisted workflow suggestions for non-technical operators"
  ],
  goToMarket: [
    "Start with D2C and Instagram-first merchants who already feel paid-ads pressure and need better retention and repeat conversion.",
    "Offer a low monthly price with clear ROI based on recovered payments and time saved in ops.",
    "Acquire initial users through freelancer operators, agencies, and local commerce communities serving small businesses."
  ],
  risks: [
    "The product can sprawl if the wedge is not kept narrow in the first release.",
    "Integrations with payment and commerce channels may vary widely across small merchants.",
    "Some merchants may see CRM or logistics as secondary until payment recovery proves value.",
    "A large incumbent could copy the broader suite, so the early moat has to come from workflow data and daily habit."
  ]
};
