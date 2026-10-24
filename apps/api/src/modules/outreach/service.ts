import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import { createProviderFromEnv } from "../../agent/providers/openai.js";
import { createOllamaProvider } from "../../agent/providers/ollama.js";
import type { GenerateDraftInput } from "@fodx/shared";

const LANG_NAMES: Record<string, string> = {
  fr: "French", "ar-MA": "Moroccan Arabic (Darija)", ar: "Modern Standard Arabic", en: "English",
};
const STYLE_HINT: Record<string, string> = {
  friendly_local: "warm, local, respectful, short",
  professional: "professional, concise, direct",
  concise: "very short, no more than 4 sentences",
  consultative: "consultative, ask one thoughtful question",
  premium: "premium agency tone, calm confidence",
};

function buildFallbackDraft(args: {
  businessName: string;
  hasWebsite: boolean;
  language: string;
}): string {
  const name = args.businessName;
  if (args.language === "fr") {
    return `Bonjour,

Je me permets de vous contacter au sujet de ${name}. Je développe des sites web pour des entreprises locales et je n'ai pas trouvé de site officiel récent dans les sources publiques que j'ai consultées. Si vous avez déjà envisagé une présence en ligne pour présenter vos services et faciliter la prise de contact, je serais ravi d'en discuter.

Bonne journée.`;
  }
  if (args.language === "en") {
    return `Hello,

I'm reaching out about ${name}. I build websites for local businesses and didn't find an official site in the public sources I checked. If you've considered an online presence to showcase your services and make it easier for customers to reach you, I'd be glad to discuss.

Best regards.`;
  }
  return `مرحباً،

أتواصل معكم بخصوص ${name}. أقوم بتطوير مواقع إلكترونية للشركات المحلية ولم أجد موقعاً رسمياً في المصادر العامة التي راجعتها. إذا كنتم تفكرون في تواجد على الإنترنت لعرض خدماتكم وتسهيل التواصل، يسعدني أن نتحدث.

مع تحياتي.`;
}

export async function generateDraft(input: GenerateDraftInput): Promise<{
  id: string; language: string; style: string; subject: string | null; body: string;
}> {
  const lead = db.prepare(
    "SELECT l.id, b.name, b.category, b.city, b.website_url, b.website_status, b.opportunity_score FROM leads l JOIN businesses b ON b.id = l.business_id WHERE l.id = ?"
  ).get(input.leadId) as {
    id: string; name: string; category: string | null; city: string | null;
    website_url: string | null; website_status: string; opportunity_score: number | null;
  } | undefined;
  if (!lead) throw new Error("Lead not found");

  const evidence = db.prepare("SELECT claim FROM evidence WHERE business_id = (SELECT business_id FROM leads WHERE id = ?) LIMIT 8")
    .all(input.leadId) as Array<{ claim: string }>;

  let provider = createProviderFromEnv();
  if (!provider) provider = createOllamaProvider();

  let body: string;
  let subject: string | null = null;

  if (provider && provider.isConfigured()) {
    const evidenceText = evidence.length > 0
      ? evidence.map((e) => `- ${e.claim}`).join("\n")
      : "(No evidence recorded — omit specific claims about the business.)";
    const prompt = `Write a short outreach message in ${LANG_NAMES[input.language] ?? "French"} with a ${STYLE_HINT[input.style] ?? "friendly"} tone.

Business: ${lead.name}
Category: ${lead.category ?? "unknown"}
City: ${lead.city ?? "unknown"}
Website URL in source: ${lead.website_url ?? "none"}
Website status: ${lead.website_status}

Verified evidence:
${evidenceText}

Rules:
- Only claim things supported by the evidence above.
- If you have no website evidence, do NOT say the business lacks a website — say you didn't find one in the sources you checked.
- Do not claim you visited, called, or audited anything.
- Do not invent names, phone numbers, or relationships.
- Keep the message under 120 words.
${input.language === "fr" ? "Format: first line is a subject line prefixed with 'Sujet: ', then a blank line, then the body." : ""}`;

    const resp = await provider.chat({
      tools: [],
      messages: [
        { role: "system", content: "You write careful, honest outreach messages. Never fabricate facts." },
        { role: "user", content: prompt },
      ],
    });
    const content = (resp.content ?? "").trim();
    const m = content.match(/^(?:Sujet|Subject|الموضوع)\s*:\s*(.+)\n+/i);
    if (m) { subject = m[1].trim(); body = content.slice(m[0].length).trim(); }
    else { body = content; }
  } else {
    body = buildFallbackDraft({
      businessName: lead.name, hasWebsite: !!lead.website_url, language: input.language,
    });
  }

  const id = nanoid();
  db.prepare(`
    INSERT INTO outreach_drafts (id, lead_id, language, style, subject, body, approved)
    VALUES (?,?,?,?,?,?,0)
  `).run(id, input.leadId, input.language, input.style, subject, body);

  return { id, language: input.language, style: input.style, subject, body };
}