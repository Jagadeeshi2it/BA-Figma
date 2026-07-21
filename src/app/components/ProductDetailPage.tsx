import React from 'react';
import { Button } from "./ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { Product } from '../types';
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { emergencyKitService } from '../services/EmergencyKitService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { AlertTriangle } from "lucide-react";

// E-Kit Icon Component - Inline SVG
const EkitIcon: React.FC = () => {
  return (
    <div className="relative size-full" data-name="ekit_icon" data-node-id="159:9188">
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 14 14" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="block max-w-none size-full"
        aria-label="E-Kit"
      >
        <path 
          d="M7.27148 0C7.78974 3.8441e-05 8.286 0.179715 8.65234 0.499023C9.01873 0.818375 9.22461 1.25134 9.22461 1.70312V2.27051H9.69824C9.78788 2.05044 10.0274 1.8916 10.3105 1.8916H11.6123C11.9278 1.8916 12.1903 2.08794 12.25 2.34766C12.6437 2.44283 13.0067 2.62405 13.3008 2.87988C13.7479 3.27037 14 3.7999 14 4.35156V11.9189C14 12.4706 13.7479 13.0001 13.3008 13.3906C12.8528 13.7803 12.2452 14 11.6123 14H2.3877C1.7548 14 1.14721 13.7803 0.699219 13.3906C0.252094 13.0001 7.90164e-06 12.4706 0 11.9189V4.35156C0 3.7999 0.25211 3.27037 0.699219 2.87988C0.993068 2.62425 1.35569 2.4429 1.74902 2.34766C1.80864 2.08783 2.07215 1.8916 2.3877 1.8916H3.68945C3.97255 1.8916 4.21212 2.05044 4.30176 2.27051H4.77539V1.70312C4.77539 1.25134 4.98127 0.818375 5.34766 0.499023C5.714 0.179715 6.21026 3.83249e-05 6.72852 0C8.1741 0 5.8259 0 7.27148 0ZM6.67188 5.25C6.49066 5.25 6.34375 5.39691 6.34375 5.57812V7.21875H4.70312C4.52191 7.21875 4.375 7.36566 4.375 7.54688V8.20312C4.375 8.38434 4.52191 8.53125 4.70312 8.53125H6.34375V10.1719C6.34375 10.3531 6.49066 10.5 6.67188 10.5H7.32812C7.50934 10.5 7.65625 10.3531 7.65625 10.1719V8.53125H9.29688C9.47809 8.53125 9.625 8.38434 9.625 8.20312V7.54688C9.625 7.36566 9.47809 7.21875 9.29688 7.21875H7.65625V5.57812C7.65625 5.39691 7.50934 5.25 7.32812 5.25H6.67188ZM6.72852 1.13477C6.5558 1.1348 6.39007 1.19509 6.26855 1.30176C6.14617 1.4077 6.07715 1.55255 6.07715 1.70312V2.27051H7.92285V1.70312C7.92285 1.55255 7.85383 1.4077 7.73145 1.30176C7.60993 1.19509 7.4442 1.1348 7.27148 1.13477H6.72852Z" 
          fill="#E94444"
        />
      </svg>
    </div>
  );
};

