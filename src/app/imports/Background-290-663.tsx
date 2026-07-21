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

export default function Background2() {
  return (
    <div className="bg-white relative rounded-[4px] size-full" data-name="Background">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-[16px] relative size-full">
          <Container2 />
          <Frame1410084118 />
          <Frame1410084119 />
        </div>
      </div>
    </div>
  );
}