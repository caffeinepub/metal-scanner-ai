// Gemini AI service for metal analysis
const GEMINI_API_KEY = "AIzaSyAlnjrjZHgctA7424EwvUuhp8S6Nl-u-Io";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiMetalResult {
  topMetal: string;
  probabilities: {
    gold: number;
    silver: number;
    copper: number;
    steel: number;
    zinc: number;
    aluminium: number;
    titanium: number;
    nickel: number;
    lead: number;
    iron: number;
  };
  purityEstimate: number | null;
  estimatedValueUSD: number | null;
  confidenceLevel: "High" | "Medium" | "Low";
  confidenceScore: number;
  visualClues: string[];
  explanation: string;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeMetalWithGemini(
  images: File[],
  hintMetal?: string,
  weightGrams?: number | null,
  dimensionsMm?: [number, number, number] | null,
): Promise<GeminiMetalResult> {
  const imageParts = await Promise.all(
    images.map(async (file) => ({
      inlineData: {
        mimeType: file.type || "image/jpeg",
        data: await fileToBase64(file),
      },
    })),
  );

  const weightInfo = weightGrams ? `Weight: ${weightGrams}g. ` : "";
  const dimInfo = dimensionsMm
    ? `Dimensions: ${dimensionsMm[0]}mm x ${dimensionsMm[1]}mm x ${dimensionsMm[2]}mm. `
    : "";
  const hintInfo =
    hintMetal && hintMetal !== "autoDetect" && hintMetal !== "unknown"
      ? `User suspects this might be ${hintMetal}. `
      : "";

  const prompt = `You are a professional metallurgist and materials scientist. Analyze the metal object in the image(s) carefully.

${weightInfo}${dimInfo}${hintInfo}

Analyze these visual properties:
1. Color and hue: gold=warm yellow, silver=cool white/mirror, copper=reddish-orange, steel=medium gray, zinc=bluish-white dull, aluminium=light silver matte, titanium=dark silver-gray, nickel=silvery-yellow tint, lead=very dark bluish-gray dull, iron=reddish-brown or dark gray
2. Surface reflectivity: silver and gold are highly reflective, aluminium is moderately reflective but duller, steel is medium, lead is very dull
3. Oxidation/rust/tarnish: iron=red rust, copper=green patina, silver=dark tarnish, aluminium=white powder oxidation
4. Surface texture, stamps, hallmarks, markings
5. Wear patterns

CRITICAL DISTINCTIONS:
- Silver vs Aluminium: Silver has very high mirror-like reflectivity and cool white color; aluminium is lighter and more matte/dull in reflectivity
- Gold vs Brass/Copper: Gold has warm yellow hue with high reflectivity; copper is distinctly orange-red
- Steel vs Iron: Steel is lighter gray, more uniform; iron is darker and more prone to rust

Return ONLY this raw JSON with NO markdown, NO code blocks, NO extra text:
{
  "topMetal": "the most likely metal name in lowercase",
  "probabilities": {
    "gold": 0,
    "silver": 0,
    "copper": 0,
    "steel": 0,
    "zinc": 0,
    "aluminium": 0,
    "titanium": 0,
    "nickel": 0,
    "lead": 0,
    "iron": 0
  },
  "purityEstimate": null,
  "estimatedValueUSD": null,
  "confidenceLevel": "High",
  "confidenceScore": 85,
  "visualClues": ["clue 1", "clue 2", "clue 3"],
  "explanation": "Brief explanation of analysis"
}

Rules:
- All probability values must be integers 0-100 and sum to exactly 100
- purityEstimate: integer 0-100 (only for gold/silver/copper/platinum, otherwise null)
- estimatedValueUSD: estimated USD value per gram based on current market (null for non-precious metals)
- confidenceLevel: "High" (>80%), "Medium" (60-80%), "Low" (<60%)
- confidenceScore: integer 0-100
- visualClues: list of 3-5 specific visual observations that led to this conclusion`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }, ...imageParts],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData as any)?.error?.message || `API error ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed: GeminiMetalResult = JSON.parse(cleaned);

  const sum = Object.values(parsed.probabilities).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 5) {
    const scale = 100 / sum;
    for (const key of Object.keys(
      parsed.probabilities,
    ) as (keyof typeof parsed.probabilities)[]) {
      parsed.probabilities[key] = Math.round(parsed.probabilities[key] * scale);
    }
  }

  return parsed;
}
