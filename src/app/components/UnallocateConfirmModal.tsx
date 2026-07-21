import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

interface ProductToUnallocate {
  productId: string;
  productName: string;
  binId: string;
  binName: string;
  location: string;
}

interface UnallocateConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productsToUnallocate: ProductToUnallocate[];
  onConfirm: (productIds: string[], binIds: string[]) => void;
  onCancel: () => void;
}

export default function UnallocateConfirmModal({
  open,
  onOpenChange,
  productsToUnallocate,
  onConfirm,
  onCancel
}: UnallocateConfirmModalProps) {
  const handleConfirm = () => {
    const productIds = productsToUnallocate.map(p => p.productId);
    const binIds = productsToUnallocate.map(p => p.binId);
    onConfirm(productIds, binIds);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">Unallocate Products?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="rounded-lg p-4 max-h-[300px] overflow-y-auto bg-[#ffffff]">
            {productsToUnallocate.map((product, index) => (
              <div 
                key={`${product.productId}-${product.binId}-${index}`}
                className="py-3 border-b border-gray-200 last:border-b-0"
              >
                <p className="font-semibold text-gray-900 mb-2">{product.productName}</p>
                <p className="text-sm text-gray-600">
                  The product has 0 inventory qty do you want to unallocate it from the bin?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Bin: {product.binName} • {product.location}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="px-6"
          >
            Keep Products
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#095192] hover:bg-[#074080] text-white px-6"
          >
            Unallocate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}