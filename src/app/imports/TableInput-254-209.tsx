function Text() {
  return (
    <div className="basis-0 content-stretch flex grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="text">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#9fa9b7] text-[14px] w-[129px]">
        <p className="leading-[21px]">Search products</p>
      </div>
    </div>
  );
}

export default function TableInput() {
  return (
    <div className="bg-white relative rounded-[4px] size-full" data-name="_ table input">
      <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-[-1px] pointer-events-none rounded-[5px]" />
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-[7px] items-center justify-center pl-[10.5px] pr-[7px] py-[10.5px] relative size-full">
          <Text />
        </div>
      </div>
    </div>
  );
}