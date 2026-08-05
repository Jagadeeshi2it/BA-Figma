"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";
import React from "react";
import { CheckCircle2, X } from "lucide-react";
import svgPaths from "../../imports/svg-k6hmk19p9g";

function ExclamationCircle() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-[21px]"
      data-name="exclamation-circle"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 21 21"
      >
        <g id="exclemation-circle">
          <path
            d={svgPaths.p3cc05c80}
            fill="var(--fill-0, #8F48D2)"
            id="Vector"
          />
          <path
            d={svgPaths.p24f18680}
            fill="var(--fill-0, #8F48D2)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p37aa3880}
            fill="var(--fill-0, #8F48D2)"
            id="Vector_3"
          />
        </g>
      </svg>
    </div>
  );
}

const CustomToast = ({ productNames }: { productNames?: string[] }) => {
  const renderMessage = () => {
    // Add null checks to prevent errors
    if (!productNames || !Array.isArray(productNames) || productNames.length === 0) {
      return (
        <>
          <span className="font-bold">Products</span>
          <span> have been successfully allocated to the bins.</span>
        </>
      );
    }

    if (productNames.length === 1) {
      return (
        <>
          <span className="font-bold">{productNames[0]}</span>
          <span> has been successfully allocated to the bin.</span>
        </>
      );
    } else {
      return (
        <>
          <span className="font-bold">
            {productNames.slice(0, -1).join(', ')} and {productNames[productNames.length - 1]}
          </span>
          <span> have been successfully allocated to the bins.</span>
        </>
      );
    }
  };

  return (
    <div className="bg-[#ead6fd] relative rounded-md w-full shadow-sm">
      <div className="absolute border-[#8f48d2] border-[0px_0px_0px_8px] border-solid inset-0 pointer-events-none rounded-md" />
      <div className="flex flex-row items-center relative w-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start px-6 py-4 relative w-full">
          <ExclamationCircle />
          <div className="basis-0 box-border content-stretch flex flex-row grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
            <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#25282a] text-[0px] text-left">
              <p className="leading-[normal] text-[14px]">
                {renderMessage()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChangeAllocationToast = ({ 
  productNames, 
  sourceLocation, 
  targetCount 
}: { 
  productNames?: string[], 
  sourceLocation?: string, 
  targetCount?: number 
}) => {
  const renderMessage = () => {
    // Add null checks to prevent errors
    if (!productNames || !Array.isArray(productNames) || productNames.length === 0) {
      return (
        <>
          <span className="font-bold">Products</span>
          <span> have been successfully moved.</span>
        </>
      );
    }

    if (productNames.length === 1) {
      return (
        <>
          <span className="font-bold">{productNames[0]}</span>
          <span> has been successfully moved from {sourceLocation || 'source'} to {targetCount || 1} target bin{(targetCount || 1) > 1 ? 's' : ''}.</span>
        </>
      );
    } else {
      return (
        <>
          <span className="font-bold">
            {productNames.slice(0, -1).join(', ')} and {productNames[productNames.length - 1]}
          </span>
          <span> have been successfully moved from {sourceLocation || 'source'} to {targetCount || 1} target bin{(targetCount || 1) > 1 ? 's' : ''}.</span>
        </>
      );
    }
  };

  return (
    <div className="bg-[#ead6fd] relative rounded-md w-full shadow-sm">
      <div className="absolute border-[#8f48d2] border-[0px_0px_0px_8px] border-solid inset-0 pointer-events-none rounded-md" />
      <div className="flex flex-row items-center relative w-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start px-6 py-4 relative w-full">
          <ExclamationCircle />
          <div className="basis-0 box-border content-stretch flex flex-row grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
            <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#25282a] text-[0px] text-left">
              <p className="leading-[normal] text-[14px]">
                {renderMessage()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "rgba(0,0,0,0.08)",
          "--width": "calc(100vw - 48px)",
          "--viewport-padding": "24px",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "group toast w-full max-w-[640px] mx-auto shadow-sm rounded-md bg-white",
          description: "group-[.toast]:text-[#25282a]",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, CustomToast, ChangeAllocationToast };

// Door-unlock notification: fired when a user lands on a page referencing a physical door,
// confirming the (simulated) hardware has unlocked it for them.
/**
 * A door transition. `lockedDoor` is the door given up to open this one — only one door at the station
 * can be unlocked at a time (STEP4-GUIDANCE.md §1), so an unlock is usually also a lock, and saying only
 * half of it leaves the operator thinking two doors are open.
 */
export const DoorUnlockedToast = ({
  doorName,
  lockedDoor,
  onDismiss
}: {
  doorName: string;
  lockedDoor?: string | null;
  onDismiss?: () => void;
}) => {
  return (
    <div className="bg-[#E1F5EC] relative rounded-md w-full shadow-sm">
      <div className="absolute border-[#12805C] border-[0px_0px_0px_8px] border-solid inset-0 pointer-events-none rounded-md" />
      <div className="flex flex-row items-center justify-between relative w-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start px-6 py-4 relative flex-1">
          <CheckCircle2 className="w-[21px] h-[21px] text-[#12805C] shrink-0" />
          <p className="text-[14px] text-[#25282a] leading-[normal]">
            {lockedDoor && (
              <>
                <span className="font-bold">{lockedDoor}</span> is locked.{' '}
              </>
            )}
            <span className="font-bold">{doorName}</span> is unlocked now.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="mr-4 shrink-0 text-[#7A7D85] hover:text-[#25282a] cursor-pointer bg-transparent border-none"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// New: Consistent validation/error toast aligned with existing design
export const ValidationToast = ({ message }: { message: string }) => {
  return (
    <div className="bg-[#FDD6D7] relative rounded-md w-full shadow-sm">
      <div className="absolute border-[#e7000b] border-[0px_0px_0px_8px] border-solid inset-0 pointer-events-none rounded-md" />
      <div className="flex flex-row items-center relative w-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start px-6 py-4 relative w-full">
          <ExclamationCircle />
          <div className="basis-0 box-border content-stretch flex flex-row grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
            <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#25282a] text-[0px] text-left">
              <p className="leading-[normal] text-[14px] whitespace-nowrap">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
