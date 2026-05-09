import { Trophy, Star, Crown } from "lucide-react";

export type BadgeTier = "bronze" | "silver" | "gold";

export function getBadgeData(points: number) {
  if (points >= 200) {
    return {
      tier: "gold" as BadgeTier,
      label: "نجم أكاديمي",
      icon: <Crown className="h-4 w-4 text-amber-500 fill-amber-500/20" />,
      color: "bg-amber-500/10 text-amber-700 border-amber-200",
      hasCrown: true
    };
  }
  if (points >= 50) {
    return {
      tier: "silver" as BadgeTier,
      label: "مساهم نشط",
      icon: <Star className="h-4 w-4 text-slate-400 fill-slate-400/20" />,
      color: "bg-slate-500/10 text-slate-700 border-slate-200",
      hasCrown: false
    };
  }
  return {
    tier: "bronze" as BadgeTier,
    label: "مساهم مبتدئ",
    icon: <Trophy className="h-4 w-4 text-orange-400 fill-orange-400/20" />,
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
    hasCrown: false
  };
}

interface ReputationBadgeProps {
  points: number;
  showLabel?: boolean;
}

export default function ReputationBadge({ points, showLabel = true }: ReputationBadgeProps) {
  const badge = getBadgeData(points);

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black transition-all hover:scale-105 cursor-default ${badge.color}`}>
      {badge.icon}
      {showLabel && <span>{badge.label}</span>}
      {badge.hasCrown && <span className="ml-0.5">👑</span>}
    </div>
  );
}
