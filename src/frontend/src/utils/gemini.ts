export interface GeminiAnalysisResult {
  goldProbability: number;
  silverProbability: number;
  copperProbability: number;
  steelProbability: number;
  zincProbability: number;
  aluminiumProbability: number;
  titaniumProbability: number;
  nickelProbability: number;
  leadProbability: number;
  ironProbability: number;
  topMetal: string;
  purityRange: string;
  estimatedValueRange: string;
  confidenceLevel: string;
  visualClues: string[];
}

const MOCK_RESULTS: GeminiAnalysisResult = {
  goldProbability: 3,
  silverProbability: 65,
  copperProbability: 8,
  steelProbability: 12,
  zincProbability: 4,
  aluminiumProbability: 4,
  titaniumProbability: 1,
  nickelProbability: 2,
  leadProbability: 1,
  ironProbability: 0,
  topMetal: "silver",
  purityRange: "92-95% pure",
  estimatedValueRange: "$45-$60",
  confidenceLevel:
    "High - Strong visual characteristics match sterling silver. Cool white reflectivity and surface texture are definitive indicators.",
  visualClues: [
    "Bright white/cool color temperature characteristic of silver",
    "High reflectivity with near-mirror surface finish",
    "Minimal oxidation, surface tarnish pattern typical of sterling silver",
    "Smooth refined texture indicating high-purity metal",
    "No reddish or warm tones that would indicate copper content",
    "Color and luster consistent with sterling silver (92.5% Ag)",
  ],
};

const GEMINI_API_KEY = "AIzaSyCWZr1--ipjjt4MMK6cXxUjZVm8gbv5kMI";

export async function analyzeMetalImage(
  base64Image: string,
  mimeType = "image/jpeg",
  weightGrams?: number,
  dimensions?: string,
): Promise<GeminiAnalysisResult> {
  const apiKey =
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[MetalScanner] Gemini API key not configured. Using demo mode.",
    );
    await new Promise((r) => setTimeout(r, 2200));
    return MOCK_RESULTS;
  }

  const weightText = weightGrams ? ` The object weighs ${weightGrams}g.` : "";
  const dimsText = dimensions ? ` Dimensions: ${dimensions}.` : "";

  const prompt = `You are a professional metallurgist and metal identification expert. Analyze this image of a metal object and identify what metal or alloy it most likely is. Analyze these visual clues: color and hue (gold=yellow/warm, silver=white/cool, copper=reddish/orange, steel=gray, zinc=bluish-white, aluminium=light silver, titanium=silver-gray, nickel=silvery-white, lead=bluish-gray, iron=reddish-brown or gray), surface shine and reflectivity, rust/tarnish/oxidation patterns, visible stamps/hallmarks/markings, wear patterns and texture.${weightText}${dimsText} Return ONLY raw JSON with no markdown, no code blocks, no extra text. The JSON must have exactly these fields: goldProbability (integer 0-100), silverProbability, copperProbability, steelProbability, zincProbability, aluminiumProbability, titaniumProbability, nickelProbability, leadProbability, ironProbability (all must sum to exactly 100), topMetal (string: one of gold/silver/copper/steel/zinc/aluminium/titanium/nickel/lead/iron), purityRange (string like '92-95% pure'), estimatedValueRange (string like '$45-$55'), confidenceLevel (string starting with High/Medium/Low followed by dash and explanation), visualClues (array of 3-6 strings describing what you observed)`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  let text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip any markdown code fences
  text = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  const parsed = JSON.parse(text) as GeminiAnalysisResult;
  return parsed;
}
