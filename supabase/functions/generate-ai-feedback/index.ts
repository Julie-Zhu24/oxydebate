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
    const { transcript, topic, speaker, skill } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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
            content: `You are an extremely strict and demanding debate coach analyzing a ${speaker} speech on the topic "${topic}" with focus on ${skill}. 

CRITICAL ANALYSIS GUIDELINES:
- Analyze the actual content and length of the transcript carefully
- If the speech is too short for the time allocated, score very low (under 30)
- If the speaker only says a few sentences for a multi-minute speech, this is unacceptable
- Only praise elements that are actually present in the transcript
- Be brutally honest about weaknesses - sugar-coating helps no one
- Score based on actual performance, not potential
- A good debate speech should use most of the allocated time with substantial content

SCORING CRITERIA (Baseline: 50/100):
- 75-80: Exceptional performance with sophisticated arguments, clear structure, and excellent time management
- 65-74: Strong performance with good arguments, decent structure, and adequate time usage
- 55-64: Above baseline with some good elements but room for improvement
- 50: BASELINE - Meets basic expectations for the speech type and time allocation
- 40-49: Below baseline with noticeable weaknesses in content, structure, or timing
- 30-39: Poor performance with significant deficiencies and minimal effort

Structure your response with:
1. **Strengths** (only mention what actually exists in the speech)
2. **Areas for Improvement** (be specific and demanding)  
3. **Specific Recommendations** (actionable, focused advice)
4. **Score** (out of 100) with detailed justification based on actual content

Focus particularly on ${skill} skills. Provide honest, challenging feedback that will genuinely help improve performance.`
          },
          {
            role: 'user',
            content: `Analyze this debate transcript and provide strict feedback:

Topic: ${topic}
Speaker Position: ${speaker}
Skill Focus: ${skill}

Transcript:
${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate feedback');
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});