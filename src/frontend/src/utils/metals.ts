import { MetalType } from "../backend";

export interface MetalInfo {
  key: string;
  label: string;
  color: string;
  description: string;
  type: MetalType | null;
}

export const METALS: MetalInfo[] = [
  {
    key: "gold",
    label: "Gold",
    color: "#FFD700",
    description: "Yellow/warm hue, high reflectivity",
    type: MetalType.gold,
  },
  {
    key: "silver",
    label: "Silver",
    color: "#C7CBD1",
    description: "White/cool hue, mirror-like shine",
    type: MetalType.silver,
  },
  {
    key: "copper",
    label: "Copper",
    color: "#C8743A",
    description: "Reddish/orange color, distinctive patina",
    type: MetalType.copper,
  },
  {
    key: "steel",
    label: "Steel",
    color: "#71797E",
    description: "Gray, matte to brushed finish",
    type: MetalType.steel,
  },
  {
    key: "zinc",
    label: "Zinc",
    color: "#B8C4C2",
    description: "Bluish-white, slightly dull surface",
    type: MetalType.zinc,
  },
  {
    key: "aluminium",
    label: "Aluminium",
    color: "#A8A9AD",
    description: "Light silver, low density appearance",
    type: MetalType.aluminium,
  },
  {
    key: "titanium",
    label: "Titanium",
    color: "#878681",
    description: "Silver-gray, dark matte tones",
    type: MetalType.titanium,
  },
  {
    key: "nickel",
    label: "Nickel",
    color: "#D4D2CA",
    description: "Silvery-white, hard bright finish",
    type: MetalType.nickel,
  },
  {
    key: "lead",
    label: "Lead",
    color: "#7F7679",
    description: "Bluish-gray, soft dull surface",
    type: MetalType.lead,
  },
  {
    key: "iron",
    label: "Iron",
    color: "#A0522D",
    description: "Reddish-brown or gray, prone to rust",
    type: null,
  }, // iron not in MetalType
];

export function getMetalInfo(key: string): MetalInfo | undefined {
  return METALS.find((m) => m.key === key.toLowerCase());
}

export function getMetalColor(key: string): string {
  return getMetalInfo(key)?.color ?? "#A1A6AE";
}

export function topMetalToMetalType(topMetal: string): MetalType {
  const info = getMetalInfo(topMetal);
  return info?.type ?? MetalType.unknown_;
}

export function getConfidenceColor(level: string): string {
  const upper = level.toUpperCase();
  if (upper.startsWith("HIGH")) return "#22c55e";
  if (upper.startsWith("MEDIUM")) return "#eab308";
  return "#ef4444";
}

export function getConfidenceLabel(level: string): "High" | "Medium" | "Low" {
  const upper = level.toUpperCase();
  if (upper.startsWith("HIGH")) return "High";
  if (upper.startsWith("MEDIUM")) return "Medium";
  return "Low";
}

export function formatTimestamp(ts: bigint): string {
  // Backend timestamps are in nanoseconds
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}
