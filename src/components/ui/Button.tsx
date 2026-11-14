import type { ButtonHTMLAttributes, ReactNode } from "react";
import { sound } from "@/utils/sound";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "shimmer";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children?: ReactNode;
  active?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-white bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:bg-neutral-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] active:bg-neutral-300",
  secondary:
    "border border-white/15 bg-[#121212] text-white hover:border-white/35 hover:bg-[#1a1a1a] active:bg-[#0f0f0f]",
  ghost:
    "border border-transparent text-neutral-400 hover:text-white hover:bg-white/5 active:bg-white/10",
  danger:
    "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30",
  shimmer:
    "relative overflow-hidden border border-white/30 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white animate-shimmer hover:border-white",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  active,
  className = "",
  onClick,
  onMouseEnter,
  disabled,
  ...props
}: ButtonProps) {
  const sizing =
    size === "sm"
      ? "px-2.5 py-1 text-[11px]"
      : size === "lg"
        ? "px-5 py-2.5 text-[13px] tracking-wide"
        : "px-3.5 py-1.5 text-[12px]";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === "primary") {
      sound.snap();
    } else {
      sound.click();
    }
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      sound.click(1600, 0.008);
    }
    onMouseEnter?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[2px] font-mono font-medium tracking-tight transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 ${sizing} ${VARIANTS[variant]} ${
        active ? "!border-white !bg-white !text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : ""
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

/** An icon-only button with an accessible label and tactile feedback. */
export function IconButton({
  label,
  icon,
  className = "",
  onClick,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    sound.click(1400, 0.01);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={handleClick}
      disabled={disabled}
      {...props}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/10 bg-[#0d0d0d] text-neutral-400 transition-all hover:border-white/30 hover:bg-[#161616] hover:text-white active:scale-95 disabled:opacity-30 ${className}`}
    >
      {icon}
    </button>
  );
}
