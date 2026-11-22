import Link from "next/link";
import { ArrowRight, ArrowUpRight, Phone } from "lucide-react";
import styles from "./ServiceLanding.module.css";

type LandingCard = {
  title: string;
  text: string;
};

type LandingStep = LandingCard & {
  number: string;
};

export default function ServiceLanding({
  eyebrow,
  title,
  description,
  primaryActionLabel,
  heroFootnote,
  asideTitle,
  asideDescription,
  sendItems,
  asideFootnote,
  asideEmailText,
  sectionEyebrow,
  sectionTitle,
  sectionDescription,
  cards,
  steps,
  note,
  processTitle,
  ctaEyebrow,
  ctaTitle,
  ctaDescription,
  ctaActionLabel,
  relatedHref,
  relatedLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  heroFootnote?: string;
  asideTitle: string;
  asideDescription: string;
  sendItems: string[];
  asideFootnote?: string;
  asideEmailText?: string;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionDescription: string;
  cards: LandingCard[];
  steps: LandingStep[];
  note: string;
  processTitle?: string;
  ctaEyebrow?: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaActionLabel?: string;
  relatedHref: string;
  relatedLabel: string;
}) {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">/</span>
        <Link href="/services">Услуги</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <section className={styles.hero} aria-labelledby="service-title">
        <div className={styles.heroMain}>
          <p className={styles.eyebrow}><span aria-hidden="true" />{eyebrow}</p>
          <h1 id="service-title">{title}</h1>
          <p className={styles.lead}>{description}</p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#service-request">
              {primaryActionLabel} <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className={styles.phoneAction} href="tel:+74952293948">
              <Phone size={17} aria-hidden="true" /> +7 (495) 229-39-48
            </a>
          </div>
          <p className={styles.heroFootnote}>{heroFootnote || "ООО «АЛИРА» · Метрологические услуги для предприятий"}</p>
        </div>

        <aside className={styles.heroAside} aria-labelledby="send-title">
          <p className={styles.asideEyebrow}>С ЧЕГО НАЧАТЬ</p>
          <h2 id="send-title">{asideTitle}</h2>
          <p className={styles.asideDescription}>{asideDescription}</p>
          <ul className={styles.sendList}>
            {sendItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
          {asideFootnote && (
            <p className={styles.asideFootnote}>{asideFootnote}</p>
          )}
          <a className={styles.emailLink} href="mailto:info@aliracert.ru?subject=Запрос%20по%20услуге%20ООО%20Алира">
            {asideEmailText || "Отправить заявку на info@aliracert.ru"} <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </aside>
      </section>

      <section className={styles.details} aria-labelledby="details-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}><span aria-hidden="true" />{sectionEyebrow}</p>
          <h2 id="details-title">{sectionTitle}</h2>
          <p>{sectionDescription}</p>
        </div>
        <div className={styles.cardGrid}>
          {cards.map((card, index) => (
            <article className={styles.infoCard} key={card.title}>
              <span className={styles.cardNumber}>0{index + 1}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
        <p className={styles.note}>{note}</p>
      </section>

      <section className={styles.process} aria-labelledby="process-title">
        <div className={styles.processHeading}>
          <div>
            <p className={styles.eyebrow}><span aria-hidden="true" />ПОРЯДОК РАБОТЫ</p>
            <h2 id="process-title">{processTitle || "Понятные шаги без лишней анкеты"}</h2>
          </div>
          <Link href={relatedHref} className={styles.relatedLink}>
            {relatedLabel} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li className={styles.step} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div>
          <p className={styles.asideEyebrow}>{ctaEyebrow || "НУЖНА ПОМОЩЬ С ПРОЦЕДУРОЙ?"}</p>
          <h2 id="cta-title">{ctaTitle}</h2>
          <p>{ctaDescription}</p>
        </div>
        <a className={styles.ctaAction} href="#service-request">
          {ctaActionLabel || "Обсудить задачу"} <ArrowRight size={18} aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
