type JsonRecord = Record<string, unknown>;

export type NormalizedReportPayload = {
  subtitle: string;
  tags: string[];
  executiveSummary: string;
  problemStatement: string;
  solutionThesis: string;
  targetMarket: {
    tam: string;
    sam: string;
    som: string;
    geography: string;
    demographics: string;
  };
  competitorAnalysis: {
    direct: string[];
    indirect: string[];
    densityScore: number | null;
    wedge: string;
  };
  scorecard: {
    marketReadiness: number | null;
    demandSignal: number | null;
    techFeasibility: number | null;
    capitalEfficiency: number | null;
    founderFit: number | null;
    regulatoryRisk: number | null;
    scalability: number | null;
    defensibility: number | null;
    timing: number | null;
    overall: number | null;
  };
  executionPlan: {
    phases: string[];
    milestones: string[];
    teamRequired: string[];
  };
  financials: {
    capex: string;
    opexMonthly: string;
    breakEvenMonths: number | null;
    revenueModel: string;
  };
  riskFactors: string[];
  moatStrategy: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function asScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(10, value));
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(10, parsed));
    }
  }
  return null;
}

function asInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }
  return null;
}

export function normalizeReportPayload(value: unknown): NormalizedReportPayload {
  const payload = isRecord(value) ? value : {};
  const targetMarket = isRecord(payload.target_market) ? payload.target_market : {};
  const competitorAnalysis = isRecord(payload.competitor_analysis)
    ? payload.competitor_analysis
    : {};
  const scorecard = isRecord(payload.scorecard) ? payload.scorecard : {};
  const executionPlan = isRecord(payload.execution_plan) ? payload.execution_plan : {};
  const financials = isRecord(payload.financials) ? payload.financials : {};

  return {
    subtitle: asString(payload.subtitle),
    tags: asStringArray(payload.tags),
    executiveSummary: asString(payload.executive_summary),
    problemStatement: asString(payload.problem_statement),
    solutionThesis: asString(payload.solution_thesis),
    targetMarket: {
      tam: asString(targetMarket.tam),
      sam: asString(targetMarket.sam),
      som: asString(targetMarket.som),
      geography: asString(targetMarket.geography),
      demographics: asString(targetMarket.demographics)
    },
    competitorAnalysis: {
      direct: asStringArray(competitorAnalysis.direct),
      indirect: asStringArray(competitorAnalysis.indirect),
      densityScore: asScore(competitorAnalysis.density_score),
      wedge: asString(competitorAnalysis.wedge)
    },
    scorecard: {
      marketReadiness: asScore(scorecard.market_readiness),
      demandSignal: asScore(scorecard.demand_signal),
      techFeasibility: asScore(scorecard.tech_feasibility),
      capitalEfficiency: asScore(scorecard.capital_efficiency),
      founderFit: asScore(scorecard.founder_fit),
      regulatoryRisk: asScore(scorecard.regulatory_risk),
      scalability: asScore(scorecard.scalability),
      defensibility: asScore(scorecard.defensibility),
      timing: asScore(scorecard.timing),
      overall: asScore(scorecard.overall)
    },
    executionPlan: {
      phases: asStringArray(executionPlan.phases),
      milestones: asStringArray(executionPlan.milestones),
      teamRequired: asStringArray(executionPlan.team_required)
    },
    financials: {
      capex: asString(financials.capex),
      opexMonthly: asString(financials.opex_monthly),
      breakEvenMonths: asInteger(financials.break_even_months),
      revenueModel: asString(financials.revenue_model)
    },
    riskFactors: asStringArray(payload.risk_factors),
    moatStrategy: asString(payload.moat_strategy)
  };
}
