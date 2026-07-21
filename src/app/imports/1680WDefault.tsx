import imgImage from "figma:asset/1636bc255f79f952c958c6688d9b298042921b71.png";
import { imgIcon, imgVector, imgSvg, imgVector1, imgTransfer, imgVector2, imgVector3, imgMenuItemIcon, imgSvg1, imgVector4, imgVector5, imgVector6, imgUnion, imgVector7, imgVector8, imgVector9, imgVector10, imgIcon1, imgSvg2, imgSvg3, imgSvg4, imgIcon2 } from "./svg-fc8ji";

function Label() {
  return (
    <div className="absolute bg-[#3c464c] box-border content-stretch flex items-center justify-start left-[290.65px] px-1.5 py-[3px] rounded-[5px] top-[4.58px]" data-name="Label">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="relative self-stretch shrink-0 w-[327.39px]" data-name="Container">
      <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal h-[28.89px] justify-center leading-[0] left-0 not-italic text-[24px] text-black top-[13.96px] translate-y-[-50%] w-[282.97px]">
        <p className="leading-[normal]">ABRAXANE 100 MG VIAL</p>
      </div>
      <Label />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-center justify-start relative self-stretch shrink-0" data-name="Container">
      <Container1 />
    </div>
  );
}

function Container3() {
  return (
    <div className="box-border content-stretch flex items-start justify-start pl-0 pr-[131.13px] py-0 relative shrink-0" data-name="Container">
      <Container2 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <Container3 />
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">paclitaxel protein-bound 100 mg intravenous suspension 120</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container4 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-[586.21px]" data-name="Container">
      <Container5 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col h-[21.67px] items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#767676] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Inventory</p>
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="box-border content-stretch flex flex-col h-full items-start justify-center pl-0 pr-4 py-0 relative shrink-0" data-name="Margin">
      <Container7 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col h-full items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[18px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">4 vials / 400 mg</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex items-start justify-between relative self-stretch shrink-0" data-name="Container">
      <Margin />
      <Container8 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-full" data-name="Container">
      <Container9 />
    </div>
  );
}

function Margin1() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-0 pr-6 py-0 relative shrink-0 w-[844.69px]" data-name="Margin">
      <Container10 />
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-white h-[92px] relative shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_0.556px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex h-[92px] items-center justify-between pb-[0.556px] pt-0 px-6 relative w-full">
          <Container6 />
          <Margin1 />
        </div>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-slate-500 w-full">
        <p className="leading-[normal]">Product Details</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative self-stretch shrink-0 w-[97.7px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">NDC</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col h-[16.67px] items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black w-full">
        <p className="leading-[normal]">68817013450</p>
      </div>
    </div>
  );
}

function Margin2() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-2 pr-0 py-0 relative self-stretch shrink-0 w-[138.26px]" data-name="Margin">
      <Container13 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container" style={{ gap: "1.42109e-14px" }}>
      <Container12 />
      <Margin2 />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative self-stretch shrink-0 w-[97.7px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">Inventory</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col h-[16.67px] items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black w-full">
        <p className="leading-[normal]">Purchased</p>
      </div>
    </div>
  );
}

function Margin3() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-2 pr-0 py-0 relative self-stretch shrink-0 w-[138.26px]" data-name="Margin">
      <Container16 />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container" style={{ gap: "1.42109e-14px" }}>
      <Container15 />
      <Margin3 />
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col gap-[3.99px] items-start justify-start relative self-stretch shrink-0 w-80" data-name="Container">
      <Container11 />
      <Container14 />
      <Container17 />
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-slate-500 w-full">
        <p className="leading-[normal]">Product Location</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start mr-[-0.01px] relative self-stretch shrink-0 w-[78.16px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">Door</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col h-[16.67px] items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black w-full">
        <p className="leading-[normal]">1</p>
      </div>
    </div>
  );
}

function Margin4() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center mr-[-0.01px] pl-2 pr-0 py-0 relative self-stretch shrink-0 w-[112.21px]" data-name="Margin">
      <Container21 />
    </div>
  );
}

function Container22() {
  return (
    <div className="box-border content-stretch flex items-start justify-start pl-0 pr-[0.01px] py-0 relative shrink-0 w-full" data-name="Container" style={{ marginBottom: "-1.42109e-14px" }}>
      <Container20 />
      <Margin4 />
    </div>
  );
}

