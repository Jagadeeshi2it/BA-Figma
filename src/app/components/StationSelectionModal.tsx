import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

interface StationSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStation: string;
  onStationSelect: (station: string) => void;
}

const stations = [
  "Onco Station",
  "Secondary Station",
  "North Station",
  "East Station"
];

export default function StationSelectionModal({
  open,
  onOpenChange,
  currentStation,
  onStationSelect
}: StationSelectionModalProps) {
  const [tempSelectedStation, setTempSelectedStation] = useState(currentStation);

  // Reset temp selection when modal opens
  useEffect(() => {
    if (open) {
      setTempSelectedStation(currentStation);
    }
  }, [open, currentStation]);

  const handleStationClick = (station: string) => {
    setTempSelectedStation(station);
  };

  const handleConfirm = () => {
    onStationSelect(tempSelectedStation);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelectedStation(currentStation);
    onOpenChange(false);
  };

  const hasChanges = tempSelectedStation !== currentStation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[4px]">
        <DialogHeader>
          <DialogTitle>Select Station</DialogTitle>
          <DialogDescription>
            Choose a station to load its inventory and configuration.
          </DialogDescription>
        </DialogHeader>
        
        {/* The app's own vocabulary rather than the primitives' defaults: 4px corners like every card
            and bin in the app, and #095192 for the picked row — it was the shadcn default, which is
            near-black and reads as a different product's selected state. */}
        <div className="space-y-2">
          {stations.map((station) => {
            const isPicked = tempSelectedStation === station;
            return (
              <button
                key={station}
                type="button"
                aria-pressed={isPicked}
                onClick={() => handleStationClick(station)}
                className={`w-full flex items-center gap-2 rounded-[4px] border px-4 h-10 text-[14px] leading-[20px] text-left cursor-pointer transition-colors ${
                  isPicked
                    ? 'bg-[#095192] border-[#095192] text-white'
                    : 'bg-white border-[#bcc3cd] text-[#020817] hover:bg-[#F1F6FA]'
                }`}
              >
                {station}
                {station === currentStation && (
                  <span className={`ml-auto text-[13px] ${isPicked ? 'text-white/80' : 'text-[#676b74]'}`}>
                    (Current)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Blue secondary beside filled primary, both 4px — the pairing the rest of the app uses.
            Confirm keeps its name while unavailable rather than stating a requirement, for the same
            reason step ④'s Cancel does: the word IS the control's identity. */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="h-9 px-3 inline-flex items-center rounded-[4px] text-[14px] leading-[20px] bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            // Guarded rather than `disabled`: a disabled button swallows its click, so a blocked
            // control becomes indistinguishable from a broken one. aria-disabled carries the state.
            onClick={hasChanges ? handleConfirm : undefined}
            aria-disabled={!hasChanges}
            className={`h-9 px-4 inline-flex items-center rounded-[4px] text-[14px] leading-[20px] bg-[#095192] text-white transition-colors ${
              hasChanges ? 'hover:bg-[#074080] cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}