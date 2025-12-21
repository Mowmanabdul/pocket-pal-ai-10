import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`Processing recurring expenses for date: ${today}`);

    // Get all active recurring expenses where next_occurrence is today or earlier
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('is_active', true)
      .lte('next_occurrence', today);

    if (fetchError) {
      console.error('Error fetching recurring expenses:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringExpenses?.length || 0} recurring expenses to process`);

    let createdCount = 0;

    for (const recurring of recurringExpenses || []) {
      // Create the expense
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          user_id: recurring.user_id,
          amount: recurring.amount,
          category: recurring.category,
          description: recurring.description ? `${recurring.description} (recurring)` : 'Recurring expense',
          date: recurring.next_occurrence,
        });

      if (insertError) {
        console.error(`Error creating expense for recurring ${recurring.id}:`, insertError);
        continue;
      }

      createdCount++;
      console.log(`Created expense for recurring ${recurring.id}`);

      // Calculate next occurrence
      const currentDate = new Date(recurring.next_occurrence);
      let nextDate: Date;

      if (recurring.frequency === 'weekly') {
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        // monthly
        nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const nextOccurrence = nextDate.toISOString().split('T')[0];

      // Update the next_occurrence date
      const { error: updateError } = await supabase
        .from('recurring_expenses')
        .update({ next_occurrence: nextOccurrence })
        .eq('id', recurring.id);

      if (updateError) {
        console.error(`Error updating next_occurrence for ${recurring.id}:`, updateError);
      } else {
        console.log(`Updated next_occurrence for ${recurring.id} to ${nextOccurrence}`);
      }
    }

    console.log(`Successfully processed ${createdCount} recurring expenses`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        created: createdCount,
        processed: recurringExpenses?.length || 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing recurring expenses:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
