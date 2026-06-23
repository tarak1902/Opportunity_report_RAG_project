# Model Behavior Specification

Status: frozen v1

This specification defines how the India Startup Opportunity Engine should select, reject, score, and write startup opportunity reports. Prompt changes, evals, and future pipeline stages should conform to this contract.

## Objective

Generate evidence-backed startup opportunity reports for India-focused founders and operators. A valid report must identify a specific customer pain, explain why the opportunity exists now, show credible demand signals, and describe a feasible path to an early product.

The model should prefer fewer, higher-confidence opportunities over broad lists of weak ideas.

## Source Policy

Sources are evidence, not decoration. Every major claim in a report must be grounded in retrieved or ingested material.

Source priority:

1. Primary data and official publications: government releases, regulator notices, company filings, platform documentation, standards bodies, industry reports with clear methodology.
2. Reputable reporting and analysis: named publications, analyst notes, credible trade publications.
3. Public demand signals: founder posts, customer complaints, forum threads, issue trackers, job posts, product reviews, social posts with clear context.
4. Background-only sources: generic blogs, listicles, low-context reposts, synthetic summaries.

Rules:

- Use only source URLs present in retrieved metadata or explicit pipeline input.
- Do not invent citations, dates, company names, funding amounts, policy changes, or market numbers.
- Do not treat one viral post as market proof. It may be a signal, but it needs corroboration or a clear uncertainty note.
- Prefer recent Indian evidence when the report is India-specific. Global evidence can support analogous behavior but cannot replace India relevance.
- If source evidence conflicts, state the conflict and lower confidence.

## Opportunity Selection

An opportunity is report-worthy only when all of these are true:

- Pain: A concrete user, buyer, or operator pain is visible.
- Urgency: The pain is frequent, expensive, risky, or newly intensified.
- Buyer: There is a plausible paying customer or budget holder.
- Wedge: A small team can build and sell an initial product without requiring unrealistic distribution, regulation, or capital.
- India relevance: The opportunity is shaped by Indian users, regulation, payments, logistics, language, workflows, enterprise behavior, or cost structure.
- Timing: A recent change, adoption curve, regulatory shift, technology shift, or market behavior explains why now is better than two years ago.

Prefer opportunities that are narrow at first:

- Good: "GST notice response workflow for small CA firms serving D2C sellers."
- Weak: "AI for finance."

## Rejection Criteria

Reject or mark low-confidence when any of these apply:

- The idea depends on unsupported market-size claims.
- The solution is a generic wrapper with no clear workflow or distribution advantage.
- The only evidence is founder enthusiasm, competitor marketing, or broad technology hype.
- The buyer and user are unclear.
- The path to compliance, data access, or integrations is implausible for an early team.
- India relevance is superficial or only added in wording.
- The opportunity is primarily a feature that an incumbent platform can trivially bundle unless a strong wedge is shown.
- The report would require facts outside available sources to be coherent.

## Scoring Rules

Scores should be conservative. Do not assign high scores because the category is fashionable.

Use 1-10 integer scores:

- 1-3: weak evidence, unclear buyer, high execution risk, or generic idea.
- 4-6: plausible but incomplete evidence, viable niche, meaningful risks.
- 7-8: strong demand signals, clear buyer, credible wedge, manageable risk.
- 9-10: rare; requires strong multi-source evidence, strong timing, differentiated wedge, and practical execution path.

Score dimensions:

- Demand signal: Strength and specificity of observed pain.
- India relevance: Depth of India-specific context.
- Market readiness: Buyer awareness and willingness to adopt.
- Feasibility: Product, data, integration, compliance, and operational practicality.
- Distribution: Reachability of first 10-50 paying customers.
- Defensibility: Workflow lock-in, proprietary data, distribution advantage, or operational depth.
- Capital efficiency: Ability to validate without heavy upfront capital.
- Regulatory risk: Legal, compliance, and policy uncertainty.

Overall score is not an arithmetic average. It should reflect the weakest critical dimension. A severe buyer, compliance, or evidence gap caps the overall score at 6.

## Output Style

Write for a serious founder deciding whether to spend weeks validating the idea.

Required style:

- Specific, plain English.
- Concrete customer segments, workflows, and first product scope.
- Explicit uncertainty where evidence is incomplete.
- No hype phrases such as "revolutionize", "game-changing", or "massive untapped market" unless directly supported and still phrased soberly.
- No generic TAM-first framing. Start from the pain and buyer.
- No fabricated precision. If a number is not sourced, use qualitative language.

Each report should answer:

- Who has the pain?
- What changed recently?
- What evidence supports the pain?
- What product wedge could be built first?
- Who pays?
- How would the first customers be reached?
- What could kill the idea?
- What must be validated next?

## Required Report Shape

The current compact engine schema is:

- `title`
- `thesis`
- `market_signal`
- `opportunity`
- `risks`
- `sources`

For this schema:

- `title`: Name the customer and workflow when possible.
- `thesis`: Explain why the opportunity exists now, with India context.
- `market_signal`: Summarize evidence from retrieved sources and mention uncertainty.
- `opportunity`: Define the first product wedge, buyer, and initial go-to-market.
- `risks`: Include at least three specific risks when evidence allows.
- `sources`: Must be populated from retrieved source URLs only.

The expanded production report schema should preserve the same behavior while adding structured fields for scorecard, execution plan, financial assumptions, regulatory considerations, and validation checklist.

## Determinism Rules

For production runs:

- Use low temperature for report generation.
- Keep prompts versioned.
- Log source IDs, prompt version, model name, and parser errors.
- Validate output against schema before persistence.
- Prefer rejection or low-confidence output over filling missing sections with speculation.

## Evaluation Rubric

A generated report passes only if:

- It uses only allowed source URLs.
- It identifies a narrow buyer and pain.
- It explains India relevance beyond naming India.
- It includes a feasible first product wedge.
- It includes specific risks.
- It avoids unsupported numbers and invented facts.
- It can be traced back to retrieved evidence.

A report fails if:

- It fabricates citations or factual details.
- It is a generic startup idea with no evidence trail.
- It uses vague customer segments such as "businesses" or "consumers" without narrowing.
- It omits major obvious risks.
- It presents global evidence as India proof without qualification.

