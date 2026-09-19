/**
 * AI financial assistant service.
 *
 * No AI_API_KEY is configured yet, so every call below returns a clearly
 * labeled "not configured" response instead of failing the request. This
 * keeps the rest of the app (dashboard, portfolio, expenses) fully working
 * even though the AI feature is not wired up.
 *
 * To enable it later:
 *   1. Set AI_API_KEY in backend/.env
 *   2. Optionally set AI_API_URL / AI_MODEL if not using the OpenAI-compatible
 *      default below
 *   3. Nothing else in the app needs to change - controllers call the
 *      functions in this file, not a specific provider.
 */

const NOT_CONFIGURED_MESSAGE =
  "Coming Soon";

function isConfigured() {
  return !!process.env.AI_API_KEY;
}

function unavailableResponse(kind) {
  return {
    available: false,
    kind,
    summary: NOT_CONFIGURED_MESSAGE,
    observations: [],
    risks: [],
    opportunities: [],
    dataPoints: [],
    limitations: ["AI provider not configured."],
  };
}

async function callModel(systemPrompt, userPrompt) {
  const apiUrl = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider responded with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

const GUARDRAIL_PROMPT =
  "You are a financial research assistant inside a personal finance and simulated-investment app. " +
  "Only use the structured data provided to you. Never guarantee returns, never claim certainty about " +
  "future prices, never fabricate data that was not given to you, and never imply that simulated " +
  "purchases are real brokerage transactions. Frame investment observations as research, analysis, and " +
  "risk considerations rather than advice or predictions. Keep responses concise and factual.";

async function analyzePortfolio(portfolioData) {
  if (!isConfigured()) return unavailableResponse("portfolio");
  try {
    const text = await callModel(
      GUARDRAIL_PROMPT,
      `Analyze this simulated portfolio data and summarize performance, concentration, and allocation. Data: ${JSON.stringify(
        portfolioData
      )}`
    );
    return { available: true, kind: "portfolio", summary: text };
  } catch (error) {
    return { ...unavailableResponse("portfolio"), summary: "AI insights are temporarily unavailable." };
  }
}

async function analyzeExpenses(expenseData) {
  if (!isConfigured()) return unavailableResponse("expenses");
  try {
    const text = await callModel(
      GUARDRAIL_PROMPT,
      `Analyze this expense and income data and summarize spending trends, top categories, and savings opportunities. Data: ${JSON.stringify(
        expenseData
      )}`
    );
    return { available: true, kind: "expenses", summary: text };
  } catch (error) {
    return { ...unavailableResponse("expenses"), summary: "AI insights are temporarily unavailable." };
  }
}

async function researchStock(stockData) {
  if (!isConfigured()) return unavailableResponse("stock");
  try {
    const text = await callModel(
      GUARDRAIL_PROMPT,
      `Explain what this stock's available metrics mean and their limitations. Do not predict future price. Data: ${JSON.stringify(
        stockData
      )}`
    );
    return { available: true, kind: "stock", summary: text };
  } catch (error) {
    return { ...unavailableResponse("stock"), summary: "AI insights are temporarily unavailable." };
  }
}

module.exports = { isConfigured, analyzePortfolio, analyzeExpenses, researchStock };
