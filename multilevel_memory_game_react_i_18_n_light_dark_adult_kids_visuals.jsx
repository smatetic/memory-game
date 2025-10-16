import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Multilevel Memory Game
 * - Difficulty levels (pairs increase)
 * - Adult vs. Children visual sets
 * - i18n (EN/DE/FR/IT)
 * - Light/Dark mode toggle
 * - Responsive grid, keyboard accessible
 * - No external assets (emojis), works in a single file
 */

// i18n dictionary
const I18N = {
  en: {
    title: "Memory Game",
    language: "Language",
    visuals: "Visuals",
    visualsAdult: "Adult",
    visualsKids: "Children",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    difficulty: "Difficulty",
    pairs: (n) => `${n} pairs`,
    start: "Start",
    reset: "Reset",
    moves: "Moves",
    time: "Time",
    best: "Best",
    newGame: "New Game",
    instructions:
      "Flip two cards at a time. Match all pairs with as few moves as possible.",
    winTitle: "You did it!",
    winSubtitle: (moves, time) => `Solved in ${moves} moves • ${time}`,
    close: "Close",
    grid: "Grid",
    accessibilitySkip: "Skip to controls",
  },
  de: {
    title: "Memory",
    language: "Sprache",
    visuals: "Motive",
    visualsAdult: "Erwachsene",
    visualsKids: "Kinder",
    theme: "Design",
    themeLight: "Hell",
    themeDark: "Dunkel",
    difficulty: "Schwierigkeit",
    pairs: (n) => `${n} Paare`,
    start: "Start",
    reset: "Zurücksetzen",
    moves: "Züge",
    time: "Zeit",
    best: "Bestzeit",
    newGame: "Neues Spiel",
    instructions:
      "Decke jeweils zwei Karten auf. Finde alle Paare mit möglichst wenigen Zügen.",
    winTitle: "Geschafft!",
    winSubtitle: (moves, time) => `Gelöst in ${moves} Zügen • ${time}`,
    close: "Schliessen",
    grid: "Raster",
    accessibilitySkip: "Zu den Steuerelementen springen",
  },
  fr: {
    title: "Jeu de mémoire",
    language: "Langue",
    visuals: "Visuels",
    visualsAdult: "Adultes",
    visualsKids: "Enfants",
    theme: "Thème",
    themeLight: "Clair",
    themeDark: "Sombre",
    difficulty: "Difficulté",
    pairs: (n) => `${n} paires`,
    start: "Démarrer",
    reset: "Réinitialiser",
    moves: "Coups",
    time: "Temps",
    best: "Record",
    newGame: "Nouvelle partie",
    instructions:
      "Retournez deux cartes à la fois. Associez toutes les paires avec le moins de coups possible.",
    winTitle: "Bravo !",
    winSubtitle: (moves, time) => `Résolu en ${moves} coups • ${time}`,
    close: "Fermer",
    grid: "Grille",
    accessibilitySkip: "Aller aux contrôles",
  },
  it: {
    title: "Gioco di memoria",
    language: "Lingua",
    visuals: "Visuali",
    visualsAdult: "Adulti",
    visualsKids: "Bambini",
    theme: "Tema",
    themeLight: "Chiaro",
    themeDark: "Scuro",
    difficulty: "Difficoltà",
    pairs: (n) => `${n} coppie`,
    start: "Avvia",
    reset: "Reset",
    moves: "Mosse",
    time: "Tempo",
    best: "Record",
    newGame: "Nuova partita",
    instructions:
      "Gira due carte alla volta. Abbina tutte le coppie con il minor numero di mosse.",
    winTitle: "Ben fatto!",
    winSubtitle: (moves, time) => `Risolto in ${moves} mosse • ${time}`,
    close: "Chiudi",
    grid: "Griglia",
    accessibilitySkip: "Vai ai controlli",
  },
};

