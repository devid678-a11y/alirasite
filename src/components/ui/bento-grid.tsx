import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type BentoGridProps = ComponentPropsWithoutRef<"div">;

export function BentoGrid({ className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12",
        className,
      )}
      {...props}
    />
  );
}
