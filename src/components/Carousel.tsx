"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselSlide = {
  src: string;
  alt: string;
  href?: string;
  width: number;
  height: number;
};

const SWIPE_THRESHOLD = 50;
const DRAG_INTENT_THRESHOLD = 8;

/**
 * Carrossel de largura cheia para as artes da Home. Cada slide usa
 * dimensões intrínsecas (nunca `fill`/`object-fit: cover`), então a
 * proporção original de cada arte é sempre preservada — se um slide algum
 * dia tiver uma proporção diferente dos demais, ele só fica um pouco mais
 * baixo/alto, nunca distorcido.
 */
export function Carousel({
  slides,
  autoplayMs = 4500,
}: {
  slides: CarouselSlide[];
  autoplayMs?: number;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  // Espelha `dragOffset` de forma síncrona: touchmove/touchend podem disparar
  // em sequência antes do React re-renderizar entre eles, então o handler de
  // touchend não pode confiar no `dragOffset` (state) — ele pode ler um
  // valor de uma renderização anterior (closure desatualizada).
  const dragOffsetRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, autoplayMs);
  }, [count, autoplayMs, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  function goToIndex(i: number) {
    setIndex(((i % count) + count) % count);
    startAutoplay();
  }

  function goToDelta(delta: number) {
    setIndex((i) => ((i + delta) % count + count) % count);
    startAutoplay();
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    draggedRef.current = false;
    dragOffsetRef.current = 0;
    setIsDragging(true);
    stopAutoplay();
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    // Gesto predominantemente vertical: deixa o navegador rolar a página
    // normalmente (touch-action: pan-y cuida disso) e ignora como swipe.
    if (Math.abs(dx) <= Math.abs(dy)) return;
    if (Math.abs(dx) > DRAG_INTENT_THRESHOLD) draggedRef.current = true;
    dragOffsetRef.current = dx;
    setDragOffset(dx);
  }

  function handleTouchEnd() {
    if (!touchStart.current) {
      setIsDragging(false);
      return;
    }
    const finalOffset = dragOffsetRef.current;
    if (finalOffset > SWIPE_THRESHOLD) goToDelta(-1);
    else if (finalOffset < -SWIPE_THRESHOLD) goToDelta(1);
    else startAutoplay();
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    touchStart.current = null;
  }

  function handleSlideClick(e: React.MouseEvent) {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{ touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      <div
        className={`flex ${isDragging ? "" : "transition-transform duration-500 ease-out"}`}
        style={{ transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))` }}
      >
        {slides.map((slide, i) => {
          const image = (
            <Image
              src={slide.src}
              alt={slide.alt}
              width={slide.width}
              height={slide.height}
              priority={i === 0}
              sizes="100vw"
              draggable={false}
              className="h-auto w-full"
            />
          );

          return (
            <div key={slide.src} className="w-full shrink-0">
              {slide.href ? (
                <Link href={slide.href} className="block" onClickCapture={handleSlideClick}>
                  {image}
                </Link>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goToDelta(-1)}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition hover:bg-background sm:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goToDelta(1)}
            aria-label="Próximo slide"
            className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition hover:bg-background sm:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-6">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goToIndex(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 w-2 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
