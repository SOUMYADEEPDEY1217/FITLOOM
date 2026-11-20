import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex max-w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-center text-sm font-medium leading-snug whitespace-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#6633EE] text-white shadow-sm hover:bg-[#5522DD] active:bg-[#4919C9]",
        primary:
          "bg-[#6633EE] text-white shadow-sm hover:bg-[#5522DD] active:bg-[#4919C9]",
        secondary:
          "border border-violet-200 bg-violet-100 text-[#4C1D95] hover:bg-violet-200/80 active:bg-violet-200",
        outline:
          "border border-slate-300 bg-white text-slate-900 shadow-2xs hover:border-[#6633EE]/60 hover:bg-violet-50/70 active:bg-violet-100/60",
        ghost:
          "text-slate-700 hover:bg-violet-50 hover:text-[#6633EE] active:bg-violet-100/70",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600",
        link: "min-h-0 h-auto px-0 py-0.5 text-[#6633EE] underline-offset-4 hover:underline active:text-[#4C1D95]",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-9 rounded-md px-3 py-1.5 text-xs",
        lg: "min-h-11 rounded-xl px-6 py-2.5 text-base",
        icon: "h-10 w-10 shrink-0 p-0 whitespace-nowrap",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading && (
          <Loader2
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);
Button.displayName = "Button";
export { buttonVariants };
