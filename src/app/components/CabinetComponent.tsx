import React from 'react';
import { SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';

interface CabinetComponentProps {
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

function CabinetHeader({ cabinetName, isSelected, isDoorSelected }: { cabinetName: string; isSelected: boolean; isDoorSelected: boolean }) {
  const shouldHighlight = isSelected || isDoorSelected;
  
  return (
    <div
      className={`${shouldHighlight ? 'bg-blue-50' : 'bg-gray-100'} box-border content-stretch flex flex-col items-start justify-start min-h-6 order-2 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0`}
      data-name="Header"
    >
      <div className={`flex flex-col ${shouldHighlight ? 'font-bold' : 'font-normal'} justify-center leading-[0] not-italic relative shrink-0 ${shouldHighlight ? 'text-[#176cff]' : 'text-black'} text-[12px] text-left text-nowrap`}>
        <p className="block leading-[16px] whitespace-pre">{cabinetName}</p>
      </div>
    </div>
  );
}

function DoorButton({ 
  door, 
  isSelected, 
  isFirst, 
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
  isFirst: boolean;
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
  
  if (isFirst) {
    return (
      <div
        className="bg-[#ffffff] h-[50px] min-h-12 relative rounded shrink-0 flex-1 cursor-pointer"
        data-name={`Button - ${door}`}
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
          <div className="absolute h-[6px] left-[25px] top-[3px] w-[14px] pointer-events-none">
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
        
        <div
          className={`absolute flex flex-col font-normal h-4 justify-center leading-[0] not-italic ${
            shouldHighlightChangeAllocation
              ? 'text-[#8F48D2]'
              : shouldHighlightAllocation
                ? 'text-[#8F48D2]'
                : isSelected 
                  ? 'text-[#176cff]' 
                  : 'text-[#020817]'
          } text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[29.435px]`}
          style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.282312px)" }}
        >
          <p className="block leading-[16px]">Door</p>
        </div>
        <div
          className={`absolute flex flex-col font-normal h-4 justify-center leading-[0] not-italic ${
            shouldHighlightChangeAllocation
              ? 'text-[#8F48D2]'
              : shouldHighlightAllocation
                ? 'text-[#8F48D2]'
                : isSelected 
                  ? 'text-[#176cff]' 
                  : 'text-[#020817]'
          } text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[6.468px]`}
          style={{ top: "calc(50% + 8px)", left: "calc(50% - 1.8357px)" }}
        >
          <p className="block leading-[16px]">{doorNumber}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px] cursor-pointer"
      data-name={`Button - ${door}`}
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
        <div className="absolute h-[6px] left-[68px] top-[3px] w-[14px] pointer-events-none">
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
        <p className="block mb-0">Door</p>
        <p className="block">{doorNumber}</p>
      </div>
    </div>
  );
}

function FullWidthDoorButton({ 
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
      className="bg-[#ffffff] min-h-12 relative rounded shrink-0 w-full cursor-pointer"
      data-name={`Button - ${door}`}
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
        <div className="absolute h-[6px] right-[6px] top-[3px] w-[14px] pointer-events-none">
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
      
      <div className="flex flex-row items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-center min-h-inherit px-[31px] py-[9px] relative w-full">
          <div className={`basis-0 flex flex-col font-normal grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 ${
            shouldHighlightChangeAllocation
              ? 'text-[#8F48D2]'
              : shouldHighlightAllocation
                ? 'text-[#8F48D2]'
                : isSelected 
                  ? 'text-[#176cff]' 
                  : 'text-[#020817]'
          } text-[12px] text-center`}>
            <p className="block mb-0">Door</p>
            <p className="block">{doorNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoorsContainer({ 
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
  onDoorClick 
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
}) {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-1 items-center justify-start max-w-[228px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      {doors.slice(0, 3).map((door, index) => (
        <DoorButton
          key={door}
          door={door}
          isSelected={selectedDoor === door}
          isFirst={index === 0}
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
  );
}

function CabinetBackground({ 
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
      className={`${isSelected ? 'bg-blue-50' : 'bg-gray-100'} order-1 relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full`}
      data-name="Background"
    >
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-[8px] relative w-full">
          <DoorsContainer 
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
          />
          {doors.length > 3 && (
            <FullWidthDoorButton 
              door={doors[3]}
              isSelected={selectedDoor === doors[3]}
              hasAvailableBins={doorsWithAvailableBins.includes(doors[3])}
              highlightAvailableBins={highlightAvailableBins}
              hasSearchMatches={doorsWithSearchMatches.includes(doors[3])}
              hasSelectedBins={doorsWithSelectedBins.includes(doors[3])}
              hasChangeAllocationBins={doorsWithChangeAllocationBins.includes(doors[3])}
              searchQuery={searchQuery}
              showUnallocatedProducts={showUnallocatedProducts}
              changeAllocationMode={changeAllocationMode}
              onClick={(e) => {
                e.stopPropagation();
                onDoorClick(doors[3]);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CabinetComponent({
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
}: CabinetComponentProps) {
  const isSelected = selectedCabinet === cabinetName;
  const isDoorSelected = doors.includes(selectedDoor);
  const shouldHighlight = isSelected || isDoorSelected;
  
  return (
    <div
      className="box-border content-stretch flex flex-col-reverse items-start justify-start p-0 relative w-[244px] cursor-pointer transition-all"
      data-name="Container"
      onClick={() => onCabinetClick(cabinetName)}
    >
      <CabinetHeader cabinetName={cabinetName} isSelected={isSelected} isDoorSelected={isDoorSelected} />
      <CabinetBackground 
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