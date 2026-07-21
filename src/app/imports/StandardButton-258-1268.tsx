export default function StandardButton() {
  return (
    <div className="bg-white relative rounded-[4px] size-full" data-name="_Standard Button">
      <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center justify-end relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
          <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[12px] text-nowrap">
            <p className="leading-[20px] whitespace-pre">Change allocation</p>
          </div>
        </div>
      </div>
    </div>
  );
}