import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 shadow-sm",
  secondary:
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 active:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
};

// iPhone でも押しやすいよう最小 44px の高さを確保する
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
