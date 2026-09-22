interface WeeklyValue {
  done: number;
  target: number;
}

interface Props {
  bigFour: Record<string, WeeklyValue>;
  compact?: boolean;
}

const DOMAIN_ORDER = ["body", "capability", "home", "money"] as const;
const LABELS: Record<(typeof DOMAIN_ORDER)[number], string> = {
  body: "Body",
  capability: "Career",
  home: "Self",
  money: "Money",
};

export function BigFourRadar({ bigFour, compact = false }: Props) {
  const cx = 90;
  const cy = 88;
  const radius = 58;
  const value = (slug: string) => {
    const item = bigFour[slug];
    if (!item || item.target <= 0) return 0;
    return Math.max(0, Math.min(1, item.done / item.target));
  };
  const coordinates = DOMAIN_ORDER.map((slug, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const r = radius * value(slug);
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  });
  const polygon = coordinates.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const guide = [0.5, 1].map((fraction) => DOMAIN_ORDER.map((_, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    return `${(cx + Math.cos(angle) * radius * fraction).toFixed(1)},${(cy + Math.sin(angle) * radius * fraction).toFixed(1)}`;
  }).join(" "));

  return (
    <div>
      <svg viewBox="0 0 180 180" role="img" aria-label="This week's Big Four balance" className={`mx-auto w-full ${compact ? "max-w-[180px]" : "max-w-[240px]"}`}>
        {guide.map((points, index) => <polygon key={points} points={points} className="fill-none stroke-zinc-800" strokeWidth={index === 0 ? 1 : 1.5} />)}
        <line x1={cx} y1="30" x2={cx} y2="146" className="stroke-zinc-800" strokeWidth="1" />
        <line x1="32" y1={cy} x2="148" y2={cy} className="stroke-zinc-800" strokeWidth="1" />
        <polygon points={polygon} className="fill-sky-500/15 stroke-sky-400" strokeWidth="2" strokeLinejoin="round" />
        {coordinates.map(([x, y], index) => <circle key={DOMAIN_ORDER[index]} cx={x} cy={y} r="3.3" className="fill-sky-300" />)}
        <text x="90" y="16" textAnchor="middle" className="fill-zinc-400 text-[10px]">Body</text>
        <text x="165" y="91" textAnchor="end" className="fill-zinc-400 text-[10px]">Career</text>
        <text x="90" y="171" textAnchor="middle" className="fill-zinc-400 text-[10px]">Self</text>
        <text x="15" y="91" className="fill-zinc-400 text-[10px]">Money</text>
      </svg>
      {!compact && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600">
          {DOMAIN_ORDER.map((slug) => {
            const item = bigFour[slug];
            return <div key={slug} className="flex justify-between"><span>{LABELS[slug]}</span><span>{item ? `${Math.min(item.done, item.target)}/${item.target}` : "0/1"}</span></div>;
          })}
        </div>
      )}
    </div>
  );
}