function Container23() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start mr-[-0.01px] relative self-stretch shrink-0 w-[78.16px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">Bin</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col h-[16.67px] items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black w-full">
        <p className="leading-[normal]">MyBin 5</p>
      </div>
    </div>
  );
}

function Margin5() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center mr-[-0.01px] pl-2 pr-0 py-0 relative self-stretch shrink-0 w-[112.21px]" data-name="Margin">
      <Container24 />
    </div>
  );
}

function Container25() {
  return (
    <div className="box-border content-stretch flex items-start justify-start pl-0 pr-[0.01px] py-0 relative shrink-0 w-full" data-name="Container" style={{ marginBottom: "-1.42109e-14px" }}>
      <Container23 />
      <Margin5 />
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container22 />
      <Container25 />
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col gap-[3.99px] items-start justify-start relative self-stretch shrink-0 w-80" data-name="Container">
      <Container19 />
      <Container26 />
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-slate-500 w-full">
        <p className="leading-[normal]">Product Par Values</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative self-stretch shrink-0 w-[58.62px]" data-name="Container" style={{ marginRight: "-1.06581e-13px" }}>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">Par Min</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col h-[16.67px] items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black w-full">
        <p className="leading-[normal]">0</p>
      </div>
    </div>
  );
}

function Margin6() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-2 pr-0 py-0 relative self-stretch shrink-0 w-[86.15px]" data-name="Margin" style={{ marginRight: "-1.06581e-13px" }}>
      <Container30 />
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container" style={{ marginBottom: "-1.42109e-14px" }}>
      <Container29 />
      <Margin6 />
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative self-stretch shrink-0 w-[58.62px]" data-name="Container" style={{ marginRight: "-1.06581e-13px" }}>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">Par Max</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col h-[16.67px] items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black w-full">
        <p className="leading-[normal]">1</p>
      </div>
    </div>
  );
}

function Margin7() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-2 pr-0 py-0 relative self-stretch shrink-0 w-[86.15px]" data-name="Margin" style={{ marginRight: "-1.06581e-13px" }}>
      <Container33 />
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container" style={{ marginBottom: "-1.42109e-14px" }}>
      <Container32 />
      <Margin7 />
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container31 />
      <Container34 />
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col gap-[3.99px] items-start justify-start relative self-stretch shrink-0 w-[234.48px]" data-name="Container">
      <Container28 />
      <Container35 />
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#e9eef4] relative shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_0.556px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex gap-[60px] items-start justify-start pb-[8.556px] pt-2 px-[24.556px] relative w-full">
          <Container18 />
          <Container27 />
          <Container36 />
        </div>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-nowrap">
        <p className="leading-[normal] whitespace-pre">Items in Anil-MedOrderStation Station-Virtual</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="box-border content-stretch flex items-center justify-start pb-2 pt-0 px-0 relative shrink-0 w-full" data-name="Container">
      <Container37 />
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Serial</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container39 />
    </div>
  );
}

function Columnheader() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Columnheader">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container40 />
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Lot</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container41 />
    </div>
  );
}

function Columnheader1() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Columnheader">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container42 />
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Expiration</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container43 />
    </div>
  );
}

function Columnheader2() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Columnheader">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container44 />
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Restocked Date</p>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container45 />
    </div>
  );
}

function Columnheader3() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Columnheader">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container46 />
    </div>
  );
}

function Container47() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#25282a] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Inventory</p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container47 />
    </div>
  );
}

function Columnheader4() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[295px]" data-name="Columnheader">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container48 />
    </div>
  );
}

function Container49() {
  return <div className="h-[19px] shrink-0 w-[73px]" data-name="Container" />;
}

function Container50() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container49 />
    </div>
  );
}

function Columnheader5() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[163px]" data-name="Columnheader">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container50 />
    </div>
  );
}

function Row() {
  return (
    <div className="content-stretch flex h-[52px] items-start justify-start relative shrink-0 w-full" data-name="Row">
      <Columnheader />
      <Columnheader1 />
      <Columnheader2 />
      <Columnheader3 />
      <Columnheader4 />
      <Columnheader5 />
    </div>
  );
}

function Container51() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-[188.85px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9fa9b7] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Search by Serial Number</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-start justify-center p-[8.556px] relative w-full">
          <Container51 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Container52() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Input />
    </div>
  );
}

function Container53() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-center pl-0 pr-10 py-0 relative w-full">
          <Container52 />
        </div>
      </div>
    </div>
  );
}

