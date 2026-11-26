"use client";

import { ArrowRight } from "lucide-react";

export default function ServiceRequestLauncher({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  const openRequestForm = () => {
    window.dispatchEvent(new Event("alira:open-service-request"));
  };

  return (
    <button
      type="button"
      className={className}
      onClick={openRequestForm}
      aria-haspopup="dialog"
    >
      {label} <ArrowRight size={18} aria-hidden="true" />
    </button>
  );
}
