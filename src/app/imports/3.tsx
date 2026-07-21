import svgPaths from "./svg-4d4ogcdl9f";
import imgImageWithFallback from "figma:asset/834b8d94ff066d058094e0c6b1f00273a10682ed.png";

function Container() {
  return <div className="absolute border-[#e0e0e0] border-[0px_0px_1px] border-solid h-[50px] left-0 top-0 w-[1176px]" data-name="Container" />;
}

function Container1() {
  return <div className="absolute bg-[#e0e0e0] h-[40px] left-[237px] opacity-80 top-0 w-[0.984px]" data-name="Container" />;
}

function Container2() {
  return <div className="absolute bg-[#e0e0e0] h-[40px] left-[427.16px] opacity-80 top-0 w-[0.984px]" data-name="Container" />;
}

function Building() {
  return (
    <div className="absolute contents inset-[0_2.78%_2.78%_0]" data-name="building">
      <div className="absolute inset-[15.28%_58.33%_73.61%_27.78%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p167132f2} fill="var(--fill-0, #095192)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[15.28%_30.56%_73.61%_55.56%]" data-name="Vector_2">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p1f8d1800} fill="var(--fill-0, #095192)" id="Vector_2" />
        </svg>
      </div>
      <div className="absolute inset-[34.72%_58.33%_54.17%_27.78%]" data-name="Vector_3">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p131ce80} fill="var(--fill-0, #095192)" id="Vector_3" />
        </svg>
      </div>
      <div className="absolute inset-[34.72%_30.56%_54.17%_55.56%]" data-name="Vector_4">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.pfb1ef00} fill="var(--fill-0, #095192)" id="Vector_4" />
        </svg>
      </div>
      <div className="absolute inset-[54.17%_58.33%_34.72%_27.78%]" data-name="Vector_5">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p131ce80} fill="var(--fill-0, #095192)" id="Vector_3" />
        </svg>
      </div>
      <div className="absolute inset-[54.17%_30.56%_34.72%_55.56%]" data-name="Vector_6">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.pfb1ef00} fill="var(--fill-0, #095192)" id="Vector_4" />
        </svg>
      </div>
      <div className="absolute inset-[0_2.78%_2.78%_0]" data-name="Vector_7">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 15">
          <path d={svgPaths.p306f6800} fill="var(--fill-0, #095192)" id="Vector_7" />
        </svg>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[14.594px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Building />
    </div>
  );
}

function Building2() {
  return (
    <div className="content-stretch flex flex-col h-[14.594px] items-start relative shrink-0 w-full" data-name="Building">
      <Icon />
    </div>
  );
}

function Building1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip pb-0 pt-[2.703px] px-[4.164px] size-[20px] top-0" data-name="Building1">
      <Building2 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[18px] left-[28px] top-px w-[193px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[#095192] text-[14px] text-nowrap top-px">The Oncology Institute of Hope</p>
    </div>
  );
}

function Frame29() {
  return (
    <div className="absolute h-[20px] left-0 top-[10px] w-[221px]" data-name="Frame14100840432">
      <Building1 />
      <Paragraph />
    </div>
  );
}

function MapMarker() {
  return (
    <div className="absolute contents inset-[0_5.59%_2.08%_0]" data-name="map-marker">
      <div className="absolute inset-[0_5.59%_2.08%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 15">
          <path d={svgPaths.p217eb800} fill="var(--fill-0, #095192)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[24.02%_36.05%_46.95%_30.46%]" data-name="Vector_2">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <path d={svgPaths.p2460ac00} fill="var(--fill-0, #095192)" id="Vector_2" />
        </svg>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[14.695px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MapMarker />
    </div>
  );
}

function MapMarker2() {
  return (
    <div className="content-stretch flex flex-col h-[14.695px] items-start relative shrink-0 w-full" data-name="MapMarker">
      <Icon1 />
    </div>
  );
}

function MapMarker1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip pb-0 pt-[2.656px] px-[3.859px] size-[20px] top-0" data-name="MapMarker1">
      <MapMarker2 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[18px] left-[28px] top-px w-[129.172px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[#095192] text-[14px] text-nowrap top-px">Thrive Health Center</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="absolute h-[20px] left-[253.98px] top-[10px] w-[157.172px]" data-name="Frame1410084044">
      <MapMarker1 />
      <Paragraph1 />
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-[0_2.78%_2.79%_0]" data-name="box">
      <div className="absolute inset-[0_2.78%_2.79%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
          <path d={svgPaths.p13f8f300} fill="var(--fill-0, #095192)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[14.594px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Box />
    </div>
  );
}

function Box2() {
  return (
    <div className="content-stretch flex flex-col h-[14.594px] items-start relative shrink-0 w-full" data-name="Box">
      <Icon2 />
    </div>
  );
}

function Box1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip pb-0 pl-[2.688px] pr-[2.719px] pt-[2.703px] size-[20px] top-0" data-name="Box1">
      <Box2 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute content-stretch flex h-[16px] items-start left-[28px] top-[2px] w-[95.703px]" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">Primary Station</p>
    </div>
  );
}

