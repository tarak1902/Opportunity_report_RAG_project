import { z } from "zod";

export const subscriptionStatusSchema = z.enum([
  "inactive",
  "active",
  "grace_period",
  "paused",
  "cancelled"
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const reportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  subtitle: z.string().min(3),
  generated_date: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  executive_summary: z.string(),
  problem_statement: z.string(),
  solution_thesis: z.string(),
  target_market: z.object({
    tam: z.string(),
    sam: z.string(),
    som: z.string(),
    geography: z.string(),
    demographics: z.string()
  }),
  competitor_analysis: z.object({
    direct: z.array(z.string()),
    indirect: z.array(z.string()),
    density_score: z.number().min(0).max(10)
  }),
  scorecard: z.object({
    market_readiness: z.number().min(1).max(10),
    demand_signal: z.number().min(1).max(10),
    tech_feasibility: z.number().min(1).max(10),
    capital_efficiency: z.number().min(1).max(10),
    founder_fit: z.number().min(1).max(10),
    regulatory_risk: z.number().min(1).max(10),
    scalability: z.number().min(1).max(10),
    defensibility: z.number().min(1).max(10),
    timing: z.number().min(1).max(10),
    overall: z.number().min(1).max(10)
  }),
  execution_plan: z.object({
    phases: z.array(z.string()),
    milestones: z.array(z.string()),
    team_required: z.array(z.string())
  }),
  financials: z.object({
    capex: z.string(),
    opex_monthly: z.string(),
    break_even_months: z.number().int().nonnegative(),
    revenue_model: z.string()
  }),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      source: z.string(),
      date: z.string().optional()
    })
  ),
  risk_factors: z.array(z.string()),
  moat_strategy: z.string()
});

export type Report = z.infer<typeof reportSchema>;

export type SeatAllocationEvent = {
  user_id: string;
  subscription_id: string;
  allocated_at: string;
};

export type IngestionRecord = {
  id: string;
  source: "x" | "reddit" | "hackernews";
  payload_url: string;
  item_count: number;
  fetched_at: string;
};

export type RetrievalQuery = {
  query: string;
  namespaces: string[];
  top_k: number;
};

export type RetrievalResult = {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, string | number | boolean | null>;
};
