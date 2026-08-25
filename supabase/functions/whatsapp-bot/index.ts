import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const META_PHONE_ID = Deno.env.get("META_PHONE_ID")!;
const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper per inviare messaggi via Meta API
async function sendWhatsAppMessage(to: string, payload: any) {
  const url = `https://graph.facebook.com/v17.0/${META_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      ...payload
    }),
  });
  return res.json();
}

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Verifica Webhook Inbound (Richiesto da Meta alla configurazione)
  if (req.method === "GET" && url.searchParams.get("hub.mode") === "subscribe") {
    if (url.searchParams.get("hub.verify_token") === VERIFY_TOKEN) {
      return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    const body = await req.json();

    // 2. TRIGGER DA META (Risposte Interactive Bottoni)
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      
      if (message && message.type === "interactive") {
        const payload = message.interactive.button_reply?.id;
        const fromPhone = message.from; 
        
        if (payload === "UPGRADE_REQ") {
          // Log alert in Dashboard
          await supabase.from("admin_alerts").insert({
            type: "UPGRADE_REQUEST",
            message: `Richiesta piano Premium (Elite) dal numero WhatsApp: ${fromPhone}`,
            status: "pending"
          });

          // Messaggio di cortesia testo libero (consentito entro le 24h)
          await sendWhatsAppMessage(fromPhone, {
            type: "text",
            text: { body: "Ottima scelta. Il team L.O.T.O. ti contatterà domani mattina per attivare il tuo piano Elite senza interrompere il tuo lavoro." }
          });
        }
      }
      return new Response("OK", { status: 200 });
    }

    // 3. TRIGGER DA DATABASE (Onboarding / Associazione NFC)
    if (body.type === "UPDATE" && body.table === "pois") {
      const newRec = body.record;
      const oldRec = body.old_record;

      // Condizione: NFC attivato ora per la prima volta
      if (newRec.nfc_activated_at && !oldRec.nfc_activated_at && newRec.b2b_phone) {
        
        await sendWhatsAppMessage(newRec.b2b_phone, {
          type: "template",
          template: {
            name: "loto_onboarding_welcome", // TEMPLATE A su Meta
            language: { code: "it" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: newRec.name }] // {{1}} Nome POI o Partner
              }
            ]
          }
        });
      }
      return new Response("DB Webhook processed", { status: 200 });
    }

    // 4. TRIGGER DA PG_CRON (Report Serali)
    if (body.action === "send_daily_reports") {
      // Generazione ottimizzata lato SQL per evitare fetch pesanti
      const { data: reports, error } = await supabase.rpc("generate_daily_b2b_reports");
      if (error) return new Response(error.message, { status: 500 });

      for (const report of reports) {
        const { b2b_phone, poi_name, b2b_plan, checkins_count, whispers_count, whisper_1, whisper_2 } = report;
        
        if (!b2b_phone) continue;

        if (b2b_plan === "freemium") {
          // TEMPLATE B (Upsell)
          await sendWhatsAppMessage(b2b_phone, {
            type: "template",
            template: {
              name: "loto_daily_freemium",
              language: { code: "it" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: poi_name },
                    { type: "text", text: checkins_count.toString() },
                    { type: "text", text: whispers_count.toString() }
                  ]
                }
              ]
            }
          });
        } else if (b2b_plan === "premium") {
          // TEMPLATE C (Ritenzione)
          await sendWhatsAppMessage(b2b_phone, {
            type: "template",
            template: {
              name: "loto_daily_premium",
              language: { code: "it" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: poi_name },
                    { type: "text", text: checkins_count.toString() },
                    { type: "text", text: whisper_1 || "Nessun nuovo whisper" },
                    { type: "text", text: whisper_2 || "Nessun nuovo whisper" }
                  ]
                }
              ]
            }
          });
        }
      }
      return new Response("Daily reports sent", { status: 200 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
