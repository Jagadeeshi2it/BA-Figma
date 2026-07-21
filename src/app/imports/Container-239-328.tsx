import { imgSubtract, imgVector34 } from "./svg-jgeb3";

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-[1377px]" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-950 text-nowrap">
        <p className="leading-[21px] whitespace-pre">Floor 1</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">ABRAXANE 100 MG VIAL</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container">
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container2 />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container3 />
    </div>
  );
}

function Margin() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin">
      <Background />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Margin />
      <div className="relative shrink-0 size-3" data-name="Subtract">
        <img className="block max-w-none size-full" src={imgSubtract} />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68817013450 - Purchased</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container5 />
    </div>
  );
}

function Container7() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container4 />
      <Container6 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">30</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container8 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container10 />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container9 />
      <Container11 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container7 />
      <Background1 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">CISPLATIN 50 MG/50 ML VIAL</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container" style={{ marginRight: "-2.84217e-14px" }}>
      <Container13 />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container15 />
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container16 />
    </div>
  );
}

function Margin1() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin" style={{ marginRight: "-2.84217e-14px" }}>
      <Background2 />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container14 />
      <Margin1 />
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68001066824 - Purchased</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container18 />
    </div>
  );
}

function Container20() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container17 />
      <Container19 />
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">4</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container21 />
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container23 />
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container22 />
      <Container24 />
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container20 />
      <Background3 />
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">ABRAXANE 100 MG VIAL</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container">
      <Container26 />
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container28 />
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container29 />
    </div>
  );
}

function Margin2() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin">
      <Background4 />
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container27 />
      <Margin2 />
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68817013450 - Purchased</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container31 />
    </div>
  );
}

function Container33() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container30 />
      <Container32 />
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">30</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container34 />
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container36 />
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container35 />
      <Container37 />
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container33 />
      <Background5 />
    </div>
  );
}

function Container52() {
  return (
    <div className="content-stretch flex flex-col gap-[10.5px] items-start justify-start relative shrink-0 w-[300px]" data-name="Container">
      <Container12 />
      <Container25 />
      <Container38 />
      <Container25 />
    </div>
  );
}

function Container53() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">ABRAXANE 100 MG VIAL</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container">
      <Container53 />
    </div>
  );
}

function Container55() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container55 />
    </div>
  );
}

function Background8() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container56 />
    </div>
  );
}

function Margin4() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin">
      <Background8 />
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container54 />
      <Margin4 />
    </div>
  );
}

function Container58() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68817013450 - Purchased</p>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container58 />
    </div>
  );
}

function Container60() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container57 />
      <Container59 />
    </div>
  );
}

function Container61() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">30</p>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container61 />
    </div>
  );
}

function Container63() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container63 />
    </div>
  );
}

function Background9() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container62 />
      <Container64 />
    </div>
  );
}

function Container65() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container60 />
      <Background9 />
    </div>
  );
}

function Container66() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">CISPLATIN 50 MG/50 ML VIAL</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container" style={{ marginRight: "-2.84217e-14px" }}>
      <Container66 />
    </div>
  );
}

function Container68() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container69() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container68 />
    </div>
  );
}

function Background10() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container69 />
    </div>
  );
}

function Margin5() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin" style={{ marginRight: "-2.84217e-14px" }}>
      <Background10 />
    </div>
  );
}

function Container70() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container67 />
      <Margin5 />
    </div>
  );
}

function Container71() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68001066824 - Purchased</p>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container71 />
    </div>
  );
}

function Container73() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container70 />
      <Container72 />
    </div>
  );
}

function Container74() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">4</p>
      </div>
    </div>
  );
}

function Container75() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container74 />
    </div>
  );
}

function Container76() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container77() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container76 />
    </div>
  );
}

function Background11() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container75 />
      <Container77 />
    </div>
  );
}

function Container78() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container73 />
      <Background11 />
    </div>
  );
}

function Container105() {
  return (
    <div className="content-stretch flex flex-col gap-[10.5px] items-start justify-start relative shrink-0 w-[300px]" data-name="Container">
      <Container65 />
      <Container78 />
      <Container65 />
      <Container78 />
    </div>
  );
}

function Container159() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">ABRAXANE 100 MG VIAL</p>
      </div>
    </div>
  );
}

