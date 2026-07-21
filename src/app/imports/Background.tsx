function Background() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[4px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap">
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

function Background1() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[60px]" data-name="Background">
      <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap text-right">
        <p className="leading-[normal] whitespace-pre">200</p>
      </div>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Background1 />
    </div>
  );
}

function Frame1410084118() {
  return (
    <div className="content-stretch flex font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">NDC:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">63323096510</p>
      </div>
    </div>
  );
}

function Frame1410084119() {
  return (
    <div className="content-stretch flex font-['Inter:Regular',_sans-serif] font-normal gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[#4a5565]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Inventory Type:</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#020817]">
        <p className="leading-[normal] text-nowrap whitespace-pre">Specialty Pharmacy</p>
      </div>
    </div>
  );
}

function Frame1410084117() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <Container2 />
      <Frame1410084118 />
      <Frame1410084119 />
    </div>
  );
}

function StandardButton() {
  return (
    <div className="box-border content-stretch flex gap-2 h-8 items-center justify-end px-3 py-2 relative rounded-[4px] shrink-0" data-name="_Standard Button">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Allocate</p>
      </div>
    </div>
  );
}

function Frame1410084114() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-start px-3 py-1.5 relative rounded-[4px] shrink-0 w-20">
      <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap">
        <p className="leading-[20px] whitespace-pre">200</p>
      </div>
    </div>
  );
}

function StandardButton1() {
  return (
    <div className="bg-[#095192] box-border content-stretch flex gap-2 h-8 items-center justify-end px-3 py-2 relative rounded-[4px] shrink-0" data-name="_Standard Button">
      <div className="capitalize font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[20px] whitespace-pre">Move</p>
      </div>
    </div>
  );
}

function Frame1410084115() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal h-[17px] leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] w-[68px]">
        <p className="leading-[20px]">Move Qty:</p>
      </div>
      <Frame1410084114 />
      <StandardButton1 />
    </div>
  );
}

function Frame1410084116() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <StandardButton />
      <Frame1410084115 />
    </div>
  );
}

export default function Background2() {
  return (
    <div className="bg-white relative rounded-[4px] size-full" data-name="Background">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col gap-4 items-start justify-start min-h-inherit p-[16px] relative size-full">
          <Frame1410084117 />
          <div className="bg-[#d9d9d9] h-px shrink-0 w-full" />
          <Frame1410084116 />
        </div>
      </div>
    </div>
  );
}