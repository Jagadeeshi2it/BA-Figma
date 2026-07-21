import image_834b8d94ff066d058094e0c6b1f00273a10682ed from 'figma:asset/834b8d94ff066d058094e0c6b1f00273a10682ed.png';
import React from 'react';
import svgPaths from "../imports/svg-5vxb1bnmqw";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useTabletSimulator } from '../context/TabletSimulatorContext';
import { usePip } from '../context/PipContext';

interface InteractiveIconContainerProps {
  onInventoryClick?: () => void;
}

function Frame1410084048() {
  return (
    <div className="bg-[#0e243f] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <div className="h-[25px] shrink-0 w-7 flex items-center justify-center" data-name="AllyIQ_White">
        <ImageWithFallback
          src={image_834b8d94ff066d058094e0c6b1f00273a10682ed}
          alt="AllyIQ Logo"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

function Transfer() {
  return (
    <div className="relative shrink-0 size-6" data-name="Transfer">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Transfer">
          <g id="Vector">
            <path
              clipRule="evenodd"
              d={svgPaths.p2f281900}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
            <path
              clipRule="evenodd"
              d={svgPaths.p21665d80}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084047() {
  return (
    <div className="bg-[#173a63] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <Transfer />
      <div
        className="absolute h-2 left-[45px] top-1/2 translate-y-[-50%] w-[5px]"
        data-name="Vector"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 5 8"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p3da5e380}
            fill="var(--fill-0, white)"
            fillRule="evenodd"
            id="Vector"
          />
        </svg>
      </div>
    </div>
  );
}

function Frame1410084055() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full">
      <Frame1410084048 />
      <Frame1410084047 />
    </div>
  );
}

function Transfer1() {
  return (
    <div className="relative shrink-0 size-6" data-name="Transfer">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Transfer">
          <g id="Vector">
            <path
              clipRule="evenodd"
              d={svgPaths.p2762d900}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
            <path d={svgPaths.p340c2780} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084045() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <Transfer1 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Dispense</p>
      </div>
    </div>
  );
}

function Transfer2() {
  return (
    <div className="relative shrink-0 size-6" data-name="Transfer">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Transfer">
          <path
            d={svgPaths.p1c5fa3f0}
            fill="var(--fill-0, white)"
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeWidth="0.25"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame1410084046() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <Transfer2 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Order</p>
      </div>
    </div>
  );
}

function Transfer3() {
  return (
    <div className="relative shrink-0 size-6" data-name="Transfer">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Transfer">
          <g id="Vector">
            <path d={svgPaths.p3d36dd00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p155d2248} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1acb380} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084043() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <Transfer3 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Restock</p>
      </div>
    </div>
  );
}

function Transfer4() {
  return (
    <div className="relative shrink-0 size-6" data-name="Transfer">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Transfer">
          <g id="Vector">
            <path d={svgPaths.p2dbdeb00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p31986300} fill="var(--fill-0, white)" />
            <path d={svgPaths.p200a8080} fill="var(--fill-0, white)" />
            <path d={svgPaths.p295fbe80} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1c2f4780} fill="var(--fill-0, white)" />
            <path d={svgPaths.pe1041c0} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1518c100} fill="var(--fill-0, white)" />
            <path d={svgPaths.p3d221800} fill="var(--fill-0, white)" />
            <path
              clipRule="evenodd"
              d={svgPaths.p5ee8700}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
            <path d={svgPaths.p147c7280} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084042() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <Transfer4 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Audit</p>
      </div>
    </div>
  );
}

function MenuItemIcon() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <path
            d={svgPaths.p33bcf100}
            fill="var(--fill-0, #095192)"
            id="Vector"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame1410084041({ onInventoryClick }: { onInventoryClick?: () => void }) {
  return (
    <div 
      className="bg-[#ffffff] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onInventoryClick}
    >
      <MenuItemIcon />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#095192] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Inventory</p>
      </div>
      <div
        className="absolute h-2 left-[45px] top-[15px] w-[5px]"
        data-name="Vector"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 5 8"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p3da5e380}
            fill="var(--fill-0, #095192)"
            fillRule="evenodd"
            id="Vector"
          />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon1() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path d={svgPaths.p184a3880} fill="var(--fill-0, white)" />
            <path d={svgPaths.p22c7c00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p36937680} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084040() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon1 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Formulary</p>
      </div>
    </div>
  );
}

function MenuItemIcon2() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path d={svgPaths.p3c31cd00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p4d413f2} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1557e300} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084039() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon2 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Patient</p>
      </div>
    </div>
  );
}

