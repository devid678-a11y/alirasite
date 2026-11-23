"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Menu, Phone, X } from "lucide-react";
import { Button } from "./Button";
import styles from "./Header.module.css";

interface HeaderData {
  companyName?: string;
  phone?: string;
  email?: string;
}

export const Header: React.FC<{ data?: HeaderData }> = ({ data }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const companyName = data?.companyName || "ООО «Алира»";
  const phone = data?.phone || "+7 (495) 229-39-48";
  const email = data?.email || "info@aliracert.ru";
  const phoneHref = phone.replace(/[^+\d]/g, "");

  const trackPhoneClick = () => {
    if (typeof window !== "undefined" && (window as any).ym) {
      (window as any).ym(98916872, "reachGoal", "click_phone");
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={closeMenu} aria-label={`${companyName} — главная`}>
          <Image src="/logo-new.png" alt="" width={42} height={42} priority />
          <span>{companyName}</span>
        </Link>

        <nav
          id="primary-navigation"
          className={`${styles.navigation} ${isMenuOpen ? styles.navigationOpen : ""}`}
          aria-label="Основная навигация"
        >
          <Link href="/services/verification" onClick={closeMenu}>Поверка</Link>
          <Link href="/services/gosreestr" onClick={closeMenu}>Испытания</Link>
          <Link href="/registry" onClick={closeMenu}>Госреестр</Link>
          <Link href="/catalog" className={styles.supplyLink} onClick={closeMenu}>Поставка оборудования</Link>
          <Link href="/services" onClick={closeMenu}>Все услуги</Link>
          <Link href="/about" onClick={closeMenu}>О компании</Link>

          <div className={styles.mobileActions}>
            <a href={`tel:${phoneHref}`} onClick={trackPhoneClick} className={styles.mobilePhone}>
              <Phone size={17} aria-hidden="true" /> {phone}
            </a>
            <a href={`mailto:${email}`} className={styles.mobilePhone}>
              <Mail size={17} aria-hidden="true" /> {email}
            </a>
            <Button variant="primary" href="/services/verification" onClick={closeMenu}>
              Рассчитать поверку
            </Button>
          </div>
        </nav>

        <div className={styles.actions}>
          <a href={`mailto:${email}`} className={styles.email} aria-label={`Email ${email}`}>
            <Mail size={17} aria-hidden="true" />
            <span>{email}</span>
          </a>
          <a href={`tel:${phoneHref}`} className={styles.phone} onClick={trackPhoneClick} aria-label={`Позвонить: ${phone}`}>
            <Phone size={17} aria-hidden="true" />
            <span>{phone}</span>
          </a>
          <Button
            variant="primary"
            href="/services/verification"
            className={styles.headerCta}
          >
            Рассчитать поверку
          </Button>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
          >
            {isMenuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
};