function Cell() {
  return (
    <div className="bg-neutral-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container53 />
    </div>
  );
}

function Container54() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-[188.85px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9fa9b7] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Search by Lot Number</p>
      </div>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-start justify-center p-[8.556px] relative w-full">
          <Container54 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Container55() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Input1 />
    </div>
  );
}

function Container56() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-center pl-0 pr-10 py-0 relative w-full">
          <Container55 />
        </div>
      </div>
    </div>
  );
}

function Cell1() {
  return (
    <div className="bg-neutral-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container56 />
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-[188.85px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9fa9b7] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Search by Expiration Date</p>
      </div>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-start justify-center p-[8.556px] relative w-full">
          <Container57 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Container58() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Input2 />
    </div>
  );
}

function Container59() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-center pl-0 pr-10 py-0 relative w-full">
          <Container58 />
        </div>
      </div>
    </div>
  );
}

function Cell2() {
  return (
    <div className="bg-neutral-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container59 />
    </div>
  );
}

function Container60() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-[188.85px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9fa9b7] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Search by Restocked Date</p>
      </div>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-start justify-center p-[8.556px] relative w-full">
          <Container60 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Container61() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Input3 />
    </div>
  );
}

function Container62() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-center pl-0 pr-10 py-0 relative w-full">
          <Container61 />
        </div>
      </div>
    </div>
  );
}

function Cell3() {
  return (
    <div className="bg-neutral-50 box-border content-stretch flex flex-col h-full items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container62 />
    </div>
  );
}

function Cell4() {
  return (
    <div className="bg-neutral-50 h-full relative shrink-0 w-[295px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Cell5() {
  return (
    <div className="bg-neutral-50 h-full relative shrink-0 w-[163px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Row1() {
  return (
    <div className="content-stretch flex h-[68px] items-start justify-start relative shrink-0 w-full" data-name="Row">
      <Cell />
      <Cell1 />
      <Cell2 />
      <Cell3 />
      <Cell4 />
      <Cell5 />
    </div>
  );
}

function Container63() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex items-start justify-start pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Medium',_sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#495057] text-[16px]">
            <p className="leading-[normal]">32958290358</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell6() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container63 />
    </div>
  );
}

function Cell7() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">034535</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">10/30/2025</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container64 />
    </div>
  );
}

function Cell8() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container65 />
    </div>
  );
}

function Cell9() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">03/25/2025</p>
      </div>
    </div>
  );
}

function Cell10() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[295px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">1 vials / 100 mg</p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[14.44px] relative w-3.5" data-name="Icon">
      <div className="absolute bottom-[-1.83%] left-0 right-0 top-0">
        <img className="block max-w-none size-full" src={imgIcon} />
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Icon />
        </div>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <Container66 />
    </div>
  );
}

function Margin8() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-0 pr-2 py-0 relative shrink-0" data-name="Margin">
      <Container67 />
    </div>
  );
}

function Container68() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">Print QR</p>
      </div>
    </div>
  );
}

function ButtonPrintQr() {
  return (
    <div className="box-border content-stretch flex items-center justify-start overflow-clip px-[16.556px] py-[8.556px] relative rounded-[4px] shrink-0" data-name="Button - Print QR">
      <Margin8 />
      <Container68 />
    </div>
  );
}

function Container69() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <ButtonPrintQr />
    </div>
  );
}

function Cell11() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[163px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container69 />
    </div>
  );
}

function Row2() {
  return (
    <div className="bg-white content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Row">
      <Cell6 />
      <Cell7 />
      <Cell8 />
      <Cell9 />
      <Cell10 />
      <Cell11 />
    </div>
  );
}

function Container70() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex items-start justify-start pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Medium',_sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#495057] text-[16px]">
            <p className="leading-[normal]">673857029482</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell12() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container70 />
    </div>
  );
}

function Cell13() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">5729034</p>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">10/30/2025</p>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container71 />
    </div>
  );
}

function Cell14() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container72 />
    </div>
  );
}

function Cell15() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">03/25/2025</p>
      </div>
    </div>
  );
}

function Cell16() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.72px] pt-[23.16px] px-4 relative shrink-0 w-[295px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">1 vials / 100 mg</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[14.44px] relative w-3.5" data-name="Icon">
      <div className="absolute bottom-[-1.83%] left-0 right-0 top-0">
        <img className="block max-w-none size-full" src={imgIcon} />
      </div>
    </div>
  );
}