function Frame30() {
  return (
    <div className="absolute h-[20px] left-[444.14px] top-[10px] w-[123.703px]" data-name="Frame14100840452">
      <Box1 />
      <Paragraph2 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="absolute h-[40px] left-[16px] top-[5px] w-[567.844px]" data-name="Frame14100840482">
      <Container1 />
      <Container2 />
      <Frame29 />
      <Frame11 />
      <Frame30 />
    </div>
  );
}

function SignOut() {
  return (
    <div className="absolute contents inset-[0_2.78%_2.75%_0]" data-name="sign-out">
      <div className="absolute inset-[0_63.89%_2.75%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 18">
          <path d={svgPaths.p29925800} fill="var(--fill-0, #095192)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[22.13%_2.78%_24.99%_66.56%]" data-name="Vector_2">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
          <path d={svgPaths.p3f0e7f80} fill="var(--fill-0, #095192)" id="Vector_2" />
        </svg>
      </div>
      <div className="absolute inset-[44.46%_2.78%_47.21%_27.78%]" data-name="Vector_3">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 2">
          <path d={svgPaths.p3bb11830} fill="var(--fill-0, #095192)" id="Vector_3" />
        </svg>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[17.516px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <SignOut />
    </div>
  );
}

function SignOut2() {
  return (
    <div className="content-stretch flex flex-col h-[17.516px] items-start relative shrink-0 w-full" data-name="SignOut">
      <Icon3 />
    </div>
  );
}

function SignOut1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[87.92px] overflow-clip pb-0 pt-[3.242px] px-[3.25px] size-[24px] top-0" data-name="SignOut1">
      <SignOut2 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute content-stretch flex h-[17px] items-start left-0 top-[3.5px] w-[62.922px]" data-name="Paragraph">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#25282a] text-[14px] text-nowrap">John Doe</p>
    </div>
  );
}

function Frame31() {
  return (
    <div className="absolute h-[24px] left-[1048.08px] top-[13px] w-[111.922px]" data-name="Frame14100840472">
      <SignOut1 />
      <Paragraph3 />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[50px] left-0 top-0 w-[1176px]" data-name="Container">
      <Frame32 />
      <Frame31 />
    </div>
  );
}

