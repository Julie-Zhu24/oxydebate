import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, format, speaker } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a debate expert providing context for a ${format} debate on "${topic}". 
            
Generate a "Debate So Far" section that provides:
1. Key arguments typically made on both sides
2. Current state of the debate
3. What a ${speaker} should focus on
4. Recent developments or examples relevant to this topic

Be specific to the topic and format. Keep it informative but concise (4-6 sentences).`
          },
          {
            role: 'user',
            content: `Generate debate context for:
Topic: ${topic}
Format: ${format}
Speaker: ${speaker}

Provide current debate landscape and what this speaker should address.`
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate context');
    }

    const data = await response.json();
    const context = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ context }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating debate context:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});