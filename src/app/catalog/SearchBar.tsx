"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import styles from "./page.module.css";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Sync state if URL changes (e.g. user goes back)
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/catalog?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/catalog");
    }
  };

  const handleClear = () => {
    setQuery("");
    router.push("/catalog");
  };

  return (
    <div className={styles.searchWrapper}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию, бренду или описанию прибора..."
          className={styles.searchInput}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearBtn}
            title="Очистить"
          >
            <X size={18} />
          </button>
        )}
        <button type="submit" className={styles.searchBtn} title="Найти">
          <Search size={20} />
        </button>
      </form>
    </div>
  );
}
