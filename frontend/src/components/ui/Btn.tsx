import React from "react";

type Variant = "primary" | "secondary" | "outline" | "primary-sm";
type Size = "lg" | "sm";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong edge pop press",
  secondary: "bg-stone-50 text-black edge pop press",
  outline: "bg-white text-black edge pop press",
  "primary-sm":
    "h-8 px-5 rounded-md bg-brand text-white edge press pop-sm gap-2 font-mono text-sm font-semibold disabled:bg-neutral-400",
};

const SIZE: Record<Size, string> = {
  lg: "h-11 px-7 rounded-lg text-base sm:text-lg font-semibold font-sans",
  sm: "h-8 px-5 rounded-md text-sm font-semibold font-mono",
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
      className={`inline-flex items-center justify-center cursor-pointer ${VARIANT[variant]} ${
        isSmallPrimary ? "" : SIZE[size]
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Anchor styled identically to Btn — for navigation rather than actions. */
export function BtnLink({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const isSmallPrimary = variant === "primary-sm";

  return (
    <a
      className={`inline-flex items-center justify-center cursor-pointer ${VARIANT[variant]} ${
        isSmallPrimary ? "" : SIZE[size]
      } ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
