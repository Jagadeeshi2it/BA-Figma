import svgPaths from "./svg-ec5tme2916";

function InAuditSolid() {
  return (
    <div className="bg-[#d9342b] h-6 opacity-0 relative rounded-[25px] shrink-0" data-name="In Audit / Solid">
      <div className="box-border content-stretch flex gap-2.5 h-6 items-center justify-center overflow-clip px-2.5 py-[5px] relative">
        <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-white">
          <p className="leading-[normal] whitespace-pre">Expired</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-0 border-[#095192] border-solid inset-0 pointer-events-none rounded-[25px]" />
    </div>
  );
}

function Frame1410084040() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0 w-40">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[90px]">
        <p className="leading-[normal]">Expiration</p>
      </div>
      <InAuditSolid />
    </div>
  );
}

function ColumnNames() {
  return (
    <div className="absolute bg-slate-50 left-6 rounded-tl-[4px] rounded-tr-[4px] top-[315px] w-[1052px]" data-name="Column Names">
      <div className="box-border content-stretch flex items-center justify-between overflow-clip px-6 py-2 relative w-[1052px]">
        <div className="relative rounded-[4px] shrink-0 size-4">
          <div aria-hidden="true" className="absolute border-2 border-[#bcc3cd] border-solid inset-[-2px] pointer-events-none rounded-[6px]" />
        </div>
        <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[180px]">
          <p className="leading-[normal]">Serial</p>
        </div>
        <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-20">
          <p className="leading-[normal]">Lot</p>
        </div>
        <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[140px]">
          <p className="leading-[normal]">Source</p>
        </div>
        <Frame1410084040 />
        <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[200px]">
          <p className="leading-[normal]">Quantity</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e0e0e0] border-solid inset-0 pointer-events-none rounded-tl-[4px] rounded-tr-[4px]" />
    </div>
  );
}

function Group1410083564() {
  return (
    <div className="relative shrink-0 size-4">
      <div className="absolute inset-[-12.5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
          <g id="Group 1410083564">
            <path d={svgPaths.pd446580} fill="var(--fill-0, #095192)" id="Rectangle 2587" stroke="var(--stroke-0, #095192)" strokeWidth="2" />
            <path d="M6 10L9 13L14.5 7.5" id="Vector 35" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame1410084038() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0 w-40">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[90px]">
        <p className="leading-[normal]">mm/dd/yyyy</p>
      </div>
    </div>
  );
}

function TableRow() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Table Row">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-center justify-between px-6 py-4 relative w-full">
          <Group1410083564 />
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[180px]">
            <p className="leading-[normal]">50825684771313</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-20">
            <p className="leading-[normal]">8768686</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[140px]">
            <p className="leading-[normal]">{`CuraScript SD	`}</p>
          </div>
          <Frame1410084038 />
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[200px]">
            <p className="leading-[normal]">1 vial / 400 mg / 16 ml</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_1px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Frame1410084039() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0 w-40">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[90px]">
        <p className="leading-[normal]">mm/dd/yyyy</p>
      </div>
    </div>
  );
}

function TableRow1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Table Row">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-center justify-between px-6 py-4 relative w-full">
          <div className="relative rounded-[4px] shrink-0 size-4">
            <div aria-hidden="true" className="absolute border-2 border-[#bcc3cd] border-solid inset-[-2px] pointer-events-none rounded-[6px]" />
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[180px]">
            <p className="leading-[normal]">50825684771314</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-20">
            <p className="leading-[normal]">8768686</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[140px]">
            <p className="leading-[normal]">Danaher Corporation</p>
          </div>
          <Frame1410084039 />
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[200px]">
            <p className="leading-[normal]">1 vial / 400 mg / 16 ml</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_1px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Frame1410084102() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[180px]">
        <p className="leading-[normal]">50825684771312</p>
      </div>
    </div>
  );
}

function Frame1410084041() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0 w-40">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[90px]">
        <p className="leading-[normal]">mm/dd/yyyy</p>
      </div>
    </div>
  );
}

