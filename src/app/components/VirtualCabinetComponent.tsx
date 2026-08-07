import React from 'react';
import { SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';

interface VirtualCabinetComponentProps {
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
      <div className={`flex flex-col ${shouldHighlight ? 'font-bold' : 'font-normal'} justify-center leading-[0] not-italic relative shrink-0 ${shouldHighlight ? 'text-[#176cff]' : 'text-[#000000]'} text-[12px] text-left text-nowrap`}>
        <p className="block leading-[16px] whitespace-pre">{cabinetName}</p>
      </div>
    </div>
  );
}

function FridgeButton({ 
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
  const shouldHighlightGreen = highlightAvailableBins && hasAvailableBins && !isSelected;
  const shouldHighlightSearch = searchQuery?.trim() && hasSearchMatches && !isSelected;
  const shouldHighlightAllocation = showUnallocatedProducts && hasSelectedBins && !isSelected;
  const shouldHighlightChangeAllocation = changeAllocationMode && hasChangeAllocationBins && !isSelected;
  
  // Show dots for search and available (persist even when selected or in change allocation mode, but not in regular allocation mode)
  const showSearchDot = searchQuery?.trim() && hasSearchMatches && !shouldHighlightAllocation;
  const showAvailableDot = highlightAvailableBins && hasAvailableBins && !shouldHighlightAllocation;
  
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[37px] relative rounded shrink-0 w-[54px] cursor-pointer"
      data-name={`Button - ${door}`}
      // Fridges answer the same door anchor the cabinet doors do — a walkthrough looking for "a door"
      // should not have to know that two components draw them. `kind` is what tells them apart, because
      // nothing in Demo Mode may match on the "Fridge N" label (a rewording would break a walk silently).
      //
      // Deliberately NO `data-door-free-bins`: this component is never told the counts, and writing a 0
      // would be a claim rather than an omission. A missing attribute reads as 0 in every resolver that
      // asks, which is the right answer here anyway — a fridge's single pooled bin is stocked in this
      // seed, so no fridge should ever satisfy a "door with room" query. A fridge still ACCEPTS an
      // allocation; a stocked bin is not a full one (the app models no capacity at all — CLAUDE.md §5).
      data-demo="door"
      data-door-kind="fridge"
      onClick={onClick}
    >
      <div className={`absolute border ${
        shouldHighlightChangeAllocation
          ? 'border-[#8F48D2] border-1'
          : shouldHighlightAllocation
            ? 'border-[#8F48D2] border-1'
            : isSelected 
              ? 'border-[#4f8cf5] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]' 
              : 'border-[#ebebeb]'
      } border-solid inset-0 pointer-events-none rounded`} />
      
      {/* Indicator Dots Container */}
      {(showSearchDot || showAvailableDot) && (
        <div className="absolute h-[6px] left-[34px] top-[3px] w-[14px] pointer-events-none">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 6">
            <g>
              {showSearchDot && (
                <circle cx={showAvailableDot ? "3" : "11"} cy="3" fill={SEARCH_HIGHLIGHT_COLOR} r="3" />
              )}
              {showAvailableDot && (
                <circle cx="11" cy="3" fill="#00C951" r="3" />
              )}
            </g>
          </svg>
        </div>
      )}
      
      <div className={`flex flex-col font-normal justify-center leading-[16px] not-italic relative shrink-0 ${
        shouldHighlightChangeAllocation
          ? 'text-[#8F48D2]'
          : shouldHighlightAllocation
            ? 'text-[#8F48D2]'
            : isSelected 
              ? 'text-[#176cff]' 
              : 'text-[#020817]'
      } text-[12px] text-center text-nowrap whitespace-pre`}>
        <p className="block mb-0">Fridge</p>
        <p className="block">{String(parseInt(doorNumber, 10) - 8)}</p>
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
      className={`${isSelected ? 'bg-blue-50' : 'bg-gray-100'} relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full`}
      data-name="Background"
    >
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-1 items-center justify-start p-[8px] relative w-full">
          {doors.map((door) => (
            <FridgeButton
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

export default function VirtualCabinetComponent({
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
}: VirtualCabinetComponentProps) {
  const isSelected = selectedCabinet === cabinetName;
  const isDoorSelected = doors.includes(selectedDoor);
  const shouldHighlight = isSelected || isDoorSelected;
  
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative w-auto shrink-0 cursor-pointer transition-all"
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