// Visual packs (emojis to avoid external asset loading)
const VISUALS = {
  adult: [
    "🗝️","📎","🔧","🧭","🧱","🧪","🔒","🖇️","⚙️","🧲","📌","🧰","🖋️","📐","🗂️","🔭","💡","📊","🗓️","📁","🧬","🛰️","🧮","📎","🧯","🧴","🧷","🔋","🪫","📏","🪀","🧳","🧵","🪡","🪛","🛠️","📠","🔌","💾","🖨️","🧼","🧹","🧽","🧻","🧷","🧯","📂","🗃️","🗄️","🗜️",
  ],
  kids: [
    "🦊","🐻","🐼","🐶","🐱","🦁","🐸","🐵","🐨","🐯","🐷","🐰","🐔","🦄","🐠","🐙","🐝","🦋","🐞","🐢","🚗","🚕","🚌","🚜","✈️","🚀","🚲","🛴","🛵","🚂","🍎","🍓","🍌","🍇","🍉","🍒","🍍","🥕","🍪","🍩","🍰","🧁","🍦","🍔","🍟","🌈","⭐","⚽","🏀",
  ],
};

// Difficulty presets (number of pairs)
const DIFFICULTY = [
  { key: "easy", pairs: 6 },
  { key: "medium", pairs: 10 },
  { key: "hard", pairs: 15 },
  { key: "insane", pairs: 20 },
];

