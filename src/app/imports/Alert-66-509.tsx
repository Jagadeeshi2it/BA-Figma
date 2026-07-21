import svgPaths from "./svg-k6hmk19p9g";

function ExclamationCircle() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-[21px]"
      data-name="exclamation-circle"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 21 21"
      >
        <g id="exclemation-circle">
          <path
            d={svgPaths.p3cc05c80}
            fill="var(--fill-0, #8F48D2)"
            id="Vector"
          />
          <path
            d={svgPaths.p24f18680}
            fill="var(--fill-0, #8F48D2)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p37aa3880}
            fill="var(--fill-0, #8F48D2)"
            id="Vector_3"
          />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0"
      data-name="text"
    >
      <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#25282a] text-[0px] text-left">
        <p className="leading-[normal] text-[14px]">
          <span className="font-['Inter:Bold',_sans-serif] font-bold not-italic">
            CAMPTOSAR 40 MG/2 ML VIAL
          </span>
          <span>{` has been successfully allocated to the bin.`}</span>
        </p>
      </div>
    </div>
  );
}

function Times() {
  return (
    <div className="absolute inset-[10.714%]" data-name="times">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 11 11"
      >
        <g id="times">
          <path
            d={svgPaths.p2d48ed80}
            fill="var(--fill-0, #25282A)"
            id="Vector"
          />
        </g>
      </svg>
    </div>
  );
}

function Times1() {
  return (
    <div className="overflow-clip relative shrink-0 size-3.5" data-name="times">
      <Times />
    </div>
  );
}

export default function Alert() {
  return (
    <div
      className="bg-[#ead6fd] relative rounded-md size-full"
      data-name="Alert"
    >
      <div className="absolute border-[#8f48d2] border-[0px_0px_0px_8px] border-solid inset-0 pointer-events-none rounded-md" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start px-6 py-4 relative size-full">
          <ExclamationCircle />
          <Text />
          <Times1 />
        </div>
      </div>
    </div>
  );
}