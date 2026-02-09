import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "michael@zelbel.de";
const FROM_EMAIL = "Querino <noreply@querino.ai>";

type EventType = "signup" | "subscribe" | "unsubscribe" | "delete_account";

interface NotifyRequest {
  eventType: EventType;
  userEmail: string;
  userId?: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-ADMIN] ${step}${detailsStr}`);
};

function getSubjectLine(eventType: EventType, userEmail: string): string {
  switch (eventType) {
    case "signup":
      return `🎉 New User Signup: ${userEmail}`;
    case "subscribe":
      return `💳 New Subscription: ${userEmail}`;
    case "unsubscribe":
      return `⚠️ Subscription Cancelled: ${userEmail}`;
    case "delete_account":
      return `🗑️ Account Deleted: ${userEmail}`;
    default:
      return `Querino Event: ${userEmail}`;
  }
}

function getEmailBody(event: NotifyRequest): string {
  const { eventType, userEmail, userId, displayName, metadata } = event;
  const timestamp = new Date().toISOString();
  const name = displayName || "Unknown";
  
  let actionDescription = "";
  let details = "";
  
  switch (eventType) {
    case "signup":
      actionDescription = "A new user has signed up for Querino!";
      details = `
        <p><strong>User Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>User ID:</strong> ${userId || "N/A"}</li>
          <li><strong>Display Name:</strong> ${name}</li>
          <li><strong>Timestamp:</strong> ${timestamp}</li>
        </ul>
      `;
      break;
      
    case "subscribe":
      actionDescription = "A user has subscribed to Querino Premium!";
      details = `
        <p><strong>Subscription Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>User ID:</strong> ${userId || "N/A"}</li>
          <li><strong>Display Name:</strong> ${name}</li>
          <li><strong>Mode:</strong> ${metadata?.mode || "live"}</li>
          <li><strong>Product ID:</strong> ${metadata?.productId || "N/A"}</li>
          <li><strong>Timestamp:</strong> ${timestamp}</li>
        </ul>
      `;
      break;
      
    case "unsubscribe":
      actionDescription = "A user has cancelled their Querino Premium subscription.";
      details = `
        <p><strong>Cancellation Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>User ID:</strong> ${userId || "N/A"}</li>
          <li><strong>Display Name:</strong> ${name}</li>
          <li><strong>Timestamp:</strong> ${timestamp}</li>
        </ul>
      `;
      break;
      
    case "delete_account":
      actionDescription = "A user has permanently deleted their Querino account.";
      details = `
        <p><strong>Deletion Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>User ID:</strong> ${userId || "N/A"}</li>
          <li><strong>Display Name:</strong> ${name}</li>
          <li><strong>Timestamp:</strong> ${timestamp}</li>
        </ul>
      `;
      break;
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        ul { background: white; padding: 15px 15px 15px 35px; border-radius: 6px; border: 1px solid #e5e7eb; }
        li { margin: 8px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Querino Admin Notification</h1>
        </div>
        <div class="content">
          <p>${actionDescription}</p>
          ${details}
        </div>
        <div class="footer">
          <p>This is an automated notification from Querino.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    logStep("Resend API key verified");
    
    const resend = new Resend(resendKey);
    
    const payload: NotifyRequest = await req.json();
    logStep("Received notification request", { 
      eventType: payload.eventType, 
      userEmail: payload.userEmail 
    });
    
    if (!payload.eventType || !payload.userEmail) {
      throw new Error("Missing required fields: eventType and userEmail");
    }
    
    const subject = getSubjectLine(payload.eventType, payload.userEmail);
    const html = getEmailBody(payload);
    
    logStep("Sending email", { to: ADMIN_EMAIL, subject });
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject,
      html,
    });
    
    if (error) {
      logStep("Resend error", { error });
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    logStep("Email sent successfully", { messageId: data?.id });
    
    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
