function Heading() {
  return (
    <div className="h-[20px] relative shrink-0 w-[185.531px]" data-name="Heading 4">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">XGEVA 120 MG/1.7 ML VIAL</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[12px] relative shrink-0 w-[18.797px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[12px] left-0 not-italic text-[8px] text-nowrap text-white top-0">MDV</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-black h-[15.5px] relative rounded-[4px] shrink-0 w-[25.797px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Heading />
        <Container1 />
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[453px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">denosumab 120 mg/1.7 mL (70 mg/mL) subcutaneous solution</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container2 />
        <Paragraph />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[20px] relative shrink-0 w-[34.648px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">NDC:</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[20px] relative shrink-0 w-[90.086px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">55513073001</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[20px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Container4 />
        <Container5 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[20px] relative shrink-0 w-[102.477px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">Inventory Type:</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[20px] relative shrink-0 w-[82.906px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">Charity Care</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[20px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Container7 />
        <Container8 />
      </div>
    </div>
  );
}

function Container10() {
  return <div className="bg-[#d9d9d9] h-px shrink-0 w-[453px]" data-name="Container" />;
}

function Container11() {
  return (
    <div className="h-[16px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[#4a5565] text-[12px] text-nowrap top-[0.5px]">Mention the quantity during the actual move in next step</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[32px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Container11 />
      </div>
    </div>
  );
}

function TargetProductCard() {
  return (
    <div className="h-[153px] relative shrink-0 w-[453px]" data-name="TargetProductCard">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container3 />
        <Container6 />
        <Container9 />
        <Container10 />
        <Container12 />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[20px] relative shrink-0 w-[75.75px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[38px] not-italic text-[#e7000b] text-[14px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Undo Move</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex h-[32px] items-center justify-end pl-px pr-[13px] py-px relative rounded-[4px] shrink-0 w-[101.75px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e7000b] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Button />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[453px]">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap">Door 4 - Bin A</p>
      <Container13 />
    </div>
  );
}

function Button1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[75.75px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[38px] not-italic text-[#e7000b] text-[14px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Undo Move</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex h-[32px] items-center justify-end pl-px pr-[13px] py-px relative rounded-[4px] shrink-0 w-[101.75px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e7000b] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Button1 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[453px]">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap">Door 5 - Bin C</p>
      <Container14 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative">
        <Frame />
        <Frame1 />
      </div>
    </div>
  );
}

export default function Card() {
  return (
    <div className="bg-[#eff6ff] relative rounded-[14px] size-full" data-name="Card">
      <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_0px_0px_2px_#bedbff]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pb-px pl-[17px] pr-px pt-[17px] relative size-full">
          <TargetProductCard />
          <Frame2 />
        </div>
      </div>
    </div>
  );
}