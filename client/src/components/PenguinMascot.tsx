import { motion } from "framer-motion";

export type PenguinMood = "idle" | "celebrating" | "waving" | "thinking" | "happy" | "sleeping";
export type PenguinSize = "small" | "medium" | "large";

interface PenguinMascotProps {
  mood?: PenguinMood;
  size?: PenguinSize | number;
  className?: string;
}

const SIZES: Record<PenguinSize, number> = { small: 80, medium: 120, large: 160 };

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  body: "#1a1a2e",
  belly: "#f0f0f5",
  beak: "#FFB300",
  feet: "#FFB300",
  eyeWhite: "#ffffff",
  pupil: "#1a1a2e",
  shine: "#ffffff",
  scarf: "#7C3AED",
  scarfDark: "#5b21b6",
  star: "#FFD700",
  blush: "#FFB3B3",
  wing: "#141428",
  wingLight: "#22223e",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Eye({ cx, cy, lookX = 0, lookY = 0, closed = false, wide = false, squint = false }: {
  cx: number; cy: number; lookX?: number; lookY?: number;
  closed?: boolean; wide?: boolean; squint?: boolean;
}) {
  const r = wide ? 10 : 8.5;
  if (closed) {
    // Sleeping — curved line
    return (
      <path
        d={`M${cx - 7} ${cy} Q${cx} ${cy + 5} ${cx + 7} ${cy}`}
        stroke={C.pupil} strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
    );
  }
  if (squint) {
    return (
      <>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.68} fill={C.eyeWhite} />
        <ellipse cx={cx + lookX * 0.5} cy={cy + lookY * 0.5} rx={r * 0.58} ry={r * 0.42} fill={C.pupil} />
        <circle cx={cx + lookX * 0.3 + 2.5} cy={cy + lookY * 0.3 - 1.5} r={1.8} fill={C.shine} />
      </>
    );
  }
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={C.eyeWhite} />
      <circle cx={cx + lookX} cy={cy + lookY} r={r * 0.62} fill={C.pupil} />
      <circle cx={cx + lookX + 2.5} cy={cy + lookY - 2.5} r={2} fill={C.shine} />
    </>
  );
}

function Blush({ cx, cy }: { cx: number; cy: number }) {
  return <ellipse cx={cx} cy={cy} rx={6.5} ry={4} fill={C.blush} opacity={0.65} />;
}

function Beak({ open = false }: { open?: boolean }) {
  if (open) {
    return (
      <>
        <path d="M46 72 L54 72 L50 80 Z" fill={C.beak} />
        <path d="M46 72 L54 72 L50 76 Z" fill="#fff8e1" />
      </>
    );
  }
  return <path d="M45 73 Q50 80 55 73 L54 70 Q50 74 46 70 Z" fill={C.beak} />;
}

function Scarf() {
  return (
    <>
      {/* Main scarf band */}
      <path d="M24 78 Q50 88 76 78 L78 84 Q50 96 22 84 Z" fill={C.scarf} />
      {/* Knot / bow on left */}
      <rect x="22" y="80" width="10" height="7" rx="3" fill={C.scarfDark} />
      <rect x="20" y="79" width="14" height="4" rx="2" fill={C.scarf} />
      {/* Small star on scarf */}
      <text x="60" y="89" fontSize="8" textAnchor="middle" fill={C.star}>★</text>
    </>
  );
}

function StarBurst({ cx, cy, r, delay }: { cx: number; cy: number; r: number; delay: number }) {
  return (
    <motion.text
      x={cx} y={cy}
      fontSize={r * 2}
      textAnchor="middle"
      dominantBaseline="central"
      fill={C.star}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0], y: [cy, cy - 18, cy - 32] }}
      transition={{ repeat: Infinity, duration: 1.4, delay, ease: "easeOut" }}
      style={{ originX: "50%", originY: "50%" }}
    >★</motion.text>
  );
}

// ─── Body template (all poses share this) ───────────────────────────────────

function BaseBody({ blushIntensity = 0.65 }: { blushIntensity?: number }) {
  return (
    <>
      {/* Shadow */}
      <ellipse cx="50" cy="114" rx="24" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* Body */}
      <path d="M18 72 C18 44 30 18 50 18 C70 18 82 44 82 72 C82 96 68 112 50 112 C32 112 18 96 18 72Z" fill={C.body} />
      {/* Belly oval */}
      <ellipse cx="50" cy="76" rx="21" ry="26" fill={C.belly} />
      {/* Head highlight */}
      <path d="M32 34 Q40 22 54 26" stroke="rgba(255,255,255,0.14)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </>
  );
}

