import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import { getPagesData } from "@/app/actions/cms";

export async function Footer() {
  const pagesData = await getPagesData();
  const global = pagesData.global || {
    companyName: "MEASURETECH",
    companyDesc1: "Поставка и поверка оптического и ВЧ-измерительного оборудования.",
    companyDesc2: "Аккредитованная лаборатория в Санкт-Петербурге.",
    phone: "+7 (812) 123-45-67",
    email: "info@measuretech.ru",
    address: "г. Санкт-Петербург, ул. Инженерная, д. 1",
    copyright: "© 2026 MeasureTech. Все права защищены."
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3>{global.companyName}</h3>
        </div>
        <div className={styles.column}>
          <Link href="/catalog" style={{ textDecoration: "none", color: "inherit" }}><h3 style={{ margin: 0, marginBottom: 20 }}>Каталог</h3></Link>
          <Link href="/catalog/lls-optika">Оптическое оборудование</Link>
          <Link href="/catalog/lls-kontrolno-izmeritelnoe-oborudovanie">Радиочастотные приборы</Link>
          <Link href="/catalog/analiticheskoe_oborudovanie">Лабораторное оборудование</Link>
          <Link href="/brands">Популярные бренды</Link>
        </div>
        <div className={styles.column}>
          <h3>Услуги</h3>
          <Link href="/services/verification">Поверка приборов</Link>
          <Link href="/services/gosreestr">Внесение в Госреестр</Link>
          <Link href="/registry">Госреестр СИ (ФГИС «АРШИН»)</Link>
        </div>
        <div className={styles.column}>
          <h3>Контакты</h3>
          <p>{global.phone}</p>
          <p>{global.email}</p>
          <p style={{ fontSize: 13, lineHeight: 1.4 }}>{global.address}</p>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>{global.copyright}</span>
        <div className={styles.bottomLinks}>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/agreement">Согласие на обработку персональных данных</Link>
        </div>
      </div>
    </footer>
  );
}