function Container73() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Icon1 />
        </div>
      </div>
    </div>
  );
}

function Container74() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <Container73 />
    </div>
  );
}

function Margin9() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-0 pr-2 py-0 relative shrink-0" data-name="Margin">
      <Container74 />
    </div>
  );
}

function Container75() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">Print QR</p>
      </div>
    </div>
  );
}

function ButtonPrintQr1() {
  return (
    <div className="box-border content-stretch flex items-center justify-start overflow-clip px-[16.556px] py-[8.556px] relative rounded-[4px] shrink-0" data-name="Button - Print QR">
      <Margin9 />
      <Container75 />
    </div>
  );
}

function Container76() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <ButtonPrintQr1 />
    </div>
  );
}

function Cell17() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[163px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container76 />
    </div>
  );
}

function Row3() {
  return (
    <div className="bg-white content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Row">
      <Cell12 />
      <Cell13 />
      <Cell14 />
      <Cell15 />
      <Cell16 />
      <Cell17 />
    </div>
  );
}

function Container77() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex items-start justify-start pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Medium',_sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#495057] text-[16px]">
            <p className="leading-[normal]">82350284092830</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell18() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.73px] pt-[23.15px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container77 />
    </div>
  );
}

function Cell19() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.73px] pt-[23.15px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">29582905</p>
      </div>
    </div>
  );
}

function Container78() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">10/30/2025</p>
      </div>
    </div>
  );
}

function Container79() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container78 />
    </div>
  );
}

function Cell20() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.73px] pt-[23.15px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container79 />
    </div>
  );
}

function Cell21() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.73px] pt-[23.15px] px-4 relative shrink-0 w-[277.94px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">03/25/2025</p>
      </div>
    </div>
  );
}

function Cell22() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[23.73px] pt-[23.15px] px-4 relative shrink-0 w-[295px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#495057] text-[16px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">1 vials / 100 mg</p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[14.44px] relative w-3.5" data-name="Icon">
      <div className="absolute bottom-[-1.83%] left-0 right-0 top-0">
        <img className="block max-w-none size-full" src={imgIcon} />
      </div>
    </div>
  );
}

function Container80() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Icon2 />
        </div>
      </div>
    </div>
  );
}

function Container81() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <Container80 />
    </div>
  );
}

function Margin10() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-0 pr-2 py-0 relative shrink-0" data-name="Margin">
      <Container81 />
    </div>
  );
}

function Container82() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">Print QR</p>
      </div>
    </div>
  );
}

function ButtonPrintQr2() {
  return (
    <div className="box-border content-stretch flex items-center justify-start overflow-clip px-[16.556px] py-[8.556px] relative rounded-[4px] shrink-0" data-name="Button - Print QR">
      <Margin10 />
      <Container82 />
    </div>
  );
}

function Container83() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <ButtonPrintQr2 />
    </div>
  );
}

function Cell23() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pb-[16.556px] pt-4 px-4 relative shrink-0 w-[163px]" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#e9ecef] border-[0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      <Container83 />
    </div>
  );
}

function Row4() {
  return (
    <div className="bg-white content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Row">
      <Cell18 />
      <Cell19 />
      <Cell20 />
      <Cell21 />
      <Cell22 />
      <Cell23 />
    </div>
  );
}

function Body() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Body">
      <Row2 />
      <Row3 />
      <Row4 />
    </div>
  );
}

function Table() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-auto relative rounded-[8px] shrink-0 w-[1570px]" data-name="Table">
      <Row />
      <Row1 />
      <Body />
    </div>
  );
}

function Container84() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start pb-0 pt-[15.99px] px-0 relative shrink-0 w-[1570px]" data-name="Container">
      <Container38 />
      <Table />
    </div>
  );
}

function Container85() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-center justify-start left-[60.42px] min-h-[806.667px] pb-[205.78px] pt-0 px-0 right-[-0.42px] top-[50.48px]" data-name="Container">
      <BackgroundBorder />
      <BackgroundBorder1 />
      <Container84 />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#0e243f] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <div className="bg-[95.54%_-230.53%] bg-no-repeat bg-size-[257.62%_100.49%] h-[25px] shrink-0 w-[24.5px]" data-name="Image" style={{ backgroundImage: `url('${imgImage}')` }} />
    </div>
  );
}

function Vector() {
  return (
    <div className="absolute inset-[10%_16.67%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector} />
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

function Svg() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <Transfer />
    </div>
  );
}