function TopNav() {
  return (
    <div className="absolute bg-white h-[50px] left-0 top-0 w-[1176px]" data-name="TopNav">
      <Container />
      <Container3 />
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[24px] relative shrink-0 w-[199.531px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-0 not-italic text-[#020817] text-[16px] text-nowrap top-[-1px]">MVASI 100 MG/4 ML VIAL</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24.75px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[18px] left-0 not-italic text-[12px] text-nowrap text-white top-[0.5px]">SDV</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-black h-[21.5px] relative rounded-[4px] shrink-0 w-[31.75px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container5 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[1050px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Container4 />
        <Container6 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[21px] relative shrink-0 w-[1050px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-0">bevacizumab-awwb 25 mg/mL intravenous solution</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow h-[49px] items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container7 />
      <Container8 />
    </div>
  );
}

function Unlock() {
  return (
    <div className="absolute inset-[13.54%_17.71%]" data-name="unlock">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
        <g id="unlock">
          <path d={svgPaths.p13b1d400} fill="var(--fill-0, #095192)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Unlock1() {
  return (
    <div className="overflow-clip relative shrink-0 size-[20px]" data-name="unlock">
      <Unlock />
    </div>
  );
}

function StandardButton() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-end px-[12px] py-[8px] relative rounded-[4px] shrink-0" data-name="Standard Button">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Unlock1 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap uppercase">Unlock Door</p>
    </div>
  );
}

function PrimaryButton() {
  return (
    <div className="content-stretch flex h-[36px] items-start relative rounded-[4px] shrink-0" data-name="Primary Button">
      <StandardButton />
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[80px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[24px] py-0 relative size-full">
          <Container9 />
          <PrimaryButton />
        </div>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[18px] opacity-50 relative shrink-0 w-[240px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-0 not-italic text-[#25282a] text-[12px] text-nowrap top-[0.5px]">Product Details</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[21px] relative shrink-0 w-[34.648px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-0">NDC:</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[21px] relative shrink-0 w-[90.883px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-0">55513026901</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[21px] relative shrink-0 w-[240px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Container12 />
        <Container13 />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[21px] relative shrink-0 w-[102.477px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-0">Inventory Type:</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[21px] relative shrink-0 w-[70.141px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-0">Purchased</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[240px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <Container15 />
        <Container16 />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[76px] relative shrink-0 w-[240px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container11 />
        <Container14 />
        <Container17 />
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="h-[18px] opacity-50 relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-0 not-italic text-[#25282a] text-[12px] text-nowrap top-[0.5px]">Target Bin</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-start leading-[21px] not-italic relative size-full text-[14px] text-nowrap">
        <p className="relative shrink-0 text-[#4a5565]">Door:</p>
        <p className="relative shrink-0 text-[#020817]">Door 2</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="h-[21px] relative shrink-0 w-[34.031px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-0">Bin B</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[21px] relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] not-italic relative shrink-0 text-[#4a5565] text-[14px] text-nowrap">Bin:</p>
        <Container21 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[76px] relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container19 />
        <Container20 />
        <Container22 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="h-[18px] opacity-50 relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-0 not-italic text-[#25282a] text-[12px] text-nowrap top-[0.5px]">Inventory</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-start leading-[21px] not-italic relative size-full text-[14px] text-nowrap">
        <p className="relative shrink-0 text-[#4a5565]">Before Move:</p>
        <p className="relative shrink-0 text-[#020817]">0</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="h-[21px] relative shrink-0 w-[34.031px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#020817] text-[14px] text-nowrap top-0">0</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="h-[21px] relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] not-italic relative shrink-0 text-[#4a5565] text-[14px] text-nowrap">After Move:</p>
        <Container26 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="h-[76px] relative shrink-0 w-[160px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Container24 />
        <Container25 />
        <Container27 />
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex gap-[60px] h-[76px] items-start relative shrink-0 w-full" data-name="Container">
      <Container18 />
      <Container23 />
      <Container28 />
    </div>
  );
}

function Container30() {
  return (
    <div className="bg-[#e9eef4] h-[109px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pb-px pt-[16px] px-[24px] relative size-full">
          <Container29 />
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[0_3.13%_3.13%_0]" data-name="Group">
      <div className="absolute inset-[0_3.13%_56.25%_53.13%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <path d={svgPaths.p86b4af0} fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_56.25%_56.25%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <path d={svgPaths.p96bed80} fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[53.13%_56.25%_3.13%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <path d={svgPaths.p96bed80} fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[53.13%_35.94%_35.94%_53.13%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-[35.94%] left-3/4 right-[14.06%] top-[53.13%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-1/4 left-[64.06%] right-1/4 top-[64.06%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-1/4 left-[85.94%] right-[3.13%] top-[64.06%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-[14.06%] left-[53.13%] right-[35.94%] top-3/4" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-[14.06%] left-3/4 right-[14.06%] top-3/4" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-[3.13%] left-[64.06%] right-1/4 top-[85.94%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[85.94%_3.13%_3.13%_85.94%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d="M1.75 0H0V1.75H1.75V0Z" fill="var(--fill-0, #64748B)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group />
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon4 />
      </div>
    </div>
  );
}

function TextInput() {
  return (
    <div className="basis-0 grow h-[24px] min-h-px min-w-px relative shrink-0" data-name="Text Input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#9fa9b7] text-[16px] text-nowrap">Scan or type serial number</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[24px] relative shrink-0 w-[305px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center pl-[16px] pr-[12px] py-0 relative size-full">
        <Container31 />
        <TextInput />
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="bg-white h-[48px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0 w-[280px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#bcc3cd] border-[1px_0px_1px_1px] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pl-px pr-0 py-px relative size-full">
        <Container32 />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M14 14L11.1067 11.1067" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p107a080} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#095192] opacity-50 relative rounded-br-[4px] rounded-tr-[4px] shrink-0 size-[48px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon5 />
      </div>
    </div>
  );
}

function SearchSerial() {
  return (
    <div className="h-[48px] relative shrink-0" data-name="search serial">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center relative">
        <Container33 />
        <Button />
      </div>
    </div>
  );
}

function InputGroup() {
  return (
    <div className="bg-white h-[48px] relative rounded-[4px] shrink-0 w-full" data-name="Input Group">
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[12px] relative size-full">
          <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#25282a] text-[18px]">
            <p className="leading-[normal]">30</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative rounded-[4px] shrink-0 w-[120px]" data-name="Input">
      <InputGroup />
    </div>
  );
}

function Frame22() {
  return (
    <div className="opacity-0 relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[18px] text-nowrap">
          <p className="leading-[normal]">Qty to move</p>
        </div>
        <Input />
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[35px] text-nowrap">
        <p className="leading-[normal]">20</p>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] items-end left-0 top-0 w-[102px]">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#64748b] text-[16px] text-right w-[min-content]">
        <p className="leading-[normal]">Qty to move</p>
      </div>
      <Frame24 />
    </div>
  );
}

function Frame() {
  return (
    <div className="h-[69px] relative shrink-0 w-[102px]">
      <Frame25 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[35px] text-nowrap">
        <p className="leading-[normal]">0</p>
      </div>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[102px]">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[16px] text-nowrap text-right">
        <p className="leading-[normal]">Qty moved (Vials)</p>
      </div>
      <Frame27 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-end relative shrink-0 w-full">
      <Frame28 />
    </div>
  );
}

function Damaged() {
  return (
    <div className="content-stretch flex flex-col items-end px-0 py-[8px] relative shrink-0 w-[135px]" data-name="Damaged">
      <Frame1 />
    </div>
  );
}

function TargetVsScanned() {
  return (
    <div className="content-stretch flex gap-[24px] h-[81px] items-center relative shrink-0 w-full" data-name="Target vs Scanned">
      <div className="bg-[#eee] h-full shrink-0 w-px" />
      <Frame />
      <div className="bg-[#eee] h-full shrink-0 w-px" />
      <Damaged />
    </div>
  );
}

function Counters() {
  return (
    <div className="relative shrink-0" data-name="Counters">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
        <TargetVsScanned />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pb-[13px] pt-[12px] px-[24px] relative w-full">
          <SearchSerial />
          <Frame22 />
          <Counters />
        </div>
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Container10 />
      <Container30 />
      <Container34 />
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute h-[21px] left-[64px] top-[16px] w-[202px]" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[-40px] not-italic text-[#25282a] text-[14px] text-nowrap top-0">Serial</p>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute h-[21px] left-[266px] top-[16px] w-[202px]" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#25282a] text-[14px] text-nowrap top-0">Lot</p>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute h-[21px] left-[468px] top-[16px] w-[202px]" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#25282a] text-[14px] text-nowrap top-0">Source</p>
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute h-[21px] left-[670px] top-[16px] w-[202px]" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#25282a] text-[14px] text-nowrap top-0">Expiration</p>
    </div>
  );
}

function Container39() {
  return (
    <div className="absolute h-[21px] left-[872px] top-[16px] w-[202px]" data-name="Container">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#25282a] text-[14px] text-nowrap top-0">Quantity</p>
    </div>
  );
}

function Container40() {
  return (
    <div className="h-[53px] relative shrink-0 w-full" data-name="Container">
      <Container35 />
      <Container36 />
      <Container37 />
      <Container38 />
      <Container39 />
    </div>
  );
}

function SerialLabel() {
  return (
    <div className="bg-[#f8fafc] content-stretch flex flex-col h-[54px] items-start pb-px pt-0 px-0 relative shrink-0 w-full" data-name="serial label">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <Container40 />
    </div>
  );
}

function Alignment() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Alignment">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#9fa9b7] text-[16px] text-center text-nowrap">Scan or Manually Add Items</p>
    </div>
  );
}

function FilterPlaceholder() {
  return (
    <div className="h-[117px] relative rounded-[4px] shrink-0 w-full" data-name="Filter Placeholder">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Alignment />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e0e0e0] border-dashed inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Frame26() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0 w-full">
      <SerialLabel />
      <FilterPlaceholder />
    </div>
  );
}

function Ndc() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] not-italic relative shrink-0" data-name="NDC">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#64748b] text-[14px] text-nowrap">
        <p className="leading-[normal]">Product</p>
      </div>
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center min-w-full relative shrink-0 text-[#095192] text-[0px] w-[min-content]">
        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid leading-[normal] not-italic text-[18px] underline">1/2</p>
      </div>
    </div>
  );
}

function Image() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Image">
      <Ndc />
    </div>
  );
}

function ChevronRight() {
  return (
    <div className="absolute inset-[26.07%_35.33%_26.09%_37.59%]" data-name="chevron-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 12">
        <g id="chevron-right">
          <path d={svgPaths.p2249e300} fill="var(--fill-0, #095192)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ChevronRight1() {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="chevron-right">
      <ChevronRight />
    </div>
  );
}

function Ndc1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] not-italic relative shrink-0" data-name="NDC">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#64748b] text-[14px] text-nowrap">
        <p className="leading-[normal]">Target Bin</p>
      </div>
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center min-w-full relative shrink-0 text-[#095192] text-[0px] w-[min-content]">
        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid leading-[normal] not-italic text-[18px] underline">1/1</p>
      </div>
    </div>
  );
}

