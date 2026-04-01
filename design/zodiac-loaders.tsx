"use client"

type ZodiacSign = 
  | "aries" | "taurus" | "gemini" | "cancer" 
  | "leo" | "virgo" | "libra" | "scorpio" 
  | "sagittarius" | "capricorn" | "aquarius" | "pisces"

interface ZodiacLoaderProps {
  sign: ZodiacSign
  size?: "sm" | "md" | "lg"
  text?: string
}

const signData: Record<ZodiacSign, { symbol: string; name: string }> = {
  aries: { symbol: "♈", name: "ARIES" },
  taurus: { symbol: "♉", name: "TAURUS" },
  gemini: { symbol: "♊", name: "GEMINI" },
  cancer: { symbol: "♋", name: "CANCER" },
  leo: { symbol: "♌", name: "LEO" },
  virgo: { symbol: "♍", name: "VIRGO" },
  libra: { symbol: "♎", name: "LIBRA" },
  scorpio: { symbol: "♏", name: "SCORPIO" },
  sagittarius: { symbol: "♐", name: "SAGITTARIUS" },
  capricorn: { symbol: "♑", name: "CAPRICORN" },
  aquarius: { symbol: "♒", name: "AQUARIUS" },
  pisces: { symbol: "♓", name: "PISCES" },
}

// Aries - Ram head with curled horns
function AriesIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Ram face outline */}
      <ellipse cx="75" cy="95" rx="28" ry="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Left horn */}
      <path d="M47 80 Q30 60 35 40 Q40 25 55 30 Q45 45 47 65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M55 30 Q65 35 60 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Right horn */}
      <path d="M103 80 Q120 60 115 40 Q110 25 95 30 Q105 45 103 65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M95 30 Q85 35 90 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Face details */}
      <ellipse cx="62" cy="88" rx="4" ry="5" fill="currentColor" fillOpacity="0.3" />
      <ellipse cx="88" cy="88" rx="4" ry="5" fill="currentColor" fillOpacity="0.3" />
      <path d="M70 105 Q75 112 80 105" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Fur texture */}
      <path d="M50 100 Q55 95 50 90" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M100 100 Q95 95 100 90" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M65 120 Q75 125 85 120" fill="none" stroke="currentColor" strokeWidth="1" />
    </g>
  )
}

// Taurus - Bull head
function TaurusIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Bull face */}
      <ellipse cx="75" cy="95" rx="30" ry="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Left horn */}
      <path d="M45 75 Q30 55 40 40 Q50 30 55 45" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right horn */}
      <path d="M105 75 Q120 55 110 40 Q100 30 95 45" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ears */}
      <path d="M42 70 Q35 65 38 75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M108 70 Q115 65 112 75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="60" cy="85" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="60" cy="85" r="2" fill="currentColor" />
      <circle cx="90" cy="85" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="90" cy="85" r="2" fill="currentColor" />
      {/* Nose ring */}
      <ellipse cx="75" cy="110" rx="10" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="75" cy="118" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Nostrils */}
      <circle cx="70" cy="108" r="2" fill="currentColor" fillOpacity="0.4" />
      <circle cx="80" cy="108" r="2" fill="currentColor" fillOpacity="0.4" />
    </g>
  )
}

// Gemini - Twin faces
function GeminiIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Left face - profile */}
      <path d="M55 60 Q45 65 42 80 Q40 95 45 110 Q50 120 55 118" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M55 60 Q65 55 70 60 Q72 70 70 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Left hair */}
      <path d="M55 60 Q50 50 55 42 Q65 35 75 40" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M48 55 Q40 50 42 60" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M45 65 Q38 62 38 72" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Left eye */}
      <ellipse cx="52" cy="78" rx="3" ry="2" fill="currentColor" fillOpacity="0.5" />
      {/* Right face - profile */}
      <path d="M95 60 Q105 65 108 80 Q110 95 105 110 Q100 120 95 118" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M95 60 Q85 55 80 60 Q78 70 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Right hair */}
      <path d="M95 60 Q100 50 95 42 Q85 35 75 40" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M102 55 Q110 50 108 60" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M105 65 Q112 62 112 72" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Right eye */}
      <ellipse cx="98" cy="78" rx="3" ry="2" fill="currentColor" fillOpacity="0.5" />
      {/* Connection wave between */}
      <path d="M70 95 Q75 90 80 95" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      {/* Stars between */}
      <circle cx="75" cy="85" r="1.5" fill="currentColor" fillOpacity="0.4" />
    </g>
  )
}

// Cancer - Crab
function CancerIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Body shell */}
      <ellipse cx="75" cy="90" rx="28" ry="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="75" cy="88" rx="20" ry="15" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      {/* Shell pattern */}
      <path d="M60 85 Q75 75 90 85" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M55 95 Q75 85 95 95" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Left claw */}
      <path d="M47 85 Q35 80 30 70 Q28 60 35 55 Q42 52 45 60 Q40 65 42 75" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M35 55 Q30 58 32 65" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Right claw */}
      <path d="M103 85 Q115 80 120 70 Q122 60 115 55 Q108 52 105 60 Q110 65 108 75" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M115 55 Q120 58 118 65" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Eyes on stalks */}
      <path d="M65 72 Q63 65 60 62" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="58" cy="60" r="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <path d="M85 72 Q87 65 90 62" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="92" cy="60" r="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      {/* Legs */}
      <path d="M50 100 Q45 108 40 115" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M55 105 Q52 112 48 118" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M100 100 Q105 108 110 115" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M95 105 Q98 112 102 118" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </g>
  )
}

// Leo - Lion head with mane
function LeoIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Mane - outer rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <path
          key={i}
          d={`M75 85 L${75 + Math.cos((angle * Math.PI) / 180) * 45} ${85 + Math.sin((angle * Math.PI) / 180) * 45}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      ))}
      {/* Mane - wavy outer edge */}
      <path d="M75 40 Q90 45 100 50 Q115 60 120 75 Q122 90 115 105 Q105 120 90 125 Q75 130 60 125 Q45 120 35 105 Q28 90 30 75 Q35 60 50 50 Q60 45 75 40" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Inner mane curves */}
      <path d="M75 48 Q85 52 92 58" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M75 48 Q65 52 58 58" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M108 70 Q112 80 110 92" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M42 70 Q38 80 40 92" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Face */}
      <ellipse cx="75" cy="88" rx="22" ry="25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Eyes */}
      <ellipse cx="65" cy="82" rx="4" ry="3" fill="currentColor" fillOpacity="0.4" />
      <ellipse cx="85" cy="82" rx="4" ry="3" fill="currentColor" fillOpacity="0.4" />
      {/* Nose */}
      <path d="M72 92 L75 98 L78 92 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      {/* Mouth */}
      <path d="M70 102 Q75 108 80 102" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="75" y1="98" x2="75" y2="105" stroke="currentColor" strokeWidth="1" />
      {/* Whisker dots */}
      <circle cx="58" cy="95" r="1" fill="currentColor" fillOpacity="0.4" />
      <circle cx="55" cy="92" r="1" fill="currentColor" fillOpacity="0.4" />
      <circle cx="92" cy="95" r="1" fill="currentColor" fillOpacity="0.4" />
      <circle cx="95" cy="92" r="1" fill="currentColor" fillOpacity="0.4" />
    </g>
  )
}

// Virgo - Maiden
function VirgoIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Face */}
      <ellipse cx="75" cy="70" rx="18" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Hair - flowing */}
      <path d="M57 55 Q50 50 48 60 Q45 75 50 90 Q52 100 48 115" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M55 52 Q48 55 45 65 Q42 80 45 95 Q44 108 42 120" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M93 55 Q100 50 102 60 Q105 75 100 90 Q98 100 102 115" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M95 52 Q102 55 105 65 Q108 80 105 95 Q106 108 108 120" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {/* Hair top */}
      <path d="M57 55 Q65 45 75 45 Q85 45 93 55" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M60 50 Q75 40 90 50" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Eyes */}
      <ellipse cx="68" cy="68" rx="3" ry="2" fill="currentColor" fillOpacity="0.5" />
      <ellipse cx="82" cy="68" rx="3" ry="2" fill="currentColor" fillOpacity="0.5" />
      {/* Nose */}
      <path d="M75 72 L75 78" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Lips */}
      <path d="M70 82 Q75 85 80 82" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {/* Neck */}
      <path d="M68 90 L68 100" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M82 90 L82 100" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Wheat sheaf */}
      <path d="M75 105 L75 125" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M75 108 L68 102" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M75 108 L82 102" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M75 115 L65 110" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M75 115 L85 110" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="68" cy="102" rx="2" ry="4" fill="currentColor" fillOpacity="0.3" />
      <ellipse cx="82" cy="102" rx="2" ry="4" fill="currentColor" fillOpacity="0.3" />
    </g>
  )
}

// Libra - Scales
function LibraIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Central pillar */}
      <rect x="72" y="90" width="6" height="35" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Base */}
      <path d="M55 125 L95 125" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M60 125 L75 118 L90 125" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Top ornament */}
      <circle cx="75" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="75" cy="55" r="4" fill="currentColor" fillOpacity="0.2" />
      {/* Balance beam */}
      <path d="M35 70 L115 70" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M75 55 L75 70" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Left scale */}
      <path d="M35 70 L35 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M35 80 L25 78" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M35 80 L45 78" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="35" cy="90" rx="15" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M25 78 Q22 85 20 90" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M45 78 Q48 85 50 90" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Right scale */}
      <path d="M115 70 L115 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M115 80 L105 78" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M115 80 L125 78" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="115" cy="90" rx="15" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M105 78 Q102 85 100 90" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M125 78 Q128 85 130 90" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Decorative swirls */}
      <path d="M65 65 Q60 60 65 55" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M85 65 Q90 60 85 55" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    </g>
  )
}

// Scorpio - Scorpion
function ScorpioIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Body segments */}
      <ellipse cx="75" cy="100" rx="25" ry="15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="75" cy="98" rx="18" ry="10" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      {/* Tail curving up */}
      <path d="M100 100 Q115 95 120 80 Q125 65 115 55 Q105 50 100 60" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M100 60 Q95 55 100 48 Q108 42 115 48" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Stinger */}
      <path d="M115 48 L120 42 L118 50 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />
      {/* Claws */}
      <path d="M50 95 Q35 85 30 75 Q28 65 35 60 Q42 58 45 65 Q40 72 45 80" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M35 60 Q30 62 32 70" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M50 100 Q38 95 32 88 Q28 80 35 75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Legs */}
      <path d="M55 110 Q50 118 45 122" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M65 112 Q62 120 58 125" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M85 112 Q88 120 92 125" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M95 110 Q100 118 105 122" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {/* Eyes */}
      <circle cx="65" cy="95" r="2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="85" cy="95" r="2" fill="currentColor" fillOpacity="0.5" />
    </g>
  )
}

// Sagittarius - Bow and Arrow
function SagittariusIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Bow */}
      <path d="M40 110 Q30 85 45 55 Q60 35 85 40" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Bow string */}
      <path d="M40 110 L85 40" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Arrow shaft */}
      <path d="M50 95 L110 45" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Arrowhead */}
      <path d="M110 45 L115 38 L120 50 L110 45 L108 55" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
      {/* Arrow fletching */}
      <path d="M52 93 L48 100 L55 95" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M52 93 L58 98 L53 88" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Decorative details on bow */}
      <circle cx="45" cy="55" r="3" fill="currentColor" fillOpacity="0.3" />
      <circle cx="40" cy="82" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="40" cy="110" r="3" fill="currentColor" fillOpacity="0.3" />
      {/* Stars */}
      <circle cx="95" cy="60" r="1.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="100" cy="75" r="1" fill="currentColor" fillOpacity="0.3" />
      <circle cx="80" cy="55" r="1" fill="currentColor" fillOpacity="0.3" />
    </g>
  )
}

// Capricorn - Sea-goat
function CapricornIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Goat head */}
      <ellipse cx="60" cy="65" rx="18" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Horns */}
      <path d="M48 50 Q40 35 50 28 Q60 25 55 40" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M72 50 Q80 35 70 28 Q60 25 65 40" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Ears */}
      <path d="M42 55 Q35 52 38 60" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {/* Eye */}
      <ellipse cx="55" cy="62" rx="3" ry="2" fill="currentColor" fillOpacity="0.5" />
      {/* Beard */}
      <path d="M55 80 Q50 90 52 100" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M60 82 Q58 92 55 102" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Body transition to fish */}
      <path d="M70 75 Q85 80 95 90 Q105 100 100 115 Q95 125 85 125" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Fish tail */}
      <path d="M85 125 Q75 130 70 125 Q65 118 70 112 Q78 108 85 115" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M70 125 Q60 135 50 130 L55 125 L48 122" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Scales */}
      <path d="M88 100 Q92 105 88 110" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M92 95 Q96 100 92 105" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M95 105 Q99 110 95 115" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    </g>
  )
}

// Aquarius - Water bearer
function AquariusIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Urn/vessel */}
      <path d="M55 50 L50 45 L100 45 L95 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M55 50 Q50 55 50 65 Q50 80 60 85 L90 85 Q100 80 100 65 Q100 55 95 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Urn pattern */}
      <path d="M55 60 Q75 55 95 60" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M55 70 Q75 65 95 70" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Handles */}
      <path d="M50 60 Q42 60 42 70 Q42 80 50 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M100 60 Q108 60 108 70 Q108 80 100 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Water flowing */}
      <path d="M70 85 Q65 95 70 105 Q75 115 65 125" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M80 85 Q85 95 80 105 Q75 115 85 125" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M75 90 Q70 100 75 110 Q80 120 75 130" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Water droplets */}
      <circle cx="60" cy="120" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="90" cy="118" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="72" cy="128" r="1.5" fill="currentColor" fillOpacity="0.3" />
      {/* Waves */}
      <path d="M55 130 Q65 125 75 130 Q85 135 95 130" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
    </g>
  )
}

// Pisces - Two fish
function PiscesIllustration() {
  return (
    <g className="animate-inner-pulse" style={{ transformOrigin: "center" }}>
      {/* Upper fish */}
      <ellipse cx="75" cy="55" rx="25" ry="12" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-15 75 55)" />
      <path d="M98 50 L110 42 L110 58 L98 50" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <circle cx="58" cy="52" r="3" fill="currentColor" fillOpacity="0.4" />
      <path d="M65 55 Q70 52 75 55" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M75 55 Q80 52 85 55" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Lower fish */}
      <ellipse cx="75" cy="115" rx="25" ry="12" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(15 75 115)" />
      <path d="M52 120 L40 128 L40 112 L52 120" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <circle cx="92" cy="112" r="3" fill="currentColor" fillOpacity="0.4" />
      <path d="M65 115 Q70 118 75 115" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M75 115 Q80 118 85 115" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Connecting ribbon */}
      <path d="M75 67 Q65 85 75 85 Q85 85 75 103" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Bubbles */}
      <circle cx="60" cy="78" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="90" cy="92" r="2" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="65" cy="95" r="1" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
    </g>
  )
}

const illustrations: Record<ZodiacSign, () => any> = {
  aries: AriesIllustration,
  taurus: TaurusIllustration,
  gemini: GeminiIllustration,
  cancer: CancerIllustration,
  leo: LeoIllustration,
  virgo: VirgoIllustration,
  libra: LibraIllustration,
  scorpio: ScorpioIllustration,
  sagittarius: SagittariusIllustration,
  capricorn: CapricornIllustration,
  aquarius: AquariusIllustration,
  pisces: PiscesIllustration,
}

const sizes = {
  sm: { card: 140, svg: 150 },
  md: { card: 180, svg: 150 },
  lg: { card: 240, svg: 150 },
}

export function ZodiacLoader({ sign, size = "md", text }: ZodiacLoaderProps) {
  const { symbol, name } = signData[sign]
  const Illustration = illustrations[sign]
  const { card } = sizes[size]

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-label={`Loading ${name}`}
    >
      <div
        className="relative rounded-2xl overflow-hidden animate-ring-pulse"
        style={{
          width: card,
          height: card * 1.4,
          background: "linear-gradient(180deg, #0A0A12 0%, #0D0D18 100%)",
          border: "2px solid rgba(201,168,76,0.3)",
          boxShadow: "0 0 30px rgba(201,168,76,0.15), inset 0 0 40px rgba(201,168,76,0.05)",
        }}
      >
        {/* Decorative border corners */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 140">
          {/* Corner flourishes */}
          <path d="M5 20 Q5 5 20 5" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          <path d="M5 25 Q5 10 25 10" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.5" />
          <path d="M95 20 Q95 5 80 5" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          <path d="M95 25 Q95 10 75 10" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.5" />
          <path d="M5 120 Q5 135 20 135" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          <path d="M5 115 Q5 130 25 130" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.5" />
          <path d="M95 120 Q95 135 80 135" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          <path d="M95 115 Q95 130 75 130" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.5" />
          {/* Inner decorative frame */}
          <rect x="8" y="8" width="84" height="124" rx="8" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>

        {/* Symbol at top */}
        <div className="absolute top-2 left-0 right-0 flex justify-center">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center animate-ring-glow-pulse"
            style={{
              background: "radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)",
              border: "1px solid rgba(201,168,76,0.4)",
            }}
          >
            <span className="text-gold text-xs">{symbol}</span>
          </div>
        </div>

        {/* Main illustration - takes up most of the card */}
        <svg
          className="absolute left-1/2 -translate-x-1/2"
          viewBox="0 0 150 150"
          style={{
            top: "12%",
            width: card * 0.95,
            height: card * 1.05,
            color: "#C9A84C",
          }}
        >
          <defs>
            <filter id={`glow-filter-${sign}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter={`url(#glow-filter-${sign})`}>
            <Illustration />
          </g>
        </svg>

        {/* Scattered stars - positioned around the illustration */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/50 animate-twinkle"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 60}%`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}

        {/* Name banner at bottom */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div
            className="px-2.5 py-0.5 rounded-sm"
            style={{
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
          >
            <span className="text-gold text-[9px] font-medium tracking-widest">{name}</span>
          </div>
        </div>

        {/* Pulsing overlay */}
        <div
          className="absolute inset-0 pointer-events-none animate-ring-glow-pulse"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Loading text */}
      {text && (
        <span className="text-sm text-gold/70 animate-mystical-text tracking-wider">{text}</span>
      )}
    </div>
  )
}

// Fullscreen variant
export function ZodiacLoaderFullscreen({ sign, text = "Consulting the stars..." }: Omit<ZodiacLoaderProps, "size">) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, #0D0D18 0%, #050508 100%)",
      }}
    >
      {/* Ambient pulsing circles */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-ring-pulse"
        style={{
          background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
          animationDuration: "4s",
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-ring-pulse"
        style={{
          background: "radial-gradient(circle, rgba(90,58,204,0.03) 0%, transparent 70%)",
          animationDuration: "5s",
          animationDelay: "0.5s",
        }}
      />
      
      <ZodiacLoader sign={sign} size="lg" text={text} />
    </div>
  )
}

// Demo component to show all loaders
export function ZodiacLoaderDemo() {
  const signs: ZodiacSign[] = [
    "aries", "taurus", "gemini", "cancer",
    "leo", "virgo", "libra", "scorpio",
    "sagittarius", "capricorn", "aquarius", "pisces"
  ]

  return (
    <div className="flex flex-wrap gap-6 justify-center p-8">
      {signs.map((sign) => (
        <ZodiacLoader key={sign} sign={sign} size="md" />
      ))}
    </div>
  )
}
