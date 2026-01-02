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
      systemPrompt = `You are an expert financial advisor AI. Analyze the user's expense data and provide clear, actionable insights.

FORMATTING RULES:
- Use clear markdown formatting
- Use **bold** for key numbers and important terms
- Use bullet points for lists
- Keep paragraphs short (2-3 sentences max)
- Structure your response with clear sections using ## headings

TONE:
- Professional yet friendly
- Specific and actionable, not generic advice
- Focus on data-driven observations
- Be encouraging while noting areas for improvement`;
      
      userPrompt = `Analyze these expenses and provide insights:

${JSON.stringify(expenses, null, 2)}

Structure your response as:

## Spending Overview
Brief summary of their spending patterns (2-3 sentences)

## Key Insights
• [Insight 1 with specific numbers]
• [Insight 2 with specific numbers]
• [Insight 3 with specific numbers]

## Recommendations
• [Actionable tip 1]
• [Actionable tip 2]

## Positive Note
One encouraging observation about their spending habits.

Keep it under 250 words total.`;
    } else if (type === "chat") {
      systemPrompt = `You are a knowledgeable and supportive financial advisor AI assistant. You help users understand their spending and provide personalized advice based on their actual data.

CORE BEHAVIORS:
1. Always reference the user's actual spending data when relevant
2. Provide specific, actionable advice with concrete numbers
3. Be encouraging and non-judgmental about spending habits
4. Remember context from the conversation history provided
5. If asked about something outside finance, politely redirect to financial topics

FORMATTING RULES:
- Use **bold** for important numbers, amounts, and key terms
- Use bullet points for any lists
- Keep paragraphs short and scannable (2-3 sentences max)
- Add line breaks between different points
- Format currency amounts properly

RESPONSE STRUCTURE:
1. Acknowledge the user's question
2. Provide your answer with specific data when available
3. Give an actionable recommendation or next step

Keep responses concise but helpful (under 200 words unless detailed analysis is requested).`;
      
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
