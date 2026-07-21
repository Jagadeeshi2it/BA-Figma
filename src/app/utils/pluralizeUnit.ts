// Helper function to properly pluralize medical units
export const pluralizeUnit = (unit: string, quantity: number): string => {
  if (quantity <= 1) return unit;
  
  // Handle common medical unit pluralizations
  const lowerUnit = unit.toLowerCase();
  
  // Handle abbreviations that shouldn't be pluralized
  if (unit.includes('.') || lowerUnit === 'via' || lowerUnit === 'via.') {
    return unit; // Keep abbreviations as-is
  }
  
  // Handle specific medical units
  switch (lowerUnit) {
    case 'vial':
      return 'vials';
    case 'syringe':
      return 'syringes';
    case 'tablet':
      return 'tablets';
    case 'capsule':
      return 'capsules';
    case 'dose':
      return 'doses';
    case 'each':
      return 'each'; // "each" doesn't pluralize
    case 'ml':
    case 'mg':
    case 'mcg':
    case 'g':
    case 'unit':
    case 'units':
      return unit; // Medical measurements typically don't change
    default:
      // For other units, try standard English pluralization
      if (lowerUnit.endsWith('s') || lowerUnit.endsWith('x')) {
        return unit; // Already plural or doesn't follow standard rules
      }
      return unit + 's';
  }
};