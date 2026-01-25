import { useState } from 'react';
import { Camera, Barcode, FileText, UtensilsCrossed } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { BarcodeScanFlow } from './BarcodeScanFlow';
import { NutritionLabelFlow } from './NutritionLabelFlow';
import { PlateEstimateFlow } from './PlateEstimateFlow';

type ScanMode = 'menu' | 'barcode' | 'label' | 'plate';

interface ScanFoodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScanFoodSheet = ({ open, onOpenChange }: ScanFoodSheetProps) => {
  const [mode, setMode] = useState<ScanMode>('menu');

  const handleClose = () => {
    setMode('menu');
    onOpenChange(false);
  };

  const handleComplete = () => {
    setMode('menu');
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (mode) {
      case 'barcode':
        return <BarcodeScanFlow onBack={() => setMode('menu')} onComplete={handleComplete} />;
      case 'label':
        return <NutritionLabelFlow onBack={() => setMode('menu')} onComplete={handleComplete} />;
      case 'plate':
        return <PlateEstimateFlow onBack={() => setMode('menu')} onComplete={handleComplete} />;
      default:
        return (
          <>
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-xl font-bold">Scan Food</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how you want to log your food
              </p>
            </DrawerHeader>
            
            <div className="px-4 pb-6 space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex items-start gap-4 justify-start"
                onClick={() => setMode('plate')}
              >
                <div className="p-2 rounded-full bg-nutrition-protein-light">
                  <UtensilsCrossed className="h-6 w-6 text-nutrition-protein" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Scan Plate (Estimate)</p>
                  <p className="text-xs text-muted-foreground">
                    Take a photo and manually select foods
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 flex items-start gap-4 justify-start"
                onClick={() => setMode('barcode')}
              >
                <div className="p-2 rounded-full bg-nutrition-carbs-light">
                  <Barcode className="h-6 w-6 text-nutrition-carbs" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Scan Barcode (Accurate)</p>
                  <p className="text-xs text-muted-foreground">
                    Scan product barcode for exact nutrition
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 flex items-start gap-4 justify-start"
                onClick={() => setMode('label')}
              >
                <div className="p-2 rounded-full bg-nutrition-fat-light">
                  <FileText className="h-6 w-6 text-nutrition-fat" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Scan Nutrition Label (Accurate)</p>
                  <p className="text-xs text-muted-foreground">
                    Take a photo of the nutrition facts label
                  </p>
                </div>
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        {renderContent()}
      </DrawerContent>
    </Drawer>
  );
};
