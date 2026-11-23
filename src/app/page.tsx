import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  FlaskConical,
  Package,
  Wrench,
} from "lucide-react";
import HomeInstrumentListForm from "@/components/HomeInstrumentListForm";
import s from "./home.module.css";

const steps = [
  ["01", "Передаёте прибор или список", "Для расчёта поверки или калибровки нескольких приборов можно начать с перечня."],
  ["02", "Мы проводим работы", "Выполняем поверку или испытания по выбранному направлению."],
  ["03", "Получаете результат", "Передаём прибор и оформленные документы по выполненным работам."],
];

export default function Home() {
  return (
    <main className={s.page}>
      <div className={s.container}>
        <section className={s.hero} aria-labelledby="home-title">
          <div className={s.heroContent}>
            <p className={s.eyebrow}><span aria-hidden="true" /> АЛИРА · МЕТРОЛОГИЧЕСКИЕ УСЛУГИ ДЛЯ ПРЕДПРИЯТИЙ</p>
            <h1 id="home-title">Поверка и испытания средств измерений</h1>
            <p className={s.lead}>
              Поверяем оптические и радиочастотные СИ, проводим испытания для утверждения типа и оформляем результат. Берём организацию работ на себя.
            </p>
            <div className={s.actions}>
              <Link href="/services/verification#service-request" className={s.primaryButton}>
                Рассчитать поверку <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/services/gosreestr#service-request" className={s.textLink}>
                Заказать испытания <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className={s.scope} aria-label="Основные направления">
            <span>ОПТИЧЕСКИЕ СИ</span>
            <span>РАДИОЧАСТОТНЫЕ СИ</span>
            <span>УТВЕРЖДЕНИЕ ТИПА</span>
          </div>
        </section>

        <section id="services" className={s.services} aria-labelledby="services-title">
          <div className={s.sectionIntro}>
            <p className={s.eyebrow}>ОСНОВНЫЕ НАПРАВЛЕНИЯ</p>
            <h2 id="services-title">Какие работы нужны?</h2>
          </div>
          <div className={s.serviceGrid}>
            <article className={`${s.service} ${s.verification}`}>
              <div className={s.serviceTop}>
                <span className={s.moduleLabel}>01 / ПОВЕРКА</span>
                <BadgeCheck size={25} aria-hidden="true" />
              </div>
              <h3>Нужна поверка прибора?</h3>
              <p>Первичная и периодическая поверка оптических и радиочастотных средств измерений. Принимаем прибор, проводим работы и оформляем результат.</p>
              <div className={s.serviceBottom}>
                <Link href="/services/verification#service-request">Рассчитать поверку <ArrowUpRight size={19} aria-hidden="true" /></Link>
                <span>ОПТИКА · ВЧ</span>
              </div>
            </article>

            <article className={`${s.service} ${s.testing}`}>
              <div className={s.serviceTop}>
                <span className={s.moduleLabel}>02 / ИСПЫТАНИЯ</span>
                <FlaskConical size={25} aria-hidden="true" />
              </div>
              <h3>Испытания для утверждения типа</h3>
              <p>Принимаем средство измерений, проводим испытания и готовим документы для утверждения типа. Ведём процесс до оформленного результата.</p>
              <div className={s.serviceBottom}>
                <Link href="/services/gosreestr#service-request">Заказать испытания <ArrowUpRight size={19} aria-hidden="true" /></Link>
                <span>УТВЕРЖДЕНИЕ ТИПА</span>
              </div>
            </article>
          </div>
        </section>

        <section className={s.request} aria-labelledby="request-title">
          <div className={s.requestCopy}>
            <p className={s.moduleLabel}>ПОВЕРКА И КАЛИБРОВКА</p>
            <h2 id="request-title">Есть перечень приборов?</h2>
            <p>Пришлите список средств измерений на поверку или калибровку — рассчитаем стоимость и сроки.</p>
          </div>
          <HomeInstrumentListForm />
        </section>

        <section className={s.workflow} aria-labelledby="workflow-title">
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>ОТ ПЕРЕДАЧИ ПРИБОРА ДО РЕЗУЛЬТАТА</p>
              <h2 id="workflow-title">Берём процесс на себя</h2>
            </div>
            <p className={s.workflowLead}>Один понятный маршрут: передача, работы, оформленный результат.</p>
          </div>
          <ol className={s.steps}>
            {steps.map(([number, title, text]) => (
              <li key={number}>
                <span className={s.stepNumber}>{number}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className={s.other} aria-label="Дополнительные направления">
          <p className={s.moduleLabel}>ДОПОЛНИТЕЛЬНО</p>
          <Link href="/services/repair"><Wrench size={19} aria-hidden="true" /><span>Ремонт измерительной техники</span><ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link href="/catalog"><Package size={19} aria-hidden="true" /><span>Поставка оборудования</span><ArrowUpRight size={17} aria-hidden="true" /></Link>
        </section>
      </div>
    </main>
  );
}
