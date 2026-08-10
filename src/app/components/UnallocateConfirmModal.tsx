import React from 'react';
import ConfirmDialog from "./ConfirmDialog";

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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Unallocate Products?"
      dismissLabel="Keep Products"
      onDismiss={handleCancel}
      confirmLabel="Unallocate"
      onConfirm={handleConfirm}
      /* Wider than the plain confirmations because the body is a list that can run to several products,
         each carrying a full product name and a bin location. */
      className="max-w-2xl"
    >
      {/* No padding and no card of its own: the rows sit flush against the dialog's `p-6`, on the same
          left edge as the title above them. A padded white box inside a white dialog read as a second
          surface, and the scroll cap is the only thing that has to stay. */}
      <div className="max-h-[300px] overflow-y-auto">
        {productsToUnallocate.map((product, index) => (
          <div
            key={`${product.productId}-${product.binId}-${index}`}
            className="py-3 first:pt-0 border-b border-gray-200 last:border-b-0 last:pb-0"
          >
            <p className="font-semibold text-gray-900 mb-2">{product.productName}</p>
            <p className="text-[14px] leading-[20px] text-[#4a5565]">
              The product has 0 inventory qty do you want to unallocate it from the bin?
            </p>
            <p className="text-[14px] leading-[20px] text-gray-500 mt-2">
              Bin: {product.binName} • {product.location}
            </p>
          </div>
        ))}
      </div>
    </ConfirmDialog>
  );
}
