export function ScoreIndicator({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-500">—</span>;
  const tone = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-gray-400";
  return <span className={`font-mono font-semibold ${tone}`}>{score}</span>;
}