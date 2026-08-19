import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { FOODS } from '../../lib/data';
import { easeSnap, easeSoft } from '../../lib/motion';
import type { Food } from '../../lib/types';

/** Sin tildes y en minúsculas: "platano" debe encontrar "plátano". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface Props {
  onPick: (food: Food) => void;
  onClose: () => void;
}

/**
 * Un detector que no se puede corregir hacia arriba se siente roto: si la IA
 * no vio el pollo, el registro queda mal y no hay salida. Esta hoja es esa
 * salida.
 */
export function FoodPicker({ onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return FOODS.slice(0, 12);
    return FOODS.filter(
      (f) => normalize(f.name).includes(q) || f.aliases.some((a) => normalize(a).includes(q)),
    ).slice(0, 20);
  }, [query]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={easeSoft}
      role="dialog"
      aria-modal="true"
      aria-label="Añadir alimento"
      className="absolute inset-x-0 bottom-0 z-50 flex max-h-[78%] flex-col rounded-t-[2rem] border-t border-white/10 bg-surface"
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="glass flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-3 focus-within:border-mint/40">
          <Search size={17} className="shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un alimento"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
          transition={easeSnap}
          aria-label="Cerrar"
          className="-mr-1 rounded-full p-2 text-ink-soft hover:text-ink"
        >
          <X size={19} />
        </motion.button>
      </div>

      <ul className="flex-1 overflow-y-auto px-5 pb-6">
        {results.length === 0 ? (
          <li className="px-1 py-8 text-center text-[13px] leading-relaxed text-ink-faint">
            No tenemos ese alimento todavía.
            <br />
            Pídelo desde el Centro de Sugerencias en Perfil.
          </li>
        ) : (
          results.map((food) => (
            <li key={food.id}>
              <motion.button
                type="button"
                onClick={() => onPick(food)}
                whileTap={{ scale: 0.98 }}
                transition={easeSnap}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-white/5"
              >
                <span className="text-xl">{food.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{food.name}</span>
                  <span className="tnum block text-[12px] text-ink-faint">
                    {food.kcal} kcal por 100 g · ración {food.portionG} g
                  </span>
                </span>
              </motion.button>
            </li>
          ))
        )}
      </ul>
    </motion.div>
  );
}