function Container160() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container">
      <Container159 />
    </div>
  );
}

function Container161() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container162() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container161 />
    </div>
  );
}

function Background24() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container162 />
    </div>
  );
}

function Margin12() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin">
      <Background24 />
    </div>
  );
}

function Container163() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container160 />
      <Margin12 />
    </div>
  );
}

function Container164() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68817013450 - Purchased</p>
      </div>
    </div>
  );
}

function Container165() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container164 />
    </div>
  );
}

function Container166() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container163 />
      <Container165 />
    </div>
  );
}

function Container167() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">30</p>
      </div>
    </div>
  );
}

function Container168() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container167 />
    </div>
  );
}

function Container169() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container170() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container169 />
    </div>
  );
}

function Background25() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container168 />
      <Container170 />
    </div>
  );
}

function Container171() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container166 />
      <Background25 />
    </div>
  );
}

function Container172() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap">
        <p className="leading-[16px] whitespace-pre">CISPLATIN 50 MG/50 ML VIAL</p>
      </div>
    </div>
  );
}

function Container173() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-[3.5px] py-0 relative shrink-0" data-name="Container" style={{ marginRight: "-2.84217e-14px" }}>
      <Container172 />
    </div>
  );
}

function Container174() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SDV</p>
      </div>
    </div>
  );
}

function Container175() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container174 />
    </div>
  );
}

function Background26() {
  return (
    <div className="bg-black box-border content-stretch flex items-center justify-center px-[3.5px] py-[1.75px] relative rounded-[3.5px] shrink-0" data-name="Background">
      <Container175 />
    </div>
  );
}

function Margin13() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start pl-[3.5px] pr-0 py-0 relative shrink-0" data-name="Margin" style={{ marginRight: "-2.84217e-14px" }}>
      <Background26 />
    </div>
  );
}

function Container176() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container173 />
      <Margin13 />
    </div>
  );
}

function Container177() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[12px] w-full">
        <p className="leading-[16px]">68001066824 - Purchased</p>
      </div>
    </div>
  );
}

function Container178() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container177 />
    </div>
  );
}

function Container179() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[1.75px] grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container176 />
      <Container178 />
    </div>
  );
}

function Container180() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">4</p>
      </div>
    </div>
  );
}

function Container181() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container180 />
    </div>
  );
}

function Container182() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[10px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">vials</p>
      </div>
    </div>
  );
}

function Container183() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0" data-name="Container">
      <Container182 />
    </div>
  );
}

function Background27() {
  return (
    <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[3.5px] shrink-0 w-[42px]" data-name="Background">
      <div className="absolute inset-0 rounded-[3.5px]" data-name="Border">
        <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
      </div>
      <Container181 />
      <Container183 />
    </div>
  );
}

function Container184() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container179 />
      <Background27 />
    </div>
  );
}

function Container185() {
  return (
    <div className="content-stretch flex flex-col gap-[10.5px] items-start justify-start relative shrink-0 w-[300px]" data-name="Container">
      <Container171 />
      <Container184 />
    </div>
  );
}

function Frame1410084111() {
  return (
    <div className="content-stretch flex gap-7 items-start justify-start relative shrink-0 w-full">
      <Container52 />
      <div className="h-[172px] relative shrink-0 w-0">
        <div className="absolute inset-[-0.29%_-0.5px]">
          <img className="block max-w-none size-full" src={imgVector34} />
        </div>
      </div>
      <Container105 />
      <div className="h-[172px] relative shrink-0 w-0">
        <div className="absolute inset-[-0.29%_-0.5px]">
          <img className="block max-w-none size-full" src={imgVector34} />
        </div>
      </div>
      <Container105 />
      <div className="h-[172px] relative shrink-0 w-0">
        <div className="absolute inset-[-0.29%_-0.5px]">
          <img className="block max-w-none size-full" src={imgVector34} />
        </div>
      </div>
      <Container185 />
    </div>
  );
}

function Container186() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-[7px] items-start justify-start p-[16px] relative w-full">
          <Frame1410084111 />
        </div>
      </div>
    </div>
  );
}

export default function Container187() {
  return (
    <div className="content-stretch flex flex-col gap-3.5 items-center justify-start relative size-full" data-name="Container">
      <Heading3 />
      <Container186 />
    </div>
  );
}