function TableRow2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Table Row">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-center justify-between px-6 py-4 relative w-full">
          <div className="relative rounded-[4px] shrink-0 size-4">
            <div aria-hidden="true" className="absolute border-2 border-[#bcc3cd] border-solid inset-[-2px] pointer-events-none rounded-[6px]" />
          </div>
          <Frame1410084102 />
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-20">
            <p className="leading-[normal]">8768686</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[140px]">
            <p className="leading-[normal]">{`CuraScript SD	`}</p>
          </div>
          <Frame1410084041 />
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[200px]">
            <p className="leading-[normal]">1 vial / 400 mg / 16 ml</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_1px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Frame1410084042() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0 w-40">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[90px]">
        <p className="leading-[normal]">mm/dd/yyyy</p>
      </div>
    </div>
  );
}

function TableRow3() {
  return (
    <div className="bg-white relative rounded-bl-[4px] rounded-br-[4px] shrink-0 w-full" data-name="Table Row">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-center justify-between px-6 py-4 relative w-full">
          <div className="relative rounded-[4px] shrink-0 size-4">
            <div aria-hidden="true" className="absolute border-2 border-[#bcc3cd] border-solid inset-[-2px] pointer-events-none rounded-[6px]" />
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[180px]">
            <p className="leading-[normal]">50825684771311</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-20">
            <p className="leading-[normal]">8768686</p>
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[140px]">
            <p className="leading-[normal]">{`CuraScript SD	`}</p>
          </div>
          <Frame1410084042 />
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#25282a] text-[14px] w-[200px]">
            <p className="leading-[normal]">1 vial / 400 mg / 16 ml</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_1px_1px] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-br-[4px]" />
    </div>
  );
}

function Frame1410084101() {
  return (
    <div className="absolute content-stretch flex flex-col items-start justify-start left-6 top-[355px] w-[1052px]">
      <TableRow />
      <TableRow1 />
      <TableRow2 />
      <TableRow3 />
    </div>
  );
}

function Group1410083562() {
  return (
    <div className="absolute contents left-6 top-[315px]">
      <ColumnNames />
      <Frame1410084101 />
    </div>
  );
}

function StandardButton() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-end relative rounded-[4px] shrink-0" data-name="Standard Button">
      <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#767676] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Inventory(Vials)</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex items-start justify-start relative rounded-[4px] shrink-0" data-name="Button">
      <StandardButton />
    </div>
  );
}

function Frame1() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-end justify-start p-[8px] relative shrink-0">
      <Button />
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[35px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">4</p>
      </div>
    </div>
  );
}

function StandardButton1() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-end relative rounded-[4px] shrink-0" data-name="Standard Button">
      <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#767676] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Move(Vials)</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex items-start justify-start relative rounded-[4px] shrink-0" data-name="Button">
      <StandardButton1 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-end justify-start p-[8px] relative shrink-0">
      <Button1 />
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[35px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">2</p>
      </div>
    </div>
  );
}

function StandardButton2() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-end relative rounded-[4px] shrink-0" data-name="Standard Button">
      <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#767676] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">
          Selected<span className="font-['Inter:Medium',_sans-serif] font-medium not-italic">(Vials)</span>
        </p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex items-start justify-start relative rounded-[4px] shrink-0" data-name="Button">
      <StandardButton2 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-end justify-start p-[8px] relative shrink-0">
      <Button2 />
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[35px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">1</p>
      </div>
    </div>
  );
}

function TargetVsScanned() {
  return (
    <div className="absolute box-border content-stretch flex gap-6 items-center justify-start px-6 py-0 right-px top-[207px]" data-name="Target vs Scanned">
      <Frame1 />
      <div className="bg-[#eeeeee] h-[66px] shrink-0 w-px" />
      <Frame4 />
      <div className="bg-[#eeeeee] h-[66px] shrink-0 w-px" />
      <Frame3 />
    </div>
  );
}