function useStopwatch(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const reset = () => setSeconds(0);
  const fmt = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  return { seconds, fmt, reset };
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(visualPack, pairCount) {
  const base = shuffle(visualPack).slice(0, pairCount);
  const deck = shuffle(
    base.flatMap((v, idx) => [
      { id: `${idx}-a`, key: idx, value: v },
      { id: `${idx}-b`, key: idx, value: v },
    ])
  );
  return deck;
}

function suggestedGridCols(cardCount) {
  if (cardCount <= 12) return 4;
  if (cardCount <= 20) return 5;
  if (cardCount <= 24) return 6;
  if (cardCount <= 30) return 6;
  if (cardCount <= 36) return 6;
  if (cardCount <= 40) return 8;
  return 8;
}

export default function MemoryGame() {
  // UI state
  const [lang, setLang] = useState("en");
  const t = I18N[lang];
  const [theme, setTheme] = useState("light"); // light | dark
  const [visualMode, setVisualMode] = useState("kids"); // kids | adult
  const [pairs, setPairs] = useState(DIFFICULTY[0].pairs);

  // Game state
  const [deck, setDeck] = useState(() => buildDeck(VISUALS[visualMode], pairs));
  const [flipped, setFlipped] = useState([]); // indexes of flipped cards (max 2)
  const [matchedKeys, setMatchedKeys] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const gridRef = useRef(null);

  const { seconds, fmt, reset: resetTimer } = useStopwatch(running);

  const allMatched = useMemo(() => matchedKeys.size === pairs, [matchedKeys, pairs]);

  // Start new game when settings change
  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualMode, pairs, lang]);

  useEffect(() => {
    if (allMatched && running) {
      setRunning(false);
      setWon(true);
    }
  }, [allMatched, running]);

  function newGame() {
    const d = buildDeck(VISUALS[visualMode], pairs);
    setDeck(d);
    setFlipped([]);
    setMatchedKeys(new Set());
    setMoves(0);
    setWon(false);
    resetTimer();
    // focus grid for accessibility
    setTimeout(() => {
      gridRef.current?.focus();
    }, 50);
  }

  function handleCardClick(idx) {
    if (won) return;
    if (!running) setRunning(true);
    if (flipped.includes(idx)) return; // same card

    const newFlipped = [...flipped, idx].slice(-2);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [i, j] = newFlipped;
      const a = deck[i];
      const b = deck[j];
      setMoves((m) => m + 1);
      if (a.key === b.key) {
        // match
        setMatchedKeys((prev) => new Set(prev).add(a.key));
        // allow a little time to show
        setTimeout(() => setFlipped([]), 350);
      } else {
        // flip back
        setTimeout(() => setFlipped([]), 700);
      }
    }
  }

  function isFaceUp(idx) {
    const k = deck[idx].key;
    return flipped.includes(idx) || matchedKeys.has(k);
  }

  function cardTabIndex(idx) {
    return isFaceUp(idx) ? -1 : 0;
  }

  const cardCount = deck.length;
  const cols = suggestedGridCols(cardCount);

  // Theme class on root
  const rootClass = theme === "dark" ? "dark" : "";

  return (
    <div className={`${rootClass} w-full min-h-screen transition-colors`}>
      <a
        href="#controls"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-500 text-white px-3 py-2 rounded-lg"
      >
        {t.accessibilitySkip}
      </a>

      <div className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <div className="flex items-center gap-2">
            <ModeToggle theme={theme} setTheme={setTheme} t={t} />
          </div>
        </header>

        {/* Controls */}
        <section id="controls" className="px-4 sm:px-6 pb-2">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label={t.language}>
              <select
                className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
              </select>
            </Field>

            <Field label={t.visuals}>
              <div className="flex gap-2">
                <ToggleButton
                  active={visualMode === "kids"}
                  onClick={() => setVisualMode("kids")}
                >
                  {t.visualsKids}
                </ToggleButton>
                <ToggleButton
                  active={visualMode === "adult"}
                  onClick={() => setVisualMode("adult")}
                >
                  {t.visualsAdult}
                </ToggleButton>
              </div>
            </Field>

            <Field label={t.difficulty}>
              <input
                type="range"
                min={4}
                max={24}
                step={1}
                value={pairs}
                onChange={(e) => setPairs(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {t.pairs(pairs)}
              </div>
            </Field>

            <Field label={t.grid}>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {cols} × {Math.ceil(cardCount / cols)}
              </div>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <PrimaryButton onClick={newGame}>{t.newGame}</PrimaryButton>
            <SecondaryButton
              onClick={() => {
                setFlipped([]);
                setMatchedKeys(new Set());
                setMoves(0);
                resetTimer();
                setRunning(false);
                setWon(false);
              }}
            >
              {t.reset}
            </SecondaryButton>
          </div>

          <p className="mt-3 text-zinc-600 dark:text-zinc-300 text-sm">{t.instructions}</p>
        </section>

        {/* Stats */}
        <section className="px-4 sm:px-6 py-2">
          <div className="flex items-center gap-4 text-sm">
            <Badge>{t.moves}: {moves}</Badge>
            <Badge>{t.time}: {fmt()}</Badge>
          </div>
        </section>

        {/* Grid */}
        <main className="p-4 sm:p-6 flex-1">
          <div
            ref={gridRef}
            tabIndex={0}
            className={`grid gap-3 sm:gap-4 outline-none`}
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {deck.map((card, idx) => (
              <CardTile
                key={card.id}
                value={card.value}
                faceUp={isFaceUp(idx)}
                onClick={() => handleCardClick(idx)}
                tabIndex={cardTabIndex(idx)}
              />
            ))}
          </div>
        </main>

        <footer className="px-4 sm:px-6 pb-6 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            © {new Date().getFullYear()} Memory • {t.best}: —
          </div>
        </footer>

        <AnimatePresence>
          {won && (
            <WinModal
              onClose={() => setWon(false)}
              title={t.winTitle}
              subtitle={t.winSubtitle(moves, fmt())}
              actionLabel={t.close}
            />)
          }
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 
        ${
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
        }`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100">
      {children}
    </span>
  );
}

function ModeToggle({ theme, setTheme, t }) {
  return (
    <div className="inline-flex p-1 rounded-2xl bg-zinc-200 dark:bg-zinc-800">
      <button
        onClick={() => setTheme("light")}
        className={`px-3 py-1.5 rounded-xl text-sm ${
          theme === "light" ? "bg-white shadow" : "opacity-70"
        }`}
      >
        {t.themeLight}
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-3 py-1.5 rounded-xl text-sm ${
          theme === "dark" ? "bg-zinc-900 text-white shadow" : "opacity-70"
        }`}
      >
        {t.themeDark}
      </button>
    </div>
  );
}

function CardTile({ value, faceUp, onClick, tabIndex }) {
  return (
    <button
      onClick={onClick}
      tabIndex={tabIndex}
      className="relative h-24 sm:h-28 md:h-32 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-pressed={faceUp}
    >
      <div className="absolute inset-0 [perspective:1000px]">
        <motion.div
          className="w-full h-full rounded-2xl"
          initial={false}
          animate={{ rotateY: faceUp ? 180 : 0 }}
          transition={{ duration: 0.35 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm flex items-center justify-center text-4xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span role="img" aria-label="card-back">🎴</span>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm flex items-center justify-center text-4xl rotate-y-180"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span>{value}</span>
          </div>
        </motion.div>
      </div>
    </button>
  );
}

function WinModal({ onClose, title, subtitle, actionLabel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-xl"
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 12, opacity: 0 }}
      >
        <div className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-semibold mb-1">{title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{subtitle}</p>
        </div>
        <div className="mt-6 flex justify-center">
          <PrimaryButton onClick={onClose}>{actionLabel}</PrimaryButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
