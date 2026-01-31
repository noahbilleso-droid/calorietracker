import { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WaterCardProps {
  currentMl: number;
  goalMl: number;
  onAddWater: (amount: number) => void;
}

export const WaterCard = ({ currentMl, goalMl, onAddWater }: WaterCardProps) => {
  const [customAmount, setCustomAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const percentage = Math.min((currentMl / goalMl) * 100, 100);

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (amount > 0) {
      onAddWater(amount);
      setCustomAmount('');
      setDialogOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-4 shadow-sm border border-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Droplets className="w-4 h-4 text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Water Intake</h3>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-blue-500"
              strokeDasharray={264}
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (264 * percentage) / 100 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground">
            {currentMl} <span className="text-sm font-normal text-muted-foreground">ml</span>
          </p>
          <p className="text-xs text-muted-foreground">of {goalMl} ml goal</p>
          <p className="text-xs text-blue-500 font-medium mt-1">
            {Math.round(percentage)}% complete
          </p>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onAddWater(250)}
        >
          <Plus className="w-3 h-3 mr-1" />
          250 ml
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onAddWater(500)}
        >
          <Plus className="w-3 h-3 mr-1" />
          500 ml
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="flex-1 text-xs">
              Custom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[300px]">
            <DialogHeader>
              <DialogTitle>Add Custom Amount</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1"
                  min="1"
                />
                <span className="text-sm text-muted-foreground">ml</span>
              </div>
              <Button onClick={handleCustomAdd} disabled={!customAmount || parseInt(customAmount) <= 0}>
                Add Water
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};