function Qrcode() {
  return (
    <div className="absolute inset-[16.17%_19.25%_19.25%_16.17%]" data-name="qrcode">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="qrcode">
          <path d={svgPaths.p389ab880} fill="var(--fill-0, #64748B)" id="Vector" />
          <path d={svgPaths.p96bed80} fill="var(--fill-0, #64748B)" id="Vector_2" />
          <path d={svgPaths.p53260f0} fill="var(--fill-0, #64748B)" id="Vector_3" />
          <path d={svgPaths.p38490800} fill="var(--fill-0, #64748B)" id="Vector_4" />
          <path d={svgPaths.p16b2fb80} fill="var(--fill-0, #64748B)" id="Vector_5" />
          <path d="M12 10.25H10.25V12H12V10.25Z" fill="var(--fill-0, #64748B)" id="Vector_6" />
          <path d={svgPaths.p20f5a800} fill="var(--fill-0, #64748B)" id="Vector_7" />
          <path d={svgPaths.p2833b9b2} fill="var(--fill-0, #64748B)" id="Vector_8" />
          <path d="M13.75 12H12V13.75H13.75V12Z" fill="var(--fill-0, #64748B)" id="Vector_9" />
          <path d={svgPaths.p6989f00} fill="var(--fill-0, #64748B)" id="Vector_10" />
          <path d={svgPaths.p539e380} fill="var(--fill-0, #64748B)" id="Vector_11" />
        </g>
      </svg>
    </div>
  );
}

function Qrcode1() {
  return (
    <div className="absolute left-0 overflow-clip size-6 top-0" data-name="qrcode">
      <Qrcode />
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="relative shrink-0 size-6" data-name="Left Icon">
      <Qrcode1 />
    </div>
  );
}

function InputGroup() {
  return (
    <div className="bg-white h-12 relative rounded-bl-[4px] rounded-tl-[4px] shrink-0 w-full" data-name="Input Group">
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex gap-2 h-12 items-center justify-start p-[12px] relative w-full">
          <LeftIcon />
          <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#9fa9b7] text-[16px]">
            <p className="leading-[normal]">Scan or type serial number</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px relative rounded-[4px] shrink-0" data-name="Input">
      <InputGroup />
    </div>
  );
}

function Search() {
  return (
    <div className="absolute inset-[13.5%_13.54%_13.54%_13.5%]" data-name="search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="search">
          <path d={svgPaths.p3c2b9f80} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p25ddd700} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Search1() {
  return (
    <div className="overflow-clip relative shrink-0 size-5" data-name="search">
      <Search />
    </div>
  );
}

function LargeButton() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex gap-2 h-full items-center justify-center min-w-11 px-4 py-2 relative rounded-br-[6px] rounded-tr-[6px] shrink-0" data-name="_Large Button">
      <Search1 />
    </div>
  );
}

function InputGroupAddOns() {
  return (
    <div className="content-stretch flex h-12 items-center justify-center relative rounded-br-[4px] rounded-tr-[4px] shrink-0" data-name="_Input Group Add-Ons">
      <LargeButton />
    </div>
  );
}

function SearchFrame() {
  return (
    <div className="absolute content-stretch flex h-12 items-start justify-start left-6 top-[226px] w-[386px]" data-name="SearchFrame">
      <Input />
      <InputGroupAddOns />
    </div>
  );
}

function Group1410083563() {
  return (
    <div className="absolute contents left-0 top-[200px]">
      <div className="absolute bg-[#e9eef4] h-px left-0 top-[200px] w-[1099px]" />
      <div className="absolute bg-[#e9eef4] h-px left-px top-[298px] w-[1099px]" />
      <TargetVsScanned />
      <SearchFrame />
    </div>
  );
}

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