function Container86() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg />
    </div>
  );
}

function Svg1() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <img className="block max-w-none size-full" src={imgSvg} />
    </div>
  );
}

function Container87() {
  return (
    <div className="absolute content-stretch flex flex-col h-[7px] items-start justify-center left-[45px] top-1/2 translate-y-[-50%] w-[5px]" data-name="Container">
      <Svg1 />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#173a63] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container86 />
      <Container87 />
    </div>
  );
}

function Container88() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Background />
      <Background1 />
    </div>
  );
}

function Vector1() {
  return (
    <div className="absolute inset-[16.67%_10.42%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector1} />
    </div>
  );
}

function Transfer1() {
  return (
    <div className="absolute contents inset-[16.67%_10.42%]" data-name="Transfer">
      <Vector1 />
    </div>
  );
}

function Svg2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <Transfer1 />
    </div>
  );
}

function Container89() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg2 />
    </div>
  );
}

function Container90() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start px-[7.84px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Dispense</p>
      </div>
    </div>
  );
}

function Container91() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container90 />
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container89 />
      <Container91 />
    </div>
  );
}

function Transfer2() {
  return (
    <div className="absolute inset-[14.58%_20.83%]" data-name="Transfer">
      <div className="absolute inset-[-0.74%_-0.89%]">
        <img className="block max-w-none size-full" src={imgTransfer} />
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <Transfer2 />
    </div>
  );
}

function Container92() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg3 />
    </div>
  );
}

function Container93() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[16.34px] pr-[16.36px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Order</p>
      </div>
    </div>
  );
}

function Container94() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container93 />
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container92 />
      <Container94 />
    </div>
  );
}

function Vector2() {
  return (
    <div className="absolute inset-[18.75%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector2} />
    </div>
  );
}

function Transfer3() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Transfer">
      <Vector2 />
    </div>
  );
}

function Svg4() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <Transfer3 />
    </div>
  );
}

function Container95() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg4 />
    </div>
  );
}

function Container96() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[10.73px] pr-[10.72px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Restock</p>
      </div>
    </div>
  );
}

function Container97() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container96 />
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container95 />
      <Container97 />
    </div>
  );
}

function Vector3() {
  return (
    <div className="absolute inset-[18.75%_16.67%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector3} />
    </div>
  );
}

function Transfer4() {
  return (
    <div className="absolute contents inset-[18.75%_16.67%]" data-name="Transfer">
      <Vector3 />
    </div>
  );
}

function Svg5() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <Transfer4 />
    </div>
  );
}

function Container98() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg5 />
    </div>
  );
}

function Container99() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[17.29px] pr-[17.3px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Audit</p>
      </div>
    </div>
  );
}

function Container100() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container99 />
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container98 />
      <Container100 />
    </div>
  );
}

function MenuItemIcon() {
  return (
    <div className="absolute inset-[16.667%]" data-name="Menu Item Icon">
      <img className="block max-w-none size-full" src={imgMenuItemIcon} />
    </div>
  );
}

function Svg6() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon />
    </div>
  );
}

function Container101() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg6 />
    </div>
  );
}

function Container102() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[7.41px] pr-[7.43px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#095192] text-[10px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">Inventory</p>
      </div>
    </div>
  );
}

function Container103() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container102 />
    </div>
  );
}

function Svg7() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <img className="block max-w-none size-full" src={imgSvg1} />
    </div>
  );
}

function Container104() {
  return (
    <div className="absolute content-stretch flex flex-col h-[7px] items-start justify-center left-[45px] top-[15px] w-[5px]" data-name="Container">
      <Svg7 />
    </div>
  );
}

function Background6() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container101 />
      <Container103 />
      <Container104 />
    </div>
  );
}

function Vector4() {
  return (
    <div className="absolute inset-[10.82%_12.5%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector4} />
    </div>
  );
}

function MenuItemIcon1() {
  return (
    <div className="absolute contents inset-[10.82%_12.5%]" data-name="Menu Item Icon">
      <Vector4 />
    </div>
  );
}

function Svg8() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon1 />
    </div>
  );
}

function Container105() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg8 />
    </div>
  );
}

function Container106() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start px-[6.01px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Formulary</p>
      </div>
    </div>
  );
}

function Container107() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container106 />
    </div>
  );
}

function Background7() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container105 />
      <Container107 />
    </div>
  );
}

