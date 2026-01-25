import { motion } from 'framer-motion';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export const CalorieRing = ({ consumed, goal, size = 200 }: CalorieRingProps) => {
  const remaining = Math.max(0, goal - consumed);
  const percentage = Math.min((consumed / goal) * 100, 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          className="text-4xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {remaining}
        </motion.span>
        <span className="text-sm text-muted-foreground">remaining</span>
        <span className="text-xs text-muted-foreground mt-1">of {goal} cal</span>
      </div>
    </div>
  );
};
