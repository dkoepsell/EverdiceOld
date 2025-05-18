import React from 'react';
import { Character } from '@shared/schema';
import { Progress } from '@/components/ui/progress';

interface EquipmentItem {
  name: string;
  weight: number;
  quantity: number;
}

interface EncumbranceTrackerProps {
  character: Character;
  equipmentItems?: EquipmentItem[];
}

export default function EncumbranceTracker({ 
  character, 
  equipmentItems = [] 
}: EncumbranceTrackerProps) {
  // D&D 5e encumbrance rules based on Strength score
  const calculateCarryCapacity = (strength: number) => {
    return strength * 15; // In pounds
  };
  
  const calculateEncumbranceThresholds = (strength: number) => {
    const carryCapacity = calculateCarryCapacity(strength);
    return {
      // At 5x Strength you are encumbered (speed -10 ft)
      encumbered: strength * 5,
      // At 10x Strength you are heavily encumbered (speed -20 ft)
      heavilyEncumbered: strength * 10,
      // Maximum carrying capacity (strength * 15)
      maximum: carryCapacity
    };
  };

  // Calculate total weight carried
  const totalWeight = equipmentItems.reduce((total, item) => {
    return total + (item.weight * item.quantity);
  }, 0);

  const thresholds = calculateEncumbranceThresholds(character.strength);
  
  // Determine encumbrance status
  let encumbranceStatus = "Normal";
  let statusColor = "text-emerald-600";
  let progressColor = "bg-emerald-600";
  
  if (totalWeight >= thresholds.heavilyEncumbered) {
    encumbranceStatus = "Heavily Encumbered";
    statusColor = "text-red-600";
    progressColor = "bg-red-600";
  } else if (totalWeight >= thresholds.encumbered) {
    encumbranceStatus = "Encumbered";
    statusColor = "text-amber-600";
    progressColor = "bg-amber-600";
  }
  
  // Calculate percentage for progress bar
  const encumbrancePercentage = Math.min(
    Math.round((totalWeight / thresholds.maximum) * 100),
    100
  );

  return (
    <div className="encumbrance-tracker mb-6">
      <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Carrying Capacity</h3>
      <div className="bg-parchment-dark rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Current Weight</span>
          <span className="font-bold">{totalWeight} lbs</span>
        </div>
        
        <div className={`w-full h-2 mb-2 bg-gray-200 rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${progressColor}`} 
            style={{ width: `${encumbrancePercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 mb-3">
          <span>{thresholds.encumbered} lbs</span>
          <span>{thresholds.heavilyEncumbered} lbs</span>
          <span>{thresholds.maximum} lbs</span>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-300 pt-2">
          <span className="text-sm">Status:</span>
          <span className={`font-bold ${statusColor}`}>{encumbranceStatus}</span>
        </div>

        {/* Show movement penalty if encumbered */}
        {encumbranceStatus !== "Normal" && (
          <div className="text-xs text-gray-700 mt-1">
            {encumbranceStatus === "Encumbered" ? (
              <span>Speed reduced by 10 feet</span>
            ) : (
              <span>Speed reduced by 20 feet, disadvantage on ability checks, attack rolls, and saving throws that use Strength, Dexterity, or Constitution</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}