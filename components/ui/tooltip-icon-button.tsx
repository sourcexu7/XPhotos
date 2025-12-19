"use client";

import { forwardRef } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "~/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type TooltipIconButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    tooltip: string;
    side?: "top" | "bottom" | "left" | "right";
    asChild?: boolean;
  };

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(({ children, tooltip, side = "bottom", className, variant, size, ...rest }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant || "outline"}
          size={size}
          {...rest}
          className={cn(className)}
          ref={ref}
        >
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});

TooltipIconButton.displayName = "TooltipIconButton";

