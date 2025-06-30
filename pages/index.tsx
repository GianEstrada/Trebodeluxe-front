import type { NextPage } from "next";
import Image from "next/image";

const HomeScreen: NextPage = () => {
  return (
    <div className="w-full relative [background:linear-gradient(180deg,_#323232,_#000)] h-[1080px] overflow-y-auto flex flex-col items-center justify-start text-left text-Static-Body-Large-Size text-M3-white font-salsa">
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font">
        <div className="self-stretch shadow-[0px_-0.6px_0px_rgba(0,_0,_0,_0.05)_inset,_0px_0.6px_0px_rgba(0,_0,_0,_0.15)] bg-Schemes-Surface h-[68px] flex flex-row items-center justify-start !pt-4 !pb-4 !pl-3.5 !pr-3.5 box-border gap-[13px]">
          <div className="flex flex-row items-center justify-start gap-3">
            <Image
              className="w-6 relative h-6 overflow-hidden shrink-0"
              width={24}
              height={24}
              sizes="100vw"
              alt=""
              src="/back.svg"
            />
            <Image
              className="w-6 relative h-6 overflow-hidden shrink-0"
              width={24}
              height={24}
              sizes="100vw"
              alt=""
              src="/forward.svg"
            />
            <Image
              className="w-6 relative h-6 overflow-hidden shrink-0"
              width={24}
              height={24}
              sizes="100vw"
              alt=""
              src="/refresh.svg"
            />
          </div>
          <div className="flex-1 rounded-[46.1px] bg-Schemes-Surface-Container overflow-hidden flex flex-row items-center justify-between !pt-1.5 !pb-1.5 !pl-4 !pr-4 gap-0">
            <div className="flex-1 flex flex-row items-center justify-start gap-2">
              <Image
                className="w-[15.4px] relative h-[15.4px] overflow-hidden shrink-0"
                width={15.4}
                height={15.4}
                sizes="100vw"
                alt=""
                src="/lock.svg"
              />
              <div className="flex-1 relative tracking-Static-Body-Large-Tracking leading-Static-Body-Large-Line-Height">
                www.url.com
              </div>
            </div>
            <Image
              className="w-5 h-[19.8px] overflow-hidden shrink-0"
              width={20}
              height={19.8}
              sizes="100vw"
              alt=""
              src="/star.svg"
            />
          </div>
          <div className="w-7 rounded-[109.1px] bg-Schemes-Outline overflow-hidden shrink-0 flex flex-col items-center justify-center !pt-px !pb-px !pl-[7px] !pr-[7px] box-border text-center text-M3-white">
            <div className="self-stretch relative tracking-[0.5px] leading-6">
              M
            </div>
          </div>
          <Image
            className="w-6 h-6 overflow-hidden shrink-0"
            width={24}
            height={24}
            sizes="100vw"
            alt=""
            src="/more.svg"
          />
        </div>
        <div className="self-stretch flex flex-col items-start justify-start text-center text-yellow font-salsa">
          <div className="self-stretch [background:linear-gradient(90deg,_#289c28,_#0e360e)] h-10 flex flex-row items-start justify-start !p-[5px] box-border gap-[409px]">
            <div className="w-[278px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
              TREBOLUXE
            </div>
            <div className="flex-1 flex flex-row items-center justify-end !pt-0 !pb-0 !pl-4 !pr-4 gap-2 text-olive">
              <Image
                className="w-[12.2px] relative max-h-full object-contain"
                width={12.2}
                height={10.9}
                sizes="100vw"
                alt=""
                src="/petalo-1@2x.png"
              />
              <div className="relative tracking-[4px] leading-6 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
                Agrega 4 productos y paga 2
              </div>
            </div>
            <div className="flex-[-0.0187] [backdrop-filter:blur(40px)] rounded-[50px] flex flex-row items-center justify-end !pt-2 !pb-2 !pl-[402px] !pr-3 relative gap-2">
              <div className="w-full absolute !!m-[0 important] h-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded-[100px] overflow-hidden hidden z-[0]">
                <div className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] [backdrop-filter:blur(50px)] [background:linear-gradient(#0d0d0d,_#0d0d0d),_rgba(191,_191,_191,_0.44)]" />
              </div>
              <div className="w-2 relative shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25),_0px_-1px_1.3px_#fff_inset] rounded-[50px] bg-gold h-2 z-[1]" />
              <div className="w-2 relative shadow-[0px_2px_4px_#000_inset] rounded-[50px] bg-springgreen h-2 opacity-[0.3] z-[2]" />
            </div>
          </div>
          <div className="self-stretch flex flex-row items-center justify-center !pt-[9px] !pb-[9px] !pl-8 !pr-8 text-M3-white">
            <div className="flex-1 flex flex-row items-center justify-start gap-[33px]">
              <div className="w-[177.8px] relative h-[34px]">
                <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
                  CATEGORIAS
                </div>
              </div>
              <div className="w-[161.8px] relative h-[34px]">
                <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
                  POPULARES
                </div>
              </div>
              <div className="w-[161.8px] relative h-[34px]">
                <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
                  NUEVOS
                </div>
              </div>
              <div className="w-[161.8px] relative h-[34px]">
                <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
                  BASICOS
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-row items-center justify-center">
              <div className="w-[50px] relative h-[50px]">
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full object-cover"
                  width={50}
                  height={50}
                  sizes="100vw"
                  alt=""
                  src="/sin-ttulo1-2@2x.png"
                />
              </div>
            </div>
            <div className="self-stretch flex-1 flex flex-row items-center justify-end gap-[31px]">
              <div className="w-5 relative h-5">
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full"
                  width={20}
                  height={20}
                  sizes="100vw"
                  alt=""
                  src="/icon.svg"
                />
              </div>
              <div className="w-4 relative h-[18px]">
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full"
                  width={16}
                  height={18}
                  sizes="100vw"
                  alt=""
                  src="/icon1.svg"
                />
              </div>
              <div className="w-[15px] relative h-[15px]">
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full"
                  width={15}
                  height={15}
                  sizes="100vw"
                  alt=""
                  src="/icon2.svg"
                />
              </div>
              <div className="w-[19.2px] relative h-[17.5px]">
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full"
                  width={19.2}
                  height={17.5}
                  sizes="100vw"
                  alt=""
                  src="/icon3.svg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch flex flex-col items-center justify-start">
        <div className="self-stretch flex flex-row items-center justify-start">
          <Image
            className="flex-1 relative max-w-full overflow-hidden max-h-full object-cover"
            width={960}
            height={904}
            sizes="100vw"
            alt=""
            src="/look-polo-2-1@2x.png"
          />
          <Image
            className="flex-1 relative max-w-full overflow-hidden max-h-full object-cover"
            width={960}
            height={904}
            sizes="100vw"
            alt=""
            src="/797e7904b64e13508ab322be3107e368-1@2x.png"
          />
        </div>
      </div>
      <div className="self-stretch flex flex-col items-start justify-start !p-4 text-[96px]">
        <div className="self-stretch rounded-[46px] h-[603px] flex flex-col items-start justify-start !p-4 box-border bg-cover bg-no-repeat bg-[top]">
          <div className="relative tracking-[5px] leading-[100px] [text-shadow:0px_14px_4px_rgba(0,_0,_0,_0.29)]">
            Promociones
          </div>
          <div className="w-[485px] relative tracking-[5px] leading-[100px] inline-block [text-shadow:0px_14px_4px_rgba(0,_0,_0,_0.29)]">
            Especiales
          </div>
        </div>
      </div>
      <div className="self-stretch bg-gray-200 flex flex-col items-center justify-start !pt-1.5 !pb-1.5 !pl-1 !pr-1 font-Body-Font-Family">
        <div className="self-stretch h-[533px] overflow-x-auto shrink-0 flex flex-row items-start justify-center !pt-[79px] !pb-[79px] !pl-[70px] !pr-[70px] box-border gap-[68px]">
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch flex flex-col items-start justify-start !pt-1.5 !pb-1.5 !pl-1 !pr-1 gap-[101px] text-center text-black">
        <div className="self-stretch flex flex-row items-center justify-start">
          <div className="flex-1 relative bg-gray-100 h-[90px]">
            <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
              Categoria 1
            </div>
          </div>
          <div className="flex-1 relative bg-gray-100 h-[90px]">
            <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
              Categoria 2
            </div>
          </div>
          <div className="flex-1 relative bg-gray-100 h-[90px]">
            <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
              Categoria 3
            </div>
          </div>
          <div className="flex-1 relative bg-gray-100 h-[90px]">
            <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
              Categoria 4
            </div>
          </div>
          <div className="flex-1 relative bg-gray-100 h-[90px]">
            <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
              Categoria 5
            </div>
          </div>
          <div className="flex-1 relative bg-gray-100 h-[90px]">
            <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center">
              Categoria 6
            </div>
          </div>
        </div>
        <div className="self-stretch overflow-x-auto flex flex-row items-center justify-center !pt-[79px] !pb-[79px] !pl-[70px] !pr-[70px] gap-[68px] text-left text-M3-white font-Body-Font-Family">
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 min-w-[240px]">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-52 flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%]">Text</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">$0</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%]">Body text.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch [background:linear-gradient(11.21deg,_#279a27_39.9%,_#000)] overflow-hidden shrink-0 flex flex-row items-start justify-start !pt-16 !pb-2 !pl-8 !pr-8 text-Text-Default-Tertiary font-Body-Font-Family">
        <div className="flex flex-row items-start justify-start gap-[23px]">
          <div className="w-60 flex flex-col items-start justify-start gap-Space-600 min-w-[240px]">
            <Image
              className="w-[23.3px] h-[35px]"
              width={23.3}
              height={35}
              sizes="100vw"
              alt=""
              src
            />
            <div className="flex flex-row items-center justify-start gap-Space-400">
              <Image
                className="w-6 relative h-6"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src
              />
              <Image
                className="w-6 relative h-6 overflow-hidden shrink-0"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src
              />
              <Image
                className="w-6 relative h-6 overflow-hidden shrink-0"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src
              />
              <Image
                className="w-6 relative h-6 overflow-hidden shrink-0"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src
              />
            </div>
          </div>
          <div className="w-[262px] flex flex-col items-start justify-start gap-Space-300">
            <div className="self-stretch flex flex-col items-start justify-start !pt-0 !pb-Space-400 !pl-0 !pr-0">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">
                  Use cases
                </div>
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                UI design
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                UX design
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Wireframing
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Diagramming
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Brainstorming
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Online whiteboard
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Team collaboration
              </div>
            </div>
          </div>
          <div className="w-[262px] h-[204px] flex flex-col items-start justify-start gap-Space-300">
            <div className="self-stretch flex flex-col items-start justify-start !pt-0 !pb-Space-400 !pl-0 !pr-0">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">
                  Explore
                </div>
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Design
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Prototyping
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Development features
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Design systems
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Collaboration features
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Design process
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                FigJam
              </div>
            </div>
          </div>
          <div className="w-[262px] flex flex-col items-start justify-start gap-Space-300">
            <div className="self-stretch flex flex-col items-start justify-start !pt-0 !pb-Space-400 !pl-0 !pr-0">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold">
                  Resources
                </div>
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Blog
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Best practices
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Colors
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Color wheel
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Support
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Developers
              </div>
            </div>
            <div className="w-[89px] relative h-[22px]">
              <div className="absolute top-[0%] left-[0%] leading-[140%]">
                Resource library
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
