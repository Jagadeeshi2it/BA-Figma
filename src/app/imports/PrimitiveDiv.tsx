import svgPaths from "./svg-jzj424bgss";

function PrimitiveH() {
  return (
    <div className="absolute h-[18px] left-[24px] top-[24px] w-[1050px]" data-name="Primitive.h2">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-0 not-italic text-[#0a0a0a] text-[18px] text-nowrap top-0">Change Allocation</p>
    </div>
  );
}

function Badge() {
  return (
    <div className="absolute bg-[#eceef2] border border-[rgba(0,0,0,0)] border-solid h-[22px] left-0 overflow-clip rounded-[8px] top-0 w-[25.75px]" data-name="Badge">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16px] left-[8px] not-italic text-[#030213] text-[12px] text-nowrap top-[2.5px]">0</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[22px] relative shrink-0 w-[141.695px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Badge />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[33.75px] not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">Products Moved</p>
      </div>
    </div>
  );
}

function Badge1() {
  return (
    <div className="absolute border border-[rgba(0,0,0,0.1)] border-solid h-[22px] left-0 overflow-clip rounded-[8px] top-0 w-[25.398px]" data-name="Badge">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16px] left-[8px] not-italic text-[#0a0a0a] text-[12px] text-nowrap top-[2.5px]">2</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="basis-0 grow h-[22px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Badge1 />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[33.4px] not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">Products Allocated</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[22px] relative shrink-0 w-[316.18px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-start relative size-full">
        <Container />
        <Container1 />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#eceef2] h-[36px] relative rounded-[8px] shrink-0 w-[78.469px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[16px] py-[8px] relative size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#030213] text-[14px] text-center text-nowrap">Cancel</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="basis-0 bg-[#030213] grow h-[36px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[16px] py-[8px] relative size-full">
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white">Confirm Changes</p>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[36px] relative shrink-0 w-[235.75px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Button />
        <Button1 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container2 />
      <Container3 />
    </div>
  );
}

function ChangeAllocationModal() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[69px] items-start left-[24px] pb-0 pt-[17px] px-[16px] top-[705px] w-[1050px]" data-name="ChangeAllocationModal">
      <div aria-hidden="true" className="absolute border-[1px_0px_0px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
      <Container4 />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p20f4ecf0} id="Vector" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 18.3333V10" id="Vector_2" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2eca8c80} id="Vector_3" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M6.25 3.55833L13.75 7.85" id="Vector_4" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[#dbeafe] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[232.961px]" data-name="Heading 4">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">CARBOPLATIN 150 MG/15 ML VIAL</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[12px] relative shrink-0 w-[20.891px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[12px] not-italic relative shrink-0 text-[10px] text-nowrap text-white">SDV</p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-black h-[15.5px] relative rounded-[4px] shrink-0 w-[27.891px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container6 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[20px] relative shrink-0 w-[382px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Heading1 />
        <Container7 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[20px] relative shrink-0 w-[34.648px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">NDC:</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[20px] relative shrink-0 w-[56.242px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">2411230</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[20px] items-start left-0 top-[30px] w-[442px]" data-name="Container">
      <Container9 />
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[20px] relative shrink-0 w-[102.477px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">Inventory Type:</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[20px] relative shrink-0 w-[130.734px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">Specialty Pharmacy</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[20px] items-start left-0 top-[58px] w-[442px]" data-name="Container">
      <Container12 />
      <Container13 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[382px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">carboplatin 10 mg/mL intravenous solution</p>
        <Container11 />
        <Container14 />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[48px] relative shrink-0 w-[382px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative size-full">
        <Container8 />
        <Paragraph />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[40px] relative shrink-0 w-[159.531px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container5 />
        <Container15 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex h-[40px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container16 />
    </div>
  );
}

function Container18() {
  return (
    <div className="bg-white h-[129px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-[519px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-tl-[10px] rounded-tr-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px pt-[16px] px-[16px] relative size-full">
        <Container17 />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-center leading-[20px] not-italic relative text-[14px] text-nowrap">
        <p className="relative shrink-0 text-[#4a5565]">Door:</p>
        <p className="relative shrink-0 text-[#020817]">4</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-center leading-[20px] not-italic relative text-[14px] text-nowrap">
        <p className="relative shrink-0 text-[#4a5565]">Bin:</p>
        <p className="relative shrink-0 text-[#020817]">B</p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-center leading-[20px] not-italic relative text-[14px] text-nowrap">
        <p className="relative shrink-0 text-[#4a5565]">vials:</p>
        <p className="relative shrink-0 text-[#020817]">25</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="bg-[#095192] h-[32px] relative rounded-[4px] shrink-0 w-[100px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white">Move Qty</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Frame3 />
        <Frame5 />
        <Frame4 />
        <Container19 />
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-white relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[12px] items-start p-[17px] relative w-full">
          {[...Array(4).keys()].map((_, i) => (
            <Container20 key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col h-[580px] items-start relative shrink-0 w-[487px]" data-name="Container">
      <Card />
    </div>
  );
}

function Container22() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[519px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pb-0 pl-[16px] pr-[27px] pt-[16px] relative rounded-[inherit] size-full">
        <Container21 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="[grid-area:1_/_1] bg-[#f9fafb] content-stretch flex flex-col items-start p-px place-self-stretch relative rounded-[10px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container18 />
      <Container22 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p20f4ecf0} id="Vector" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 18.3333V10" id="Vector_2" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1ad3bc70} id="Vector_3" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M6.25 3.55833L13.75 7.85" id="Vector_4" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container24() {
  return (
    <div className="bg-[#dcfce7] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon1 />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#101828] text-[16px] top-[-1px] w-[108px]">Door 8 - Bin C</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#6a7282] text-[14px] text-nowrap top-[0.5px]">Door 8</p>
    </div>
  );
}

function Container25() {
  return (
    <div className="basis-0 grow h-[44px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex gap-[12px] h-[44px] items-center relative shrink-0 w-full" data-name="Container">
      <Container24 />
      <Container25 />
    </div>
  );
}

function Container27() {
  return (
    <div className="bg-white h-[77px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-[519px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-tl-[10px] rounded-tr-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px pl-[16px] pr-[343.492px] pt-[16px] relative size-full">
        <Container26 />
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[185.531px]" data-name="Heading 4">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">XGEVA 120 MG/1.7 ML VIAL</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="h-[12px] relative shrink-0 w-[18.797px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[12px] left-0 not-italic text-[8px] text-nowrap text-white top-0">MDV</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="bg-black h-[15.5px] relative rounded-[4px] shrink-0 w-[25.797px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container28 />
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="h-[20px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Heading2 />
        <Container29 />
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[453px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">denosumab 120 mg/1.7 mL (70 mg/mL) subcutaneous solution</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container30 />
        <Paragraph2 />
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[20px] relative shrink-0 w-[34.648px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">NDC:</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[20px] relative shrink-0 w-[90.086px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">55513073001</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[20px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Container32 />
        <Container33 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="h-[20px] relative shrink-0 w-[102.477px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px]">Inventory Type:</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[20px] relative shrink-0 w-[82.906px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-[0.5px]">Charity Care</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="h-[20px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Container35 />
        <Container36 />
      </div>
    </div>
  );
}

function Container38() {
  return <div className="bg-[#d9d9d9] h-px shrink-0 w-[453px]" data-name="Container" />;
}

function Container39() {
  return (
    <div className="h-[16px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[#4a5565] text-[12px] text-nowrap top-[0.5px]">Mention the quantity during the actual move in next step</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="h-[32px] relative shrink-0 w-[453px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Container39 />
      </div>
    </div>
  );
}

function TargetProductCard() {
  return (
    <div className="h-[153px] relative shrink-0 w-[453px]" data-name="TargetProductCard">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container31 />
        <Container34 />
        <Container37 />
        <Container38 />
        <Container40 />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[75.75px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[38px] not-italic text-[#e7000b] text-[14px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Undo Move</p>
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex h-[32px] items-center justify-end pl-px pr-[13px] py-px relative rounded-[4px] shrink-0 w-[101.75px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e7000b] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Button2 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[453px]">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap">Door 4 - Bin A</p>
      <Container41 />
    </div>
  );
}

function Button3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[75.75px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[38px] not-italic text-[#e7000b] text-[14px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Undo Move</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex h-[32px] items-center justify-end pl-px pr-[13px] py-px relative rounded-[4px] shrink-0 w-[101.75px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e7000b] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Button3 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[453px]">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#020817] text-[14px] text-nowrap">Door 5 - Bin C</p>
      <Container42 />
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

function Card1() {
  return (
    <div className="bg-[#eff6ff] h-[258px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
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

function Container43() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[519px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pb-0 pt-[16px] px-[16px] relative rounded-[inherit] size-full">
        <Card1 />
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="[grid-area:1_/_2] bg-[#f9fafb] content-stretch flex flex-col items-start p-px place-self-stretch relative rounded-[10px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container27 />
      <Container43 />
    </div>
  );
}

function ChangeAllocationModal1() {
  return (
    <div className="absolute gap-[8px] grid grid-cols-[repeat(2,_minmax(0px,_1fr))] grid-rows-[repeat(1,_minmax(0px,_1fr))] h-[631px] left-[24px] overflow-clip top-[58px] w-[1050px]" data-name="ChangeAllocationModal">
      <Container23 />
      <Container44 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-0 size-[16px] top-0" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M12 4L4 12" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M4 4L12 12" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function DialogContent() {
  return (
    <div className="absolute left-[7px] overflow-clip size-px top-[15px]" data-name="DialogContent">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[21.5px] not-italic text-[#0a0a0a] text-[16px] text-center text-nowrap top-[-1px] translate-x-[-50%]">Close</p>
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="absolute left-[1066px] opacity-70 rounded-[2px] size-[16px] top-[16px]" data-name="Primitive.button">
      <Icon2 />
      <DialogContent />
    </div>
  );
}

export default function PrimitiveDiv() {
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.1)] border-solid overflow-clip relative rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-full" data-name="Primitive.div">
      <PrimitiveH />
      <ChangeAllocationModal />
      <ChangeAllocationModal1 />
      <PrimitiveButton />
    </div>
  );
}