// app/api/plan/route.js
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",           // per prototipo; poi limita al tuo dominio
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const { profile, type } = await req.json();

    const system = `
Sei un coach certificato. Crea piani SEMPLICI e sicuri.
Regole:
- Adatta al profilo: età, sesso, livello, obiettivo, tempo disponibile, restrizioni.
- Linguaggio chiaro, punti elenco, tabelle Markdown.
- Evita linguaggio medico. Suggerisci visita medica se utente è principiante o ha patologie.
- Per l'allenamento: 3-6 sedute/settimana, riscaldamento, esercizi, serie/ripetizioni, RPE/rest, progressione settimanale.
- Per la dieta: stima calorie, distribuzione macro, 1 giornata tipo, 3 alternative pasti, lista spesa.
`;

    const user = `
TYPE: ${String(type || "").toUpperCase()}
PROFILO:
${JSON.stringify(profile ?? {}, null, 2)}

Output richiesto:
- Titolo del piano
- Riepilogo
- Tabella settimanale (giorno, sessione/pasti)
- Note di sicurezza e aderenza
- Consigli di progressione 4 settimane
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ ok: false, error: `OpenAI ${r.status}: ${t}` }, { status: 500, headers: corsHeaders });
    }

    const data = await r.json();
    const plan = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ ok: true, plan }, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500, headers: corsHeaders });
  }
}
