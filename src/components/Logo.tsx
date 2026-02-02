import Image from "next/image";

type LogoProps = {
  className?: string;
  labelClassName?: string;
  showText?: boolean;
};

export function Logo({
  className,
  labelClassName,
  showText = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/brand/quackninja-mark.png"
        alt="QuackNinja"
        width={100}
        height={100}
        className="h-11 w-11 object-contain md:h-12 md:w-12"
      />
      {showText ? (
        <Image
          src="/brand/quackninja-wordmark-white.png"
          alt="QuackNinja"
          width={120}
          height={50}
          className={`h-8 object-contain md:h-10 ${labelClassName ?? ""}`}
        />
      ) : null}
    </div>
  );
}
