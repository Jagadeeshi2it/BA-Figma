import React, { useMemo, memo } from 'react';
import CabinetComponent from './CabinetComponent';
import VirtualCabinetComponent from './VirtualCabinetComponent';
import EmergencyKitComponent from './EmergencyKitComponent';
import { cabinets } from '../data/cabinets';

interface CabinetSelectionProps {
  selectedCabinet: string | null;
  selectedDoor: string | null;
  doorsWithAvailableBins: string[];
  // Per-door free-bin counts, threaded through for Demo Mode's door anchors (see CabinetComponent).
  freeBinsByDoor?: Record<string, number>;
  highlightAvailableBins: boolean;
  doorsWithSearchMatches: string[];
  doorsWithSelectedBins: string[];
  doorsWithChangeAllocationBins: string[];
  searchQuery: string;
  showUnallocatedProducts: boolean;
  changeAllocationMode: boolean;
  onCabinetClick: (cabinetName: string) => void;
  onDoorClick: (doorKey: string) => void;
}

const CabinetSelection = memo(function CabinetSelection({
  selectedCabinet,
  selectedDoor,
  doorsWithAvailableBins,
  freeBinsByDoor = {},
  highlightAvailableBins,
  doorsWithSearchMatches,
  doorsWithSelectedBins,
  doorsWithChangeAllocationBins,
  searchQuery,
  showUnallocatedProducts,
  changeAllocationMode,
  onCabinetClick,
  onDoorClick
}: CabinetSelectionProps) {
  const filteredCabinets = useMemo(() => 
    cabinets.filter(cabinet => cabinet.name !== "Cabinet 3"), 
    []
  );

  return (
    <div className="mb-8">
      <div className="flex gap-2 flex-wrap">
        {filteredCabinets.map((cabinet) => {
          if (cabinet.name === "Virtual") {
            return (
              <VirtualCabinetComponent
                key={cabinet.id}
                cabinetName={cabinet.name}
                doors={cabinet.doors}
                selectedCabinet={selectedCabinet}
                selectedDoor={selectedDoor}
                doorsWithAvailableBins={doorsWithAvailableBins}
                freeBinsByDoor={freeBinsByDoor}
                highlightAvailableBins={highlightAvailableBins}
                doorsWithSearchMatches={doorsWithSearchMatches}
                doorsWithSelectedBins={doorsWithSelectedBins}
                doorsWithChangeAllocationBins={doorsWithChangeAllocationBins}
                searchQuery={searchQuery}
                showUnallocatedProducts={showUnallocatedProducts}
                changeAllocationMode={changeAllocationMode}
                onCabinetClick={onCabinetClick}
                onDoorClick={onDoorClick}
              />
            );
          } else if (cabinet.name === "Emergency Kit") {
            return (
              <EmergencyKitComponent
                key={cabinet.id}
                cabinetName={cabinet.name}
                doors={cabinet.doors}
                selectedCabinet={selectedCabinet}
                selectedDoor={selectedDoor}
                doorsWithAvailableBins={doorsWithAvailableBins}
                highlightAvailableBins={highlightAvailableBins}
                doorsWithSearchMatches={doorsWithSearchMatches}
                doorsWithSelectedBins={doorsWithSelectedBins}
                doorsWithChangeAllocationBins={doorsWithChangeAllocationBins}
                searchQuery={searchQuery}
                showUnallocatedProducts={showUnallocatedProducts}
                changeAllocationMode={changeAllocationMode}
                onCabinetClick={onCabinetClick}
                onDoorClick={onDoorClick}
              />
            );
          } else {
            return (
              <CabinetComponent
                key={cabinet.id}
                cabinetName={cabinet.name}
                doors={cabinet.doors}
                selectedCabinet={selectedCabinet}
                selectedDoor={selectedDoor}
                doorsWithAvailableBins={doorsWithAvailableBins}
                freeBinsByDoor={freeBinsByDoor}
                highlightAvailableBins={highlightAvailableBins}
                doorsWithSearchMatches={doorsWithSearchMatches}
                doorsWithSelectedBins={doorsWithSelectedBins}
                doorsWithChangeAllocationBins={doorsWithChangeAllocationBins}
                searchQuery={searchQuery}
                showUnallocatedProducts={showUnallocatedProducts}
                changeAllocationMode={changeAllocationMode}
                onCabinetClick={onCabinetClick}
                onDoorClick={onDoorClick}
              />
            );
          }
        })}
      </div>
    </div>
  );
});

export default CabinetSelection;