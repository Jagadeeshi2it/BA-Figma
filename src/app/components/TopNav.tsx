import svgPaths from "../imports/svg-3zhva7n9ii";

function Building() {
  return (
    <div
      className="absolute bottom-[13.542%] left-[20.833%] right-[20.833%] top-[13.542%]"
      data-name="building"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 12 15"
      >
        <g id="building">
          <path
            d={svgPaths.ped26200}
            fill="var(--fill-0, #095192)"
            id="Vector"
          />
          <path
            d={svgPaths.p21140560}
            fill="var(--fill-0, #095192)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p5940380}
            fill="var(--fill-0, #095192)"
            id="Vector_3"
          />
          <path
            d={svgPaths.p202e7080}
            fill="var(--fill-0, #095192)"
            id="Vector_4"
          />
          <path
            d={svgPaths.p1cf1f500}
            fill="var(--fill-0, #095192)"
            id="Vector_5"
          />
          <path
            d={svgPaths.p23228080}
            fill="var(--fill-0, #095192)"
            id="Vector_6"
          />
          <path
            d={svgPaths.pa404672}
            fill="var(--fill-0, #095192)"
            id="Vector_7"
          />
        </g>
      </svg>
    </div>
  );
}

function Building1() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-5"
      data-name="building"
    >
      <Building />
    </div>
  );
}

function Frame1410084043() {
  return (
    <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0">
      <Building1 />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-end leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-left">
        <p className="block leading-[18px] text-[14px]">
          Onco Demo
        </p>
      </div>
    </div>
  );
}

function MapMarker() {
  return (
    <div
      className="absolute bottom-[13.266%] left-[19.317%] right-[19.319%] top-[13.295%]"
      data-name="map-marker"
    >
      <div className="absolute bottom-0 left-0 right-[-0.002%] top-0">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 13 15"
        >
          <g id="map-marker">
            <path
              d={svgPaths.p30dada80}
              fill="var(--fill-0, #095192)"
              id="Vector"
            />
            <path
              d={svgPaths.p37e540f0}
              fill="var(--fill-0, #095192)"
              id="Vector_2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function MapMarker1() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-5"
      data-name="map-marker"
    >
      <MapMarker />
    </div>
  );
}

/**
 * The clinic. Tapping it switches the operator to clinic level, where there is no cabinet in reach and
 * so no Move — see App's accessLevel. It was a static label until 2026-08-10, which is why making it a
 * control could not affect anything that already worked.
 *
 * Underlined while active, not just recoloured: everything in this bar is already #095192, so colour
 * alone says nothing here.
 */
function Frame1410084044({ isClinicLevel, onClick }: { isClinicLevel?: boolean; onClick?: () => void }) {
  return (
    <div
      className={`box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0 ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? !!isClinicLevel : undefined}
    >
      <MapMarker1 />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-end leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-left">
        <p className={`block leading-[18px] text-[14px] ${isClinicLevel ? 'underline underline-offset-4' : ''}`}>
          Onco Clinic Center
        </p>
      </div>
    </div>
  );
}

function Box() {
  return (
    <div
      className="absolute bottom-[13.541%] left-[13.458%] right-[13.625%] top-[13.554%]"
      data-name="box"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 15 15"
      >
        <g id="box">
          <path
            d={svgPaths.p26663700}
            fill="var(--fill-0, #095192)"
            id="Vector"
          />
        </g>
      </svg>
    </div>
  );
}

function Box1() {
  return (
    <div className="overflow-clip relative shrink-0 size-5" data-name="box">
      <Box />
    </div>
  );
}

function Frame1410084045({ currentStation, onClick }: { currentStation?: string; onClick?: () => void }) {
  return (
    <div 
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <Box1 />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre text-[14px]">
          {currentStation || "Onco Station"}
        </p>
      </div>
    </div>
  );
}

function Frame1410084048({
  currentStation,
  onStationClick,
  isClinicLevel,
  onClinicClick
}: {
  currentStation?: string;
  onStationClick?: () => void;
  isClinicLevel?: boolean;
  onClinicClick?: () => void;
}) {
  return (
    <div className="box-border content-stretch flex flex-row gap-4 items-center justify-start p-0 relative shrink-0">
      <Frame1410084043 />
      <div
        className="bg-[#e0e0e0] h-10 opacity-80 shrink-0 w-[0.988px]"
        data-name="Horizonal Rule 1"
      />
      <Frame1410084044 isClinicLevel={isClinicLevel} onClick={onClinicClick} />
      <div
        className="bg-[#e0e0e0] h-10 opacity-80 shrink-0 w-[0.988px]"
        data-name="Horizontal Rule 2"
      />
      <Frame1410084045 currentStation={currentStation} onClick={onStationClick} />
    </div>
  );
}

function SignOut() {
  return (
    <div
      className="absolute bottom-[13.532%] left-[13.542%] right-[13.542%] top-[13.532%]"
      data-name="sign-out"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 18 18"
      >
        <g id="sign-out">
          <path
            d={svgPaths.p334ab100}
            fill="var(--fill-0, #095192)"
            id="Vector"
          />
          <path
            d={svgPaths.pdaf3b00}
            fill="var(--fill-0, #095192)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p370d4180}
            fill="var(--fill-0, #095192)"
            id="Vector_3"
          />
        </g>
      </svg>
    </div>
  );
}

function SignOut1() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-6"
      data-name="sign-out"
    >
      <SignOut />
    </div>
  );
}

function Frame1410084047({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="box-border content-stretch flex flex-row gap-[25px] items-center justify-start p-0 relative shrink-0">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre font-normal text-[14px]">John Doe</p>
      </div>
      <div className="cursor-pointer" onClick={onLogout}>
        <SignOut1 />
      </div>
    </div>
  );
}

export default function TopNav({
  onLogout,
  currentStation,
  onStationClick,
  isClinicLevel,
  onClinicClick
}: {
  onLogout?: () => void;
  currentStation?: string;
  onStationClick?: () => void;
  isClinicLevel?: boolean;
  onClinicClick?: () => void;
}) {
  return (
    <div className="bg-[#ffffff] relative size-full">
      <div className="absolute border-[#e0e0e0] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-between px-4 py-[7px] relative size-full">
          <Frame1410084048
            currentStation={currentStation}
            onStationClick={onStationClick}
            isClinicLevel={isClinicLevel}
            onClinicClick={onClinicClick}
          />
          <Frame1410084047 onLogout={onLogout} />
        </div>
      </div>
    </div>
  );
}