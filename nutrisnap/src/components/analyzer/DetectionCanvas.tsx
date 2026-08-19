import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { easeSoft } from '../../lib/motion';
import type { PreparedImage } from '../../lib/image';
import type { MealItem } from '../../lib/types';

/**
 * Contenedor de imagen con la proporción exacta de la foto preparada.
 *
 * Esto no es cosmético: fijar `aspectRatio` al tamaño real hace que la
 * imagen llene el contenedor sin recorte, y por tanto las cajas en % caen
 * justo encima del alimento. Con `object-cover` sobre un contenedor de otra
 * proporción, cada caja se desplaza y el efecto "la IA reconoció mi plato"
 * se desmorona.
 */
function ImageFrame({
  image,
  children,
}: {
  image: PreparedImage;
  children?: ReactNode;
}) {
  return (
    <div className="flex justify-center bg-black">
      <div
        className="relative w-full"
        style={{ aspectRatio: `${image.width} / ${image.height}`, maxHeight: '52vh' }}
      >
        <img
          src={image.dataUrl}
          alt="Foto de la comida analizada"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {children}
      </div>
    </div>
  );
}

/** Barrido de escaneo. La duración la marca el análisis real, no un timer. */
export function ScanOverlay({ image }: { image: PreparedImage }) {
  const reduce = useReducedMotion();

  return (
    <ImageFrame image={image}>
      <div className="absolute inset-0 bg-void/45" aria-hidden />

      {!reduce && (
        <>
          {/* Línea de barrido con estela */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-24"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(16,185,129,0.28), transparent)',
            }}
            animate={{ top: ['-6rem', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-px bg-mint shadow-[0_0_16px_4px_rgba(16,185,129,0.8)]"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      <div className="absolute inset-0 grid place-items-center">
        <motion.p
          animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="font-display text-[13px] font-semibold tracking-[0.2em] text-mint uppercase"
        >
          Analizando
        </motion.p>
      </div>
    </ImageFrame>
  );
}

interface CanvasProps {
  image: PreparedImage;
  items: MealItem[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

/** Foto con las cajas de lo detectado. Tocar una caja selecciona el alimento. */
export function DetectionCanvas({ image, items, selectedIndex, onSelect }: CanvasProps) {
  return (
    <ImageFrame image={image}>
      <AnimatePresence>
        {items.map((item, i) => {
          if (!item.box) return null;
          const active = selectedIndex === i;
          const uncertain = (item.confidence ?? 1) < 0.7;

          return (
            <motion.button
              key={`${item.foodId}-${i}`}
              type="button"
              onClick={() => onSelect(active ? null : i)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ ...easeSoft, delay: i * 0.09 }}
              aria-label={`${item.name}, ${item.grams} gramos`}
              aria-pressed={active}
              className={[
                'absolute rounded-xl border-2 transition-colors duration-200',
                active
                  ? 'border-mint bg-mint/16'
                  : uncertain
                    ? 'border-dashed border-white/55 bg-white/6'
                    : 'border-white/75 bg-white/4',
              ].join(' ')}
              style={{
                left: `${item.box.x}%`,
                top: `${item.box.y}%`,
                width: `${item.box.w}%`,
                height: `${item.box.h}%`,
              }}
            >
              <span
                className={[
                  'absolute -top-3 left-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
                  active ? 'bg-mint text-void' : 'bg-void/85 text-ink backdrop-blur-sm',
                ].join(' ')}
              >
                {item.emoji} {item.name}
                {uncertain && !active && ' ?'}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </ImageFrame>
  );
}
