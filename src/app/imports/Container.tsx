function Header() {
  return (
    <div
      className="bg-blue-50 box-border content-stretch flex flex-col items-start justify-start min-h-6 order-2 px-2 py-[5px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0"
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
        style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.282312px)" }}
      >
        <p className="block leading-[16px]">Door</p>
      </div>
      <div
        className="absolute flex flex-col font-['SF_Pro_Text:Bold',_sans-serif] h-4 justify-center leading-[0] not-italic text-[#176cff] text-[12px] text-center translate-x-[-50%] translate-y-[-50%] w-[6.468px]"
        style={{ top: "calc(50% + 8px)", left: "calc(50% - 1.8357px)" }}
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

function Container() {
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

function Background() {
  return (
    <div
      className="bg-blue-50 order-1 relative rounded-bl-[4px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-full"
      data-name="Background"
    >
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-[8px] relative w-full">
          <Container />
          <ButtonDoor4 />
        </div>
      </div>
    </div>
  );
}

export default function Container1() {
  return (
    <div
      className="box-border content-stretch flex flex-col-reverse items-start justify-start p-0 relative size-full"
      data-name="Container"
    >
      <Header />
      <Background />
    </div>
  );
}