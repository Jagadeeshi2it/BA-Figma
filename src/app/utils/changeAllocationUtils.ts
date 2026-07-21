// Utility functions for change allocation modal

export const getBinSizeLabel = (size: string): string => {
  switch (size) {
    case 'double': return 'Double Bin';
    case '2x2': return '2x2 Bin';
    case '2x3': return '2x3 Bin';
    case '3x3': return '3x3 Bin';
    default: return 'Single Bin';
  }
};

export const formatBinLocation = (bin: any): string => {
  if (!bin.location) return '';
  
  // Parse the location string which is in format "Door X, Cabinet Y"
  const locationParts = bin.location.split(', ');
  const door = locationParts[0] || '';
  const cabinet = locationParts[1] || '';
  const shelfName = bin.shelfName || 'Shelf';
  
  // Format as "Cabinet X, Door Y, Shelf (Size)"
  return `${cabinet}, ${door}, ${shelfName} (${getBinSizeLabel(bin.size)})`;
};

export const getDoorName = (bin: any): string => {
  if (!bin.location) return '';
  
  // Parse the location string which is in format "Door X, Cabinet Y"
  const locationParts = bin.location.split(', ');
  return locationParts[0] || ''; // Return just the door part (e.g., "Door 1")
};