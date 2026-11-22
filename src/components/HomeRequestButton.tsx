"use client";
import type { ReactNode } from "react";
import { useModal } from "@/context/ModalContext";
export function HomeRequestButton({ children, className, inquiry = false }: { children: ReactNode; className?: string; inquiry?: boolean }) {
  const { openModal } = useModal();
  return <button type="button" className={className} onClick={() => openModal(inquiry ? "inquiry" : "kp")}>{children}</button>;
}
