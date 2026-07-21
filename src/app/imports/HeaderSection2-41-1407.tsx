function Frame1410084217() {
  return (
    <div className="content-stretch flex flex-col items-start not-italic relative shrink-0 text-nowrap whitespace-pre">
      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-black tracking-[-0.1504px]">Step 1. Select one or more source bins</p>
      <p className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#165dfc] text-[12px]">Selected: 0 bins</p>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-[11px] py-[7px] relative rounded-[4px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <p className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap whitespace-pre">Clear</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex gap-[10px] items-center justify-center px-[11px] py-[7px] relative rounded-[4px] shrink-0" data-name="Container">
      <p className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">Next Step</p>
    </div>
  );
}

function Frame1410084218() {
  return (
    <div className="content-stretch flex gap-[8px] items-center opacity-0 relative shrink-0">
      <Container />
      <Container1 />
    </div>
  );
}

export default function HeaderSection2() {
  return (
    <div className="bg-[#edf1f5] relative rounded-[10px] size-full" data-name="HeaderSection2">
      <div aria-hidden="true" className="absolute border border-[rgba(9,81,146,0.2)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between pb-px pt-0 px-[16px] relative size-full">
          <Frame1410084217 />
          <Frame1410084218 />
        </div>
      </div>
    </div>
  );
}