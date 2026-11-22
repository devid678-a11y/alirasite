"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./AboutGallery.module.css";

interface AboutGalleryProps {
  gridCols?: number;
}

export const AboutGallery: React.FC<AboutGalleryProps> = ({ gridCols = 4 }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const images = [
    "/about-gallery/XXXL.webp",
    "/about-gallery/XXXL (1).webp",
    "/about-gallery/XXXL (2).webp",
    "/about-gallery/XXXL (3).webp",
    "/about-gallery/XXXL (4).webp",
    "/about-gallery/XXXL (5).webp",
    "/about-gallery/XXXL (6).webp",
    "/about-gallery/XXXL (7).webp",
  ];

  const gridClass =
    gridCols === 2
      ? styles.grid2
      : gridCols === 3
      ? styles.grid3
      : styles.grid4;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx - 1 + images.length) % images.length);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx + 1) % images.length);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIdx(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIdx]);

  return (
    <div>
      <div className={`${styles.grid} ${gridClass}`}>
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIdx(idx)}
            aria-label={`Открыть фотографию лаборатории ${idx + 1}`}
            className={styles.item}
            style={{
              position: "relative",
              display: "block",
              width: "100%",
              aspectRatio: "4 / 3",
              overflow: "hidden",
            }}
          >
            <Image
              src={img}
              alt={`Лаборатория Алира ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={styles.image}
              style={{ objectFit: "cover" }}
            />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeIdx !== null && (
        <div 
          onClick={() => setActiveIdx(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 20, 35, 0.92)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(6px)",
          }}
        >
          {/* Close Button */}
          <button 
            onClick={() => setActiveIdx(null)}
            aria-label="Закрыть"
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <X size={24} />
          </button>

          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            aria-label="Предыдущая фотография"
            style={{
              position: "absolute",
              left: "20px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Image Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "85vh",
              position: "relative",
            }}
          >
            <img 
              src={images[activeIdx]} 
              alt={`Лаборатория Алира ${activeIdx + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "12px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                objectFit: "contain",
                display: "block",
              }}
            />
            {/* Counter */}
            <div style={{
              position: "absolute",
              bottom: "-36px",
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.85)",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "var(--font-roboto), sans-serif",
            }}>
              {activeIdx + 1} / {images.length}
            </div>
          </div>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            aria-label="Следующая фотография"
            style={{
              position: "absolute",
              right: "20px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
