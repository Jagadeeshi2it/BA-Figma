import svgPaths from "./svg-5m8k6it6lb";

function Container() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[20px] text-left text-nowrap">
        <p className="block leading-[28px] whitespace-pre">AllyGPO</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">®</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <Container />
      <Container1 />
    </div>
  );
}

function BackgroundHorizontalBorder() {
  return (
    <div
      className="bg-[#095192] h-[54px] relative shrink-0 w-full"
      data-name="Background+HorizontalBorder"
    >
      <div className="absolute border-[#0a5ba3] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col h-[54px] items-center justify-center pb-[9px] pt-2 px-2 relative w-full">
          <Container2 />
        </div>
      </div>
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d="M5.33333 1.33333V4"
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M10.6667 1.33333V4"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3ee34580}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M2 6.66667H14"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container3() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">The Oncology Clinic</p>
      </div>
    </div>
  );
}

function Svg1() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d="M6 12L10 8L6 4"
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Link() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg />
          <Container3 />
          <Svg1 />
        </div>
      </div>
    </div>
  );
}

function Item() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link />
    </div>
  );
}

function Svg2() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p299d1200}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p1f2c5400}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">My Work</p>
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg2 />
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function Item1() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link1 />
    </div>
  );
}

function Svg3() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d="M5.33333 1.33333V4"
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M10.6667 1.33333V4"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3ee34580}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M2 6.66667H14"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Appointments</p>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg3 />
          <Container5 />
        </div>
      </div>
    </div>
  );
}

function Item2() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link2 />
    </div>
  );
}

function Svg4() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p18993c00}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M8 14.6667V8"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p12470480}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5 2.84667L11 6.28"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Inventory</p>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg4 />
          <Container6 />
        </div>
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="h-8 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row h-8 items-center justify-start px-4 py-2 relative w-full">
          <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left">
            <p className="block leading-[20px]">All Products</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Link5() {
  return (
    <div className="h-8 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row h-8 items-center justify-start px-4 py-2 relative w-full">
          <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left">
            <p className="block leading-[20px]">Serial Lookup</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Link6() {
  return (
    <div
      className="bg-[#ffffff] h-8 relative rounded-md shrink-0 w-full"
      data-name="Link"
    >
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row h-8 items-center justify-start px-4 py-2 relative w-full">
          <div className="basis-0 flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#095192] text-[0px] text-left">
            <p className="block leading-[20px] text-[14px]">Allocation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-0.5 items-start justify-start p-0 relative shrink-0 w-48"
      data-name="Container"
    >
      <Link4 />
      <Link5 />
      <Link6 />
    </div>
  );
}

function Item3() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-0.5 items-end justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link3 />
      <Container7 />
    </div>
  );
}

function Svg5() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p368df400}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3a53aa80}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M8 7.33333H10.6667"
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M8 10.6667H10.6667"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5.33333 7.33333H5.34"
            id="Vector_5"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5.33333 10.6667H5.34"
            id="Vector_6"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container8() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Audit</p>
      </div>
    </div>
  );
}

function Link7() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg5 />
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function Item4() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link7 />
    </div>
  );
}

function Svg6() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p19416e00}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3e059a80}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M6.66667 6H5.33333"
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M10.6667 8.66667H5.33333"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M10.6667 11.3333H5.33333"
            id="Vector_5"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container9() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Orders</p>
      </div>
    </div>
  );
}

function Link8() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg6 />
          <Container9 />
        </div>
      </div>
    </div>
  );
}

function Item5() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link8 />
    </div>
  );
}

function Svg7() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d="M12 1.33333L14.6667 4"
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p550c080}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3ab54c00}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M6 7.33333L8.66667 10"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p36c63a00}
            id="Vector_5"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p1d48d580}
            id="Vector_6"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Dispense</p>
      </div>
    </div>
  );
}

function Link9() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg7 />
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Item6() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link9 />
    </div>
  );
}

function Svg8() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p12949080}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M2 2V5.33333H5.33333"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container11() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Restock</p>
      </div>
    </div>
  );
}

function Link10() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg8 />
          <Container11 />
        </div>
      </div>
    </div>
  );
}

function Item7() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link10 />
    </div>
  );
}

function Svg9() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p220c5680}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p17a3eb00}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container12() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Formulary</p>
      </div>
    </div>
  );
}

function Link11() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg9 />
          <Container12 />
        </div>
      </div>
    </div>
  );
}

function Item8() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link11 />
    </div>
  );
}

function Svg10() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p22a62180}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M2.66667 4.66667H13.3333"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p88b5180}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M13.3333 11.3333H2.66667"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container13() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Transfer</p>
      </div>
    </div>
  );
}

function Link12() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg10 />
          <Container13 />
        </div>
      </div>
    </div>
  );
}

function Item9() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link12 />
    </div>
  );
}

function Svg11() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p32887f80}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3694d280}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p1f197700}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3bf3e100}
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Patients</p>
      </div>
    </div>
  );
}

function Link13() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg11 />
          <Container14 />
        </div>
      </div>
    </div>
  );
}

function Item10() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link13 />
    </div>
  );
}

