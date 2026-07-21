import svgPaths from "./svg-5ag2e33jng";

function ArrowLeft() {
  return (
    <div className="absolute inset-[21.95%_17.71%_21.88%_17.71%]" data-name="arrow-left">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 12">
        <g id="arrow-left">
          <path d={svgPaths.pf018400} fill="var(--fill-0, #095192)" id="Vector" />
          <path d={svgPaths.p207cb080} fill="var(--fill-0, #095192)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function ArrowLeft1() {
  return (
    <div className="overflow-clip relative shrink-0 size-5" data-name="arrow-left">
      <ArrowLeft />
    </div>
  );
}

function StandardButton() {
  return (
    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative rounded-[4px] shrink-0" data-name="_Standard Button">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <ArrowLeft1 />
      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
        <p className="leading-[20px] whitespace-pre">back</p>
      </div>
    </div>
  );
}

function StandardButton1() {
  return (
    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative rounded-[4px] shrink-0" data-name="_Standard Button">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Cancel</p>
      </div>
    </div>
  );
}

function Check() {
  return (
    <div className="absolute inset-[24.5%_14.05%_23.96%_13.03%]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 11">
        <g id="check">
          <path d={svgPaths.p20a5e100} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Check1() {
  return (
    <div className="overflow-clip relative shrink-0 size-5" data-name="check">
      <Check />
    </div>
  );
}

function StandardButton2() {
  return (
    <div className={`${!window.serialNumberModalEnabled ? 'bg-[#095192] hover:bg-[#074080] cursor-pointer' : 'bg-[rgba(32,81,140,0.6)] cursor-not-allowed'} box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative rounded-[4px] shrink-0 transition-colors`} data-name="_Standard Button">
      <Check1 />
      <div className="capitalize font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[20px] whitespace-pre">Save</p>
      </div>
    </div>
  );
}

function Frame1410084127() {
  return (
    <div className="content-stretch flex gap-4 items-center justify-end relative shrink-0">
      <StandardButton1 />
      <StandardButton2 />
    </div>
  );
}

export default function Frame1410084126() {
  return (
    <div className="bg-white sticky bottom-0 size-full z-50">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[23px] py-4 relative size-full h-[64px] min-h-[64px] max-h-[64px]">
          <StandardButton />
          <Frame1410084127 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}