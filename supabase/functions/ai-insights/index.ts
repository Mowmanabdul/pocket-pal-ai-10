import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expenses, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "insights") {
      systemPrompt = `You are an expert financial advisor AI specializing in personal finance analysis. Your goal is to provide insightful, data-driven advice that helps users improve their financial health.

ANALYSIS APPROACH:
1. First, identify the key patterns in the data
2. Calculate meaningful percentages and comparisons
3. Provide specific, actionable recommendations
4. Be encouraging while being honest about areas for improvement

FORMATTING RULES:
- Use clear markdown formatting with **bold** for key numbers
- Use bullet points for lists
- Keep paragraphs short (2-3 sentences max)
- Structure with clear ## headings
- Include specific amounts and percentages

TONE:
- Professional yet warm and approachable
- Data-driven with specific numbers
- Encouraging but honest
- Personalized to their actual spending`;
      
      userPrompt = `Analyze these expenses and provide insights:

${JSON.stringify(expenses, null, 2)}

Structure your response as:

## Spending Overview
Brief 2-3 sentence summary with key totals and main spending areas.

## Key Insights
• [Insight 1 with specific amounts/percentages]
• [Insight 2 with specific amounts/percentages]  
• [Insight 3 with comparison or trend]

## Smart Recommendations
• [Specific actionable tip based on their data]
• [Second actionable tip]

## Keep It Up
One specific positive observation about their habits.

Keep under 250 words.`;
    } else if (type === "chat") {
      systemPrompt = `You are an expert AI financial advisor with deep knowledge of personal finance, budgeting, saving strategies, and spending psychology. You have access to the user's actual expense data and use it to provide personalized, actionable advice.

CORE EXPERTISE:
- Personal budgeting and expense tracking
- Identifying spending patterns and opportunities to save
- Category-specific advice (food, transport, entertainment, etc.)
- Goal-setting and financial planning
- Behavioral finance and spending psychology

YOUR APPROACH:
1. Always reference the user's ACTUAL data when relevant
2. Be specific with numbers - say "You spent $X on Y" not "You spend a lot on Y"
3. Provide actionable next steps, not just observations
4. Remember the conversation context - build on previous exchanges
5. If asked something outside finance, briefly acknowledge then redirect

PERSONALITY:
- Warm, supportive, and non-judgmental
- Confident but not preachy
- Practical and realistic
- Celebrates wins, constructive about challenges

FORMATTING:
- Use **bold** for key numbers and important terms
- Use bullet points for any lists (3-5 items max)
- Short paragraphs (2-3 sentences)
- Add line breaks between sections
- Format currency amounts clearly

RESPONSE LENGTH:
- Quick questions: 2-3 sentences
- Analysis requests: 100-150 words with structure
- Detailed breakdowns: up to 200 words

Always end with an actionable suggestion or offer to dive deeper into a specific area.`;
      
      userPrompt = expenses.message;
    }

    console.log(`Processing ${type} request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`AI gateway error: ${status}`);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const errorText = await response.text();
      console.error("AI gateway response:", errorText);
      return new Response(JSON.stringify({ error: "Unable to process your request. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully streaming ${type} response`);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-insights function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