function Svg12() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p7ad6800}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5.33333 14H10.6667"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M8 11.3333V14"
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container15() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Stations</p>
      </div>
    </div>
  );
}

function Link14() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg12 />
          <Container15 />
        </div>
      </div>
    </div>
  );
}

function Item11() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link14 />
    </div>
  );
}

function Svg13() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p32976d80}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p3694d280}
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p36381b80}
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p1dc66e00}
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p382e2b80}
            id="Vector_5"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p217a6a00}
            id="Vector_6"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p275fcf60}
            id="Vector_7"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M13.0667 12.4667L12.8 11.8"
            id="Vector_8"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M11.2 8.2L10.9333 7.53333"
            id="Vector_9"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M9.53333 11.0667L10.2 10.8"
            id="Vector_10"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M13.8 9.2L14.4667 8.93333"
            id="Vector_11"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container16() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px overflow-clip p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-left w-full">
        <p className="block leading-[20px]">Admin</p>
      </div>
    </div>
  );
}

function Link15() {
  return (
    <div className="h-10 relative rounded-md shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row gap-3 h-10 items-center justify-start px-4 py-2 relative w-full">
          <Svg13 />
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function Item12() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Item"
    >
      <Link15 />
    </div>
  );
}

function List() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-0.5 items-start justify-start p-0 relative shrink-0 w-full"
      data-name="List"
    >
      <Item />
      <Item1 />
      <Item2 />
      <Item3 />
      <Item4 />
      <Item5 />
      <Item6 />
      <Item7 />
      <Item8 />
      <Item9 />
      <Item10 />
      <Item11 />
      <Item12 />
    </div>
  );
}

function Background() {
  return (
    <div
      className="basis-0 bg-[#095192] grow min-h-px min-w-px relative shrink-0 w-full"
      data-name="Background"
    >
      <div className="overflow-auto relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start px-2 py-0 relative size-full">
          <List />
        </div>
      </div>
    </div>
  );
}

function SideMenu() {
  return (
    <div
      className="bg-neutral-50 box-border content-stretch flex flex-col h-[771px] items-start justify-start p-0 relative shrink-0 w-60"
      data-name="side menu"
    >
      <BackgroundHorizontalBorder />
      <Background />
    </div>
  );
}

function Svg14() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.pda21400}
            id="Vector"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p1be36900}
            id="Vector_2"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.pa8d100}
            id="Vector_3"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M6.66667 4H9.33333"
            id="Vector_4"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M6.66667 6.66667H9.33333"
            id="Vector_5"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M6.66667 9.33333H9.33333"
            id="Vector_6"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M6.66667 12H9.33333"
            id="Vector_7"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container17() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-gray-700 text-left text-nowrap">
        <p className="block leading-[20px] whitespace-pre">
          The Oncology Institute of Hope and Innovation-Nevada
        </p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <Svg14 />
      <Container17 />
    </div>
  );
}

function Svg15() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p14548f00}
            id="Vector"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d={svgPaths.p17781bc0}
            id="Vector_2"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container19() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-gray-700 text-left text-nowrap">
        <p className="block leading-[20px] whitespace-pre">
          Thrive Health Center of North Virginia
        </p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <Svg15 />
      <Container19 />
    </div>
  );
}

function Svg16() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p7ad6800}
            id="Vector"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M5.33333 14H10.6667"
            id="Vector_2"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M8 11.3333V14"
            id="Vector_3"
            stroke="var(--stroke-0, #2563EB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Container21() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-gray-700 text-left text-nowrap">
        <p className="block leading-[20px] whitespace-pre">
          Back Office Station
        </p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <Svg16 />
      <Container21 />
    </div>
  );
}

function Container23() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-6 items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <Container18 />
      <Container20 />
      <Container22 />
    </div>
  );
}

function Head() {
  return (
    <div
      className="bg-gray-100 h-[54px] shrink-0 sticky top-0 w-full"
      data-name="head"
    >
      <div className="absolute border-[0px_0px_1px] border-gray-200 border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row h-[54px] items-center justify-start pb-px pt-0 px-4 relative w-full">
          <Container23 />
        </div>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Heading 1"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-gray-900 text-left text-nowrap">
        <p className="block leading-[32px] whitespace-pre">Allocation</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-center justify-center p-0 relative shrink-0"
      data-name="Button"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-blue-600 text-center text-nowrap">
        <p className="block leading-[20px] whitespace-pre">Primary Station</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Heading1 />
      <Button />
    </div>
  );
}

function Container25() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0"
      data-name="Container"
    >
      <Container24 />
    </div>
  );
}

function Button1() {
  return (
    <div
      className="box-border content-stretch flex flex-row h-9 items-center justify-center px-[13px] py-px relative rounded shrink-0"
      data-name="Button"
    >
      <div className="absolute border border-gray-300 border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1e3a5f] text-[14px] text-center text-nowrap">
        <p className="block leading-[20px] whitespace-pre">7 Available Bins</p>
      </div>
    </div>
  );
}