function ProductInfo() {
  return (
    <div className="content-stretch flex gap-[20px] h-[52px] items-center relative shrink-0" data-name="Product Info">
      <Image />
      <ChevronRight1 />
      <div className="bg-[#d9d9d9] h-[40px] shrink-0 w-px" data-name="Divider" />
      <Ndc1 />
      <ChevronRight1 />
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex items-center justify-center px-[12px] py-[8px] relative rounded-[4px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap uppercase">cancel</p>
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex items-center justify-center px-[12px] py-[8px] relative rounded-[4px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap uppercase">{`Skip & Continue`}</p>
    </div>
  );
}

function StandardButton1() {
  return (
    <div className="bg-[#095192] content-stretch flex gap-[8px] items-center justify-end px-[12px] py-[8px] relative rounded-[4px] shrink-0" data-name="Standard Button">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-white uppercase">save</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex h-[36px] items-start relative rounded-[4px] shrink-0" data-name="Button">
      <StandardButton1 />
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
      <Container41 />
      <Container42 />
      <Button1 />
    </div>
  );
}

function Container44() {
  return (
    <div className="bg-white h-[72px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[24px] py-0 relative size-full">
          <ProductInfo />
          <Container43 />
        </div>
      </div>
    </div>
  );
}

function PrimitiveDiv() {
  return (
    <div className="absolute bg-white h-[807px] left-0 top-[50px] w-[1176px]" data-name="Primitive.div">
      <div className="content-stretch flex flex-col items-start justify-between overflow-clip relative rounded-[inherit] size-full">
        <Frame23 />
        <Frame26 />
        <Container44 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute h-[857px] left-[60px] top-0 w-[1176px]" data-name="Container">
      <TopNav />
      <PrimitiveDiv />
    </div>
  );
}

function ImageWithFallback() {
  return (
    <div className="h-[25px] relative shrink-0 w-[28px]" data-name="ImageWithFallback">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImageWithFallback} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid size-full" />
    </div>
  );
}

function Frame15() {
  return (
    <div className="absolute bg-[#0e243f] content-stretch flex flex-col h-[50px] items-center justify-center left-0 top-0 w-[60px]" data-name="Frame1410084048">
      <ImageWithFallback />
    </div>
  );
}

function Vector() {
  return (
    <div className="absolute contents inset-[10%_16.67%]" data-name="Vector">
      <div className="absolute inset-[10%_16.67%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
          <path clipRule="evenodd" d={svgPaths.pdb62f00} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[30%_36.67%_43.33%_36.67%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <path clipRule="evenodd" d={svgPaths.pcb4280} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Transfer() {
  return (
    <div className="absolute contents inset-[10%_16.67%]" data-name="Transfer">
      <Vector />
    </div>
  );
}

function Icon6() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Transfer />
    </div>
  );
}

function Transfer5() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[13px]" data-name="Transfer">
      <Icon6 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8">
        <path clipRule="evenodd" d={svgPaths.p186a3900} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
      </svg>
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute content-stretch flex flex-col h-[8px] items-start left-[45px] top-[21px] w-[5px]" data-name="Container">
      <Icon7 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="absolute bg-[#173a63] h-[50px] left-0 top-[50px] w-[60px]" data-name="Frame1410084047">
      <Transfer5 />
      <Container46 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="absolute h-[100px] left-0 top-0 w-[60px]" data-name="Frame1410084055">
      <Frame15 />
      <Frame14 />
    </div>
  );
}

