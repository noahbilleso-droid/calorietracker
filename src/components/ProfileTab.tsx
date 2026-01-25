import { motion } from 'framer-motion';
import { User, Target, Scale, Ruler, Activity } from 'lucide-react';

export const ProfileTab = () => {
  const stats = [
    { icon: Target, label: 'Daily Goal', value: '2,000 cal' },
    { icon: Scale, label: 'Current Weight', value: '75 kg' },
    { icon: Ruler, label: 'Height', value: '175 cm' },
    { icon: Activity, label: 'Activity Level', value: 'Moderate' },
  ];

  const macroGoals = [
    { label: 'Protein', value: 150, unit: 'g', color: 'bg-nutrition-protein' },
    { label: 'Carbs', value: 250, unit: 'g', color: 'bg-nutrition-carbs' },
    { label: 'Fat', value: 65, unit: 'g', color: 'bg-nutrition-fat' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm">Your nutrition settings</p>
        </motion.div>
      </header>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 bg-card rounded-lg p-6 border border-border shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">John Doe</h2>
            <p className="text-sm text-muted-foreground">Tracking since Jan 2025</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="bg-card rounded-lg p-4 border border-border shadow-sm"
            >
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Macro Goals */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 mt-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Daily Macro Goals</h3>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm space-y-4">
          {macroGoals.map((macro) => (
            <div key={macro.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${macro.color}`} />
                <span className="text-sm text-foreground">{macro.label}</span>
              </div>
              <span className="font-medium text-foreground">
                {macro.value}{macro.unit}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-6"
      >
        <div className="bg-accent rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            Want to adjust your goals? Tap any stat above to customize your nutrition plan.
          </p>
        </div>
      </motion.section>
    </div>
  );
};