function BaseFeet() {
  return (
    <>
      <ellipse cx="38" cy="112" rx="10" ry="5" fill={C.feet} />
      <ellipse cx="62" cy="112" rx="10" ry="5" fill={C.feet} />
    </>
  );
}

function StarWand({ x = 82, y = 28 }: { x?: number; y?: number }) {
  return (
    <>
      <line x1={x - 2} y1={y + 12} x2={x + 4} y2={y - 4} stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
      <text x={x + 5} y={y - 4} fontSize="12" textAnchor="middle" fill={C.star}>★</text>
    </>
  );
}

// ─── MOOD POSES ──────────────────────────────────────────────────────────────

function IdlePose() {
  return (
    <>
      <BaseBody />
      {/* Wings resting */}
      <path d="M18 72 C10 68 8 82 14 88 Q18 90 22 88 L22 68Z" fill={C.wing} />
      <path d="M82 72 C90 68 92 82 86 88 Q82 90 78 88 L78 68Z" fill={C.wing} />
      <Scarf />
      <BaseFeet />
      <Eye cx={37} cy={58} />
      <Eye cx={63} cy={58} />
      <Blush cx={28} cy={68} />
      <Blush cx={72} cy={68} />
      <Beak />
    </>
  );
}

function WavingPose() {
  return (
    <>
      <BaseBody />
      {/* Left wing resting */}
      <path d="M18 72 C10 68 8 82 14 88 Q18 90 22 88 L22 68Z" fill={C.wing} />
      {/* Right wing raised — animated via the outer group */}
      <motion.g
        style={{ transformOrigin: "78px 72px" }}
        animate={{ rotate: [-25, 18, -25] }}
        transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
      >
        <path d="M78 72 C84 58 96 52 100 40 Q100 32 94 34 C90 36 82 50 78 68Z" fill={C.wing} />
        <path d="M78 68 C84 54 94 48 98 38" stroke={C.wingLight} strokeWidth="2" strokeLinecap="round" fill="none" />
      </motion.g>
      <Scarf />
      <BaseFeet />
      <Eye cx={37} cy={58} squint />
      <Eye cx={63} cy={58} squint />
      <Blush cx={28} cy={68} />
      <Blush cx={72} cy={68} />
      {/* Happy smile */}
      <path d="M39 80 Q50 92 61 80" stroke={C.pupil} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  );
}

function CelebratingPose() {
  return (
    <>
      <BaseBody />
      {/* Both wings up */}
      <path d="M18 72 C8 60 4 44 10 32 Q16 24 22 32 C26 44 22 64 22 72Z" fill={C.wing} />
      <path d="M82 72 C92 60 96 44 90 32 Q84 24 78 32 C74 44 78 64 78 72Z" fill={C.wing} />
      <Scarf />
      <BaseFeet />
      <Eye cx={37} cy={58} squint />
      <Eye cx={63} cy={58} squint />
      <Blush cx={28} cy={66} />
      <Blush cx={72} cy={66} />
      {/* Big open grin */}
      <path d="M37 78 Q50 96 63 78 Q50 90 37 78Z" fill={C.pupil} />
      <ellipse cx="50" cy="88" rx="9" ry="4.5" fill="white" opacity="0.9" />
      <StarWand x={86} y={24} />
      <StarBurst cx={12} cy={28} r={5} delay={0} />
      <StarBurst cx={88} cy={18} r={4} delay={0.22} />
      <StarBurst cx={18} cy={10} r={4} delay={0.44} />
      <StarBurst cx={84} cy={38} r={3} delay={0.6} />
    </>
  );
}

function ThinkingPose() {
  return (
    <>
      <BaseBody />
      <path d="M18 72 C10 68 8 82 14 88 Q18 90 22 88 L22 68Z" fill={C.wing} />
      {/* Right wing raised to chin */}
      <path d="M78 72 C86 70 90 76 88 82 Q86 86 80 84 L78 72Z" fill={C.wing} />
      <Scarf />
      <BaseFeet />
      {/* Eyes glance left/right — animated via parent */}
      <Eye cx={37} cy={58} lookX={-2} />
      <Eye cx={63} cy={58} lookX={-2} />
      <Blush cx={28} cy={68} />
      <Blush cx={72} cy={68} />
      <Beak />
      {/* Thought bubbles */}
      {[0, 1, 2].map(i => (
        <motion.circle
          key={i}
          cx={88 + i * 7} cy={32 - i * 6} r={2.5 + i * 0.8}
          fill="#c4b5fd"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.35 }}
        />
      ))}
    </>
  );
}

