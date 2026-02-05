import Image from "next/image";

type LogoProps = {
  className?: string;
  labelClassName?: string;
  showText?: boolean;
  showMark?: boolean;
};

export function Logo({
  className,
  labelClassName,
  showText = true,
  showMark = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {showMark ? (
        <Image
          src="/brand/quackninja-mark.svg"
          alt="QuackNinja"
          width={100}
          height={100}
          className="h-11 w-11 object-contain md:h-12 md:w-12"
        />
      ) : null}
      {showText ? (
        <span
          className={`text-xl font-semibold tracking-tight text-white md:text-2xl ${labelClassName ?? ""}`}
        >
          QuackNinja
        </span>
      ) : null}
    </div>
  );
}
