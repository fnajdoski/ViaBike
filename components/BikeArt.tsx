"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { resolveBikeImage } from "@/lib/bikeArt";
import type { Bike, BikeCategory, LuggageStyle } from "@/lib/types";

/**
 * Original, theme-aware bike artwork. Body lines/masses use `currentColor`
 * (graphite on light, near-white on dark — always legible) and wheels use the
 * accent token; background is transparent. One characterful side profile per
 * category, with a category-matched luggage overlay for the loaded state.
 *
 * Real per-model photos (Bike.imageUrlSolo / imageUrlLoaded) take priority via
 * resolveBikeImage — these illustrations are the fallback for bikes without one.
 */

const ACCENT: CSSProperties = { stroke: "var(--color-accent)" };

function Tire({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="none" style={ACCENT} strokeWidth={r > 48 ? 13 : r > 38 ? 10 : 8} />
      <circle cx={cx} cy={cy} r={Math.max(5, r * 0.17)} fill="currentColor" />
    </>
  );
}

/** Filled body mass helper. */
function Body({ d, opacity = 0.9 }: { d: string; opacity?: number }) {
  return <path d={d} fill="currentColor" fillOpacity={opacity} />;
}

/** Stroked detail (forks, bars, screens) in currentColor. */
function Line({ d, w = 9 }: { d: string; w?: number }) {
  return <path d={d} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

// ——— per-category rear-seat anchor for placing luggage ———
const ANCHOR: Record<BikeCategory, { x: number; top: number }> = {
  sport: { x: 206, top: 240 },
  naked: { x: 212, top: 250 },
  adventure: { x: 202, top: 232 },
  touring: { x: 212, top: 244 },
  cruiser: { x: 200, top: 258 },
  retro: { x: 212, top: 242 },
  scooter: { x: 210, top: 236 },
  maxiscooter: { x: 214, top: 224 },
  small: { x: 214, top: 250 },
};

function Luggage({ style, a }: { style: LuggageStyle; a: { x: number; top: number } }) {
  const fill = "currentColor";
  const boxEdge = { ...ACCENT, strokeWidth: 3.5 } as CSSProperties;
  switch (style) {
    case "hard-panniers":
      return (
        <g>
          {/* side pannier */}
          <rect x={a.x - 52} y={a.top + 6} width={66} height={56} rx={6} fill={fill} fillOpacity={0.82} style={boxEdge} />
          {/* top box */}
          <rect x={a.x - 30} y={a.top - 34} width={74} height={38} rx={7} fill={fill} fillOpacity={0.9} style={boxEdge} />
        </g>
      );
    case "integrated-cases":
      return (
        <path
          d={`M${a.x - 54} ${a.top + 60} Q ${a.x - 58} ${a.top - 8} ${a.x - 20} ${a.top - 12} L ${a.x + 40} ${a.top - 8} Q ${a.x + 54} ${a.top + 6} ${a.x + 44} ${a.top + 58} Z`}
          fill={fill}
          fillOpacity={0.88}
          style={boxEdge}
        />
      );
    case "top-box":
      return <rect x={a.x - 28} y={a.top - 30} width={68} height={46} rx={9} fill={fill} fillOpacity={0.9} style={boxEdge} />;
    case "tail-bag":
      return (
        <path
          d={`M${a.x - 36} ${a.top + 6} Q ${a.x - 40} ${a.top - 26} ${a.x} ${a.top - 28} Q ${a.x + 44} ${a.top - 26} ${a.x + 40} ${a.top + 8} Z`}
          fill={fill}
          fillOpacity={0.85}
          style={boxEdge}
        />
      );
    case "tank-bag":
      // sits on the tank (forward of the seat anchor)
      return (
        <path
          d={`M300 ${a.top - 6} Q 298 ${a.top - 30} 332 ${a.top - 30} Q 366 ${a.top - 28} 362 ${a.top - 4} Z`}
          fill={fill}
          fillOpacity={0.85}
          style={boxEdge}
        />
      );
    case "leather-saddlebags":
      return (
        <path
          d={`M${a.x - 38} ${a.top + 8} L ${a.x + 40} ${a.top + 8} Q ${a.x + 46} ${a.top + 40} ${a.x + 28} ${a.top + 64} L ${a.x - 26} ${a.top + 64} Q ${a.x - 44} ${a.top + 40} ${a.x - 38} ${a.top + 8} Z`}
          fill={fill}
          fillOpacity={0.8}
          style={boxEdge}
        />
      );
    case "soft-saddlebag":
      return (
        <rect x={a.x - 26} y={a.top + 4} width={62} height={46} rx={12} fill={fill} fillOpacity={0.82} style={boxEdge} />
      );
    case "minimal":
      return (
        <rect x={a.x - 12} y={a.top - 16} width={50} height={26} rx={8} fill={fill} fillOpacity={0.85} style={boxEdge} />
      );
  }
}

function CategoryArt({ category, luggage }: { category: BikeCategory; luggage: LuggageStyle | null }) {
  let body: React.ReactNode;
  switch (category) {
    case "sport":
      body = (
        <>
          <Body d="M150 236 L250 238 L300 228 L360 238 L442 214 L470 226 L476 262 L430 276 L340 288 L250 286 L185 270 Z" />
          <Line d="M250 240 L300 232" w={5} />
          <Line d="M440 224 L466 232" w={6} /> {/* windscreen */}
          <Tire cx={180} cy={290} r={52} />
          <Tire cx={470} cy={290} r={52} />
        </>
      );
      break;
    case "naked":
      body = (
        <>
          <Body d="M182 252 L252 250 L300 230 L352 238 L372 234 L372 252 L320 258 L250 262 L200 262 Z" />
          <Body d="M256 260 L332 260 L342 292 L266 294 Z" opacity={0.6} /> {/* engine */}
          <circle cx={376} cy={232} r={14} fill="none" style={ACCENT} strokeWidth={7} />
          <Line d="M362 230 L394 214" /> {/* handlebar */}
          <Line d="M372 240 L462 286" /> {/* fork */}
          <Tire cx={182} cy={290} r={52} />
          <Tire cx={464} cy={290} r={52} />
        </>
      );
      break;
    case "adventure":
      body = (
        <>
          <Body d="M150 240 L260 232 L316 222 L368 224 L392 236 L372 252 L300 252 L250 256 L170 260 Z" />
          <Line d="M392 234 L406 194 L370 199" w={8} /> {/* tall windscreen */}
          <Body d="M430 250 L488 234 L470 264 Z" opacity={0.85} /> {/* beak */}
          <Line d="M430 250 L470 286" /> {/* fork */}
          <Line d="M150 244 L150 232" w={8} /> {/* rear rack hint */}
          <Tire cx={175} cy={288} r={56} />
          <Tire cx={470} cy={288} r={56} />
        </>
      );
      break;
    case "touring":
      body = (
        <>
          <Body d="M150 252 L260 246 L330 242 L410 236 L452 224 L470 232 L484 290 L430 292 L300 290 L220 286 Z" />
          <Line d="M452 224 L462 192" w={8} /> {/* screen */}
          <Tire cx={180} cy={294} r={52} />
          <Tire cx={468} cy={294} r={52} />
        </>
      );
      break;
    case "cruiser":
      body = (
        <>
          <Body d="M150 268 L205 258 L250 262 L300 246 L360 252 L430 254 L300 278 L210 280 Z" />
          <Line d="M205 258 L250 260" w={5} /> {/* stepped seat */}
          <Line d="M430 252 L478 222" /> {/* raked fork upper */}
          <Line d="M438 248 L495 286" /> {/* raked fork lower */}
          <Line d="M470 224 L500 216" /> {/* pullback bars */}
          <Tire cx={150} cy={296} r={56} />
          <Tire cx={495} cy={296} r={56} />
        </>
      );
      break;
    case "retro":
      body = (
        <>
          <Body d="M165 244 L300 242 L330 238 L372 236 L388 244 L372 252 L300 252 L200 254 Z" />
          <Body d="M270 258 L332 258 L338 288 L278 290 Z" opacity={0.55} /> {/* engine */}
          <circle cx={392} cy={234} r={15} fill="none" style={ACCENT} strokeWidth={7} />
          <Line d="M380 232 L404 220" /> {/* bars */}
          <Line d="M388 240 L462 286" /> {/* fork */}
          <Line d="M272 286 L156 294" w={6} /> {/* peashooter pipe */}
          <Tire cx={178} cy={292} r={52} />
          <Tire cx={468} cy={292} r={52} />
        </>
      );
      break;
    case "scooter":
      body = (
        <>
          <Body d="M175 300 L178 250 L235 236 L300 242 L305 300 Z" /> {/* rear body + seat */}
          <Body d="M430 300 L436 206 L458 204 L466 250 L472 300 Z" /> {/* front leg shield */}
          <rect x={305} y={278} width={126} height={22} fill="currentColor" fillOpacity={0.7} /> {/* floor */}
          <Line d="M450 206 L470 196" /> {/* bar */}
          <Tire cx={205} cy={300} r={34} />
          <Tire cx={452} cy={300} r={34} />
        </>
      );
      break;
    case "maxiscooter":
      body = (
        <>
          <Body d="M172 300 L176 238 L240 224 L315 232 L320 300 Z" />
          <Body d="M424 300 L430 200 L456 196 L468 246 L476 300 Z" />
          <rect x={320} y={272} width={104} height={28} fill="currentColor" fillOpacity={0.7} />
          <Line d="M452 196 L470 160" w={8} /> {/* tall screen */}
          <Tire cx={198} cy={298} r={40} />
          <Tire cx={458} cy={298} r={40} />
        </>
      );
      break;
    case "small":
      body = (
        <>
          <Body d="M195 256 L250 252 L290 238 L336 242 L352 240 L352 254 L300 258 L230 262 Z" />
          <Body d="M256 260 L322 260 L330 290 L262 292 Z" opacity={0.55} />
          <circle cx={354} cy={238} r={12} fill="none" style={ACCENT} strokeWidth={6} />
          <Line d="M344 236 L368 222" w={8} />
          <Line d="M352 244 L450 288" w={8} />
          <Tire cx={195} cy={294} r={46} />
          <Tire cx={452} cy={294} r={46} />
        </>
      );
      break;
  }

  return (
    <g opacity={0.92}>
      {body}
      {luggage && <Luggage style={luggage} a={ANCHOR[category]} />}
    </g>
  );
}

export default function BikeArt({
  bike,
  loaded,
  priority = false,
  sizes,
  className = "object-contain",
}: {
  bike: Bike;
  loaded: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const resolved = resolveBikeImage(bike, loaded);
  if (resolved.kind === "photo") {
    return (
      <Image src={resolved.src} alt={`${bike.brand} ${bike.model}`} fill priority={priority} sizes={sizes} className={className} />
    );
  }
  return (
    <svg
      viewBox="0 0 640 360"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${bike.brand} ${bike.model} illustration`}
    >
      <CategoryArt category={resolved.category} luggage={resolved.luggage} />
    </svg>
  );
}
