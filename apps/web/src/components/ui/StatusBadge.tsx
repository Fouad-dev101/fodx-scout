export function StatusBadge({
  tone = "neutral", children,
}: { tone?: "neutral" | "success" | "warning" | "danger"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-bg-muted text-gray-300 border-border",
    success: "bg-emerald-950 text-emerald-300 border-emerald-900",
    warning: "bg-amber-950 text-amber-300 border-amber-900",
    danger: "bg-red-950 text-red-300 border-red-900",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs border rounded ${tones[tone]}`}>
      {children}
    </span>
  );
}