function Svg17() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p39ee6532}
            id="Vector"
            stroke="var(--stroke-0, #1E3A5F)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M8 4V8L10.6667 9.33333"
            id="Vector_2"
            stroke="var(--stroke-0, #1E3A5F)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div
      className="box-border content-stretch flex flex-row h-9 items-center justify-center p-[9px] relative rounded shrink-0"
      data-name="Button"
    >
      <div className="absolute border border-gray-300 border-solid inset-0 pointer-events-none rounded" />
      <Svg17 />
    </div>
  );
}

function Button3() {
  return (
    <div
      className="box-border content-stretch flex flex-row h-9 items-center justify-center px-[13px] py-px relative rounded shrink-0"
      data-name="Button"
    >
      <div className="absolute border border-gray-300 border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-gray-700 text-nowrap">
        <p className="block leading-[20px] whitespace-pre">
          Allocate/Unallocate
        </p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div
      className="box-border content-stretch flex flex-row h-9 items-center justify-center px-[13px] py-px relative rounded shrink-0"
      data-name="Button"
    >
      <div className="absolute border border-gray-300 border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-gray-700 text-nowrap">
        <p className="block leading-[20px] whitespace-pre">Change Allocation</p>
      </div>
    </div>
  );
}

function Svg18() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="SVG">
          <path
            d={svgPaths.p107a080}
            id="Vector"
            stroke="var(--stroke-0, #1E3A5F)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
          <path
            d="M14 14L11.1333 11.1333"
            id="Vector_2"
            stroke="var(--stroke-0, #1E3A5F)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div
      className="box-border content-stretch flex flex-row h-10 items-center justify-center p-[9px] relative rounded shrink-0"
      data-name="Button"
    >
      <div className="absolute border border-gray-300 border-solid inset-0 pointer-events-none rounded" />
      <Svg18 />
    </div>
  );
}

function Container26() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <Button1 />
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
    </div>
  );
}

function Container27() {
  return (
    <div
      className="box-border content-stretch flex flex-row h-10 items-center justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container25 />
      <Container26 />
    </div>
  );
}

function Header() {
  return (
    <div
      className="bg-blue-50 box-border content-stretch flex flex-col items-start justify-start min-h-6 order-2 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0 w-20"
      data-name="Header"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#176cff] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Cabinet 1</p>
      </div>
    </div>
  );
}

function ButtonDoor1() {
  return (
    <div
      className="bg-[#ffffff] h-[50px] min-h-12 relative rounded shrink-0 w-11"
      data-name="Button - Door 1"
    >
      <div className="absolute border border-[#4f8cf5] border-solid inset-0 pointer-events-none rounded shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]" />
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#176cff] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[29.435px]"
        style={{ top: "calc(50% - 8px)", left: "calc(50% + 1.71769px)" }}
      >
        <p className="block leading-[16px]">Door</p>
      </div>
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#176cff] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[6.468px]"
        style={{ top: "calc(50% + 8px)", left: "calc(50% + 0.16425px)" }}
      >
        <p className="block leading-[16px]">1</p>
      </div>
    </div>
  );
}

function ButtonDoor2() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px]"
      data-name="Button - Door 2"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">2</p>
      </div>
    </div>
  );
}

function ButtonDoor3() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px]"
      data-name="Button - Door 3"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">3</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-1 items-center justify-start max-w-[228px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonDoor1 />
      <ButtonDoor2 />
      <ButtonDoor3 />
    </div>
  );
}

function ButtonDoor4() {
  return (
    <div
      className="bg-[#ffffff] min-h-12 relative rounded shrink-0 w-full"
      data-name="Button - Door 4"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-row items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-center min-h-inherit px-[31px] py-[9px] relative w-full">
          <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-center">
            <p className="block mb-0">Door</p>
            <p className="block">4</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div
      className="bg-blue-50 order-1 relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full"
      data-name="Background"
    >
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-[8px] relative w-full">
          <Container28 />
          <ButtonDoor4 />
        </div>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div
      className="box-border content-stretch flex flex-col-reverse items-start justify-start max-w-[244px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Header />
      <Background1 />
    </div>
  );
}

function SectionCabinet1() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-60 p-0 relative shrink-0 w-[244px]"
      data-name="Section - Cabinet 1"
    >
      <Container29 />
    </div>
  );
}

function SectionCabinet1Margin() {
  return (
    <div
      className="box-border content-stretch flex flex-col h-[150px] items-start justify-center min-w-60 px-0 py-0.5 relative shrink-0 w-[244px]"
      data-name="Section - Cabinet 1:margin"
    >
      <SectionCabinet1 />
    </div>
  );
}

function Header1() {
  return (
    <div
      className="bg-gray-100 box-border content-stretch flex flex-col items-start justify-start min-h-6 order-2 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0 w-20"
      data-name="Header"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Cabinet 2</p>
      </div>
    </div>
  );
}

function ButtonDoor5() {
  return (
    <div
      className="bg-[#ffffff] h-[50px] min-h-12 relative rounded shrink-0 w-11"
      data-name="Button - Door 5"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#020817] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[27.835px]"
        style={{ top: "calc(50% - 8px)", left: "calc(50% + 0.917719px)" }}
      >
        <p className="block leading-[16px]">Door</p>
      </div>
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#020817] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[7.78px]"
        style={{ top: "calc(50% + 8px)", left: "calc(50% + 0.180251px)" }}
      >
        <p className="block leading-[16px]">5</p>
      </div>
    </div>
  );
}

