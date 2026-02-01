import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ActivityLevel } from '@/hooks/useProfileStore';

type StatType = 'dailyCalorieGoal' | 'weightKg' | 'heightCm' | 'activityLevel';

interface ProfileStatEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statType: StatType;
  currentValue: number | string;
  onSave: (value: number | string) => Promise<void>;
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'Sedentary',
  'Light',
  'Moderate',
  'Active',
  'Very Active',
];

const STAT_CONFIG: Record<
  StatType,
  { title: string; label: string; unit?: string; min?: number; max?: number }
> = {
  dailyCalorieGoal: {
    title: 'Edit Daily Goal',
    label: 'Daily Calorie Goal',
    unit: 'kcal',
    min: 500,
    max: 6000,
  },
  weightKg: {
    title: 'Edit Weight',
    label: 'Current Weight',
    unit: 'kg',
    min: 20,
    max: 300,
  },
  heightCm: {
    title: 'Edit Height',
    label: 'Height',
    unit: 'cm',
    min: 80,
    max: 250,
  },
  activityLevel: {
    title: 'Edit Activity Level',
    label: 'Activity Level',
  },
};

export const ProfileStatEditor = ({
  open,
  onOpenChange,
  statType,
  currentValue,
  onSave,
}: ProfileStatEditorProps) => {
  const [value, setValue] = useState<string>(String(currentValue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = STAT_CONFIG[statType];

  useEffect(() => {
    if (open) {
      setValue(String(currentValue));
      setError(null);
    }
  }, [open, currentValue]);

  const validate = (): boolean => {
    if (statType === 'activityLevel') {
      return ACTIVITY_LEVELS.includes(value as ActivityLevel);
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return false;
    }

    const { min, max } = config;
    if (min !== undefined && numValue < min) {
      setError(`Value must be at least ${min}`);
      return false;
    }
    if (max !== undefined && numValue > max) {
      setError(`Value must be at most ${max}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    const saveValue = statType === 'activityLevel' ? value : parseFloat(value);
    await onSave(saveValue);
    setSaving(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[50dvh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{config.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(50dvh-120px)]">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stat-input">{config.label}</Label>

              {statType === 'activityLevel' ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger id="stat-input" className="w-full">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="stat-input"
                    type="number"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setError(null);
                    }}
                    min={config.min}
                    max={config.max}
                    className="flex-1 text-lg"
                    inputMode="decimal"
                  />
                  {config.unit && (
                    <span className="text-muted-foreground text-sm w-12">
                      {config.unit}
                    </span>
                  )}
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              {config.min !== undefined && config.max !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Valid range: {config.min} – {config.max} {config.unit}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !!error}
            >
              <Check className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
