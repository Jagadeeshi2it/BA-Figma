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

export default function Background1() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-4 items-start justify-start relative rounded-[4px] size-full" data-name="Background">
      <Container2 />
      <Frame1410084131 />
    </div>
  );
}