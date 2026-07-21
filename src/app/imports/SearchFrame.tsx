import { imgQrcode } from "./svg-lw87d";

function Qrcode() {
  return (
    <div className="absolute inset-[16.17%_19.25%_19.25%_16.17%]" data-name="qrcode">
      <img className="block max-w-none size-full" src={imgQrcode} />
    </div>
  );
}

function Qrcode1() {
  return (
    <div className="absolute left-0 overflow-clip size-6 top-0" data-name="qrcode">
      <Qrcode />
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="relative shrink-0 size-6" data-name="Left Icon">
      <Qrcode1 />
    </div>
  );
}

function InputGroup() {
  return (
    <div className="bg-white h-12 relative rounded-[4px] shrink-0 w-full" data-name="Input Group">
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex gap-2 h-12 items-center justify-start p-[12px] relative w-full">
          <LeftIcon />
          <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#9fa9b7] text-[16px]">
            <p className="leading-[normal]">Scan or type serial number</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px relative rounded-[4px] shrink-0" data-name="Input">
      <InputGroup />
    </div>
  );
}

export default function SearchFrame() {
  return (
    <div className="content-stretch flex items-start justify-start relative size-full" data-name="SearchFrame">
      <Input />
    </div>
  );
}