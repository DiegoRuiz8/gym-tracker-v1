// src/components/exercise/ExercisePhotoToggle.tsx
//
// Muestra las fotos de un ejercicio (de free-exercise-db), alternando entre
// las dos automaticamente. Dos modos:
//  - "compact": thumbnail chiquito y estatico, tap para expandir a overlay
//    con el toggle automatico completo. Usado en ExercisesPage y
//    ActiveWorkoutPage (listas largas / pantallas con poco espacio).
//  - "auto": toggle automatico completo desde el inicio, sin necesitar tap.
//    Usado en RoutineDetailPage (modo "repaso", una tarjeta a la vez).
//
// Si no hay imagenes (ejercicio sin vincular a ExerciseDB), muestra un
// placeholder en vez de romper el layout. El placeholder puede ser
// clickeable (onPlaceholderClick) para que cada pantalla decida que hacer
// -- por ejemplo, navegar a editar el ejercicio para vincular una foto.
//
// Si la imagen tiene URL pero falla al cargar (sin internet, no cacheada),
// tambien cae al placeholder en vez de mostrar el icono roto del navegador.
//
// El overlay expandido se renderiza via createPortal directo a document.body:
// esto evita un bug real de CSS donde un ancestro con `transform` (por
// ejemplo botones con :active { transform: scale(...) }) convierte el
// `position: fixed` del overlay en relativo a ese ancestro en vez de a la
// ventana completa, rompiendo el cierre del overlay en ciertos contenedores.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/exercise-photo-toggle.css";

const TOGGLE_INTERVAL_MS = 1200;

type ExercisePhotoToggleProps = {
  images: string[];
  alt: string;
  mode: "compact" | "auto";
  onPlaceholderClick?: () => void;
};

function PlaceholderFrame({
  alt,
  onClick,
}: {
  alt: string;
  onClick?: () => void;
}) {
  const icon = (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="exercise-photo-placeholder-icon"
    >
      <path
        d="M3 10v4M7 8v8M17 8v8M21 10v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!onClick) {
    return (
      <div className="exercise-photo-placeholder" role="img" aria-label={alt}>
        {icon}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="exercise-photo-placeholder exercise-photo-placeholder-clickable"
      onClick={onClick}
      aria-label={`No photo linked for ${alt}. Tap to link one.`}
    >
      {icon}
    </button>
  );
}

// El "motor" del toggle: alterna entre dos imagenes con crossfade via CSS
// opacity. Si solo hay una imagen, simplemente la muestra fija (no hay nada
// que alternar). Si todas las imagenes fallan al cargar, muestra placeholder.
function AlternatingFrame({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Rastrea indices de imagenes que fallaron al cargar (sin red, sin cache, 404, etc.)
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());

  const validImages = images.filter((_, i) => !failedIndices.has(i));

  useEffect(() => {
    if (validImages.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current === 0 ? 1 : 0));
    }, TOGGLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [validImages.length]);

  // Si todas las imagenes fallaron, cae al placeholder silenciosamente
  if (failedIndices.size === images.length) {
    return <PlaceholderFrame alt={alt} />;
  }

  function handleFrameClick() {
    if (validImages.length < 2) return;
    setActiveIndex((current) => (current === 0 ? 1 : 0));
  }

  function handleImageError(index: number) {
    setFailedIndices((prev) => new Set(prev).add(index));
  }

  return (
    <div
      className="exercise-photo-frame"
      onClick={handleFrameClick}
      role={validImages.length > 1 ? "button" : undefined}
      tabIndex={validImages.length > 1 ? 0 : undefined}
      aria-label={validImages.length > 1 ? `${alt}, tap to change photo` : alt}
      onKeyDown={(event) => {
        if (validImages.length < 2) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleFrameClick();
        }
      }}
    >
      {images.map((src, index) => (
        // Las imagenes falladas se ocultan pero siguen en el DOM para que
        // el crossfade de las validas no se rompa
        !failedIndices.has(index) && (
          <img
            key={src}
            src={src}
            alt={alt}
            className={`exercise-photo-frame-img ${
              index === activeIndex ? "is-visible" : ""
            }`}
            loading="lazy"
            onError={() => handleImageError(index)}
          />
        )
      ))}
    </div>
  );
}

function ExpandedOverlay({
  images,
  alt,
  onClose,
}: {
  images: string[];
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleClose(event: React.MouseEvent) {
    event.stopPropagation();
    onClose();
  }

  return createPortal(
    <div
      className="exercise-photo-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="exercise-photo-overlay-content"
        onClick={(event) => event.stopPropagation()}
      >
        <AlternatingFrame images={images} alt={alt} />
        <button
          type="button"
          className="exercise-photo-overlay-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function ExercisePhotoToggle({
  images,
  alt,
  mode,
  onPlaceholderClick,
}: ExercisePhotoToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Rastrea si el thumbnail del modo compact fallo al cargar
  const [thumbnailError, setThumbnailError] = useState(false);
  const thumbnailButtonRef = useRef<HTMLButtonElement | null>(null);

  if (images.length === 0) {
    return <PlaceholderFrame alt={alt} onClick={onPlaceholderClick} />;
  }

  if (mode === "auto") {
    return <AlternatingFrame images={images} alt={alt} />;
  }

  function handleOverlayClose() {
    setIsExpanded(false);
    window.setTimeout(() => {
      thumbnailButtonRef.current?.focus();
    }, 0);
  }

  // Si el thumbnail fallo, muestra placeholder (con onPlaceholderClick si aplica)
  if (thumbnailError) {
    return <PlaceholderFrame alt={alt} onClick={onPlaceholderClick} />;
  }

  // mode === "compact"
  return (
    <>
      <button
        ref={thumbnailButtonRef}
        type="button"
        className="exercise-photo-thumbnail"
        onClick={() => setIsExpanded(true)}
        aria-label={`View photo of ${alt}`}
      >
        <img
          src={images[0]}
          alt={alt}
          className="exercise-photo-thumbnail-img"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />
      </button>

      {isExpanded && (
        <ExpandedOverlay
          images={images}
          alt={alt}
          onClose={handleOverlayClose}
        />
      )}
    </>
  );
}