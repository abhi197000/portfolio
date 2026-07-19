import { NextResponse } from "next/server";

// =============================================================================
// API KEY CONFIGURATION
// =============================================================================
// The API key is read from the environment variable COMPETITOR_ANALYSIS_API_KEY.
//
// For LOCAL development:
//   Create a .env.local file in the project root:
//     COMPETITOR_ANALYSIS_API_KEY=your-api-key-here
//
// For VERCEL deployment:
//   Add it in Vercel Dashboard → Settings → Environment Variables:
//     Key:   COMPETITOR_ANALYSIS_API_KEY
//     Value: your-api-key-here
//
// Supported providers (pick one):
//   - OpenAI (GPT-4): https://platform.openai.com/api-keys
//   - Google Gemini:   https://aistudio.google.com/app/apikey
//   - Perplexity AI:   https://www.perplexity.ai/settings/api (best for web search)
//
// The current implementation uses Perplexity AI for real-time web search + analysis.
// =============================================================================

const API_KEY = process.env.COMPETITOR_ANALYSIS_API_KEY || "";

const SYSTEM_PROMPT = `You are a competitive intelligence analyst. Given an industry and optional company name, provide a structured competitor analysis report. Include:

1. **Market Overview** - Brief overview of the industry landscape, market size, and growth trends.
2. **Top Competitors** - List 5-8 major players with:
   - Company name
   - Estimated market share (%)
   - Key strengths
   - Key weaknesses
   - Headquarters location
3. **Competitive Positioning** - How competitors differentiate themselves (price, quality, innovation, distribution, branding).
4. **Market Trends** - 3-5 emerging trends shaping the industry.
5. **Opportunities & Threats** - Key gaps in the market and potential threats for new entrants.
6. **Strategic Recommendations** - 3-5 actionable recommendations for someone entering or competing in this space.

Format your response as valid JSON with this structure:
{
  "industry": "string",
  "marketOverview": "string (2-3 sentences)",
  "marketSize": "string (e.g. $50B globally)",
  "growthRate": "string (e.g. 8.5% CAGR)",
  "competitors": [
    {
      "name": "string",
      "marketShare": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "hq": "string"
    }
  ],
  "positioning": [
    { "strategy": "string", "leaders": ["string"] }
  ],
  "trends": ["string"],
  "opportunities": ["string"],
  "threats": ["string"],
  "recommendations": ["string"]
}

Only return valid JSON. No markdown formatting, no code blocks, just the JSON object.`;

export async function POST(request) {
  try {
    const { industry, company, region } = await request.json();

    if (!industry || !industry.trim()) {
      return NextResponse.json(
        { error: "Industry type is required." },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        {
          error:
            "API key not configured. See the Setup Guide for instructions on adding your COMPETITOR_ANALYSIS_API_KEY.",
        },
        { status: 500 }
      );
    }

    let userPrompt = `Analyze the competitive landscape for the "${industry.trim()}" industry.`;
    if (company && company.trim()) {
      userPrompt += ` Focus the analysis relative to "${company.trim()}" as the reference company.`;
    }
    if (region && region.trim()) {
      userPrompt += ` Focus on the ${region.trim()} market.`;
    }
    userPrompt += ` Provide current, factual data from 2024-2025 where possible.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `API request failed (${response.status}): ${err}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from analysis API." },
        { status: 502 }
      );
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis response. Raw: " + content.substring(0, 200) },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: parsed });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error: " + e.message },
      { status: 500 }
    );
  }
}