function Vector1() {
  return (
    <div className="absolute contents inset-[16.67%_10.42%]" data-name="Vector">
      <div className="absolute inset-[16.67%_10.42%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 16">
          <path clipRule="evenodd" d={svgPaths.pc465080} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[45.33%_41.18%_32.62%_41.18%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 6">
          <path d={svgPaths.p38e1ba00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Transfer6() {
  return (
    <div className="absolute contents inset-[16.67%_10.42%]" data-name="Transfer">
      <Vector1 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Transfer6 />
    </div>
  );
}

function Transfer1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="Transfer1">
      <Icon8 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Dispense</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[100px] w-[60px]" data-name="Frame1410084045">
      <Transfer1 />
      <Paragraph4 />
    </div>
  );
}

function Transfer7() {
  return (
    <div className="absolute contents inset-[14.58%_20.83%]" data-name="Transfer">
      <div className="absolute inset-[14.58%_20.83%]" data-name="Vector">
        <div className="absolute inset-[-0.74%_-0.89%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 18">
            <path d={svgPaths.p8face00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, white)" strokeWidth="0.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Icon9() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Transfer7 />
    </div>
  );
}

function Transfer2() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="Transfer2">
      <Icon9 />
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Order</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[150px] w-[60px]" data-name="Frame1410084046">
      <Transfer2 />
      <Paragraph5 />
    </div>
  );
}

