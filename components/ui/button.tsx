import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },

      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
  asChild?: boolean;
  loading?: boolean;
}

export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-flex h-6 w-6 items-center justify-center", className)}
      aria-hidden="true"
    >
      <span className="absolute inset-0 animate-spin">
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#25388C] ring-2 ring-white shadow-[0_0_7px_rgba(255,255,255,0.9)]" />
        <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#E7C9A5] ring-2 ring-[#25388C] shadow-[0_0_7px_rgba(231,201,165,0.9)]" />
      </span>
    </span>
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const classNames = cn(
      buttonVariants({ variant, size, className }),
      "relative"
    );

    if (asChild) {
      const child = (
        <Comp
          className={cn(classNames, loading && "pointer-events-none opacity-0")}
          ref={ref}
          aria-busy={loading || undefined}
          aria-disabled={loading || disabled || undefined}
          tabIndex={loading || disabled ? -1 : props.tabIndex}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            if (loading || disabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            onClick?.(event);
          }}
          {...props}
        >
          {children}
        </Comp>
      );

      if (!loading) return child;

      return (
        <span className="relative inline-flex items-center justify-center" aria-busy="true">
          {child}
          <span className="absolute inset-0 z-10 flex items-center justify-center">
            <ButtonSpinner />
          </span>
        </span>
      );
    }

    return (
      <Comp
        className={classNames}
        ref={ref}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        onClick={onClick}
        {...props}
      >
        <span className={cn(loading && "opacity-0")}>{children}</span>
        {loading && (
          <span className="absolute inset-0 z-10 flex items-center justify-center">
            <ButtonSpinner />
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };