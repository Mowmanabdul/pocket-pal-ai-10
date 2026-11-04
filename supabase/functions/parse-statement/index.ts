import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_IMAGE_CHARS = 4_500_000; // ~3.3MB per base64 image

const SYSTEM_PROMPT = `You are a bank statement reader. You receive one or more images of bank statement pages or receipt-style transaction lists.

Your job: extract EVERY transaction row visible in the images.

Return STRICT JSON only, no markdown, in this shape:
{"transactions":[{"date":"YYYY-MM-DD","description":"merchant or narration","amount":-12.34}]}

Rules:
- "date": the transaction (posted) date, formatted YYYY-MM-DD. If the year is missing, infer the most recent year that makes the date not in the future.
- "description": the merchant name or transaction narration. Clean up reference numbers unless they identify the merchant.
- "amount": signed number. Money IN (credits, deposits, salary) is POSITIVE. Money OUT (debits, card purchases, fees, withdrawals) is NEGATIVE. Ignore currency symbols.
- Include card purchases, EFTs, transfers out, fees, airtime, interest, and deposits.
- EXCLUDE balance columns, running balances, account summaries, and headers.
- If a page has no transactions, return an empty list for it.
- Read carefully: amounts must match the statement exactly, including decimals.
- Never invent transactions that are not visible.`;

function jsonFromContent(content: string): any {
  const cleaned = content.replace(/```json/gi, "```").split("```").filter(Boolean);
  const candidates = [content, ...cleaned];
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start > -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        // try next candidate
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the caller's session token
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Please sign in again" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Please sign in again to import statements" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const images: unknown = body?.images;
    if (!Array.isArray(images) || images.length === 0 || images.length > 4 ||
        images.some((i) => typeof i !== "string" || !i.startsWith("data:image/") || i.length > MAX_IMAGE_CHARS)) {
      return new Response(JSON.stringify({ error: "Invalid statement images" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [
      { type: "text", text: "Extract all transactions from these bank statement page(s). Respond with strict JSON only." },
      ...images.map((url: string) => ({ type: "image_url", image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      const status = res.status;
      const errText = await res.text().catch(() => "");
      console.error(`AI gateway error ${status}: ${errText.slice(0, 500)}`);
      const message =
        status === 429 ? "Rate limit reached. Please try again in a moment."
        : status === 402 ? "AI credits exhausted. Please add credits to continue."
        : "Couldn't read the statement right now. Please try again.";
      return new Response(JSON.stringify({ error: message }), {
        status: status === 429 || status === 402 ? status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const parsed = jsonFromContent(text);
    const transactions = Array.isArray(parsed?.transactions) ? parsed.transactions : null;
    if (!transactions) {
      console.error("Unparseable AI response:", text.slice(0, 300));
      return new Response(JSON.stringify({ error: "Couldn't read transactions from these images" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ transactions }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-statement:", error);
    return new Response(JSON.stringify({ error: "Statement reading failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