function HappyPose() {
  return (
    <>
      <BaseBody blushIntensity={0.9} />
      {/* Wings out mid-flap */}
      <path d="M18 74 C8 66 6 52 12 44 Q18 38 22 48 C24 58 22 68 22 74Z" fill={C.wing} />
      <path d="M82 74 C92 66 94 52 88 44 Q82 38 78 48 C76 58 78 68 78 74Z" fill={C.wing} />
      <Scarf />
      <BaseFeet />
      <Eye cx={37} cy={58} wide squint />
      <Eye cx={63} cy={58} wide squint />
      {/* Extra-rosy cheeks */}
      <ellipse cx={26} cy={68} rx={9} ry={6} fill={C.blush} opacity={0.75} />
      <ellipse cx={74} cy={68} rx={9} ry={6} fill={C.blush} opacity={0.75} />
      {/* Big smile */}
      <path d="M35 78 Q50 98 65 78 Q50 92 35 78Z" fill={C.pupil} />
      <ellipse cx="50" cy="89" rx="10" ry="5" fill="white" opacity="0.9" />
    </>
  );
}

function SleepingPose() {
  return (
    <>
      {/* Slight body tilt */}
      <g transform="rotate(-8 50 65)">
        <BaseBody />
        {/* Wings drooping */}
        <path d="M18 76 C10 78 8 90 14 94 Q18 96 22 92 L22 72Z" fill={C.wing} />
        <path d="M82 76 C90 78 92 90 86 94 Q82 96 78 92 L78 72Z" fill={C.wing} />
        <Scarf />
        <BaseFeet />
        <Eye cx={37} cy={58} closed />
        <Eye cx={63} cy={58} closed />
        <Blush cx={28} cy={68} />
        <Blush cx={72} cy={68} />
        {/* Small smile / content */}
        <path d="M42 80 Q50 84 58 80" stroke={C.pupil} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
      {/* ZZZs */}
      {["Z", "z", "Z"].map((z, i) => (
        <motion.text
          key={i}
          x={74 + i * 9} y={26 - i * 8}
          fontSize={10 + i * 3}
          fill="#a78bfa"
          fontWeight="bold"
          fontFamily="sans-serif"
          animate={{ opacity: [0, 1, 0], y: [0, -6, -12] }}
          transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.55 }}
        >
          {z}
        </motion.text>
      ))}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PenguinMascot({ mood = "idle", size = "medium", className = "" }: PenguinMascotProps) {
  const px = typeof size === "number" ? size : SIZES[size];

  // Outer body animation per mood
  const bodyAnim = {
    idle: { y: [0, -6, 0] },
    waving: { y: [0, -5, 0] },
    celebrating: { y: [0, -14, 0] },
    happy: { y: [0, -10, 0] },
    thinking: { rotate: [0, -4, 0, 4, 0] },
    sleeping: { y: [0, -3, 0] },
  }[mood];

  const bodyTransition = {
    idle: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
    waving: { repeat: Infinity, duration: 2.0, ease: "easeInOut" },
    celebrating: { repeat: Infinity, duration: 0.55, ease: "easeInOut" },
    happy: { repeat: Infinity, duration: 0.7, ease: "easeInOut" },
    thinking: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
    sleeping: { repeat: Infinity, duration: 4.0, ease: "easeInOut" },
  }[mood];

  // Eye look direction for thinking
  const [eyeLook] = [{ x: 0, y: 0 }];

  return (
    <motion.div
      className={`inline-block select-none ${className}`}
      animate={bodyAnim}
      transition={bodyTransition}
      style={{ width: px, height: px }}
    >
      <motion.svg
        width={px}
        height={px}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        // Thinking: subtle head tilt via svg itself
        animate={mood === "thinking" ? { rotate: [0, -5, 0, 5, 0] } : {}}
        transition={mood === "thinking" ? { repeat: Infinity, duration: 4.0, ease: "easeInOut" } : {}}
      >
        {mood === "idle" && <IdlePose />}
        {mood === "waving" && <WavingPose />}
        {mood === "celebrating" && <CelebratingPose />}
        {mood === "thinking" && <ThinkingPose />}
        {mood === "happy" && <HappyPose />}
        {mood === "sleeping" && <SleepingPose />}

        {/* Idle: slow wink blink overlay */}
        {mood === "idle" && (
          <motion.g
            animate={{ scaleY: [1, 1, 1, 0.05, 1], opacity: [1, 1, 1, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", times: [0, 0.7, 0.82, 0.9, 1] }}
            style={{ transformOrigin: "50px 58px" }}
          >
            <rect x={27.5} y={50} width={19} height={16} rx={8} fill={C.body} opacity={0} />
          </motion.g>
        )}
      </motion.svg>
    </motion.div>
  );
}
