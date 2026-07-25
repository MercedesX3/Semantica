import React from "react";

type Variant = "primary" | "secondary" | "outline" | "primary-sm";
type Size = "lg" | "sm";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  as?: "button" | "a";
  href?: string;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-pink-500 text-stone-50 outline outline-2 outline-offset-[-2px] outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  secondary:
    "bg-stone-50 text-black outline outline-2 outline-offset-[-2px] outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  outline:
    "bg-white text-black outline outline-2 outline-offset-[-2px] outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  "primary-sm":
    "h-8 px-6 py-2 rounded-md bg-pink-500 text-stone-50 outline outline-2 outline-offset-[-2px] outline-black flex items-center justify-center gap-2 overflow-hidden font-['Sometype_Mono'] hover:bg-pink-500 active:bg-pink-600 disabled:bg-neutral-400",
};

const SIZE: Record<Size, string> = {
  lg: "h-11 px-7 py-2.5 rounded-lg text-lg font-semibold font-sans",
  sm: "h-8 px-6 py-2 rounded-md text-sm font-semibold font-mono",
};

export default function Btn({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: BtnProps) {
  const isSmallPrimary = variant === "primary-sm";

  return (
    <button
      className={`inline-flex items-center justify-center transition-all cursor-pointer ${VARIANT[variant]} ${isSmallPrimary ? "" : SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
