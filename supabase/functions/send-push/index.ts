/**
 * send-push — Supabase Edge Function for delivering web push notifications.
 *
 * Called by pg_cron hourly with type 'check', or manually with 'morning'/'evening'.
 * Reads user_settings to determine whether the current UTC hour matches a
 * configured notification time, then sends push messages to all stored
 * subscriptions via VAPID-authenticated Web Push protocol.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ApplicationServer,
  type ApplicationServerOptions,
} from "jsr:@negrel/webpush";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MESSAGES: Record<string, { title: string; body: string }> = {
  morning: { title: "wintrack", body: "What's the grind for today?" },
  evening: { title: "wintrack", body: "Time to reflect on your day" },
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Determine notification type for this invocation
    let notificationType: "morning" | "evening" | null = null;

    if (type === "morning" || type === "evening") {
      // Direct invocation for testing — skip hour check
      notificationType = type;
    } else if (type === "check") {
      // Hourly cron check — compare current UTC hour against user settings
      const { data: settings } = await supabase
        .from("user_settings")
        .select("morning_prompt_hour, evening_prompt_hour")
        .single();

      if (!settings) {
        return new Response(
          JSON.stringify({ message: "No user settings found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const currentUtcHour = new Date().getUTCHours();

      if (currentUtcHour === settings.morning_prompt_hour) {
        notificationType = "morning";
      } else if (currentUtcHour === settings.evening_prompt_hour) {
        notificationType = "evening";
      } else {
        return new Response(
          JSON.stringify({
            message: "Not notification time",
            currentUtcHour,
            morningHour: settings.morning_prompt_hour,
            eveningHour: settings.evening_prompt_hour,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'check', 'morning', or 'evening'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch all push subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subsError) {
      throw subsError;
    }

    if (!subs?.length) {
      return new Response(
        JSON.stringify({ message: "No subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build push message payload
    const message = MESSAGES[notificationType] ?? MESSAGES.morning;
    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      tag: "wintrack-reminder",
    });

    // Create VAPID application server
    const appServerOptions: ApplicationServerOptions = {
      contactInformation: "mailto:admin@wintrack.app",
      vapidKeys: {
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey,
      },
    };
    const appServer = await ApplicationServer.new(appServerOptions);

    let sentCount = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subs) {
      try {
        const subscriber = appServer.subscribe({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        });

        await subscriber.pushTextMessage(payload, {});
        sentCount++;
      } catch (pushError: unknown) {
        // Handle 410 Gone — subscription expired, clean up
        const err = pushError as { statusCode?: number; status?: number };
        if (err.statusCode === 410 || err.status === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error(
            `[send-push] Failed to send to ${sub.endpoint}:`,
            pushError,
          );
        }
      }
    }

    // Remove stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);

      console.log(
        `[send-push] Cleaned up ${staleEndpoints.length} stale subscription(s)`,
      );
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${sentCount} notification(s)`,
        type: notificationType,
        sent: sentCount,
        staleRemoved: staleEndpoints.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-push] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
