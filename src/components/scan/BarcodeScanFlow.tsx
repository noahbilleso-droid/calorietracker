import { useState } from 'react';
import Quagga from 'quagga';
import { CameraCapture } from './CameraCapture';
import { FoodConfirmation, NutritionData } from './FoodConfirmation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScanFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'capture' | 'processing' | 'confirm';

interface OpenFoodFactsProduct {
  product_name?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal'?: number;
    proteins_100g?: number;
    proteins?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
    fat_100g?: number;
    fat?: number;
  };
  serving_size?: string;
}

export const BarcodeScanFlow = ({ onBack, onComplete }: BarcodeScanFlowProps) => {
  const [step, setStep] = useState<Step>('capture');
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  const decodeBarcode = (imageData: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);

        Quagga.decodeSingle(
          {
            src: imageData,
            numOfWorkers: 0,
            decoder: {
              readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
            },
            locate: true,
          },
          (result) => {
            if (result?.codeResult?.code) {
              resolve(result.codeResult.code);
            } else {
              resolve(null);
            }
          }
        );
      };
      img.src = imageData;
    });
  };

  const fetchNutrition = async (barcode: string): Promise<OpenFoodFactsProduct | null> => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      if (data.status === 1 && data.product) {
        return data.product;
      }
      return null;
    } catch (error) {
      console.error('Error fetching from OpenFoodFacts:', error);
      return null;
    }
  };

  const handleCapture = async (imageData: string) => {
    setImagePreview(imageData);
    setStep('processing');

    try {
      const barcode = await decodeBarcode(imageData);
      
      if (!barcode) {
        toast({
          title: 'No barcode detected',
          description: 'Please try again with a clearer image of the barcode',
          variant: 'destructive',
        });
        setStep('capture');
        return;
      }

      const product = await fetchNutrition(barcode);
      
      if (!product) {
        toast({
          title: 'Product not found',
          description: `Barcode ${barcode} not found in database. Try manual entry.`,
          variant: 'destructive',
        });
        setStep('capture');
        return;
      }

      const nutriments = product.nutriments || {};
      
      setNutritionData({
        name: product.product_name || 'Unknown Product',
        calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        protein: Math.round(nutriments.proteins_100g || nutriments.proteins || 0),
        carbs: Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
        fat: Math.round(nutriments.fat_100g || nutriments.fat || 0),
        servingSize: product.serving_size || '100g',
      });

      setStep('confirm');
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the barcode. Please try again.',
        variant: 'destructive',
      });
      setStep('capture');
    }
  };

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Processing barcode...</p>
        <p className="text-sm text-muted-foreground">Looking up nutrition information</p>
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
      title="Scan Barcode"
      instructions="Position the barcode clearly in the frame"
    />
  );
};
