import imgImage4 from "figma:asset/875d2d29a86564562d2213facf69cc50d85ee6da.png";

function Group1410083562() {
  return (
    <div className="absolute left-[776px] size-2.5 top-[25px]">
      <div className="absolute inset-[-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <g id="Group 1410083562">
            <path d="M11 1L1 11" id="Vector 36" stroke="var(--stroke-0, black)" strokeLinecap="round" />
            <path d="M1 1L11 11" id="Vector 37" stroke="var(--stroke-0, black)" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function InputGroup() {
  return (
    <div className="absolute bg-white box-border content-stretch flex gap-2 h-9 items-center justify-start left-[111px] p-[12px] rounded-[4px] top-1/2 translate-y-[-50%] w-[120px]" data-name="Input Group">
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-neutral-950">
        <p className="leading-[normal]">Today</p>
      </div>
      <div className="h-[4.5px] relative shrink-0 w-[8.675px]">
        <div className="absolute inset-[-11.11%_-5.76%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 6">
            <path d="M1 1L5.5 5.5L9.67543 1" id="Vector 35" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function InputGroup1() {
  return (
    <div className="absolute bg-white box-border content-stretch flex gap-2 h-9 items-center justify-start left-[580px] p-[12px] rounded-[4px] top-1/2 translate-y-[-50%] w-[180px]" data-name="Input Group">
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#9fa9b7] text-[14px]">
        <p className="leading-[normal]">Search Products</p>
      </div>
    </div>
  );
}

export default function Frame1410084113() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-white h-[45px] left-[198px] top-[5px] w-[533px]" />
      <div className="absolute bg-[41.67%_45.24%] bg-no-repeat bg-size-[275.71%_380%] h-[15px] left-72 top-[22px] w-[280px]" data-name="image 4" style={{ backgroundImage: `url('${imgImage4}')` }} />
      <Group1410083562 />
      <InputGroup />
      <InputGroup1 />
      <div className="absolute font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] left-6 not-italic text-[21px] text-neutral-950 text-nowrap top-[17px]">
        <p className="leading-[normal] whitespace-pre">History</p>
      </div>
    </div>
  );
}