function ButtonDoor6() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px]"
      data-name="Button - Door 6"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">6</p>
      </div>
    </div>
  );
}

function ButtonDoor7() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px]"
      data-name="Button - Door 7"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">7</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-1 items-center justify-start max-w-[228px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonDoor5 />
      <ButtonDoor6 />
      <ButtonDoor7 />
    </div>
  );
}

function ButtonDoor8() {
  return (
    <div
      className="bg-[#ffffff] min-h-12 relative rounded shrink-0 w-full"
      data-name="Button - Door 8"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-row items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-center min-h-inherit px-[31px] py-[9px] relative w-full">
          <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-center">
            <p className="block mb-0">Door</p>
            <p className="block">8</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div
      className="bg-gray-100 order-1 relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full"
      data-name="Background"
    >
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-[8px] relative w-full">
          <Container30 />
          <ButtonDoor8 />
        </div>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div
      className="box-border content-stretch flex flex-col-reverse items-start justify-start max-w-[244px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Header1 />
      <Background2 />
    </div>
  );
}

function SectionCabinet2() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-60 p-0 relative shrink-0 w-[244px]"
      data-name="Section - Cabinet 2"
    >
      <Container31 />
    </div>
  );
}

function SectionCabinet2Margin() {
  return (
    <div
      className="box-border content-stretch flex flex-col h-[150px] items-start justify-center min-w-60 px-0 py-0.5 relative shrink-0 w-[244px]"
      data-name="Section - Cabinet 2:margin"
    >
      <SectionCabinet2 />
    </div>
  );
}

function Header2() {
  return (
    <div
      className="bg-gray-100 box-border content-stretch flex flex-col items-start justify-start min-h-6 order-2 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0 w-20"
      data-name="Header"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Cabinet 3</p>
      </div>
    </div>
  );
}

function ButtonDoor9() {
  return (
    <div
      className="bg-[#ffffff] h-[50px] min-h-12 relative rounded shrink-0 w-11"
      data-name="Button - Door 9"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#020817] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[27.835px]"
        style={{ top: "calc(50% - 8px)", left: "calc(50% + 0.917719px)" }}
      >
        <p className="block leading-[16px]">Door</p>
      </div>
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#020817] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[8.006px]"
        style={{ top: "calc(50% + 8px)", left: "calc(50% + 0.183001px)" }}
      >
        <p className="block leading-[16px]">9</p>
      </div>
    </div>
  );
}

function ButtonDoor10() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px]"
      data-name="Button - Door 10"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">10</p>
      </div>
    </div>
  );
}

function ButtonDoor11() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[9px] relative rounded shrink-0 w-[88px]"
      data-name="Button - Door 11"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">11</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-1 items-center justify-start max-w-[228px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonDoor9 />
      <ButtonDoor10 />
      <ButtonDoor11 />
    </div>
  );
}

function ButtonDoor12() {
  return (
    <div
      className="bg-[#ffffff] min-h-12 relative rounded shrink-0 w-full"
      data-name="Button - Door 12"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-row items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-center min-h-inherit px-[31px] py-[9px] relative w-full">
          <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-center">
            <p className="block mb-0">Door</p>
            <p className="block">12</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div
      className="bg-gray-100 order-1 relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full"
      data-name="Background"
    >
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-[8px] relative w-full">
          <Container32 />
          <ButtonDoor12 />
        </div>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div
      className="box-border content-stretch flex flex-col-reverse items-start justify-start max-w-[244px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Header2 />
      <Background3 />
    </div>
  );
}

function SectionCabinet3() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-60 p-0 relative shrink-0 w-[244px]"
      data-name="Section - Cabinet 3"
    >
      <Container33 />
    </div>
  );
}

function SectionCabinet3Margin() {
  return (
    <div
      className="box-border content-stretch flex flex-col h-[150px] items-start justify-center min-w-60 px-0 py-0.5 relative shrink-0 w-[244px]"
      data-name="Section - Cabinet 3:margin"
    >
      <SectionCabinet3 />
    </div>
  );
}

function Header3() {
  return (
    <div
      className="bg-gray-100 box-border content-stretch flex flex-col items-start justify-start min-h-6 order-2 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0 w-20"
      data-name="Header"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Fridge</p>
      </div>
    </div>
  );
}

function ButtonDoor13() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[37px] relative rounded shrink-0 w-[54px]"
      data-name="Button - Door 13"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">13</p>
      </div>
    </div>
  );
}

function ButtonDoor14() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[37px] relative rounded shrink-0 w-[54px]"
      data-name="Button - Door 14"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">14</p>
      </div>
    </div>
  );
}

function ButtonDoor15() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[37px] relative rounded shrink-0 w-[54px]"
      data-name="Button - Door 15"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">15</p>
      </div>
    </div>
  );
}

function ButtonDoor16() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-12 px-[13px] py-[37px] relative rounded shrink-0 w-[54px]"
      data-name="Button - Door 16"
    >
      <div className="absolute border border-[#ebebeb] border-solid inset-0 pointer-events-none rounded" />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="block mb-0">Door</p>
        <p className="block">16</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row gap-1 grow items-center justify-start max-w-[228px] min-h-px min-w-px p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonDoor13 />
      <ButtonDoor14 />
      <ButtonDoor15 />
      <ButtonDoor16 />
    </div>
  );
}

