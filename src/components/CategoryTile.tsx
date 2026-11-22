import React from "react";
import Link from "next/link";
import { Activity, Radio, FlaskConical } from "lucide-react";
import styles from "./CategoryTile.module.css";

interface CategoryTileProps {
  title: string;
  subtitle: string;
  href: string;
  iconType: "optical" | "rf" | "analytical";
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ title, subtitle, href, iconType }) => {
  return (
    <Link href={href} className={styles.tile}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      
      {iconType === "optical" ? (
        <Activity size={200} className={styles.icon} strokeWidth={1} />
      ) : iconType === "rf" ? (
        <Radio size={200} className={styles.icon} strokeWidth={1} />
      ) : (
        <FlaskConical size={200} className={styles.icon} strokeWidth={1} />
      )}
    </Link>
  );
};
