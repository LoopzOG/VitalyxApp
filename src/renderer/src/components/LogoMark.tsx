import vitalyxLogo from "@/assets/vitalyx-logo.png";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "h-12 w-12" }: LogoMarkProps) {
  return (
    <img
      src={vitalyxLogo}
      alt="Vitalyx logo"
      className={`${className} rounded-[24px] object-contain shadow-[0_18px_42px_rgba(0,0,0,0.34)]`}
      draggable={false}
    />
  );
}