interface ProductDetailPageProps {
  product: Product;
  location?: {
    cabinet: string;
    door: string;
    bin: string;
    shelf: string;
  };
  doorShelfConfig?: any; // Add doorShelfConfig to determine E-Kit status
  onBack: () => void;
  onUnallocate?: (productId: string, binId: string) => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  location,
  doorShelfConfig,
  onBack,
  onUnallocate
}) => {
  // Determine if the product is in an E-Kit bin
  const isInEKitBin = React.useMemo(() => {
    if (!location?.door || !doorShelfConfig) return false;
    
    // Find the bin ID from the location information
    const doorKey = location.door;
    const binName = location.bin;
    
    // Search for the bin in the doorShelfConfig
    const doorShelves = doorShelfConfig[doorKey];
    if (!doorShelves) return false;
    
    for (const shelf of doorShelves) {
      const bin = shelf.bins.find(b => b.name === binName);
      if (bin) {
        return emergencyKitService.isBinInEmergencyKit(bin.id, doorShelfConfig);
      }
    }
    
    return false;
  }, [location, doorShelfConfig]);

  // Generate serial numbers, lot numbers, expiration dates, and restocked dates based on product quantity
  const generateSerialNumber = (index: number): string => {
    // Generate realistic serial numbers with varying lengths (8-14 digits)
    const baseSerial = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
    const variation = Math.floor(Math.random() * 1000000) + index * 1000;
    return (parseInt(baseSerial) + variation).toString();
  };

  const generateLotNumber = (index: number): string => {
    // Generate realistic lot numbers (5-8 characters)
    const lotPrefix = ['LOT', 'BAT', 'MFG'][Math.floor(Math.random() * 3)];
    const lotNumber = Math.floor(Math.random() * 900000) + 100000 + index;
    return `${lotPrefix}${lotNumber.toString().slice(0, 6)}`;
  };

  const generateExpirationDate = (): string => {
    // Generate expiration dates 6-24 months from now
    const monthsFromNow = Math.floor(Math.random() * 18) + 6; // 6-24 months
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + monthsFromNow);
    
    const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
    const day = expirationDate.getDate().toString().padStart(2, '0');
    const year = expirationDate.getFullYear();
    
    return `${month}/${day}/${year}`;
  };

  const generateRestockedDate = (): string => {
    // Generate restocked dates within the last 30-90 days
    const daysAgo = Math.floor(Math.random() * 60) + 30; // 30-90 days ago
    const restockedDate = new Date();
    restockedDate.setDate(restockedDate.getDate() - daysAgo);
    
    const month = (restockedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = restockedDate.getDate().toString().padStart(2, '0');
    const year = restockedDate.getFullYear();
    
    return `${month}/${day}/${year}`;
  };

  // Generate items based on product quantity
  const generateItems = () => {
    const quantity = parseInt(product.quantity.toString()) || 1;
    const items = [];
    
    for (let i = 0; i < quantity; i++) {
      items.push({
        serial: generateSerialNumber(i),
        lot: generateLotNumber(i),
        expiration: generateExpirationDate(),
        restockedDate: generateRestockedDate(),
        inventory: `1 ${product.unit} / ${Math.floor(Math.random() * 500) + 50} mg`
      });
    }
    
    return items;
  };

  const generatedItems = React.useMemo(() => generateItems(), [product.quantity, product.unit]);

  const handleLogout = () => {
    // Handle logout functionality here
    console.log("Logout clicked");
  };

  // Get bin ID from location
  const getBinId = () => {
    if (!location?.door || !location?.bin || !doorShelfConfig) return null;
    
    const doorShelves = doorShelfConfig[location.door];
    if (!doorShelves) return null;
    
    for (const shelf of doorShelves) {
      const bin = shelf.bins.find(b => b.name === location.bin);
      if (bin) return bin.id;
    }
    
    return null;
  };

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const handleUnallocateClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmUnallocate = () => {
    const binId = getBinId();
    if (binId && onUnallocate) {
      onUnallocate(product.id, binId);
    }
    setShowConfirmModal(false);
  };

  const isZeroQuantity = parseInt(product.quantity.toString()) === 0;

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <div className="h-[50px]">
          <TopNav onLogout={handleLogout} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Header */}
          <div className="bg-white border-b border-[#e0e0e0] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-[24px] font-normal text-black leading-[28.89px] w-fit">
                {product.name}
              </h1>
              <div className="bg-[#3c464c] px-1.5 py-[3px] rounded-[5px]">
                <span className="text-[12px] font-semibold text-white">
                  {product.inventoryType === 'Charity Care' ? 'MDV' : 'SDV'}
                </span>
              </div>
            </div>
            <p className="text-[16px] font-normal text-black mt-1">
              {product.description || `${product.name.toLowerCase()} ${product.quantity} ${product.unit} intravenous suspension 120`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#767676] text-[16px] font-normal">Inventory</p>
            <p className="text-[#25282a] text-[18px] font-semibold">
              {product.quantity} {product.unit} / {parseInt(product.quantity) * 100} mg
            </p>
          </div>
        </div>
          </div>

          {/* Product Details Section */}
          <div className="bg-[#e9eef4] px-6 py-4">
        <div className="grid grid-cols-3 gap-[60px]">
          {/* Product Details */}
          <div className="space-y-1">
            <h3 className="text-[14px] font-medium text-slate-500 mb-2">Product Details</h3>
            <div className="space-y-1">
              <div className="flex">
                <span className="text-[14px] font-normal text-black w-[97.7px]">NDC</span>
                <span className="text-[14px] font-semibold text-black ml-2">{product.ndc}</span>
              </div>
              <div className="flex">
                <span className="text-[14px] font-normal text-black w-[97.7px]">Inventory</span>
                <span className="text-[14px] font-semibold text-black ml-2">{product.inventoryType}</span>
              </div>
            </div>
          </div>

          {/* Product Location */}
          <div className="space-y-1">
            <h3 className="text-[14px] font-medium text-slate-500 mb-2">Product Location</h3>
            <div className="space-y-1">
              <div className="flex">
                <span className="text-[14px] font-normal text-black w-[78.16px]">Door</span>
                <span className="text-[14px] font-semibold text-black ml-2">
                  {location?.door.replace('Door ', '') || '1'}
                </span>
              </div>
              <div className="flex">
                <span className="text-[14px] font-normal text-black w-[78.16px]">Bin</span>
                <span className="text-[14px] font-semibold text-black ml-2">
                  {location?.bin || 'MyBin 5'}
                </span>
              </div>
            </div>
          </div>

          {/* Product Par Values */}
          <div className="space-y-1">
            <h3 className="text-[14px] font-medium text-slate-500 mb-2">Product Par Values</h3>
            <div className="space-y-1">
              <div className="flex">
                <span className="text-[14px] font-normal text-black w-[58.62px]">Par Min</span>
                <span className="text-[14px] font-semibold text-black ml-2">0</span>
              </div>
              <div className="flex">
                <span className="text-[14px] font-normal text-black w-[58.62px]">Par Max</span>
                <span className="text-[14px] font-semibold text-black ml-2">1</span>
              </div>
            </div>
          </div>
        </div>
          </div>

          {/* Items Table */}
          <div className="px-6 py-4">
        <h3 className="text-[16px] font-semibold text-black mb-4">
          Items in {location?.cabinet || 'Anil-MedOrderStation Station-Virtual'} ({generatedItems.length} {generatedItems.length === 1 ? 'item' : 'items'})
        </h3>

        <div className="overflow-auto rounded-[8px] border border-[#e0e0e0]">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50 h-[52px]">
                <th className="text-left px-4 pt-4 pb-[16.556px] text-[14px] font-medium text-[#25282a] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  Serial
                </th>
                <th className="text-left px-4 pt-4 pb-[16.556px] text-[14px] font-medium text-[#25282a] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  Lot
                </th>
                <th className="text-left px-4 pt-4 pb-[16.556px] text-[14px] font-medium text-[#25282a] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  Expiration
                </th>
                <th className="text-left px-4 pt-4 pb-[16.556px] text-[14px] font-medium text-[#25282a] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  Restocked Date
                </th>
                <th className="text-left px-4 pt-4 pb-[16.556px] text-[14px] font-medium text-[#25282a] border-b-[0.556px] border-[#e0e0e0] w-[295px]">
                  Inventory
                </th>
                <th className="text-left px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[163px]"></th>
              </tr>
            </thead>

            {/* Filter Row */}
            <tbody>
              <tr className="bg-neutral-50 h-[68px]">
                <td className="px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  <input
                    type="text"
                    placeholder="Search by Serial Number"
                    className="w-full p-[8.556px] text-[16px] border border-[#ced4da] rounded-[4px] bg-white text-[#9fa9b7] placeholder:text-[#9fa9b7]"
                  />
                </td>
                <td className="px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  <input
                    type="text"
                    placeholder="Search by Lot Number"
                    className="w-full p-[8.556px] text-[16px] border border-[#ced4da] rounded-[4px] bg-white text-[#9fa9b7] placeholder:text-[#9fa9b7]"
                  />
                </td>
                <td className="px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  <input
                    type="text"
                    placeholder="Search by Expiration Date"
                    className="w-full p-[8.556px] text-[16px] border border-[#ced4da] rounded-[4px] bg-white text-[#9fa9b7] placeholder:text-[#9fa9b7]"
                  />
                </td>
                <td className="px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[277.94px]">
                  <input
                    type="text"
                    placeholder="Search by Restocked Date"
                    className="w-full p-[8.556px] text-[16px] border border-[#ced4da] rounded-[4px] bg-white text-[#9fa9b7] placeholder:text-[#9fa9b7]"
                  />
                </td>
                <td className="px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[295px]"></td>
                <td className="px-4 pt-4 pb-[16.556px] border-b-[0.556px] border-[#e0e0e0] w-[163px]"></td>
              </tr>

              {/* Data Rows */}
              {generatedItems.map((item, index) => (
                <tr key={index} className="bg-white h-[49px]">
                  <td className="p-4 border-b-[0.556px] border-[#e9ecef] w-[277.94px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-normal text-[#25282a]">{item.serial}</span>
                      {isInEKitBin && (
                        <div className="w-4 h-4 flex-shrink-0">
                          <EkitIcon />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 border-b-[0.556px] border-[#e9ecef] w-[277.94px]">
                    <span className="text-[14px] font-normal text-[#25282a]">{item.lot}</span>
                  </td>
                  <td className="p-4 border-b-[0.556px] border-[#e9ecef] w-[277.94px]">
                    <span className="text-[14px] font-normal text-[#25282a]">{item.expiration}</span>
                  </td>
                  <td className="p-4 border-b-[0.556px] border-[#e9ecef] w-[277.94px]">
                    <span className="text-[14px] font-normal text-[#25282a]">{item.restockedDate}</span>
                  </td>
                  <td className="p-4 border-b-[0.556px] border-[#e9ecef] w-[295px]">
                    <span className="text-[14px] font-normal text-[#25282a]">{item.inventory}</span>
                  </td>
                  <td className="p-4 border-b-[0.556px] border-[#e9ecef] w-[163px]">
                    <button
                      className="flex items-center px-[16.556px] py-[8.556px] rounded-[4px] text-[#095192] text-[14px] font-normal hover:bg-gray-50"
                    >
                      <div className="mr-2 scale-y-[-100%]">
                        <svg className="w-3.5 h-[14.44px]" fill="none" viewBox="0 0 15 15">
                          <path d="M12.2217 3.41895H10.6221C10.458 3.41895 10.3167 3.47819 10.1982 3.59668C10.0798 3.71517 10.0205 3.85645 10.0205 4.02051C10.0205 4.18457 10.0798 4.32585 10.1982 4.44434C10.3167 4.56283 10.458 4.62207 10.6221 4.62207H12.2217C12.4951 4.62207 12.7298 4.72005 12.9258 4.91602C13.1217 5.11198 13.2197 5.34668 13.2197 5.62012V8.81934C13.2197 9.09277 13.1217 9.32747 12.9258 9.52344C12.7298 9.7194 12.4951 9.81738 12.2217 9.81738H2.62402C2.35059 9.81738 2.11589 9.7194 1.91992 9.52344C1.72396 9.32747 1.62598 9.09277 1.62598 8.81934V5.62012C1.62598 5.34668 1.72396 5.11198 1.91992 4.91602C2.11589 4.72005 2.35059 4.62207 2.62402 4.62207H4.22363C4.3877 4.62207 4.52897 4.56283 4.64746 4.44434C4.76595 4.32585 4.8252 4.18457 4.8252 4.02051C4.8252 3.85645 4.76595 3.71517 4.64746 3.59668C4.52897 3.47819 4.3877 3.41895 4.22363 3.41895H2.62402C2.01335 3.41895 1.49382 3.63314 1.06543 4.06152C0.637044 4.48991 0.422852 5.00944 0.422852 5.62012V8.81934C0.422852 9.43001 0.637044 9.94954 1.06543 10.3779C1.49382 10.8063 2.01335 11.0205 2.62402 11.0205H12.2217C12.8324 11.0205 13.3519 10.8063 13.7803 10.3779C14.2087 9.94954 14.4229 9.43001 14.4229 8.81934V5.62012C14.4229 5.00944 14.2087 4.48991 13.7803 4.06152C13.3519 3.63314 12.8324 3.41895 12.2217 3.41895ZM10.6221 9.81738C10.458 9.81738 10.3167 9.87663 10.1982 9.99512C10.0798 10.1136 10.0205 10.2549 10.0205 10.4189V13.0166H4.8252V10.4189C4.8252 10.2549 4.76595 10.1136 4.64746 9.99512C4.52897 9.87663 4.3877 9.81738 4.22363 9.81738C4.05957 9.81738 3.91829 9.87663 3.7998 9.99512C3.68132 10.1136 3.62207 10.2549 3.62207 10.4189V13.2217C3.62207 13.4951 3.72005 13.7298 3.91602 13.9258C4.11198 14.1217 4.34668 14.2197 4.62012 14.2197H10.2256C10.499 14.2197 10.7337 14.1217 10.9297 13.9258C11.1257 13.7298 11.2236 13.4951 11.2236 13.2217V10.4189C11.2236 10.2549 11.1644 10.1136 11.0459 9.99512C10.9274 9.87663 10.7861 9.81738 10.6221 9.81738ZM10.2256 0.219727H4.62012C4.34668 0.219727 4.11198 0.317708 3.91602 0.513672C3.72005 0.709635 3.62207 0.944336 3.62207 1.21777V6.82324C3.62207 7.09668 3.72005 7.33138 3.91602 7.52734C4.11198 7.72331 4.34668 7.82129 4.62012 7.82129H10.2256C10.499 7.82129 10.7337 7.72331 10.9297 7.52734C11.1257 7.33138 11.2236 7.09668 11.2236 6.82324V1.21777C11.2236 0.944336 11.1257 0.709635 10.9297 0.513672C10.7337 0.317708 10.499 0.219727 10.2256 0.219727ZM4.8252 1.42285H10.0205V6.61816H4.8252V1.42285Z" fill="#095192" />
                        </svg>
                      </div>
                      Print QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-[60px] right-0 bg-white border-t border-[#e0e0e0] px-6 py-4">
            <div className="flex justify-end items-center gap-3">
              <Button
                onClick={onBack}
                className="bg-[#095192] text-white text-[16px] font-semibold px-4 py-2 rounded border border-[#095192] hover:bg-[#074080]"
              >
                <ArrowLeft className="w-4 h-4 mr-2 scale-y-[-1]" />
                BACK TO ALL PRODUCTS
              </Button>
              
              {/* Unallocate Button - Only visible when quantity is 0 */}
              {isZeroQuantity && onUnallocate && (
                <Button
                  onClick={handleUnallocateClick}
                  variant="outline"
                  className="text-red-600 border-red-600 text-[16px] font-semibold px-4 py-2 rounded hover:bg-red-50"
                >
                  UNALLOCATE FROM BIN
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <DialogTitle className="text-xl">Confirm Unallocation</DialogTitle>
            </div>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to unallocate <strong>{product.name}</strong> from bin <strong>{location?.bin}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This will remove the product from the bin entirely. You can reallocate it later if needed.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUnallocate}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              Unallocate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;