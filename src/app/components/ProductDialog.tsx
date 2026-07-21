import React from 'react';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Plus } from "lucide-react";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: () => void;
}

const ProductDialog = React.forwardRef<HTMLDivElement, ProductDialogProps>(({ open, onOpenChange, onAddProduct }, ref) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product to Slot</DialogTitle>
          <DialogDescription>
            Select a product to allocate to this bin slot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div 
              className="bg-white relative rounded-[4px] cursor-pointer w-full"
              onClick={onAddProduct}
            >
              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-start relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-start px-3 py-2 relative size-full">
                  <Plus className="w-4 h-4 text-[#095192]" />
                  <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[12px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre">PACLITAXEL 100 MG VIAL - SDV</p>
                  </div>
                </div>
              </div>
            </div>
            <div 
              className="bg-white relative rounded-[4px] cursor-pointer w-full"
              onClick={onAddProduct}
            >
              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-start relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-start px-3 py-2 relative size-full">
                  <Plus className="w-4 h-4 text-[#095192]" />
                  <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[12px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre">CARBOPLATIN 150 MG VIAL - SDV</p>
                  </div>
                </div>
              </div>
            </div>
            <div 
              className="bg-white relative rounded-[4px] cursor-pointer w-full"
              onClick={onAddProduct}
            >
              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-start relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-start px-3 py-2 relative size-full">
                  <Plus className="w-4 h-4 text-[#095192]" />
                  <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[12px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre">LEUCOVORIN 50 MG VIAL - SDV</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ProductDialog.displayName = 'ProductDialog';

export default ProductDialog;