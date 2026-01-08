import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Expense {
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

function generateEmailHTML(
  totalSpent: number,
  expenseCount: number,
  categories: CategorySummary[],
  aiInsights: string,
  currencySymbol: string = "R"
): string {
  const categoryRows = categories
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(
      (cat) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-transform: capitalize;">${cat.category}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${cat.total.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${cat.count}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        <h1 style="color: #1a1a1a; margin-bottom: 8px;">Your Weekly Spending Summary</h1>
        <p style="color: #666; margin-bottom: 32px;">Here's how you spent this week</p>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px 0; font-size: 14px;">Total Spent This Week</p>
          <h2 style="color: #fff; margin: 0; font-size: 36px;">${currencySymbol}${totalSpent.toFixed(2)}</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">${expenseCount} transactions</p>
        </div>
        
        <h3 style="color: #1a1a1a; margin-bottom: 16px;">Top Spending Categories</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; font-weight: 600;">Category</th>
              <th style="padding: 12px; text-align: right; font-weight: 600;">Amount</th>
              <th style="padding: 12px; text-align: center; font-weight: 600;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
        
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="color: #1a1a1a; margin: 0 0 16px 0;">💡 AI Insights</h3>
          <div style="color: #444; line-height: 1.6; white-space: pre-wrap;">${aiInsights}</div>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
          You're receiving this email because you enabled weekly summaries. 
          You can disable this in your app settings.
        </p>
      </div>
    </body>
    </html>
  `;
}

async function getAIInsights(expenses: Expense[], totalSpent: number): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey || expenses.length === 0) {
    return "Add more expenses to get personalized insights!";
  }

  try {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const prompt = `Analyze this week's spending data and provide 3 brief, actionable insights:
Total: ${totalSpent.toFixed(2)}
Categories: ${JSON.stringify(categoryTotals)}
Transaction count: ${expenses.length}

Keep each insight to 1-2 sentences. Focus on patterns and savings opportunities.`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful financial advisor. Be concise and practical." },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return "Keep tracking your expenses to see spending patterns!";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Keep tracking your expenses!";
  } catch (error) {
    console.error("AI insights error:", error);
    return "Keep tracking your expenses to see spending patterns!";
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with weekly summary enabled
    const { data: preferences, error: prefError } = await supabase
      .from("email_preferences")
      .select("user_id, email_address")
      .eq("weekly_summary_enabled", true);

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    console.log(`Found ${preferences?.length || 0} users with weekly summary enabled`);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStartDate = oneWeekAgo.toISOString().split("T")[0];

    let emailsSent = 0;

    for (const pref of preferences || []) {
      if (!pref.email_address) {
        console.log(`Skipping user ${pref.user_id} - no email address`);
        continue;
      }

      // Get user's expenses for the past week
      const { data: expenses, error: expError } = await supabase
        .from("expenses")
        .select("amount, category, description, date")
        .eq("user_id", pref.user_id)
        .gte("date", weekStartDate)
        .order("date", { ascending: false });

      if (expError) {
        console.error(`Error fetching expenses for user ${pref.user_id}:`, expError);
        continue;
      }

      if (!expenses || expenses.length === 0) {
        console.log(`No expenses for user ${pref.user_id} this week`);
        continue;
      }

      // Calculate summary
      const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const categoryMap = new Map<string, CategorySummary>();

      expenses.forEach((e) => {
        const existing = categoryMap.get(e.category) || { category: e.category, total: 0, count: 0 };
        existing.total += Number(e.amount);
        existing.count += 1;
        categoryMap.set(e.category, existing);
      });

      const categories = Array.from(categoryMap.values());

      // Get AI insights
      const aiInsights = await getAIInsights(expenses, totalSpent);

      // Generate and send email
      const html = generateEmailHTML(totalSpent, expenses.length, categories, aiInsights);

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Expense Tracker <onboarding@resend.dev>",
          to: [pref.email_address],
          subject: `Your Weekly Spending Summary - R${totalSpent.toFixed(2)}`,
          html,
        }),
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text();
        console.error(`Error sending email to ${pref.email_address}:`, emailError);
        continue;
      }

      emailsSent++;
      console.log(`Email sent to ${pref.email_address}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-weekly-summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