function Background4() {
  return (
    <div
      className="bg-gray-100 h-[122px] order-1 relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full"
      data-name="Background"
    >
      <div className="flex flex-col justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col h-[122px] items-start justify-center p-[8px] relative w-full">
          <Container34 />
        </div>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col-reverse grow items-start justify-start max-w-[244px] min-h-px min-w-px p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Header3 />
      <Background4 />
    </div>
  );
}

function SectionFridge() {
  return (
    <div
      className="box-border content-stretch flex flex-col h-[150px] items-start justify-center min-w-60 p-0 relative shrink-0 w-[244px]"
      data-name="Section - Fridge"
    >
      <Container35 />
    </div>
  );
}

function SectionCabinetSelection() {
  return (
    <div
      className="[flex-flow:wrap] box-border content-start flex gap-2 h-[150px] items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Section - Cabinet selection"
    >
      <SectionCabinet1Margin />
      <SectionCabinet2Margin />
      <SectionCabinet3Margin />
      <SectionFridge />
    </div>
  );
}

function Header4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start px-3 py-0 relative w-full">
          <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-left w-full">
            <p className="block leading-[20px]">Shelf 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin A</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">CYCLOPHOSPHAMIDE</p>
        <p className="block">500 MG VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">00078041564 -</p>
        <p className="block">Purchased</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container37 />
      <Container38 />
    </div>
  );
}

function Container40() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">44 Via.</p>
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[18.98px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container40 />
    </div>
  );
}

function Container42() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container39 />
      <Container41 />
    </div>
  );
}

function Container43() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">DOXORUBICIN 50 MG</p>
        <p className="block">VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">00703319101 - Purchased</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container43 />
      <Container44 />
    </div>
  );
}

function Container46() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">12 Via.</p>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[21.61px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container46 />
    </div>
  );
}

function Container48() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container45 />
      <Container47 />
    </div>
  );
}

function Container49() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-0 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container42 />
      <Container48 />
    </div>
  );
}

function ButtonBinAWith2Products() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Bin A with 2 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-[13px] relative size-full">
          <Container36 />
          <Container49 />
        </div>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin B</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">ABRAXANE 100 MG VIAL -</p>
        <p className="block">SDV</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">68817013450 -</p>
        <p className="block">Purchased</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px mr-[-0.01px] p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container51 />
      <Container52 />
    </div>
  );
}

function Container54() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">292 vials</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] mr-[-0.01px] pl-[7.86px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container54 />
    </div>
  );
}

function Container56() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-between pl-0 pr-[0.02px] py-0 relative w-full">
          <Container53 />
          <Container55 />
        </div>
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">BOTOX 200 UNIT VIAL -</p>
        <p className="block">WNB - MDV</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">23392102 - Purchased</p>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px mr-[-0.01px] p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container57 />
      <Container58 />
    </div>
  );
}

function Container60() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">47 vials</p>
      </div>
    </div>
  );
}

function Container61() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] mr-[-0.01px] pl-[15.62px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container60 />
    </div>
  );
}

function Container62() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-between pl-0 pr-[0.02px] py-0 relative w-full">
          <Container59 />
          <Container61 />
        </div>
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-0 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container56 />
      <Container62 />
    </div>
  );
}

function ButtonBinBWith2Products() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Bin B with 2 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-[13px] relative size-full">
          <Container50 />
          <Container63 />
        </div>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#999999] text-[12px] text-center text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Available Slot</p>
      </div>
    </div>
  );
}

function ButtonAvailableSlotClickToAddProduct() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Available slot - click to add product"
    >
      <div className="absolute border border-[#d1d1d1] border-dashed inset-0 pointer-events-none rounded-lg" />
      <div className="flex flex-col items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center min-h-inherit p-[13px] relative size-full">
          <Container64 />
        </div>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-start justify-center min-h-[166px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonBinAWith2Products />
      <ButtonBinBWith2Products />
      {[...Array(3).keys()].map((_, i) => (
        <ButtonAvailableSlotClickToAddProduct key={i} />
      ))}
    </div>
  );
}

function SectionShelf1() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Section - Shelf 1"
    >
      <Header4 />
      <Container67 />
    </div>
  );
}

function Header5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start px-3 py-0 relative w-full">
          <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-left w-full">
            <p className="block leading-[20px]">Shelf 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container68() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin A</p>
      </div>
    </div>
  );
}

function Container69() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[16px]">CISPLATIN 50 MG/50 ML VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container70() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">72266025201 - Purchased</p>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container69 />
      <Container70 />
    </div>
  );
}

function Container72() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">4 vials</p>
      </div>
    </div>
  );
}

function Container73() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[22.6px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container72 />
    </div>
  );
}

function Container74() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container71 />
      <Container73 />
    </div>
  );
}

function Container75() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[16px]">ABRAXANE 100 MG VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container76() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">68817013450 - Purchased</p>
      </div>
    </div>
  );
}

function Container77() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container75 />
      <Container76 />
    </div>
  );
}