function Vector5() {
  return (
    <div className="absolute inset-[13.65%_17.81%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector5} />
    </div>
  );
}

function MenuItemIcon2() {
  return (
    <div className="absolute contents inset-[13.65%_17.81%]" data-name="Menu Item Icon">
      <Vector5 />
    </div>
  );
}

function Svg9() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon2 />
    </div>
  );
}

function Container108() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg9 />
    </div>
  );
}

function Container109() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[13.09px] pr-[13.1px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Patient</p>
      </div>
    </div>
  );
}

function Container110() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container109 />
    </div>
  );
}

function Background8() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container108 />
      <Container110 />
    </div>
  );
}

function Vector6() {
  return (
    <div className="absolute inset-[18.75%_16.67%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector6} />
    </div>
  );
}

function MenuItemIcon3() {
  return (
    <div className="absolute contents inset-[18.75%_16.67%]" data-name="Menu Item Icon">
      <Vector6 />
    </div>
  );
}

function Svg10() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon3 />
    </div>
  );
}

function Container111() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg10 />
    </div>
  );
}

function Container112() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[10.02px] pr-[10.03px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Transfer</p>
      </div>
    </div>
  );
}

function Container113() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container112 />
    </div>
  );
}

function Background9() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container111 />
      <Container113 />
    </div>
  );
}

function Union() {
  return (
    <div className="absolute inset-[18.75%]" data-name="Union">
      <img className="block max-w-none size-full" src={imgUnion} />
    </div>
  );
}

function MenuItemIcon4() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Menu Item Icon">
      <Union />
    </div>
  );
}

function Svg11() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon4 />
    </div>
  );
}

function Container114() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg11 />
    </div>
  );
}

function Container115() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start px-[6.88px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Reporting</p>
      </div>
    </div>
  );
}

function Container116() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container115 />
    </div>
  );
}

function Background10() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container114 />
      <Container116 />
    </div>
  );
}

function Vector7() {
  return (
    <div className="absolute inset-[16.67%_20.83%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector7} />
    </div>
  );
}

function MenuItemIcon5() {
  return (
    <div className="absolute contents inset-[16.67%_20.83%]" data-name="Menu Item Icon">
      <Vector7 />
    </div>
  );
}

function Svg12() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon5 />
    </div>
  );
}

function Container117() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg12 />
    </div>
  );
}

function Container118() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[12.97px] pr-[12.98px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Station</p>
      </div>
    </div>
  );
}

function Container119() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container118 />
    </div>
  );
}

function Background11() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container117 />
      <Container119 />
    </div>
  );
}

function Vector8() {
  return (
    <div className="absolute inset-[19.89%_17.81%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector8} />
    </div>
  );
}

function MenuItemIcon6() {
  return (
    <div className="absolute contents inset-[19.89%_17.81%]" data-name="Menu Item Icon">
      <Vector8 />
    </div>
  );
}

function Svg13() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon6 />
    </div>
  );
}

function Container120() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg13 />
    </div>
  );
}

function Container121() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-[18.77px] pr-[18.78px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">User</p>
      </div>
    </div>
  );
}

function Container122() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container121 />
    </div>
  );
}

function Background12() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container120 />
      <Container122 />
    </div>
  );
}

function Container123() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col items-start justify-start relative shrink-0 w-[60px]" data-name="Container">
      <Container88 />
      <Background2 />
      <Background3 />
      <Background4 />
      <Background5 />
      <Background6 />
      <Background7 />
      <Background8 />
      <Background9 />
      <Background10 />
      <Background11 />
      <Background12 />
    </div>
  );
}

function Vector9() {
  return (
    <div className="absolute inset-[16.67%_22.92%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector9} />
    </div>
  );
}

function MenuItemIcon7() {
  return (
    <div className="absolute contents inset-[16.67%_22.92%]" data-name="Menu Item Icon">
      <Vector9 />
    </div>
  );
}

function Svg14() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon7 />
    </div>
  );
}

function Container124() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg14 />
    </div>
  );
}

function Container125() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start px-[7.61px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Resource</p>
      </div>
    </div>
  );
}

function Container126() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container125 />
    </div>
  );
}

function Background13() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container124 />
      <Container126 />
    </div>
  );
}

function Vector10() {
  return (
    <div className="absolute inset-[18.75%]" data-name="Vector">
      <img className="block max-w-none size-full" src={imgVector10} />
    </div>
  );
}

