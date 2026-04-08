import vitalyxLogo from "@/assets/vitalyx-logo.png";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "h-12 w-12" }: LogoMarkProps) {
  return (
    <img
      src={vitalyxLogo}
      alt="Vitalyx logo"
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}