function Container78() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">292 vials</p>
      </div>
    </div>
  );
}

function Container79() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[7.86px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container78 />
    </div>
  );
}

function Container80() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container77 />
      <Container79 />
    </div>
  );
}

function Container81() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[16px]">MVASI 400 MG/16 ML VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container82() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">55513020701 - Purchased</p>
      </div>
    </div>
  );
}

function Container83() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container81 />
      <Container82 />
    </div>
  );
}

function Container84() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">8 vials</p>
      </div>
    </div>
  );
}

function Container85() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[22.61px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container84 />
    </div>
  );
}

function Container86() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container83 />
      <Container85 />
    </div>
  );
}

function Container87() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-6 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container74 />
      <Container80 />
      <Container86 />
    </div>
  );
}

function ButtonBinAWith3ProductsDoubleBin() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start min-h-[140px] p-[13px] relative rounded-lg self-stretch shrink-0 w-[481.59px]"
      data-name="Button - Bin A with 3 products - double bin"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <Container68 />
      <Container87 />
    </div>
  );
}

function Container88() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin B</p>
      </div>
    </div>
  );
}

function Container89() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#999999] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Available Bin</p>
      </div>
    </div>
  );
}

function Container90() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row grow items-center justify-center min-h-px min-w-px p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container89 />
    </div>
  );
}

function ButtonBinBAvailableBin() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start min-h-[140px] p-[13px] relative rounded-lg self-stretch shrink-0 w-[236.8px]"
      data-name="Button - Bin B - Available bin"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <Container88 />
      <Container90 />
    </div>
  );
}

function Container91() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin C</p>
      </div>
    </div>
  );
}

function Container92() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">MAGNESIUM SULFATE</p>
        <p className="block">50% 1 G/2 ML - MDV</p>
      </div>
    </div>
  );
}

function Container93() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">63323006403 - Charity</p>
        <p className="block">Care</p>
      </div>
    </div>
  );
}

function Container94() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container92 />
      <Container93 />
    </div>
  );
}

function Container95() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">10 syringe</p>
      </div>
    </div>
  );
}

function Container96() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[0.64px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container95 />
    </div>
  );
}

function Container97() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container94 />
      <Container96 />
    </div>
  );
}

function Container98() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">BENDEKA 100 MG/4 ML</p>
        <p className="block">VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container99() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">63459034804 -</p>
        <p className="block">Purchased</p>
      </div>
    </div>
  );
}

function Container100() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container98 />
      <Container99 />
    </div>
  );
}

function Container101() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">1 vials</p>
      </div>
    </div>
  );
}

function Container102() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[24.72px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container101 />
    </div>
  );
}

function Container103() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container100 />
      <Container102 />
    </div>
  );
}

function Container104() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-0 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container97 />
      <Container103 />
    </div>
  );
}

function ButtonBinCWith2Products() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start min-h-[140px] p-[13px] relative rounded-lg self-stretch shrink-0 w-[236.8px]"
      data-name="Button - Bin C with 2 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <Container91 />
      <Container104 />
    </div>
  );
}

function Container105() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#999999] text-[12px] text-center text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Available Slot</p>
      </div>
    </div>
  );
}

function ButtonAvailableSlotClickToAddProduct3() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col items-center justify-center min-h-[140px] p-[13px] relative rounded-lg self-stretch shrink-0 w-[236.8px]"
      data-name="Button - Available slot - click to add product"
    >
      <div className="absolute border border-[#d1d1d1] border-dashed inset-0 pointer-events-none rounded-lg" />
      <Container105 />
    </div>
  );
}

function Container106() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-start justify-center min-h-[182px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonBinAWith3ProductsDoubleBin />
      <ButtonBinBAvailableBin />
      <ButtonBinCWith2Products />
      <ButtonAvailableSlotClickToAddProduct3 />
    </div>
  );
}

function SectionShelf2() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Section - Shelf 2"
    >
      <Header5 />
      <Container106 />
    </div>
  );
}

function Header6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start px-3 py-0 relative w-full">
          <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-left w-full">
            <p className="block leading-[20px]">Shelf 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container107() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin D</p>
      </div>
    </div>
  );
}

function Container108() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">CARBOPLATIN 600 MG/60</p>
        <p className="block">ML VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container109() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">703423901 - Purchased</p>
      </div>
    </div>
  );
}

function Container110() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container108 />
      <Container109 />
    </div>
  );
}

function Container111() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">1 vials</p>
      </div>
    </div>
  );
}

function Container112() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[24.72px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container111 />
    </div>
  );
}

function Container113() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container110 />
      <Container112 />
    </div>
  );
}

function Container114() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px pb-[184px] pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container113 />
    </div>
  );
}

function ButtonBinDWith1Products() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Bin D with 1 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-[13px] relative size-full">
          <Container107 />
          <Container114 />
        </div>
      </div>
    </div>
  );
}

function Container115() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin E</p>
      </div>
    </div>
  );
}

function Container116() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">POTASSIUM CL 20</p>
        <p className="block">MEQ/10 ML CONC - SDV</p>
      </div>
    </div>
  );
}

function Container117() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">63323096510 - Specialty</p>
        <p className="block">Pharmacy</p>
      </div>
    </div>
  );
}