function MenuItemIcon8() {
  return (
    <div className="absolute contents inset-[18.75%]" data-name="Menu Item Icon">
      <Vector10 />
    </div>
  );
}

function Svg15() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="SVG">
      <MenuItemIcon8 />
    </div>
  );
}

function Container127() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[21px]" data-name="Container">
      <Svg15 />
    </div>
  );
}

function Container128() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start px-[19.02px] py-0 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Help</p>
      </div>
    </div>
  );
}

function Container129() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start min-w-[60px] relative shrink-0" data-name="Container">
      <Container128 />
    </div>
  );
}

function Background14() {
  return (
    <div className="bg-[#095192] content-stretch flex flex-col h-[50px] items-center justify-center relative shrink-0 w-full" data-name="Background">
      <Container127 />
      <Container129 />
    </div>
  );
}

function Container130() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0 w-[60px]" data-name="Container">
      <Background13 />
      <Background14 />
    </div>
  );
}

function Frame1410084112() {
  return (
    <div className="absolute bg-[#095192] content-stretch flex flex-col h-[858px] items-start justify-between left-0 top-0">
      <Container123 />
      <Container130 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[16.1px] relative w-4" data-name="Icon">
      <img className="block max-w-none size-full" src={imgIcon1} />
    </div>
  );
}

function Container131() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Icon3 />
        </div>
      </div>
    </div>
  );
}

function Container132() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <Container131 />
    </div>
  );
}

function Margin11() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start mr-[-0.01px] pl-0 pr-2 py-0 relative shrink-0" data-name="Margin">
      <Container132 />
    </div>
  );
}

function Container133() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start mr-[-0.01px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">BACK TO ALL PRODUCTS</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#095192] h-9 relative rounded-[4px] shrink-0" data-name="Button">
      <div className="box-border content-stretch flex h-9 items-center justify-start overflow-clip pl-[16.556px] pr-[16.566px] py-[8.556px] relative">
        <Margin11 />
        <Container133 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function BottomNav() {
  return (
    <div className="absolute bg-white bottom-0 h-16 max-w-[1728px] right-0 w-[1620px]" data-name="bottom nav">
      <div className="box-border content-stretch flex h-16 items-center justify-end max-w-inherit overflow-clip px-6 py-0 relative w-[1620px]">
        <Button />
      </div>
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0.556px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Svg16() {
  return (
    <div className="relative shrink-0 size-[23.99px]" data-name="SVG">
      <img className="block max-w-none size-full" src={imgSvg2} />
    </div>
  );
}

function Margin12() {
  return (
    <div className="box-border content-stretch flex flex-col h-[23.99px] items-start justify-start mr-[-0.01px] pl-0 pr-1 py-0 relative shrink-0" data-name="Margin">
      <Svg16 />
    </div>
  );
}

function Container134() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start mr-[-0.01px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6c757d] text-[14px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">AIQ Demo Practice</p>
      </div>
    </div>
  );
}

function Container135() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex items-center justify-start left-0 pl-0 pr-[0.01px] py-0 top-0" data-name="Container">
      <Margin12 />
      <Container134 />
    </div>
  );
}

function Svg17() {
  return (
    <div className="relative shrink-0 size-[23.99px]" data-name="SVG">
      <img className="block max-w-none size-full" src={imgSvg3} />
    </div>
  );
}

function Margin13() {
  return (
    <div className="box-border content-stretch flex flex-col h-[23.99px] items-start justify-start pl-0 pr-1 py-0 relative shrink-0" data-name="Margin">
      <Svg17 />
    </div>
  );
}

function Container136() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6c757d] text-[14px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Dev Oncology Clinic-Frisco</p>
      </div>
    </div>
  );
}

function Container137() {
  return (
    <div className="absolute bottom-0 content-stretch flex items-center justify-start left-[193.7px] top-0" data-name="Container" style={{ gap: "1.06581e-14px" }}>
      <Margin13 />
      <Container136 />
    </div>
  );
}

function Svg18() {
  return (
    <div className="relative shrink-0 size-[23.99px]" data-name="SVG">
      <img className="block max-w-none size-full" src={imgSvg4} />
    </div>
  );
}

function Margin14() {
  return (
    <div className="box-border content-stretch flex flex-col h-[23.99px] items-start justify-start mr-[-0.01px] pl-0 pr-1 py-0 relative shrink-0" data-name="Margin">
      <Svg18 />
    </div>
  );
}

