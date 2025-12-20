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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "insights") {
      systemPrompt = `You are a friendly, expert financial advisor AI. Analyze the user's expense data and provide clear, actionable insights.

FORMATTING RULES (IMPORTANT):
- Use clear markdown formatting
- Use **bold** for key numbers and important terms
- Use bullet points (•) for lists
- Keep paragraphs short (2-3 sentences max)
- Use emoji sparingly but effectively for visual appeal
- Structure your response with clear sections

TONE:
- Warm and encouraging, like a helpful friend
- Specific and actionable, not generic advice
- Focus on positive observations while gently noting areas for improvement`;
      
      userPrompt = `Analyze these expenses and provide insights:

${JSON.stringify(expenses, null, 2)}

Structure your response as:

## 📊 Spending Overview
Brief summary of their spending patterns (2-3 sentences)

## 💡 Key Insights
• [Insight 1 with specific numbers]
• [Insight 2 with specific numbers]
• [Insight 3 with specific numbers]

## 💰 Smart Tips
• [Actionable tip 1]
• [Actionable tip 2]

## ✨ Great Job!
One encouraging observation about their spending habits.

Keep it under 250 words total.`;
    } else if (type === "chat") {
      systemPrompt = `You are a warm, knowledgeable financial advisor AI assistant. You help users understand their spending and provide personalized advice.

FORMATTING RULES (CRITICAL - follow these exactly):
- Use **bold** for important numbers, amounts, and key terms
- Use bullet points (•) for any lists
- Keep paragraphs short and scannable (2-3 sentences max)
- Add line breaks between different points
- Use emoji occasionally for visual warmth 💡💰✨
- For numbers, always format with currency symbol

PERSONALITY:
- Friendly and supportive, never judgmental
- Give specific, actionable advice
- Reference their actual data when relevant
- Keep responses concise but helpful (under 200 words)

RESPONSE STRUCTURE:
When giving advice, use this format:
1. Brief acknowledgment of their question
2. Key insight or answer (with specific data if available)
3. Actionable recommendation`;
      
      userPrompt = expenses.message;
    }

    console.log("Calling Lovable AI Gateway with type:", type);

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-insights function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