function Container118() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px mr-[-0.01px] p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container116 />
      <Container117 />
    </div>
  );
}

function Container119() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">1 vials</p>
      </div>
    </div>
  );
}

function Container120() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] mr-[-0.01px] pl-[24.73px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container119 />
    </div>
  );
}

function Container121() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-between pl-0 pr-[0.02px] py-0 relative w-full">
          <Container118 />
          <Container120 />
        </div>
      </div>
    </div>
  );
}

function Container122() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">DEXAMETHASONE 100</p>
        <p className="block">MG/10 ML VL - MDV</p>
      </div>
    </div>
  );
}

function Container123() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">63323051610 - Specialty</p>
        <p className="block">Pharmacy</p>
      </div>
    </div>
  );
}

function Container124() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px mr-[-0.01px] p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container122 />
      <Container123 />
    </div>
  );
}

function Container125() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">2 syringe</p>
      </div>
    </div>
  );
}

function Container126() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] mr-[-0.01px] pl-[6.79px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container125 />
    </div>
  );
}

function Container127() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-between pl-0 pr-[0.02px] py-0 relative w-full">
          <Container124 />
          <Container126 />
        </div>
      </div>
    </div>
  );
}

function Container128() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">BOTOX 200 UNIT VIAL -</p>
        <p className="block">WNB - MDV</p>
      </div>
    </div>
  );
}

function Container129() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">23392102 - Purchased</p>
      </div>
    </div>
  );
}

function Container130() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px mr-[-0.01px] p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container128 />
      <Container129 />
    </div>
  );
}

function Container131() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">47 vials</p>
      </div>
    </div>
  );
}

function Container132() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] mr-[-0.01px] pl-[15.62px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container131 />
    </div>
  );
}

function Container133() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-between pl-0 pr-[0.02px] py-0 relative w-full">
          <Container130 />
          <Container132 />
        </div>
      </div>
    </div>
  );
}

function Container134() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-10 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container121 />
      <Container127 />
      <Container133 />
    </div>
  );
}

function ButtonBinEWith3Products() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Bin E with 3 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-[13px] relative size-full">
          <Container115 />
          <Container134 />
        </div>
      </div>
    </div>
  );
}

function Container135() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin F</p>
      </div>
    </div>
  );
}

function Container136() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">AFSTYLA 2,500 UNIT</p>
        <p className="block">RANGE VIAL - MDV</p>
      </div>
    </div>
  );
}

function Container137() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">69911048102 - Sample</p>
      </div>
    </div>
  );
}

function Container138() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container136 />
      <Container137 />
    </div>
  );
}

function Container139() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">400 vials</p>
      </div>
    </div>
  );
}

function Container140() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[7.04px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container139 />
    </div>
  );
}

function Container141() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container138 />
      <Container140 />
    </div>
  );
}

function Container142() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">BOTOX 100 UNIT VIAL -</p>
        <p className="block">WNB - SDV</p>
      </div>
    </div>
  );
}

function Container143() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">23114501 - Purchased</p>
      </div>
    </div>
  );
}

function Container144() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container142 />
      <Container143 />
    </div>
  );
}

function Container145() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">2vials unit</p>
      </div>
    </div>
  );
}

function Container146() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[1.05px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container145 />
    </div>
  );
}

function Container147() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-[0.01px] items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container144 />
      <Container146 />
    </div>
  );
}

function Container148() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">GAMMAGARD LIQUID 10%</p>
        <p className="block">VIAL 20 g 200 mL - SDV</p>
      </div>
    </div>
  );
}

function Container149() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">944270006 - Purchased</p>
      </div>
    </div>
  );
}

function Container150() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container148 />
      <Container149 />
    </div>
  );
}

function Container151() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">6.73 vials</p>
      </div>
    </div>
  );
}

function Container152() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[5.23px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container151 />
    </div>
  );
}

function Container153() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container150 />
      <Container152 />
    </div>
  );
}

function Container154() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">MAGNESIUM SULFATE</p>
        <p className="block">50% 5 G/10 ML - SDV</p>
      </div>
    </div>
  );
}

function Container155() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">63323006411 -</p>
        <p className="block">Purchased</p>
      </div>
    </div>
  );
}

function Container156() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container154 />
      <Container155 />
    </div>
  );
}

function Container157() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">3 vials</p>
      </div>
    </div>
  );
}

function Container158() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[22.8px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container157 />
    </div>
  );
}

function Container159() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container156 />
      <Container158 />
    </div>
  );
}

function Container160() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-0 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container141 />
      <Container147 />
      <Container153 />
      <Container159 />
    </div>
  );
}

function ButtonBinFWith4Products() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Bin F with 4 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-[13px] relative size-full">
          <Container135 />
          <Container160 />
        </div>
      </div>
    </div>
  );
}

function Container161() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#999999] text-[12px] text-center text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Available Slot</p>
      </div>
    </div>
  );
}

function ButtonAvailableSlotClickToAddProduct4() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Available slot - click to add product"
    >
      <div className="absolute border border-[#d1d1d1] border-dashed inset-0 pointer-events-none rounded-lg" />
      <div className="flex flex-col items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center min-h-inherit p-[13px] relative size-full">
          <Container161 />
        </div>
      </div>
    </div>
  );
}