function Container138() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start mr-[-0.01px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6c757d] text-[14px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Anil-MedOrderStation Station-Virtual</p>
      </div>
    </div>
  );
}

function Container139() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex items-center justify-start left-[444.48px] pl-0 pr-[0.01px] py-0 top-0" data-name="Container">
      <Margin14 />
      <Container138 />
    </div>
  );
}

function Separator() {
  return (
    <div className="h-[23.99px] min-h-[23.99px] relative shrink-0 w-[7.99px]" data-name="Separator">
      <div className="absolute bottom-0 left-[49.94%] right-[43.05%] top-0" data-name="Vertical Divider">
        <div aria-hidden="true" className="absolute border-[#eeeeee] border-[0px_0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function SeparatorMargin() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex flex-col items-start justify-center left-[153.72px] min-h-[23.99px] px-4 py-0 top-0" data-name="Separator:margin">
      <Separator />
    </div>
  );
}

function Separator1() {
  return (
    <div className="h-[23.99px] min-h-[23.99px] relative shrink-0 w-[7.99px]" data-name="Separator">
      <div className="absolute bottom-0 left-[49.94%] right-[43.05%] top-0" data-name="Vertical Divider">
        <div aria-hidden="true" className="absolute border-[#eeeeee] border-[0px_0px_0px_0.556px] border-solid inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function SeparatorMargin1() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex flex-col items-start justify-center left-[404.49px] min-h-[23.99px] px-4 py-0 top-0" data-name="Separator:margin">
      <Separator1 />
    </div>
  );
}

function Container140() {
  return (
    <div className="h-[23.99px] relative shrink-0 w-[719.84px]" data-name="Container">
      <Container135 />
      <Container137 />
      <Container139 />
      <SeparatorMargin />
      <SeparatorMargin1 />
    </div>
  );
}

function Container141() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container" style={{ marginBottom: "-3.55271e-15px" }}>
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-nowrap text-right">
        <p className="leading-[normal] whitespace-pre">Jagadeesh Radhakrishnan</p>
      </div>
    </div>
  );
}

function Container142() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container" style={{ marginBottom: "-3.55271e-15px" }}>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6c757d] text-[12px] text-nowrap text-right">
        <p className="leading-[normal] whitespace-pre">jagadeesh@allygpo.com</p>
      </div>
    </div>
  );
}

function Container143() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start px-0 py-1 relative shrink-0" data-name="Container">
      <Container141 />
      <Container142 />
    </div>
  );
}

function Margin15() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-0 pr-4 py-0 relative shrink-0" data-name="Margin" style={{ marginRight: "-5.68434e-14px" }}>
      <Container143 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[16.11px] relative w-[16.01px]" data-name="Icon">
      <img className="block max-w-none size-full" src={imgIcon2} />
    </div>
  );
}

function Container144() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Icon4 />
        </div>
      </div>
    </div>
  );
}

function Container145() {
  return (
    <div className="content-stretch flex flex-col items-center justify-start relative shrink-0" data-name="Container">
      <Container144 />
    </div>
  );
}

function ButtonLogout() {
  return (
    <div className="box-border content-stretch flex items-center justify-center overflow-clip pb-[10.86px] pt-[10.29px] px-[0.556px] relative rounded-[18.86px] shrink-0 size-[37.71px]" data-name="Button - logout" style={{ marginRight: "-5.68434e-14px" }}>
      <Container145 />
    </div>
  );
}

function Container146() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0" data-name="Container">
      <Margin15 />
      <ButtonLogout />
    </div>
  );
}

function Toolbar() {
  return (
    <div className="bg-white h-[50px] relative shrink-0 w-full" data-name="Toolbar">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_0.556px_0.556px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-center flex flex-wrap h-[50px] items-center justify-between pb-[0.556px] pl-[16.56px] pr-[16.55px] pt-0 relative w-full">
          <Container140 />
          <Container146 />
        </div>
      </div>
    </div>
  );
}

function Container147() {
  return (
    <div className="absolute content-stretch flex flex-col items-start justify-start left-[60.42px] top-[0.48px] w-[1620px]" data-name="Container">
      <Toolbar />
    </div>
  );
}

export default function Component1680WDefault() {
  return (
    <div className="bg-white relative size-full" data-name="1680w default">
      <BottomNav />
      <Container147 />
      <Container85 />
      <Frame1410084112 />
    </div>
  );
}