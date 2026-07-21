function Header() {
  return (
    <div
      className="bg-gray-100 box-border content-stretch flex flex-col items-start justify-start min-h-6 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0"
      data-name="Header"
    >
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] text-left text-nowrap">
        <p className="block leading-[16px] whitespace-pre">Virtual</p>
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
        <p className="block mb-0">Fridge</p>
        <p className="block">1</p>
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
        <p className="block mb-0">Fridge</p>
        <p className="block">2</p>
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
        <p className="block mb-0">Fridge</p>
        <p className="block">3</p>
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
        <p className="block mb-0">Fridge</p>
        <p className="block">4</p>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div
      className="bg-gray-100 h-[122px] relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full"
      data-name="Background"
    >
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-1 h-[122px] items-center justify-start p-[8px] relative w-full">
          <ButtonDoor13 />
          <ButtonDoor14 />
          <ButtonDoor15 />
          <ButtonDoor16 />
        </div>
      </div>
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start p-0 relative size-full">
      <Header />
      <Background />
    </div>
  );
}