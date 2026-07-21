function Frame() {
  return (
    <div className="absolute h-[6px] left-[25px] top-[3px] w-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 6">
        <g id="Frame 1410084080">
          <circle cx="3" cy="3" fill="var(--fill-0, #DCB518)" id="Ellipse 1" r="3" />
          <circle cx="11" cy="3" fill="var(--fill-0, #00C951)" id="Ellipse 2" r="3" />
        </g>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] border border-[#4f8cf5] border-solid h-[50px] left-0 rounded-[4px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] top-0 w-[44px]" data-name="Container">
      <Frame />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[16px] left-[7px] top-[9px] w-[29.43px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-[15.01px] not-italic text-[#176cff] text-[12px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Door</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[16px] left-[16.93px] top-[25px] w-[6.461px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-[3.44px] not-italic text-[#176cff] text-[12px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">1</p>
    </div>
  );
}

function DoorButton() {
  return (
    <div className="absolute bg-white h-[50px] left-0 rounded-[4px] top-0 w-[44px]" data-name="DoorButton">
      <Container />
      <Paragraph />
      <Paragraph1 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute h-[6px] left-[68px] top-[3px] w-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 6">
        <g id="Frame 1410084081">
          <circle cx="3" cy="3" fill="var(--fill-0, white)" id="Ellipse 2" r="3" />
          <circle cx="11" cy="3" fill="var(--fill-0, #DCB518)" id="Ellipse 1" r="3" />
        </g>
      </svg>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute border border-[#ebebeb] border-solid h-[50px] left-0 rounded-[4px] top-0 w-[88px]" data-name="Container">
      <Frame1 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[16px] relative shrink-0 w-[27.414px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-[14px] not-italic text-[#020817] text-[12px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Door</p>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[16px] relative shrink-0 w-[27.414px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-[14.07px] not-italic text-[#020817] text-[12px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">2</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start justify-center left-[30.29px] top-[9px] w-[27.414px]" data-name="Container">
      <Paragraph2 />
      <Paragraph3 />
    </div>
  );
}

function DoorButton1() {
  return (
    <div className="absolute bg-white h-[50px] left-[48px] rounded-[4px] top-0 w-[88px]" data-name="DoorButton">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Container3() {
  return <div className="absolute border border-[#ebebeb] border-solid h-[50px] left-0 rounded-[4px] top-0 w-[88px]" data-name="Container" />;
}

function Paragraph4() {
  return (
    <div className="h-[16px] relative shrink-0 w-[27.414px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-[14px] not-italic text-[#020817] text-[12px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">Door</p>
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[16px] relative shrink-0 w-[27.414px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-[13.88px] not-italic text-[#020817] text-[12px] text-center text-nowrap top-[0.5px] translate-x-[-50%]">3</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start justify-center left-[30.29px] top-[9px] w-[27.414px]" data-name="Container">
      <Paragraph4 />
      <Paragraph5 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute h-[6px] left-[68px] top-[4px] w-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 6">
        <g id="Frame 1410084080">
          <circle cx="3" cy="3" fill="var(--fill-0, #DCB518)" id="Ellipse 1" r="3" />
          <circle cx="11" cy="3" fill="var(--fill-0, #00C951)" id="Ellipse 2" r="3" />
        </g>
      </svg>
    </div>
  );
}

function DoorButton2() {
  return (
    <div className="absolute bg-white h-[50px] left-[140px] rounded-[4px] top-0 w-[88px]" data-name="DoorButton">
      <Container3 />
      <Container4 />
      <Frame2 />
    </div>
  );
}

export default function DoorsContainer() {
  return (
    <div className="relative size-full" data-name="DoorsContainer">
      <DoorButton />
      <DoorButton1 />
      <DoorButton2 />
    </div>
  );
}