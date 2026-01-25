import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { CameraCapture } from './CameraCapture';
import { FoodConfirmation, NutritionData } from './FoodConfirmation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NutritionLabelFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'capture' | 'processing' | 'confirm';

const parseNutritionFromText = (text: string): Partial<NutritionData> => {
  const lines = text.toLowerCase();
  
  // Common patterns for nutrition values
  const patterns = {
    calories: [
      /calories[:\s]*(\d+)/i,
      /energy[:\s]*(\d+)\s*(?:kcal|cal)/i,
      /(\d+)\s*(?:kcal|calories)/i,
    ],
    protein: [
      /protein[:\s]*(\d+\.?\d*)\s*g/i,
      /proteins?[:\s]*(\d+\.?\d*)/i,
    ],
    carbs: [
      /carbohydrate[s]?[:\s]*(\d+\.?\d*)\s*g/i,
      /total carb[s]?[:\s]*(\d+\.?\d*)/i,
      /carbs?[:\s]*(\d+\.?\d*)/i,
    ],
    fat: [
      /total fat[:\s]*(\d+\.?\d*)\s*g/i,
      /fat[:\s]*(\d+\.?\d*)\s*g/i,
      /fats?[:\s]*(\d+\.?\d*)/i,
    ],
  };

  const extract = (patternList: RegExp[]): number => {
    for (const pattern of patternList) {
      const match = lines.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1]) || 0;
      }
    }
    return 0;
  };

  return {
    calories: Math.round(extract(patterns.calories)),
    protein: Math.round(extract(patterns.protein)),
    carbs: Math.round(extract(patterns.carbs)),
    fat: Math.round(extract(patterns.fat)),
  };
};

export const NutritionLabelFlow = ({ onBack, onComplete }: NutritionLabelFlowProps) => {
  const [step, setStep] = useState<Step>('capture');
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processImage = async (imageData: string) => {
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      return text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw error;
    }
  };

  const handleCapture = async (imageData: string) => {
    setImagePreview(imageData);
    setStep('processing');
    setProgress(0);

    try {
      const text = await processImage(imageData);
      console.log('OCR Result:', text);

      const parsed = parseNutritionFromText(text);

      if (parsed.calories === 0 && parsed.protein === 0 && parsed.carbs === 0 && parsed.fat === 0) {
        toast({
          title: 'Could not read label',
          description: 'Unable to extract nutrition info. You can enter values manually.',
        });
      }

      setNutritionData({
        name: 'Scanned Food',
        calories: parsed.calories || 0,
        protein: parsed.protein || 0,
        carbs: parsed.carbs || 0,
        fat: parsed.fat || 0,
        servingSize: '1 serving',
      });

      setStep('confirm');
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
      setStep('capture');
    }
  };

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Reading nutrition label...</p>
        <p className="text-sm text-muted-foreground mb-4">This may take a moment</p>
        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
      </div>
    );
  }

  if (step === 'confirm' && nutritionData) {
    return (
      <FoodConfirmation
        initialData={nutritionData}
        onBack={() => setStep('capture')}
        onComplete={onComplete}
        imagePreview={imagePreview}
      />
    );
  }

  return (
    <CameraCapture
      onCapture={handleCapture}
      onCancel={onBack}
      title="Scan Nutrition Label"
      instructions="Position the nutrition facts label clearly in the frame"
    />
  );
};
