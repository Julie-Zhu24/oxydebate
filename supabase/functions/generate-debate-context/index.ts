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
            content: `You are a debate moderator generating realistic context for a ${format} debate on the specific topic: "${topic}". The current speaker is ${speaker}.

CRITICAL REQUIREMENTS:
- Generate content that is specifically relevant to the exact topic: "${topic}"
- Create realistic arguments that previous speakers would actually make on this topic
- Include specific examples, statistics, or policy details relevant to "${topic}"
- Make the context feel like a real debate, not generic debate content
- Consider what side (government/opposition or pro/con) would realistically argue about "${topic}"

Generate a detailed summary of what has been debated so far, including:
- Specific arguments that would realistically be made about "${topic}"
- Real-world examples or case studies relevant to "${topic}"
- Concrete policy implications or stakeholder impacts for "${topic}"
- Actual points of clash that would emerge when debating "${topic}"
- Strategic advice for what this ${speaker} should focus on given the topic

Make it feel like you're sitting in an actual debate about "${topic}" - be specific, realistic, and topic-focused.`
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