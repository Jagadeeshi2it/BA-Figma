import imgImage3 from "figma:asset/7c5787f47b79f80e0607a980f1fa4c553cf2331f.png";

export default function Frame1410083840() {
  return (
    <div className="bg-[#ffffff] relative size-full">
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[751px] left-0 top-0 w-[1083px]"
        data-name="image 3"
        style={{ backgroundImage: `url('${imgImage3}')` }}
      />
      <div
        className="absolute bg-[88.58%_100%] bg-no-repeat bg-size-[304.21%_247.85%] h-[303px] left-[430px] top-[448px] w-[356px]"
        data-name="image 4"
        style={{ backgroundImage: `url('${imgImage3}')` }}
      />
      <div className="absolute bg-[#ffffff] h-[86px] left-[759px] top-[477px] w-[201px]" />
      <div className="absolute bg-gray-50 h-[11px] left-[1060px] top-[744px] w-[26px]" />
    </div>
  );
}