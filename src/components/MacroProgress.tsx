import { motion } from 'framer-motion';

interface MacroProgressProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  colorClass: string;
  bgClass: string;
}

export const MacroProgress = ({
  label,
  current,
  goal,
  unit = 'g',
  colorClass,
  bgClass,
}: MacroProgressProps) => {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {current}/{goal}{unit}
        </span>
      </div>
      <div className={`h-2 rounded-full ${bgClass} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
};
