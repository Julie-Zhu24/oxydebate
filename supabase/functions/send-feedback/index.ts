import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  name?: string;
  email?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: FeedbackRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Oxymorona <onboarding@resend.dev>",
      to: ["juliezhu.ziyang@gmail.com"],
      subject: `New feedback from ${name || 'Anonymous'}`,
      html: `
        <h2>New feedback received</h2>
        <p><strong>From:</strong> ${name || 'Anonymous'} (${email || 'N/A'})</p>
        <p><strong>Message:</strong></p>
        <p>${(message || '').replace(/\n/g, '<br/>')}</p>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
