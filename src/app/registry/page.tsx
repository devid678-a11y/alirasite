"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Download, 
  Wrench, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Info,
  X
} from "lucide-react";
import { searchGrsi, GrsiSearchParams } from "@/app/actions/grsi";
import { useModal } from "@/context/ModalContext";
import styles from "./grsi.module.css";

function RegistrySearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useModal();

  // Search input states
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [fName, setFName] = useState(searchParams.get("f_name") || "");
  const [fGosnum, setFGosnum] = useState(searchParams.get("f_gosnum") || "");
  const [fVendor, setFVendor] = useState(searchParams.get("f_vendor") || "");
  const [fCategName, setFCategName] = useState(searchParams.get("f_categ_name") || "");
  
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(searchParams.get("f_name") || searchParams.get("f_gosnum") || searchParams.get("f_vendor") || searchParams.get("f_categ_name"))
  );

  // Selected years state for multi-select
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // Results state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(true);

  // Trigger search based on URL params on load or change
  useEffect(() => {
    // Parse selected years from URL
    const urlYears = searchParams.get("years");
    const activeYears = urlYears ? urlYears.split(",") : [];
    setSelectedYears(activeYears);

    const hasQuery = searchParams.get("q") || 
                     searchParams.get("f_name") || 
                     searchParams.get("f_gosnum") || 
                     searchParams.get("f_vendor") || 
                     searchParams.get("f_categ_name");
    
    if (hasQuery) {
      const searchPage = Number(searchParams.get("page")) || 1;
      setPage(searchPage);
      
      const searchParamsObj: GrsiSearchParams = {
        page: searchPage
      };

      if (searchParams.get("q")) {
        searchParamsObj.q = searchParams.get("q") || "";
        setQ(searchParamsObj.q);
      } else {
        searchParamsObj.f_name = searchParams.get("f_name") || "";
        searchParamsObj.f_gosnum = searchParams.get("f_gosnum") || "";
        searchParamsObj.f_vendor = searchParams.get("f_vendor") || "";
        searchParamsObj.f_categ_name = searchParams.get("f_categ_name") || "";
        
        setFName(searchParamsObj.f_name);
        setFGosnum(searchParamsObj.f_gosnum);
        setFVendor(searchParamsObj.f_vendor);
        setFCategName(searchParamsObj.f_categ_name);
        setShowAdvanced(true);
      }

      // Add year boundaries if any are selected
      if (activeYears.length > 0 && !activeYears.includes("Все")) {
        let minYear = 2050;
        let maxYear = 1900;
        activeYears.forEach(y => {
            if (y === "до 2010") {
                minYear = Math.min(minYear, 1939);
                maxYear = Math.max(maxYear, 2009);
            } else {
                const ny = Number(y);
                if (!isNaN(ny)) {
                    minYear = Math.min(minYear, ny);
                    maxYear = Math.max(maxYear, ny);
                }
            }
        });
        if (minYear !== 2050) searchParamsObj.f_year_from = minYear.toString();
        if (maxYear !== 1900) searchParamsObj.f_year_to = maxYear.toString();
      }

      performSearch(searchParamsObj);
    } else {
      // Load entries (if years selected, query them, else default to all)
      let minYear = 1939;
      let maxYear = new Date().getFullYear();
      
      if (activeYears.length > 0 && !activeYears.includes("Все")) {
        minYear = 2050;
        maxYear = 1900;
        activeYears.forEach(y => {
            if (y === "до 2010") {
                minYear = Math.min(minYear, 1939);
                maxYear = Math.max(maxYear, 2009);
            } else {
                const ny = Number(y);
                if (!isNaN(ny)) {
                    minYear = Math.min(minYear, ny);
                    maxYear = Math.max(maxYear, ny);
                }
            }
        });
      }

      performSearch({
        page: 1,
        f_year_from: minYear === 2050 ? "" : minYear.toString(),
        f_year_to: maxYear === 1900 ? "" : maxYear.toString(),
      });
    }
  }, [searchParams]);

  const performSearch = async (searchArgs: GrsiSearchParams) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    const res = await searchGrsi(searchArgs);
    setLoading(false);
    
    if (res.success) {
      setResults(res.items || []);
      setTotalPages(res.totalPages || 1);
    } else {
      setError(res.error || "Произошла ошибка при поиске в реестре.");
    }
  };

  const handleYearToggle = (year: string) => {
    let newYears: string[];
    if (year === "Все") {
      newYears = [];
    } else {
      if (selectedYears.includes(year)) {
        newYears = selectedYears.filter(y => y !== year && y !== "Все");
      } else {
        newYears = [...selectedYears.filter(y => y !== "Все"), year];
      }
    }
    
    const params = new URLSearchParams(searchParams.toString());
    if (newYears.length > 0) {
      params.set("years", newYears.join(","));
      params.delete("f_year_from");
      params.delete("f_year_to");
    } else {
      params.delete("years");
      params.delete("f_year_from");
      params.delete("f_year_to");
    }

    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (showAdvanced) {
      if (fName.trim()) params.set("f_name", fName.trim());
      if (fGosnum.trim()) params.set("f_gosnum", fGosnum.trim());
      if (fVendor.trim()) params.set("f_vendor", fVendor.trim());
      if (fCategName.trim()) params.set("f_categ_name", fCategName.trim());
    } else {
      if (q.trim()) params.set("q", q.trim());
    }
    
    if (selectedYears.length > 0) {
      params.set("years", selectedYears.join(","));
      const yearsNum = selectedYears.map(Number);
      params.set("f_year_from", Math.min(...yearsNum).toString());
      params.set("f_year_to", Math.max(...yearsNum).toString());
    }
    
    params.set("page", "1"); // Reset to page 1 on new search
    
    router.push(`/registry?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/registry?${params.toString()}`);
    
    // Scroll to results heading
    const heading = document.getElementById("results-anchor");
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClear = () => {
    setQ("");
    setFName("");
    setFGosnum("");
    setFVendor("");
    setFCategName("");
    setSelectedYears([]);
    router.push("/registry");
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Previous Button
    buttons.push(
      <button 
        key="prev" 
        className={styles.pageBtn}
        disabled={page === 1}
        onClick={() => handlePageChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </button>
    );

    // First page
    if (startPage > 1) {
      buttons.push(
        <button 
          key={1} 
          className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnActive : ""}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots-start" className={styles.pageDots}>...</span>);
      }
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots-end" className={styles.pageDots}>...</span>);
      }
      buttons.push(
        <button 
          key={totalPages} 
          className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnActive : ""}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next Button
    buttons.push(
      <button 
        key="next" 
        className={styles.pageBtn}
        disabled={page === totalPages}
        onClick={() => handlePageChange(page + 1)}
      >
        <ChevronRight size={16} />
      </button>
    );

    return buttons;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumbs */}
        <div className={styles.breadcrumbs}>
          <a href="/">Главная</a> / <span>Госреестр СИ</span>
        </div>

        {/* Title */}
        <h1 className={styles.title}>Реестр средств измерений. Госреестр СИ</h1>
        <p className={styles.subtitle}>
          Официальный онлайн-справочник утвержденных типов средств измерений (ФГИС «АРШИН»). 
          Найдите прибор, скачайте официальные описания типов и методики поверки, а также оформите поверку за 1 клик.
        </p>

        {/* Search Box */}
        <div className={styles.searchBox}>
          <form onSubmit={handleSubmit}>
            {!showAdvanced ? (
              <div className={styles.primarySearchRow}>
                <div className={styles.searchInputWrapper}>
                  <Search className={styles.searchIcon} size={20} />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Введите название прибора, тип или номер ГРСИ (например, МЕГЕОН или 85208-22)..."
                    className={styles.searchInput}
                  />
                  {q && (
                    <button type="button" className={styles.clearButton} onClick={handleClear}>
                      <X size={18} />
                    </button>
                  )}
                </div>
                <button type="submit" className={styles.btnSearch}>
                  Найти
                </button>
              </div>
            ) : (
              <div className={styles.advancedSearchBlock}>
                <div className={styles.advancedGrid}>
                  <div className={styles.formGroup}>
                    <label>Наименование прибора</label>
                    <input 
                      type="text" 
                      value={fName} 
                      onChange={(e) => setFName(e.target.value)} 
                      placeholder="Например, Измерители уровня звука"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Номер в госреестре (ГРСИ)</label>
                    <input 
                      type="text" 
                      value={fGosnum} 
                      onChange={(e) => setFGosnum(e.target.value)} 
                      placeholder="Например, 85208-22"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Изготовитель</label>
                    <input 
                      type="text" 
                      value={fVendor} 
                      onChange={(e) => setFVendor(e.target.value)} 
                      placeholder="Например, SHENZHEN JUMAOYUAN"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Обозначение типа СИ</label>
                    <input 
                      type="text" 
                      value={fCategName} 
                      onChange={(e) => setFCategName(e.target.value)} 
                      placeholder="Например, МЕГЕОН 921"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}>
                  <button type="button" className={styles.btnToggleAdvanced} onClick={handleClear} style={{ color: 'var(--text-muted)' }}>
                    Очистить
                  </button>
                  <button type="submit" className={styles.btnSearch} style={{ height: 44 }}>
                    Искать по параметрам
                  </button>
                </div>
              </div>
            )}

            <div className={styles.advancedToggleRow}>
              <button 
                type="button" 
                className={styles.btnToggleAdvanced} 
                onClick={() => {
                  setShowAdvanced(!showAdvanced);
                  // Reset conflicting search forms
                  if (!showAdvanced) setQ("");
                  else {
                    setFName("");
                    setFGosnum("");
                    setFVendor("");
                    setFCategName("");
                  }
                }}
              >
                {showAdvanced ? (
                  <><ChevronUp size={16} /> Простой поиск по строке</>
                ) : (
                  <><ChevronDown size={16} /> Расширенный поиск по полям Госреестра</>
                )}
              </button>
            </div>
          </form>

          <div className={styles.yearsFilterRow}>
            <span className={styles.filterLabel}>Дата поверки:</span>
            <div className={styles.yearsList}>
              {["Все", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010", "до 2010"].map(year => {
                const isActive = year === "Все" ? selectedYears.length === 0 : selectedYears.includes(year);
                return (
                  <button
                    key={year}
                    type="button"
                    className={`${styles.yearBtn} ${isActive ? styles.yearBtnActive : ""}`}
                    onClick={() => handleYearToggle(year)}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Heading Anchor */}
        <div id="results-anchor" />

        {/* Results Block */}
        <div className={styles.resultsWrapper}>
            <h2 className={styles.resultsHeading}>
              {loading ? "Загрузка приборов..." : `Последние добавленные приборы (${results.length} на странице)`}
            </h2>

            {loading && (
              <div className={styles.loadingSkeleton}>
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonCard} />
              </div>
            )}

            {error && !loading && (
              <div className={styles.noResults} style={{ borderColor: 'red' }}>
                <Info size={32} style={{ color: 'red', marginBottom: 12 }} />
                <h3>Временные неполадки</h3>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className={styles.noResults}>
                <Info size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h3>Приборы не найдены</h3>
                <p>По вашему запросу в Государственном реестре СИ ничего не найдено. Проверьте правильность написания номера или типа прибора.</p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (() => {
              const displayedResults = selectedYears.length > 0
                ? results.filter((item: any) => {
                    const cleanYear = item.year.replace(/[^\d]/g, "");
                    return selectedYears.includes(cleanYear);
                  })
                : results;

              if (displayedResults.length === 0) {
                return (
                  <div className={styles.noResults}>
                    <Info size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <h3>Приборы не найдены для выбранных годов</h3>
                    <p>Попробуйте выбрать другие года или сбросить фильтр.</p>
                  </div>
                );
              }

              return (
                <>
                  <div className={styles.resultsGrid}>
                    {displayedResults.map((item) => (
                      <div key={item.slug} className={styles.registryCard}>
                        <div className={styles.cardImageWrapper}>
                          <img src={item.image} alt={item.title} className={styles.cardImage} />
                        </div>
                        
                        <div className={styles.cardInfo}>
                          <div className={styles.cardHeader}>
                            <span className={styles.gosnumBadge}>{item.gosnum}</span>
                            <span className={styles.yearText}>Год рег.: {item.year}</span>
                          </div>
                          <h3 className={styles.cardTitle}>{item.title}</h3>
                          <div className={styles.cardVendor}>Изготовитель: {item.vendor}</div>
                          {item.validity && (
                            <div className={styles.cardValidity}>
                              Срок действия: <span>{item.validity}</span>
                            </div>
                          )}
                        </div>

                        <div className={styles.cardActions}>
                          <a href={`/registry/${item.slug}`} className={styles.btnDetail}>
                            Подробнее / Спецификация
                          </a>
                          <button 
                            className={styles.btnPoverka}
                            onClick={() => openModal("inquiry", `Поверка прибора: ${item.title} (ГРСИ № ${item.gosnum})`)}
                          >
                            Заказать поверку
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      {renderPaginationButtons()}
                    </div>
                  )}
                </>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

export default function RegistryPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ color: 'var(--text-muted)' }}>Загрузка страницы реестра...</p>
        </div>
      </div>
    }>
      <RegistrySearchContent />
    </Suspense>
  );
}