function Vector2() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Vector">
      <div className="absolute inset-[18.75%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
          <path d={svgPaths.p27953a00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[40.88%_31.92%_35.77%_49.6%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 6">
          <path d={svgPaths.p36da700} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[44.78%_49.27%_31.88%_33.38%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 6">
          <path d={svgPaths.p3888ba00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Transfer8() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Transfer">
      <Vector2 />
    </div>
  );
}

function Icon10() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Transfer8 />
    </div>
  );
}

function Transfer3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="Transfer3">
      <Icon10 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Restock</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[200px] w-[60px]" data-name="Frame1410084043">
      <Transfer3 />
      <Paragraph6 />
    </div>
  );
}

function Vector3() {
  return (
    <div className="absolute contents inset-[18.75%_16.67%]" data-name="Vector">
      <div className="absolute inset-[59.45%_69.12%_40.53%_30.72%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 0">
          <path d={svgPaths.p3e359900} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[54.01%_53.03%_40.53%_36.91%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 2">
          <path d={svgPaths.p14d8a200} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[54.01%_66.59%_40.55%_28.19%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.pbb9aa00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[54.01%_69.12%_45.99%_30.72%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 0">
          <path d={svgPaths.p23ea7b00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[43.09%_66.21%_51.45%_28.19%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p30a05b00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[43.09%_39.17%_51.45%_36.91%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 2">
          <path d={svgPaths.p5ef0600} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[32.17%_66.21%_62.37%_28.19%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p27e0c240} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[32.17%_39.17%_62.37%_36.91%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 2">
          <path d={svgPaths.p208b6a00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[18.75%_16.67%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <path clipRule="evenodd" d={svgPaths.p20cf9a00} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[62.11%_26.78%_29.69%_62.45%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 2">
          <path d={svgPaths.p5ca180} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Transfer9() {
  return (
    <div className="absolute contents inset-[18.75%_16.67%]" data-name="Transfer">
      <Vector3 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Transfer9 />
    </div>
  );
}

function Transfer4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="Transfer4">
      <Icon11 />
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Audit</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[250px] w-[60px]" data-name="Frame1410084042">
      <Transfer4 />
      <Paragraph7 />
    </div>
  );
}

function MenuItemIcon() {
  return (
    <div className="absolute contents inset-[16.67%]" data-name="Menu Item Icon">
      <div className="absolute inset-[16.67%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <path d={svgPaths.p1644400} fill="var(--fill-0, #095192)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon12() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon />
    </div>
  );
}

function MenuItemIcon9() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon">
      <Icon12 />
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#095192] text-[10px] text-center">Inventory</p>
    </div>
  );
}

function Icon13() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8">
        <path clipRule="evenodd" d={svgPaths.p186a3900} fill="var(--fill-0, #095192)" fillRule="evenodd" id="Vector" />
      </svg>
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex flex-col h-[8px] items-start left-[45px] top-[15px] w-[5px]" data-name="Container">
      <Icon13 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="absolute bg-white h-[50px] left-0 top-[300px] w-[60px]" data-name="Frame1410084041">
      <MenuItemIcon9 />
      <Paragraph8 />
      <Container47 />
    </div>
  );
}

function Vector4() {
  return (
    <div className="absolute contents inset-[10.82%_12.5%]" data-name="Vector">
      <div className="absolute inset-[50.21%_48.57%_10.82%_12.5%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p38f82080} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[29.1%_12.5%_31.79%_48.56%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p1b122a00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[10.82%_45.4%_55.94%_21.4%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
          <path d={svgPaths.p1c78700} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon10() {
  return (
    <div className="absolute contents inset-[10.82%_12.5%]" data-name="Menu Item Icon">
      <Vector4 />
    </div>
  );
}

function Icon14() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon10 />
    </div>
  );
}

function MenuItemIcon1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon1">
      <Icon14 />
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Formulary</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[350px] w-[60px]" data-name="Frame1410084040">
      <MenuItemIcon1 />
      <Paragraph9 />
    </div>
  );
}

function Vector5() {
  return (
    <div className="absolute contents inset-[13.65%_17.81%]" data-name="Vector">
      <div className="absolute inset-[13.65%_34.43%_55.22%_34.43%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
          <path d={svgPaths.p15676d00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[51.05%_17.81%_26.12%_17.81%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 6">
          <path d={svgPaths.p3a535400} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[63.5%_30.79%_13.65%_44.83%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p15d70c00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon11() {
  return (
    <div className="absolute contents inset-[13.65%_17.81%]" data-name="Menu Item Icon">
      <Vector5 />
    </div>
  );
}

function Icon15() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon11 />
    </div>
  );
}

function MenuItemIcon2() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon2">
      <Icon15 />
    </div>
  );
}

function Paragraph10() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Patient</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[400px] w-[60px]" data-name="Frame1410084039">
      <MenuItemIcon2 />
      <Paragraph10 />
    </div>
  );
}

function Vector6() {
  return (
    <div className="absolute contents inset-[18.75%_16.67%]" data-name="Vector">
      <div className="absolute inset-[20.26%_16.67%_54.34%_68.04%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 7">
          <path d={svgPaths.p2c9a3d00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[54.34%_68.04%_20.26%_16.67%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 7">
          <path d={svgPaths.p3477b600} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[30.42%_17.16%_64.26%_55.26%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 2">
          <path d={svgPaths.p9119c00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[64.26%_55.67%_30.42%_16.75%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 2">
          <path d={svgPaths.p34201900} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[52.47%_17.23%_18.75%_54.1%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <path clipRule="evenodd" d={svgPaths.p3281b800} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[18.75%_54.1%_52.47%_17.23%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <path clipRule="evenodd" d={svgPaths.p2b470000} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon12() {
  return (
    <div className="absolute contents inset-[18.75%_16.67%]" data-name="Menu Item Icon">
      <Vector6 />
    </div>
  );
}

function Icon16() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon12 />
    </div>
  );
}

function MenuItemIcon3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon3">
      <Icon16 />
    </div>
  );
}

function Paragraph11() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Transfer</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[450px] w-[60px]" data-name="Frame1410084038">
      <MenuItemIcon3 />
      <Paragraph11 />
    </div>
  );
}

function Union() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Union">
      <div className="absolute inset-[43.86%_63.9%_32.36%_30.86%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 6">
          <path d={svgPaths.p2051a800} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[56.42%_31.75%_32.36%_63.01%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 3">
          <path d={svgPaths.p33d02c00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[31.31%_53.23%_32.37%_41.53%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 9">
          <path d={svgPaths.p181a5f00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[35.49%_42.49%_32.37%_52.27%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 8">
          <path d={svgPaths.p3ed6e500} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[18.75%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
          <path clipRule="evenodd" d={svgPaths.p1ddef980} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon13() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Menu Item Icon">
      <Union />
    </div>
  );
}

function Icon17() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon13 />
    </div>
  );
}

function MenuItemIcon4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon4">
      <Icon17 />
    </div>
  );
}

function Paragraph12() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Reporting</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[500px] w-[60px]" data-name="Frame1410084037">
      <MenuItemIcon4 />
      <Paragraph12 />
    </div>
  );
}

function Vector7() {
  return (
    <div className="absolute contents inset-[16.67%_20.83%]" data-name="Vector">
      <div className="absolute inset-[16.67%_20.83%_48.48%_20.83%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 9">
          <path clipRule="evenodd" d={svgPaths.paaf2200} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[76.31%_20.83%_16.67%_20.83%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 2">
          <path d={svgPaths.p2e0ac480} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[65.79%_20.83%_27.19%_20.83%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 2">
          <path d={svgPaths.p1ac3e400} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[43.44%_57.29%_37.72%_20.83%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 5">
          <path d={svgPaths.p25ea2100} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[55.26%_20.83%_37.72%_46.35%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 2">
          <path d={svgPaths.p1d463200} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon14() {
  return (
    <div className="absolute contents inset-[16.67%_20.83%]" data-name="Menu Item Icon">
      <Vector7 />
    </div>
  );
}

function Icon18() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon14 />
    </div>
  );
}

function MenuItemIcon5() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon5">
      <Icon18 />
    </div>
  );
}

function Paragraph13() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Station</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[550px] w-[60px]" data-name="Frame1410084036">
      <MenuItemIcon5 />
      <Paragraph13 />
    </div>
  );
}

function Vector8() {
  return (
    <div className="absolute contents inset-[19.89%_17.81%]" data-name="Vector">
      <div className="absolute inset-[19.89%_34.43%_48.99%_34.43%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
          <path d={svgPaths.p214ce6f0} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[57.28%_17.81%_19.89%_17.81%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 6">
          <path d={svgPaths.p1ca25e40} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon15() {
  return (
    <div className="absolute contents inset-[19.89%_17.81%]" data-name="Menu Item Icon">
      <Vector8 />
    </div>
  );
}

function Icon19() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon15 />
    </div>
  );
}

function MenuItemIcon6() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon6">
      <Icon19 />
    </div>
  );
}

function Paragraph14() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">User</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[600px] w-[60px]" data-name="Frame1410084035">
      <MenuItemIcon6 />
      <Paragraph14 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="absolute h-[650px] left-0 top-0 w-[60px]" data-name="Frame1410084056">
      <Frame19 />
      <Frame12 />
      <Frame13 />
      <Frame10 />
      <Frame9 />
      <Frame8 />
      <Frame7 />
      <Frame6 />
      <Frame5 />
      <Frame4 />
      <Frame3 />
      <Frame2 />
    </div>
  );
}

function Vector9() {
  return (
    <div className="absolute contents inset-[16.67%_22.92%]" data-name="Vector">
      <div className="absolute inset-[16.67%_22.92%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
          <path d={svgPaths.p24a19b00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[18.63%_24.85%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
          <path d={svgPaths.p2cba4c00} fill="var(--fill-0, #095192)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[16.67%_22.92%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
          <path d={svgPaths.p24a19b00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon16() {
  return (
    <div className="absolute contents inset-[16.67%_22.92%]" data-name="Menu Item Icon">
      <Vector9 />
    </div>
  );
}

function Icon20() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon16 />
    </div>
  );
}

function MenuItemIcon7() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon7">
      <Icon20 />
    </div>
  );
}

function Paragraph15() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Resource</p>
    </div>
  );
}

function Frame16() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-0 w-[60px]" data-name="Frame1410084049">
      <MenuItemIcon7 />
      <Paragraph15 />
    </div>
  );
}

