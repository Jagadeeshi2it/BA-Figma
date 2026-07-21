import svgPaths from "./svg-hyhz42ush2";
import imgImage49 from "figma:asset/aa6c17ad9dd4b7e36c04da8beea0996cf157b48c.png";

function Text() {
  return (
    <div className="bg-white h-full relative rounded-bl-[4px] rounded-tl-[4px] shrink-0 w-[72px]" data-name="Text">
      <div className="content-stretch flex items-center overflow-clip p-[12px] relative rounded-[inherit] size-full">
        <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#25282a] text-[14px] text-right">12</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
    </div>
  );
}

function DropdownButton() {
  return (
    <div className="bg-[#f7f8f9] content-stretch flex h-full items-center justify-center relative rounded-br-[4px] rounded-tr-[4px] shrink-0 w-[82px]" data-name="Dropdown Button">
      <div aria-hidden="true" className="absolute border-[#bcc3cd] border-[1px_1px_1px_0px] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#767676] text-[14px] text-center text-nowrap">each</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0 w-[154px]">
      <Text />
      <DropdownButton />
    </div>
  );
}

function TextDropdown() {
  return (
    <div className="absolute content-stretch flex flex-col h-[44px] items-start right-[72px] top-[41px] w-[154px]" data-name="Text/dropdown">
      <Frame />
    </div>
  );
}

function Frame1() {
  return <div className="absolute h-[33px] left-[189px] top-[46px] w-[34px]" />;
}

function CheckCircle() {
  return (
    <div className="absolute inset-[12.5%_12.3%_12.5%_12.55%]" data-name="check-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
        <g id="check-circle">
          <path d={svgPaths.p8ac0680} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p34ca1100} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function CheckCircle1() {
  return (
    <div className="absolute left-1/2 overflow-clip size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="check-circle">
      <CheckCircle />
    </div>
  );
}

function Search() {
  return (
    <div className="absolute bg-[#095192] left-[182px] overflow-clip rounded-[4px] size-[44px] top-[41px]" data-name="Search">
      <CheckCircle1 />
    </div>
  );
}

function NotReceived() {
  return (
    <div className="absolute bg-white h-[120px] left-[1392px] overflow-clip rounded-[4px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3)] top-[351px] w-[242px]" data-name="Not Received">
      <TextDropdown />
      <Frame1 />
      <Search />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[16px] not-italic text-[#25282a] text-[12px] text-nowrap top-[89px]">Max: 12 each</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[16px] not-italic text-[#25282a] text-[14px] text-nowrap top-[16px]">Change Qty to move</p>
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute h-[968px] left-0 top-0 w-[1646px]" data-name="image 49">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage49} />
      </div>
      <NotReceived />
    </div>
  );
}