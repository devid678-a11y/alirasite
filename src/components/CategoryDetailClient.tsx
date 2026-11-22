"use client";

import React, { useState, useMemo } from "react";
import NextLink from "next/link";
import { 
  Grid, 
  List, 
  Search, 
  X, 
  ChevronDown, 
  CheckCircle2, 
  Clock,
  Download, 
  Scale, 
  ArrowUpDown,
  Filter,
  Trash2
} from "lucide-react";
import { useModal } from "@/context/ModalContext";
import styles from "./CategoryDetailClient.module.css";

interface CategoryDetailClientProps {
  initialProducts: any[];
  subCategories: any[];
  categoryName: string;
  categoryPath: string;
  docs: any[];
}

export default function CategoryDetailClient({
  initialProducts,
  subCategories,
  categoryName,
  categoryPath,
  docs
}: CategoryDetailClientProps) {
  const { openModal } = useModal();

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockOnly, setStockOnly] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [sortKey, setSortKey] = useState<string>("default");

  // Comparison State
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Active SKU selections (productId -> activeVariant object)
  const [activeVariants, setActiveVariants] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    initialProducts.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        initial[p.id] = p.variants[0];
      }
    });
    return initial;
  });

  // 1. Get dynamic list of brands from the products
  const brandsList = useMemo(() => {
    const brands = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.brand && p.brand !== "Unknown") {
        brands.add(p.brand);
      }
    });
    return Array.from(brands).sort();
  }, [initialProducts]);

  // 2. Determine which spec keys are suitable for filters.
  // We look for spec keys that are present in multiple products and have between 2 and 15 unique values.
  const filterableSpecs = useMemo(() => {
    const specCounts: Record<string, Set<string>> = {};
    
    initialProducts.forEach((p) => {
      // Check main specs
      if (p.specs) {
        Object.entries(p.specs).forEach(([k, v]) => {
          if (typeof v === "string" && v.trim() && k !== "Описание" && k !== "Характеристика") {
            if (!specCounts[k]) specCounts[k] = new Set();
            specCounts[k].add(v.trim());
          }
        });
      }
      // Check variant specs
      if (p.variants) {
        p.variants.forEach((v: any) => {
          if (v.specs) {
            Object.entries(v.specs).forEach(([k, val]) => {
              if (typeof val === "string" && val.trim() && k !== "Описание" && k !== "Характеристика") {
                if (!specCounts[k]) specCounts[k] = new Set();
                specCounts[k].add(val.trim());
              }
            });
          }
        });
      }
    });

    const result: { key: string; values: string[] }[] = [];
    Object.entries(specCounts).forEach(([key, valSet]) => {
      const values = Array.from(valSet).sort();
      // Only filter by parameters that have 2 to 15 options
      if (values.length > 1 && values.length <= 15) {
        result.push({ key, values });
      }
    });

    return result;
  }, [initialProducts]);

  // 3. Resolve dynamic product values helper (merges main and variant specs)
  const getProductDisplayData = (product: any) => {
    const activeVar = activeVariants[product.id];
    return {
      name: activeVar ? `${product.name} (${activeVar.name})` : product.name,
      image: (activeVar && activeVar.image) || product.image || "/product_placeholder.svg",
      price: (activeVar && activeVar.price) || product.price,
      sku: (activeVar && activeVar.sku) || activeVar?.name || product.id,
      inStock: activeVar && activeVar.inStock !== undefined ? activeVar.inStock : product.inStock,
      specs: activeVar && activeVar.specs ? { ...product.specs, ...activeVar.specs } : product.specs
    };
  };

  // 4. Handle variant selectors click
  const handleSelectSkuSpec = (productId: string, specKey: string, specVal: string) => {
    const product = initialProducts.find((p) => p.id === productId);
    if (!product || !product.variants) return;

    const currentActive = activeVariants[productId] || product.variants[0];

    // Find all variants of this product matching the clicked option
    const matches = product.variants.filter(
      (v: any) => v.selectedSpecs && v.selectedSpecs[specKey] === specVal
    );
    if (matches.length === 0) return;

    // Find the closest matching variant among matches based on other spec keys
    let bestMatch = matches[0];
    let maxMatchesCount = -1;

    for (const candidate of matches) {
      let matchCount = 0;
      Object.keys(currentActive.selectedSpecs || {}).forEach((k) => {
        if (k !== specKey && candidate.selectedSpecs?.[k] === currentActive.selectedSpecs?.[k]) {
          matchCount++;
        }
      });
      if (matchCount > maxMatchesCount) {
        maxMatchesCount = matchCount;
        bestMatch = candidate;
      }
    }

    setActiveVariants((prev) => ({
      ...prev,
      [productId]: bestMatch
    }));
  };

  // Helper to find docs for a product
  const getProductDocs = (product: any) => {
    return docs.filter((d: any) => 
      d.productId === product.id || 
      (d.title && product.name && d.title.toLowerCase().includes(product.name.toLowerCase()))
    );
  };

  // 5. Apply Filtering & Searching & Sorting
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const hasVariantMatch = p.variants?.some(
          (v: any) => v.name?.toLowerCase().includes(q) || v.sku?.toLowerCase().includes(q)
        );
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          hasVariantMatch
        );
      });
    }

    // 2. Brand Filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // 3. Stock Filter
    if (stockOnly) {
      result = result.filter((p) => {
        const disp = getProductDisplayData(p);
        return disp.inStock;
      });
    }

    // 4. Spec Filters
    Object.entries(selectedSpecs).forEach(([specKey, specVals]) => {
      if (specVals.length > 0) {
        result = result.filter((p) => {
          const disp = getProductDisplayData(p);
          const val = disp.specs?.[specKey];
          return val && specVals.includes(val.trim());
        });
      }
    });

    // 5. Sorting
    if (sortKey === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortKey === "price-asc") {
      // B2B prices are often "По запросу". Put "По запросу" at the end.
      result.sort((a, b) => {
        const dispA = getProductDisplayData(a);
        const dispB = getProductDisplayData(b);
        const priceA = parseFloat(dispA.price.replace(/[^0-9.]/g, "")) || Infinity;
        const priceB = parseFloat(dispB.price.replace(/[^0-9.]/g, "")) || Infinity;
        return priceA - priceB;
      });
    } else if (sortKey === "price-desc") {
      result.sort((a, b) => {
        const dispA = getProductDisplayData(a);
        const dispB = getProductDisplayData(b);
        const priceA = parseFloat(dispA.price.replace(/[^0-9.]/g, "")) || -Infinity;
        const priceB = parseFloat(dispB.price.replace(/[^0-9.]/g, "")) || -Infinity;
        return priceB - priceA;
      });
    }

    return result;
  }, [initialProducts, searchQuery, selectedBrands, stockOnly, selectedSpecs, sortKey, activeVariants]);

  // Handle checking a specs filter option
  const handleSpecsFilterChange = (key: string, value: string, checked: boolean) => {
    setSelectedSpecs((prev) => {
      const current = prev[key] || [];
      const updated = checked 
        ? [...current, value] 
        : current.filter((v) => v !== value);
      
      const newSpecs = { ...prev, [key]: updated };
      if (updated.length === 0) {
        delete newSpecs[key];
      }
      return newSpecs;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrands([]);
    setStockOnly(false);
    setSelectedSpecs({});
    setSortKey("default");
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (stockOnly) count += 1;
    Object.values(selectedSpecs).forEach((vals) => {
      count += vals.length;
    });
    return count;
  }, [selectedBrands, stockOnly, selectedSpecs]);

  // Comparison toggle
  const handleToggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        if (prev.length >= 4) {
          alert("Вы можете сравнивать одновременно не более 4 товаров.");
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  // Detailed Comparison Modal Specifications Map
  const comparisonData = useMemo(() => {
    if (compareIds.length === 0) return { products: [], specKeys: [] };

    const selectedProducts = initialProducts.filter((p) => compareIds.includes(p.id));
    const allSpecKeys = new Set<string>();

    selectedProducts.forEach((p) => {
      const disp = getProductDisplayData(p);
      if (disp.specs) {
        Object.keys(disp.specs).forEach((k) => {
          if (k !== "Описание" && k !== "Характеристика") {
            allSpecKeys.add(k);
          }
        });
      }
    });

    return {
      products: selectedProducts.map((p) => ({
        ...p,
        display: getProductDisplayData(p)
      })),
      specKeys: Array.from(allSpecKeys)
    };
  }, [compareIds, initialProducts, activeVariants]);

  return (
    <div className={styles.container}>
      {/* Search & Sort Panel */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Поиск по названию, бренду или артикулу..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.sortWrapper}>
            <ArrowUpDown size={16} className={styles.controlIcon} />
            <select 
              value={sortKey} 
              onChange={(e) => setSortKey(e.target.value)} 
              className={styles.sortSelect}
            >
              <option value="default">Сортировка: По умолчанию</option>
              <option value="name-asc">Название (А - Я)</option>
              <option value="name-desc">Название (Я - А)</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
            </select>
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.active : ""}`}
              onClick={() => setViewMode("grid")}
              title="Сетка"
            >
              <Grid size={18} />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.active : ""}`}
              onClick={() => setViewMode("table")}
              title="Таблица"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Filters Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>
              <Filter size={16} style={{ marginRight: 8 }} /> Фильтры
            </span>
            {activeFiltersCount > 0 && (
              <button onClick={clearAllFilters} className={styles.resetAllBtn}>
                Сбросить ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Stock Filter */}
          <div className={styles.filterSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={(e) => setStockOnly(e.target.checked)}
              />
              <span>Только в наличии</span>
            </label>
          </div>

          {/* Brands Filter */}
          {brandsList.length > 0 && (
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>Производитель</h4>
              <div className={styles.checkboxList}>
                {brandsList.map((brand) => {
                  const count = initialProducts.filter(p => p.brand === brand).length;
                  return (
                    <label key={brand} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedBrands((prev) =>
                            checked ? [...prev, brand] : prev.filter((b) => b !== brand)
                          );
                        }}
                      />
                      <span>{brand} <small className={styles.countTag}>({count})</small></span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parametric Filters */}
          {filterableSpecs.map((filter) => (
            <div key={filter.key} className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>{filter.key}</h4>
              <div className={styles.checkboxList}>
                {filter.values.map((val) => {
                  const isChecked = selectedSpecs[filter.key]?.includes(val) || false;
                  return (
                    <label key={val} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleSpecsFilterChange(filter.key, val, e.target.checked)}
                      />
                      <span>{val}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Products Display Area */}
        <div className={styles.contentArea}>
          {filteredProducts.length === 0 ? (
            <div className={styles.noResults}>
              <h3>Товары не найдены</h3>
              <p>Попробуйте сбросить фильтры или ввести другой поисковый запрос.</p>
              <button onClick={clearAllFilters} className={styles.btnResetLarge}>
                Сбросить фильтры
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className={styles.productsGrid}>
              {filteredProducts.map((p) => {
                const disp = getProductDisplayData(p);
                const hasVariants = p.variants && p.variants.length > 0;
                const isCompared = compareIds.includes(p.id);
                const productDocs = getProductDocs(p);

                // Build unique selector choices for this product card
                const variantKeys: string[] = [];
                const selectorMap: Record<string, string[]> = {};
                if (hasVariants) {
                  p.variants.forEach((v: any) => {
                    if (v.selectedSpecs) {
                      Object.entries(v.selectedSpecs).forEach(([k, val]) => {
                        if (typeof val === "string") {
                          if (!variantKeys.includes(k)) variantKeys.push(k);
                          if (!selectorMap[k]) selectorMap[k] = [];
                          if (!selectorMap[k].includes(val)) selectorMap[k].push(val);
                        }
                      });
                    }
                  });
                }

                return (
                  <div key={p.id} className={styles.gridCard}>
                    {/* Badge */}
                    <div className={styles.cardBadges}>
                      {p.isNew && <span className={`${styles.badge} ${styles.badgeNew}`}>Новинка</span>}
                      {p.grsi && <span className={`${styles.badge} ${styles.badgeGrsi}`}>ГРСИ</span>}
                    </div>

                    {/* Image */}
                    <div className={styles.cardImageArea}>
                      <img src={disp.image} alt={disp.name} className={styles.cardImage} />
                    </div>

                    {/* Meta */}
                    <div className={styles.cardMeta}>
                      <span className={styles.cardBrand}>{p.brand}</span>
                      <h3 className={styles.cardTitle}>
                        <NextLink href={`/catalog/${categoryPath}/${p.id}`} className={styles.cardLink}>
                          {p.name}
                        </NextLink>
                      </h3>
                      {hasVariants && activeVariants[p.id] && (
                        <div className={styles.variantSubname}>
                          Модель: {activeVariants[p.id].name}
                        </div>
                      )}
                    </div>

                    {/* SKU Selection inside card */}
                    {hasVariants && (
                      <div className={styles.cardSkuSelectors}>
                        {variantKeys.map((key) => (
                          <div key={key} className={styles.skuSelectGroup}>
                            <span className={styles.skuSelectLabel}>{key}:</span>
                            <div className={styles.skuSelectButtons}>
                              {selectorMap[key].map((val) => {
                                const isActive = activeVariants[p.id]?.selectedSpecs?.[key] === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    className={`${styles.skuSelectBtn} ${isActive ? styles.skuSelectBtnActive : ""}`}
                                    onClick={() => handleSelectSkuSpec(p.id, key, val)}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Small specs snippet */}
                    <div className={styles.cardSpecsSnippet}>
                      {Object.entries(disp.specs || {}).slice(0, 3).map(([k, v]) => (
                        <div key={k} className={styles.cardSpecItem}>
                          <span className={styles.cardSpecKey}>{k}:</span>
                          <span className={styles.cardSpecVal}>{v as string}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className={styles.cardFooter}>
                      <div className={styles.priceRow}>
                        <div className={styles.cardPrice}>{disp.price}</div>
                        <div className={`${styles.cardStock} ${disp.inStock ? styles.stockIn : styles.stockOut}`}>
                          {disp.inStock ? (
                            <><CheckCircle2 size={12} style={{ marginRight: 4 }} /> В наличии</>
                          ) : (
                            <><Clock size={12} style={{ marginRight: 4 }} /> Под заказ</>
                          )}
                        </div>
                      </div>

                      <div className={styles.cardActionRow}>
                        <button
                          className={`${styles.btnCompare} ${isCompared ? styles.btnCompareActive : ""}`}
                          onClick={() => handleToggleCompare(p.id)}
                          title={isCompared ? "Убрать из сравнения" : "Добавить к сравнению"}
                        >
                          <Scale size={16} />
                          <span>{isCompared ? "В сравнении" : "Сравнить"}</span>
                        </button>

                        {productDocs.length > 0 && (
                          <a
                            href={productDocs[0].url || `/uploads/${productDocs[0].filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnDownloadSpec}
                            title="Скачать спецификацию (PDF)"
                          >
                            <Download size={16} />
                          </a>
                        )}

                        <button 
                          className={styles.btnQuote} 
                          onClick={() => openModal(disp.price === "По запросу" ? "inquiry" : "kp", disp.name)}
                        >
                          Запросить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className={styles.tableResponsive}>
              <table className={styles.specTable}>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Фото</th>
                    <th>Наименование / Модель</th>
                    <th style={{ width: 140 }}>Производитель</th>
                    <th>Конфигурация (SKU)</th>
                    <th>Основные характеристики</th>
                    <th style={{ width: 110 }}>Статус</th>
                    <th style={{ width: 120 }}>Цена</th>
                    <th style={{ width: 160 }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const disp = getProductDisplayData(p);
                    const hasVariants = p.variants && p.variants.length > 0;
                    const isCompared = compareIds.includes(p.id);
                    const productDocs = getProductDocs(p);

                    // Build selector options for this product
                    const variantKeys: string[] = [];
                    const selectorMap: Record<string, string[]> = {};
                    if (hasVariants) {
                      p.variants.forEach((v: any) => {
                        if (v.selectedSpecs) {
                          Object.entries(v.selectedSpecs).forEach(([k, val]) => {
                            if (typeof val === "string") {
                              if (!variantKeys.includes(k)) variantKeys.push(k);
                              if (!selectorMap[k]) selectorMap[k] = [];
                              if (!selectorMap[k].includes(val)) selectorMap[k].push(val);
                            }
                          });
                        }
                      });
                    }

                    return (
                      <tr key={p.id} className={styles.tableRow}>
                        <td className={styles.tableImgCell}>
                          <img src={disp.image} alt={disp.name} className={styles.tableThumb} />
                        </td>
                        <td>
                          <div className={styles.tableNameContainer}>
                            <NextLink href={`/catalog/${categoryPath}/${p.id}`} className={styles.tableProductLink}>
                              {p.name}
                            </NextLink>
                            {p.grsi && <span className={styles.tableBadgeGrsi}>ГРСИ</span>}
                            {hasVariants && activeVariants[p.id] && (
                              <div className={styles.tableVariantSub}>
                                Модификация: <strong>{activeVariants[p.id].name}</strong>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.tableBrandLabel}>{p.brand}</span>
                        </td>
                        <td>
                          {hasVariants ? (
                            <div className={styles.tableSkuSelects}>
                              {variantKeys.map((key) => (
                                <div key={key} className={styles.tableSkuRow}>
                                  <span className={styles.tableSkuLabel}>{key}:</span>
                                  <div className={styles.tableSkuButtons}>
                                    {selectorMap[key].map((val) => {
                                      const isActive = activeVariants[p.id]?.selectedSpecs?.[key] === val;
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          className={`${styles.skuSelectBtnMini} ${isActive ? styles.skuSelectBtnMiniActive : ""}`}
                                          onClick={() => handleSelectSkuSpec(p.id, key, val)}
                                        >
                                          {val}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Базовая</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.tableSpecsList}>
                            {Object.entries(disp.specs || {}).slice(0, 3).map(([k, v]) => (
                              <div key={k} className={styles.tableSpecItem}>
                                <strong>{k}:</strong> {v as string}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.tableStockStatus} ${disp.inStock ? styles.tableStockIn : styles.tableStockOut}`}>
                            {disp.inStock ? "В наличии" : "Под заказ"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.tablePriceValue}>{disp.price}</div>
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              className={`${styles.btnTableCompare} ${isCompared ? styles.btnTableCompareActive : ""}`}
                              onClick={() => handleToggleCompare(p.id)}
                              title={isCompared ? "Убрать из сравнения" : "Добавить к сравнению"}
                            >
                              <Scale size={14} />
                            </button>
                            {productDocs.length > 0 && (
                              <a
                                href={productDocs[0].url || `/uploads/${productDocs[0].filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.btnTableDownload}
                                title="Скачать Datasheet"
                              >
                                <Download size={14} />
                              </a>
                            )}
                            <button
                              className={styles.btnTableQuote}
                              onClick={() => openModal(disp.price === "По запросу" ? "inquiry" : "kp", disp.name)}
                            >
                              Запрос КП
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Drawer */}
      {compareIds.length > 0 && (
        <div className={styles.compareDrawer}>
          <div className={styles.drawerContainer}>
            <div className={styles.drawerInfo}>
              <Scale size={20} className={styles.drawerIcon} />
              <div>
                <span className={styles.drawerTitle}>Сравнение товаров</span>
                <span className={styles.drawerSubtitle}>Добавлено: {compareIds.length} из 4</span>
              </div>
            </div>

            <div className={styles.drawerThumbs}>
              {compareIds.map((id) => {
                const p = initialProducts.find((prod) => prod.id === id);
                if (!p) return null;
                const disp = getProductDisplayData(p);
                return (
                  <div key={id} className={styles.drawerThumbWrapper} title={disp.name}>
                    <img src={disp.image} alt={disp.name} className={styles.drawerMiniImg} />
                    <button className={styles.drawerRemoveThumb} onClick={() => handleToggleCompare(id)}>
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={styles.drawerActions}>
              <button className={styles.btnDrawerClear} onClick={() => setCompareIds([])}>
                <Trash2 size={16} style={{ marginRight: 6 }} /> Очистить
              </button>
              <button className={styles.btnDrawerCompare} onClick={() => setIsCompareModalOpen(true)}>
                Сравнить характеристики
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Compare Modal */}
      {isCompareModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Сравнение характеристик</h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsCompareModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalScrollArea}>
              <table className={styles.comparisonModalTable}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 200, textAlign: "left" }}>Параметр</th>
                    {comparisonData.products.map((p: any) => (
                      <th key={p.id} className={styles.compareColHeader}>
                        <div className={styles.compareProductCard}>
                          <button 
                            className={styles.removeCompareItem} 
                            onClick={() => handleToggleCompare(p.id)}
                            title="Убрать из сравнения"
                          >
                            <X size={14} />
                          </button>
                          <img src={p.display.image} alt={p.display.name} className={styles.compareProductImg} />
                          <div className={styles.compareProductBrand}>{p.brand}</div>
                          <div className={styles.compareProductName}>{p.name}</div>
                          {p.variants && activeVariants[p.id] && (
                            <div className={styles.compareProductVariant}>
                              Мод: {activeVariants[p.id].name}
                            </div>
                          )}
                          <div className={styles.compareProductPrice}>{p.display.price}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* General parameters */}
                  <tr className={styles.specSubHeader}>
                    <td colSpan={compareIds.length + 1}>Общие сведения</td>
                  </tr>
                  <tr>
                    <td className={styles.specName}>Наличие</td>
                    {comparisonData.products.map((p: any) => (
                      <td key={p.id} className={styles.specValue}>
                        {p.display.inStock ? "На складе" : "Под заказ"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={styles.specName}>В Госреестре (ГРСИ)</td>
                    {comparisonData.products.map((p: any) => (
                      <td key={p.id} className={styles.specValue}>
                        {p.grsi ? "Да" : "Нет"}
                      </td>
                    ))}
                  </tr>

                  {/* Parametric values */}
                  <tr className={styles.specSubHeader}>
                    <td colSpan={compareIds.length + 1}>Технические характеристики</td>
                  </tr>

                  {comparisonData.specKeys.map((key) => {
                    // Check if all values are identical
                    const values = comparisonData.products.map((p: any) => p.display.specs?.[key] || "—");
                    const allIdentical = values.every((v) => v === values[0]);

                    return (
                      <tr 
                        key={key} 
                        className={!allIdentical ? styles.differentValuesRow : ""}
                      >
                        <td className={styles.specName}>
                          {key}
                          {!allIdentical && (
                            <span className={styles.diffDot} title="Характеристики отличаются" />
                          )}
                        </td>
                        {comparisonData.products.map((p: any) => (
                          <td key={p.id} className={styles.specValue}>
                            {p.display.specs?.[key] || "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