function MenuItemIcon3() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path d={svgPaths.p1d973f80} fill="var(--fill-0, white)" />
            <path d={svgPaths.pb201390} fill="var(--fill-0, white)" />
            <path d={svgPaths.p128c3ef1} fill="var(--fill-0, white)" />
            <path d={svgPaths.p17ccaf00} fill="var(--fill-0, white)" />
            <path
              clipRule="evenodd"
              d={svgPaths.pe39ce80}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
            <path
              clipRule="evenodd"
              d={svgPaths.p3abc7280}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084038() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon3 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Transfer</p>
      </div>
    </div>
  );
}

function MenuItemIcon4() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Union">
            <path d={svgPaths.p7e443f0} fill="var(--fill-0, white)" />
            <path d={svgPaths.pf8d4f00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1e39ab00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1b719400} fill="var(--fill-0, white)" />
            <path
              clipRule="evenodd"
              d={svgPaths.p142de2f0}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084037() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon4 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal] font-normal">Reporting</p>
      </div>
    </div>
  );
}

function MenuItemIcon5() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path
              clipRule="evenodd"
              d={svgPaths.p3381e780}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
            <path d={svgPaths.p5e01370} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1194d980} fill="var(--fill-0, white)" />
            <path d={svgPaths.p4d9c432} fill="var(--fill-0, white)" />
            <path d={svgPaths.p158129f2} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084036() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon5 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Station</p>
      </div>
    </div>
  );
}

function MenuItemIcon6() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path d={svgPaths.p26134e00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p32659400} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084035() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon6 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">User</p>
      </div>
    </div>
  );
}

function Frame1410084056({ onInventoryClick }: { onInventoryClick?: () => void }) {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full">
      <Frame1410084055 />
      <Frame1410084045 />
      <Frame1410084046 />
      <Frame1410084043 />
      <Frame1410084042 />
      <Frame1410084041 onInventoryClick={onInventoryClick} />
      <Frame1410084040 />
      <Frame1410084039 />
      <Frame1410084038 />
      <Frame1410084037 />
      <Frame1410084036 />
      <Frame1410084035 />
    </div>
  );
}

function MenuItemIcon7() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path d={svgPaths.p29c56700} fill="var(--fill-0, white)" />
            <path d={svgPaths.p136a0c00} fill="#095192" />
            <path d={svgPaths.p29c56700} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084049() {
  // Doubles as the on/off toggle for the "Cabinet — Live Physical View" PIP (demo aid).
  const { pipEnabled, togglePip } = usePip();
  return (
    <button
      type="button"
      onClick={togglePip}
      title="Toggle Cabinet Live Physical View (PIP)"
      className={`box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full cursor-pointer border-none ${
        pipEnabled ? 'bg-[#F7941D]' : 'bg-[#095192]'
      }`}
    >
      <MenuItemIcon7 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Resource</p>
      </div>
    </button>
  );
}

function MenuItemIcon8() {
  return (
    <div className="relative shrink-0 size-6" data-name="Menu Item Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Menu Item Icon">
          <g id="Vector">
            <path d={svgPaths.p178d0b00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p12666d70} fill="var(--fill-0, white)" />
            <path
              clipRule="evenodd"
              d={svgPaths.p22d4bf00}
              fill="var(--fill-0, white)"
              fillRule="evenodd"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Frame1410084052() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full">
      <MenuItemIcon8 />
      <div
        className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] min-w-full not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center"
        style={{ width: "min-content" }}
      >
        <p className="block leading-[normal]">Help</p>
      </div>
    </div>
  );
}

function Frame1410084053() {
  const { isSimulating, toggleSimulation } = useTabletSimulator();
  return (
    <button
      type="button"
      onClick={toggleSimulation}
      title="Toggle 1920×1080 tablet simulation"
      className={`box-border content-stretch flex flex-col h-[50px] items-center justify-center p-0 relative shrink-0 w-full cursor-pointer border-none ${
        isSimulating ? 'bg-[#F7941D]' : 'bg-[#095192]'
      }`}
    >
      <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[10px] text-center w-full">
        <p className="block leading-[normal]">V 1.0</p>
      </div>
    </button>
  );
}

function Frame1410084057() {
  return (
    <div className="box-border content-stretch flex flex-col gap-1 items-center justify-start p-0 relative shrink-0 w-full">
      <Frame1410084049 />
      <Frame1410084052 />
      <Frame1410084053 />
    </div>
  );
}

export default function InteractiveIconContainer({ onInventoryClick }: InteractiveIconContainerProps) {
  return (
    <div
      className="bg-[#095192] box-border content-stretch flex flex-col items-start justify-between p-0 relative size-full"
      data-name="Icon Container"
    >
      <Frame1410084056 onInventoryClick={onInventoryClick} />
      <Frame1410084057 />
    </div>
  );
}