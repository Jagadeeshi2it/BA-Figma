import React from 'react';
import Vector from '../imports/Vector';

interface EmergencyKitComponentProps {
  cabinetName: string;
  doors: string[];
  selectedCabinet: string;
  selectedDoor: string;
  doorsWithAvailableBins?: string[];
  highlightAvailableBins?: boolean;
  doorsWithSearchMatches?: string[];
  doorsWithSelectedBins?: string[];
  doorsWithChangeAllocationBins?: string[];
  searchQuery?: string;
  showUnallocatedProducts?: boolean;
  changeAllocationMode?: boolean;
  onCabinetClick: (cabinetName: string) => void;
  onDoorClick: (doorName: string) => void;
}

function Header({ cabinetName, isSelected, isDoorSelected }: { cabinetName: string; isSelected: boolean; isDoorSelected: boolean }) {
  const shouldHighlight = isSelected || isDoorSelected;
  
  return (
    <div
      className={`${shouldHighlight ? 'bg-blue-50' : 'bg-gray-100'} box-border content-stretch flex flex-col items-start justify-start min-h-6 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0`}
      data-name="Header"
    >
      <div className={`flex flex-row items-center gap-1 ${shouldHighlight ? 'font-bold' : 'font-normal'} justify-center leading-[0] not-italic relative shrink-0 ${shouldHighlight ? 'text-[#176cff]' : 'text-[#000000]'} text-[12px] text-left text-nowrap`}>
        <div className="w-3 h-3 flex-shrink-0">
          <Vector />
        </div>
        <p className="block leading-[16px] whitespace-pre">{cabinetName}</p>
      </div>
    </div>
  );
}

function FloorButton({ 
  door, 
  isSelected, 
  hasAvailableBins,
  highlightAvailableBins,
  hasSearchMatches,
  hasSelectedBins,
  hasChangeAllocationBins,
  searchQuery,
  showUnallocatedProducts,
  changeAllocationMode,
  onClick 
}: { 
  door: string; 
  isSelected: boolean;
  hasAvailableBins: boolean;
  highlightAvailableBins: boolean;
  hasSearchMatches: boolean;
  hasSelectedBins: boolean;
  hasChangeAllocationBins: boolean;
  searchQuery: string;
  showUnallocatedProducts: boolean;
  changeAllocationMode: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const doorNumber = door.split(' ')[1];
  const floorNumber = doorNumber.replace('17', '1').replace('18', '2').replace('19', '3');
  const shouldHighlightGreen = highlightAvailableBins && hasAvailableBins && !isSelected;
  const shouldHighlightSearch = searchQuery?.trim() && hasSearchMatches && !isSelected;
  const shouldHighlightAllocation = showUnallocatedProducts && hasSelectedBins && !isSelected;
  const shouldHighlightChangeAllocation = changeAllocationMode && hasChangeAllocationBins && !isSelected;
  
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[10px] py-[37px] relative rounded shrink-0 w-[55px] cursor-pointer"
      data-name={`Button - ${door}`}
      onClick={onClick}
    >
      <div className={`absolute border ${
        shouldHighlightChangeAllocation
          ? 'border-[#8F48D2] border-1'
          : shouldHighlightAllocation
            ? 'border-[#8F48D2] border-1'
            : shouldHighlightSearch
              ? 'border-[#A16207] border'
              : shouldHighlightGreen 
                ? 'border-green-500 border-2' 
                : isSelected 
                  ? 'border-[#4f8cf5] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]' 
                  : 'border-[#ebebeb]'
      } border-solid inset-0 pointer-events-none rounded`} />
      <div className={`flex flex-col font-normal justify-center leading-[16px] not-italic relative shrink-0 ${
        shouldHighlightChangeAllocation
          ? 'text-[#8F48D2]'
          : shouldHighlightAllocation
            ? 'text-[#8F48D2]'
            : shouldHighlightSearch
              ? 'text-[#B45309]'
              : shouldHighlightGreen
                ? 'text-green-600'
                : isSelected 
                  ? 'text-[#176cff]' 
                  : 'text-[#020817]'
      } text-[12px] text-center text-nowrap whitespace-pre`}>
        <p className="block mb-0">Floor</p>
        <p className="block">{floorNumber}</p>
      </div>
    </div>
  );
}

function Background({ 
  doors, 
  selectedDoor, 
  doorsWithAvailableBins,
  highlightAvailableBins,
  doorsWithSearchMatches,
  doorsWithSelectedBins,
  doorsWithChangeAllocationBins,
  searchQuery,
  showUnallocatedProducts,
  changeAllocationMode,
  onDoorClick,
  isSelected 
}: { 
  doors: string[]; 
  selectedDoor: string;
  doorsWithAvailableBins: string[];
  highlightAvailableBins: boolean;
  doorsWithSearchMatches: string[];
  doorsWithSelectedBins: string[];
  doorsWithChangeAllocationBins: string[];
  searchQuery: string;
  showUnallocatedProducts: boolean;
  changeAllocationMode: boolean;
  onDoorClick: (doorName: string) => void;
  isSelected: boolean;
}) {
  return (
    <div
      className={`${isSelected ? 'bg-blue-50' : 'bg-gray-100'} h-[122px] relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full`}
      data-name="Background"
    >
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-1 h-[122px] items-center justify-start p-[8px] relative w-full">
          {doors.map((door) => (
            <FloorButton
              key={door}
              door={door}
              isSelected={selectedDoor === door}
              hasAvailableBins={doorsWithAvailableBins.includes(door)}
              highlightAvailableBins={highlightAvailableBins}
              hasSearchMatches={doorsWithSearchMatches.includes(door)}
              hasSelectedBins={doorsWithSelectedBins.includes(door)}
              hasChangeAllocationBins={doorsWithChangeAllocationBins.includes(door)}
              searchQuery={searchQuery}
              showUnallocatedProducts={showUnallocatedProducts}
              changeAllocationMode={changeAllocationMode}
              onClick={(e) => {
                e.stopPropagation();
                onDoorClick(door);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EmergencyKitComponent({
  cabinetName,
  doors,
  selectedCabinet,
  selectedDoor,
  doorsWithAvailableBins = [],
  highlightAvailableBins = false,
  doorsWithSearchMatches = [],
  doorsWithSelectedBins = [],
  doorsWithChangeAllocationBins = [],
  searchQuery = "",
  showUnallocatedProducts = false,
  changeAllocationMode = false,
  onCabinetClick,
  onDoorClick
}: EmergencyKitComponentProps) {
  const isSelected = selectedCabinet === cabinetName;
  const isDoorSelected = doors.includes(selectedDoor);
  const shouldHighlight = isSelected || isDoorSelected;
  
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative w-[190px] cursor-pointer transition-all"
      onClick={() => onCabinetClick(cabinetName)}
    >
      <Header cabinetName={cabinetName} isSelected={isSelected} isDoorSelected={isDoorSelected} />
      <Background 
        doors={doors} 
        selectedDoor={selectedDoor} 
        doorsWithAvailableBins={doorsWithAvailableBins}
        highlightAvailableBins={highlightAvailableBins}
        doorsWithSearchMatches={doorsWithSearchMatches}
        doorsWithSelectedBins={doorsWithSelectedBins}
        doorsWithChangeAllocationBins={doorsWithChangeAllocationBins}
        searchQuery={searchQuery}
        showUnallocatedProducts={showUnallocatedProducts}
        changeAllocationMode={changeAllocationMode}
        onDoorClick={onDoorClick}
        isSelected={shouldHighlight}
      />
    </div>
  );
}