function StandardButton3() {
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

function StandardButton4() {
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

function StandardButton5() {
  return (
    <div className="bg-[rgba(32,81,140,0.6)] box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative rounded-[4px] shrink-0" data-name="_Standard Button">
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
      <StandardButton4 />
      <StandardButton5 />
    </div>
  );
}

function Frame1410084126() {
  return (
    <div className="absolute bg-white bottom-0 left-0 w-[1100px]">
      <div className="box-border content-stretch flex items-center justify-between overflow-clip px-[23px] py-4 relative w-[1100px]">
        <StandardButton3 />
        <Frame1410084127 />
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[4px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">POTASSIUM CL 20 MEQ/10 ML CONC</p>
      </div>
      <Background />
    </div>
  );
}

function Container1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container />
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#4a5565] text-[14px] w-full">
        <p className="leading-[normal]">potassium chloride 2 mEq/mL intravenous solution</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container1 />
    </div>
  );
}

function Frame1410084118() {
  return (
    <div className="content-start flex flex-wrap font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">NDC:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">63323096510</p>
      </div>
    </div>
  );
}

function Frame1410084124() {
  return (
    <div className="content-start flex flex-wrap font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Inventory Type:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Specialty Pharmacy</p>
      </div>
    </div>
  );
}

function Frame1410084130() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
      <Frame1410084118 />
      <Frame1410084124 />
    </div>
  );
}

function Frame1410084123() {
  return (
    <div className="content-start flex flex-wrap font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Bin:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">1</p>
      </div>
    </div>
  );
}

function Frame1410084120() {
  return (
    <div className="content-start flex flex-wrap font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Door:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">2</p>
      </div>
    </div>
  );
}

function Frame1410084128() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-40">
      <Frame1410084123 />
      <Frame1410084120 />
    </div>
  );
}

function Frame1410084122() {
  return (
    <div className="content-start flex flex-wrap font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-[334px]">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Move Qty:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">2</p>
      </div>
    </div>
  );
}

function Frame1410084125() {
  return (
    <div className="content-start flex flex-wrap font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-[334px]">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Move To:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">E-Kit, Floor 1</p>
      </div>
    </div>
  );
}

function Frame1410084129() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
      <Frame1410084122 />
      <Frame1410084125 />
    </div>
  );
}

function Frame1410084131() {
  return (
    <div className="content-stretch flex gap-[60px] items-start justify-start relative shrink-0">
      <Frame1410084130 />
      <Frame1410084128 />
      <Frame1410084129 />
    </div>
  );
}

function Background1() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col gap-4 items-start justify-start left-[23px] right-[25px] rounded-[4px] translate-y-[-50%]" data-name="Background" style={{ top: "calc(50% - 185px)" }}>
      <Container2 />
      <Frame1410084131 />
    </div>
  );
}

function Frame1410084132() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-1 items-start justify-start not-italic relative shrink-0 w-[632px]">
      <div className="flex flex-col justify-center relative shrink-0 text-[21px] text-neutral-950 w-full">
        <p className="leading-[normal]">Select serial items to move</p>
      </div>
      <div className="relative shrink-0 text-[#25282a] text-[14px] w-full">
        <p className="leading-[normal]">Quantity being moved to the Emergency Kit requires selecting a serial number before the move.</p>
      </div>
    </div>
  );
}

function Group1410083565() {
  return (
    <div className="[grid-area:1_/_1] ml-[7px] mt-[7px] relative size-2.5">
      <div className="absolute inset-[-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <g id="Group 1410083565">
            <path d="M11 1L1 11" id="Vector 36" stroke="var(--stroke-0, black)" strokeLinecap="round" />
            <path d="M1 1L11 11" id="Vector 37" stroke="var(--stroke-0, black)" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group1410083566() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="[grid-area:1_/_1] bg-white ml-0 mt-0 size-6" />
      <Group1410083565 />
    </div>
  );
}

function Frame1410084133() {
  return (
    <div className="absolute content-stretch flex items-center justify-between leading-[0] left-6 top-4 w-[1052px]">
      <Frame1410084132 />
      <Group1410083566 />
    </div>
  );
}

export default function Frame1410084113() {
  return (
    <div className="bg-white overflow-clip relative rounded-[8px] size-full">
      <Group1410083562 />
      <Group1410083563 />
      <Frame1410084126 />
      <Background1 />
      <Frame1410084133 />
    </div>
  );
}