function Container163() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-start justify-center min-h-[278px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonBinDWith1Products />
      <ButtonBinEWith3Products />
      <ButtonBinFWith4Products />
      {[...Array(2).keys()].map((_, i) => (
        <ButtonAvailableSlotClickToAddProduct4 key={i} />
      ))}
    </div>
  );
}

function SectionShelf3() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Section - Shelf 3"
    >
      <Header6 />
      <Container163 />
    </div>
  );
}

function Header7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start px-3 py-0 relative w-full">
          <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[14px] text-left w-full">
            <p className="block leading-[20px]">Shelf 4</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container164() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block leading-[12px]">Bin G</p>
      </div>
    </div>
  );
}

function Container165() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">RUXIENCE 500 MG/50 ML</p>
        <p className="block">VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container166() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">69024901 - Purchased</p>
      </div>
    </div>
  );
}

function Container167() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container165 />
      <Container166 />
    </div>
  );
}

function Container168() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">20 syringe</p>
      </div>
    </div>
  );
}

function Container169() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container168 />
    </div>
  );
}

function Container170() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-between pl-0 pr-[0.01px] py-0 relative w-full">
          <Container167 />
          <Container169 />
        </div>
      </div>
    </div>
  );
}

function Container171() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">ZYPREXA 2.5 MG TABLET</p>
        <p className="block">- MDV</p>
      </div>
    </div>
  );
}

function Container172() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[16px] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block mb-0">2411230 - Specialty</p>
        <p className="block">Pharmacy</p>
      </div>
    </div>
  );
}

function Container173() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container171 />
      <Container172 />
    </div>
  );
}

function Container174() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">2 tabs</p>
      </div>
    </div>
  );
}

function Container175() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-6 pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container174 />
    </div>
  );
}

function Container176() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container173 />
      <Container175 />
    </div>
  );
}

function Container183() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="basis-0 flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] grow justify-center leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-[12px] text-left">
        <p className="block mb-0">CARBOPLATIN 600 MG/60</p>
        <p className="block">ML VIAL - SDV</p>
      </div>
    </div>
  );
}

function Container184() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start opacity-60 p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-left w-full">
        <p className="block leading-[16px]">703423901 - Purchased</p>
      </div>
    </div>
  );
}

function Container185() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px p-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container183 />
      <Container184 />
    </div>
  );
}

function Container186() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-end justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-[12px] text-nowrap text-right">
        <p className="block leading-[16px] whitespace-pre">1 vials</p>
      </div>
    </div>
  );
}

function Container187() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-end min-w-[60px] pl-[24.72px] pr-0 py-0 relative self-stretch shrink-0"
      data-name="Container"
    >
      <Container186 />
    </div>
  );
}

function Container188() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container185 />
      <Container187 />
    </div>
  );
}

function Container189() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start min-h-px min-w-px pb-0 pt-2 px-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <Container170 />
      {[...Array(2).keys()].map((_, i) => (
        <Container176 key={i} />
      ))}
      <Container188 />
    </div>
  );
}

function ButtonBinGWith4Products() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Bin G with 4 products"
    >
      <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-[13px] relative size-full">
          <Container164 />
          <Container189 />
        </div>
      </div>
    </div>
  );
}

function Container190() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-center justify-start p-0 relative shrink-0"
      data-name="Container"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#999999] text-[12px] text-center text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Available Slot</p>
      </div>
    </div>
  );
}

function ButtonAvailableSlotClickToAddProduct6() {
  return (
    <div
      className="basis-0 bg-[#ffffff] grow min-h-[140px] min-w-px relative rounded-lg self-stretch shrink-0"
      data-name="Button - Available slot - click to add product"
    >
      <div className="absolute border border-[#d1d1d1] border-dashed inset-0 pointer-events-none rounded-lg" />
      <div className="flex flex-col items-center justify-center min-h-inherit relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center min-h-inherit p-[13px] relative size-full">
          <Container190 />
        </div>
      </div>
    </div>
  );
}

function Container194() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-start justify-center min-h-[294px] p-0 relative shrink-0 w-full"
      data-name="Container"
    >
      <ButtonBinGWith4Products />
      {[...Array(4).keys()].map((_, i) => (
        <ButtonAvailableSlotClickToAddProduct6 key={i} />
      ))}
    </div>
  );
}

function SectionShelf4() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full"
      data-name="Section - Shelf 4"
    >
      <Header7 />
      <Container194 />
    </div>
  );
}

function Main() {
  return (
    <div className="bg-[#ffffff] relative shrink-0 w-full" data-name="Main">
      <div className="overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start p-[24px] relative w-full">
          <Container27 />
          <SectionCabinetSelection />
          <SectionShelf1 />
          <SectionShelf2 />
          <SectionShelf3 />
          <SectionShelf4 />
        </div>
      </div>
    </div>
  );
}

function Content() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-[1264px]"
      data-name="Content"
    >
      <Head />
      <Main />
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="box-border content-stretch flex flex-row items-start justify-start p-0 relative size-full">
      <SideMenu />
      <Content />
    </div>
  );
}