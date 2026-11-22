"use client";

import React, { createContext, useContext, useState } from "react";

type ModalType = "callback" | "inquiry" | "kp" | null;

interface ModalContextType {
  isOpen: boolean;
  modalType: ModalType;
  productName?: string;
  openModal: (type: ModalType, productName?: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [productName, setProductName] = useState<string | undefined>(undefined);

  const openModal = (type: ModalType, name?: string) => {
    setModalType(type);
    setProductName(name);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalType(null);
    setProductName(undefined);
  };

  return (
    <ModalContext.Provider value={{ isOpen, modalType, productName, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
