function Scroll() {
  return (
    <div
      className="absolute bg-[#c9d5e3] h-[494px] left-0 rounded-[40px] top-0 w-[5px]"
      data-name="Scroll"
    />
  );
}

function Scroll1() {
  return (
    <div
      className="absolute bg-[#095192] h-[71px] left-0 rounded-[40px] top-0 w-[5px]"
      data-name="Scroll"
    />
  );
}

export default function Scroll2() {
  return (
    <div className="relative size-full" data-name="Scroll">
      <Scroll />
      <Scroll1 />
    </div>
  );
}