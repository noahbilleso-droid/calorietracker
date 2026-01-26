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

interface OpenFoodFactsNutriments {
  'energy-kcal_100g'?: number;
  'energy-kcal_100ml'?: number;
  'energy-kcal_serving'?: number;
  'energy-kcal'?: number;
  'energy_100g'?: number;
  'energy_100ml'?: number;
  'energy_serving'?: number;
  energy?: number;
  proteins_100g?: number;
  proteins_100ml?: number;
  proteins_serving?: number;
  proteins?: number;
  carbohydrates_100g?: number;
  carbohydrates_100ml?: number;
  carbohydrates_serving?: number;
  carbohydrates?: number;
  fat_100g?: number;
  fat_100ml?: number;
  fat_serving?: number;
  fat?: number;
  [key: string]: number | undefined;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  nutriments?: OpenFoodFactsNutriments;
  serving_size?: string;
  quantity?: string;
  product_quantity_unit?: string;
}

interface ExtractionResult {
  value: number;
  source: string;
}

const KJ_TO_KCAL = 0.239005736;

// Detect if product is liquid based on various fields
const isLiquidProduct = (product: OpenFoodFactsProduct): boolean => {
  const quantity = (product.quantity || '').toLowerCase();
  const unit = (product.product_quantity_unit || '').toLowerCase();
  const servingSize = (product.serving_size || '').toLowerCase();
  
  return (
    quantity.includes('ml') ||
    quantity.includes('l ') ||
    quantity.includes('litre') ||
    quantity.includes('liter') ||
    unit === 'ml' ||
    unit === 'l' ||
    servingSize.includes('ml')
  );
};

// Parse serving size to get amount in ml or g
const parseServingSize = (servingSize: string): { amount: number; unit: string } | null => {
  const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*(ml|g|cl|l|oz)/i);
  if (match) {
    let amount = parseFloat(match[1].replace(',', '.'));
    let unit = match[2].toLowerCase();
    
    // Convert cl and l to ml
    if (unit === 'cl') {
      amount *= 10;
      unit = 'ml';
    } else if (unit === 'l') {
      amount *= 1000;
      unit = 'ml';
    }
    
    return { amount, unit };
  }
  return null;
};

// Extract calories with fallbacks
const extractCalories = (
  nutriments: OpenFoodFactsNutriments,
  isLiquid: boolean
): ExtractionResult => {
  // Priority 1: energy-kcal_100g or energy-kcal_100ml
  if (isLiquid && nutriments['energy-kcal_100ml'] !== undefined) {
    return { value: nutriments['energy-kcal_100ml'], source: 'energy-kcal_100ml' };
  }
  if (nutriments['energy-kcal_100g'] !== undefined) {
    return { value: nutriments['energy-kcal_100g'], source: 'energy-kcal_100g' };
  }
  
  // Priority 2: Convert from kJ (energy_100g or energy_100ml)
  if (isLiquid && nutriments['energy_100ml'] !== undefined) {
    return { 
      value: nutriments['energy_100ml'] * KJ_TO_KCAL, 
      source: 'energy_100ml (kJ→kcal)' 
    };
  }
  if (nutriments['energy_100g'] !== undefined) {
    return { 
      value: nutriments['energy_100g'] * KJ_TO_KCAL, 
      source: 'energy_100g (kJ→kcal)' 
    };
  }
  
  // Priority 3: Per serving values
  if (nutriments['energy-kcal_serving'] !== undefined) {
    return { value: nutriments['energy-kcal_serving'], source: 'energy-kcal_serving' };
  }
  if (nutriments['energy_serving'] !== undefined) {
    return { 
      value: nutriments['energy_serving'] * KJ_TO_KCAL, 
      source: 'energy_serving (kJ→kcal)' 
    };
  }
  
  // Priority 4: Generic energy-kcal or energy
  if (nutriments['energy-kcal'] !== undefined) {
    return { value: nutriments['energy-kcal'], source: 'energy-kcal' };
  }
  if (nutriments.energy !== undefined) {
    return { value: nutriments.energy * KJ_TO_KCAL, source: 'energy (kJ→kcal)' };
  }
  
  return { value: 0, source: 'not found' };
};

// Extract macro with fallbacks
const extractMacro = (
  nutriments: OpenFoodFactsNutriments,
  baseName: string,
  isLiquid: boolean
): ExtractionResult => {
  // Priority 1: per 100ml for liquids
  if (isLiquid) {
    const key100ml = `${baseName}_100ml`;
    if (nutriments[key100ml] !== undefined) {
      return { value: nutriments[key100ml]!, source: key100ml };
    }
  }
  
  // Priority 2: per 100g
  const key100g = `${baseName}_100g`;
  if (nutriments[key100g] !== undefined) {
    return { value: nutriments[key100g]!, source: key100g };
  }
  
  // Priority 3: per serving
  const keyServing = `${baseName}_serving`;
  if (nutriments[keyServing] !== undefined) {
    return { value: nutriments[keyServing]!, source: keyServing };
  }
  
  // Priority 4: generic value
  if (nutriments[baseName] !== undefined) {
    return { value: nutriments[baseName]!, source: baseName };
  }
  
  return { value: 0, source: 'not found' };
};

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
      const isLiquid = isLiquidProduct(product);
      
      // Extract all values with sources
      const calories = extractCalories(nutriments, isLiquid);
      const protein = extractMacro(nutriments, 'proteins', isLiquid);
      const carbs = extractMacro(nutriments, 'carbohydrates', isLiquid);
      const fat = extractMacro(nutriments, 'fat', isLiquid);
      
      // Determine base unit and serving info
      const baseUnit = isLiquid ? '100ml' : '100g';
      const servingInfo = parseServingSize(product.serving_size || '');
      
      // Build source info for debugging
      const sourceDetails: string[] = [];
      sourceDetails.push(`Base: per ${baseUnit}`);
      sourceDetails.push(`Cal: ${calories.source}`);
      sourceDetails.push(`Pro: ${protein.source}`);
      sourceDetails.push(`Carb: ${carbs.source}`);
      sourceDetails.push(`Fat: ${fat.source}`);
      if (servingInfo) {
        sourceDetails.push(`Serving: ${servingInfo.amount}${servingInfo.unit}`);
      }
      
      // If we have serving size, calculate per-serving values
      let finalCalories = calories.value;
      let finalProtein = protein.value;
      let finalCarbs = carbs.value;
      let finalFat = fat.value;
      let servingSizeDisplay = baseUnit;
      
      if (servingInfo && servingInfo.amount > 0) {
        const multiplier = servingInfo.amount / 100;
        finalCalories = calories.value * multiplier;
        finalProtein = protein.value * multiplier;
        finalCarbs = carbs.value * multiplier;
        finalFat = fat.value * multiplier;
        servingSizeDisplay = `${servingInfo.amount}${servingInfo.unit}`;
        sourceDetails.push(`→ Converted to ${servingSizeDisplay}`);
      }
      
      console.log('OpenFoodFacts extraction:', {
        product: product.product_name,
        isLiquid,
        rawNutriments: nutriments,
        extracted: { calories, protein, carbs, fat },
        final: { finalCalories, finalProtein, finalCarbs, finalFat },
        servingInfo,
      });

      setNutritionData({
        name: product.product_name || 'Unknown Product',
        calories: Math.round(finalCalories),
        protein: Math.round(finalProtein * 10) / 10,
        carbs: Math.round(finalCarbs * 10) / 10,
        fat: Math.round(finalFat * 10) / 10,
        servingSize: servingSizeDisplay,
        sourceInfo: sourceDetails.join(' | '),
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