function Vector10() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Vector">
      <div className="absolute inset-[34.38%_39.06%_43.98%_39.06%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p3523b600} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[58.54%_46.66%_34.38%_46.22%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 2">
          <path d={svgPaths.p3a17c580} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[18.75%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
          <path clipRule="evenodd" d={svgPaths.pce97f00} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MenuItemIcon17() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Menu Item Icon">
      <Vector10 />
    </div>
  );
}

function Icon21() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <MenuItemIcon17 />
    </div>
  );
}

function MenuItemIcon8() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[18px] size-[24px] top-[7.25px]" data-name="MenuItemIcon8">
      <Icon21 />
    </div>
  );
}

function Paragraph16() {
  return (
    <div className="absolute content-stretch flex h-[11.5px] items-start left-0 top-[31.25px] w-[60px]" data-name="Paragraph">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[10px] text-center text-white">Help</p>
    </div>
  );
}

function Frame17() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[54px] w-[60px]" data-name="Frame1410084052">
      <MenuItemIcon8 />
      <Paragraph16 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="absolute bg-[#095192] h-[50px] left-0 top-[108px] w-[60px]" data-name="Frame1410084053">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[normal] left-[30.82px] not-italic text-[10px] text-center text-nowrap text-white top-[19.25px] translate-x-[-50%]">V 1.0</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="absolute h-[158px] left-0 top-[699px] w-[60px]" data-name="Frame1410084057">
      <Frame16 />
      <Frame17 />
      <Frame18 />
    </div>
  );
}

function InteractiveIconContainer() {
  return (
    <div className="absolute bg-[#095192] h-[857px] left-0 top-0 w-[60px]" data-name="InteractiveIconContainer">
      <Frame20 />
      <Frame21 />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="3">
      <Container45 />
      <InteractiveIconContainer />
    </div>
  );
}