import React from "react";
import Link from "next/link";
import { Button as ShadcnButton, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  href?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  href,
  children,
  className,
  onClick,
  ...props
}) => {
  const variantMap = { primary: "default", secondary: "secondary", outline: "outline" } as const;
  const rootClassName = cn(
    buttonVariants({ variant: variantMap[variant], size: "lg" }),
    "h-11 rounded-lg px-4",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={rootClassName}
        style={props.style}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  }

  return (
    <ShadcnButton className={rootClassName} onClick={onClick} {...props}>
      {children}
    </ShadcnButton>
  );
};
