import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Trash2, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WaterEntry } from '@/hooks/useWaterStore';

interface WaterCardProps {
  currentMl: number;
  goalMl: number;
  entries: WaterEntry[];
  onAddWater: (amount: number) => void;
  onRemoveEntry: (entryId: string) => void;
  onUndoLast: () => void;
}

export const WaterCard = ({
  currentMl,
  goalMl,
  entries,
  onAddWater,
  onRemoveEntry,
  onUndoLast,
}: WaterCardProps) => {
  const [customAmount, setCustomAmount] = useState('');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [entriesSheetOpen, setEntriesSheetOpen] = useState(false);

  const percentage = Math.min((currentMl / goalMl) * 100, 100);

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (amount > 0) {
      onAddWater(amount);
      setCustomAmount('');
      setCustomDialogOpen(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-4 shadow-sm border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Water Intake</h3>
        </div>
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground"
            onClick={onUndoLast}
          >
            <Undo2 className="w-3 h-3 mr-1" />
            Undo
          </Button>
        )}
      </div>

      {/* Progress Ring - Clickable to show entries */}
      <Sheet open={entriesSheetOpen} onOpenChange={setEntriesSheetOpen}>
        <SheetTrigger asChild>
          <button className="w-full flex items-center gap-4 mb-4 text-left hover:opacity-80 transition-opacity">
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
                {Math.round(percentage)}% complete • {entries.length} entries
              </p>
            </div>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80dvh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Today's Water Entries
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(80dvh-80px)]">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Droplets className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">No water logged today</p>
                <p className="text-xs mt-1">Use the buttons below to add water</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                <AnimatePresence mode="popLayout">
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      layout
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Droplets className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{entry.amountMl} ml</p>
                          <p className="text-xs text-muted-foreground">{formatTime(entry.createdAt)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveEntry(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
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
