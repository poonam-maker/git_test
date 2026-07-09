// Creator / business content templates.
// A template pre-configures the processing pipeline and copy tone so a
// non-technical user picks an intent ("Talking-head", "Business promo") instead
// of tuning knobs. Templates are data, not code — easy to extend or sell as packs.

export type TemplateKey =
  | "talking-head"
  | "vlog"
  | "business-promo"
  | "testimonial"
  | "educational";

export interface ContentTemplate {
  key: TemplateKey;
  name: string;
  description: string;
  audience: "creator" | "business" | "both";
  emoji: string;
  defaults: {
    /** target length of each generated clip, seconds */
    targetClipSeconds: number;
    /** how aggressively to trim silence (0..1) */
    silenceAggressiveness: number;
    captionStyle: string; // key into CAPTION_STYLES
    tone: string; // seeds copy generation
    ctaExamples: string[];
  };
}

export const CAPTION_STYLES: Record<
  string,
  { label: string; className: string; placement: "top" | "center" | "bottom" }
> = {
  "bold-bottom": {
    label: "Bold Bottom",
    className: "font-extrabold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.9)]",
    placement: "bottom",
  },
  "karaoke-center": {
    label: "Karaoke Center",
    className: "font-bold text-yellow-300 uppercase tracking-wide",
    placement: "center",
  },
  "clean-top": {
    label: "Clean Top",
    className: "font-medium text-white",
    placement: "top",
  },
  "minimal-bottom": {
    label: "Minimal Bottom",
    className: "font-semibold text-white/90",
    placement: "bottom",
  },
};

export const TEMPLATES: Record<TemplateKey, ContentTemplate> = {
  "talking-head": {
    key: "talking-head",
    name: "Talking-head",
    description:
      "For creators speaking to camera. Tight cuts, punchy captions, hook-first.",
    audience: "creator",
    emoji: "🎤",
    defaults: {
      targetClipSeconds: 35,
      silenceAggressiveness: 0.8,
      captionStyle: "bold-bottom",
      tone: "energetic",
      ctaExamples: ["Follow for more", "Save this for later"],
    },
  },
  vlog: {
    key: "vlog",
    name: "Vlog",
    description:
      "Story-driven daily content. Looser pacing, moments over information.",
    audience: "creator",
    emoji: "📹",
    defaults: {
      targetClipSeconds: 45,
      silenceAggressiveness: 0.5,
      captionStyle: "clean-top",
      tone: "casual",
      ctaExamples: ["Come along next time", "Subscribe for the journey"],
    },
  },
  "business-promo": {
    key: "business-promo",
    name: "Business Promo",
    description:
      "Promote a product, service, or offer. Clear value prop and strong CTA.",
    audience: "business",
    emoji: "📣",
    defaults: {
      targetClipSeconds: 30,
      silenceAggressiveness: 0.85,
      captionStyle: "minimal-bottom",
      tone: "professional",
      ctaExamples: ["Book a call", "Shop now", "Link in bio"],
    },
  },
  testimonial: {
    key: "testimonial",
    name: "Testimonial",
    description:
      "Turn customer praise into social proof clips with quote captions.",
    audience: "business",
    emoji: "⭐",
    defaults: {
      targetClipSeconds: 30,
      silenceAggressiveness: 0.7,
      captionStyle: "karaoke-center",
      tone: "warm",
      ctaExamples: ["See more reviews", "Join happy customers"],
    },
  },
  educational: {
    key: "educational",
    name: "Educational clip",
    description:
      "Teach one idea per clip. Numbered hooks, clear takeaways, save-worthy.",
    audience: "both",
    emoji: "🎓",
    defaults: {
      targetClipSeconds: 40,
      silenceAggressiveness: 0.75,
      captionStyle: "karaoke-center",
      tone: "educational",
      ctaExamples: ["Follow for daily tips", "Save this"],
    },
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export function getTemplate(key: string | null | undefined): ContentTemplate {
  if (key && key in TEMPLATES) return TEMPLATES[key as TemplateKey];
  return TEMPLATES["talking-head"];
}
