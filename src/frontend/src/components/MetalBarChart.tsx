import { METALS } from "../utils/metals";

interface MetalBarChartProps {
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
  topMetal?: string;
}

const PROB_MAP: Record<string, keyof MetalBarChartProps> = {
  gold: "goldProbability",
  silver: "silverProbability",
  copper: "copperProbability",
  steel: "steelProbability",
  zinc: "zincProbability",
  aluminium: "aluminiumProbability",
  titanium: "titaniumProbability",
  nickel: "nickelProbability",
  lead: "leadProbability",
  iron: "ironProbability",
};

export default function MetalBarChart(props: MetalBarChartProps) {
  const bars = METALS.map((m) => ({
    key: m.key,
    label: m.label,
    value: (props[PROB_MAP[m.key]] as number) ?? 0,
    color: m.color,
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-2">
      {bars.map((bar) => (
        <div key={bar.key} className="flex items-center gap-3">
          <div className="w-20 text-xs text-right" style={{ color: bar.color }}>
            {bar.label}
          </div>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(bar.value, bar.value > 0 ? 2 : 0)}%`,
                backgroundColor: bar.color,
                opacity: props.topMetal === bar.key ? 1 : 0.65,
                boxShadow:
                  props.topMetal === bar.key
                    ? `0 0 8px ${bar.color}80`
                    : "none",
              }}
            />
          </div>
          <div
            className="w-10 text-xs font-mono text-right"
            style={{ color: bar.color }}
          >
            {bar.value}%
          </div>
        </div>
      ))}
    </div>
  );
}
