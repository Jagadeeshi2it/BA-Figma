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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Station</DialogTitle>
          <DialogDescription>
            Choose a station to load its inventory and configuration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {stations.map((station) => (
            <Button
              key={station}
              variant={tempSelectedStation === station ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleStationClick(station)}
            >
              {station}
              {station === currentStation && (
                <span className="ml-auto text-xs opacity-70">(Current)</span>
              )}
            </Button>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!hasChanges}
            className={hasChanges ? "bg-[#095192] hover:bg-[#095192]/90" : ""}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}