"use client";
import React from "react";
import { Button } from "@/components/Button";
import { useModal } from "@/context/ModalContext";

export const ServiceInquiryButton = ({ title }: { title: string }) => {
  const { openModal } = useModal();
  return (
    <Button 
      variant="primary" 
      style={{ width: '100%', marginTop: 'auto' }}
      onClick={() => openModal("inquiry", title)}
    >
      Оформить заявку
    </Button>
  );
};
