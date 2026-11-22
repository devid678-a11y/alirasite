import React from "react";

interface CaliperSvgProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const CaliperSvg: React.FC<CaliperSvgProps> = ({ className, ...props }) => {
  // Generate millimeter scale marks along the main beam
  const scaleMarks = [];
  const startX = 120;
  const endX = 620;
  const step = 5;

  for (let x = startX, i = 0; x <= endX; x += step, i++) {
    const isMajor = i % 10 === 0;
    const isMid = i % 5 === 0 && !isMajor;
    const y1 = isMajor ? 122 : isMid ? 127 : 130;
    const y2 = 135;
    scaleMarks.push(
      <line
        key={`tick-${i}`}
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke="currentColor"
        strokeWidth={isMajor ? 1.2 : 0.8}
        strokeLinecap="round"
      />
    );

    if (isMajor && i / 10 <= 10) {
      scaleMarks.push(
        <text
          key={`num-${i}`}
          x={x}
          y={118}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace, sans-serif"
          fill="currentColor"
          fontWeight="500"
        >
          {i / 10}
        </text>
      );
    }
  }

  // Vernier scale marks (нониус) on the movable frame
  const vernierMarks = [];
  for (let v = 0; v <= 10; v++) {
    const vx = 212 + v * 4.5;
    vernierMarks.push(
      <line
        key={`vernier-${v}`}
        x1={vx}
        y1={140}
        x2={vx}
        y2={v === 0 || v === 10 || v === 5 ? 148 : 145}
        stroke="currentColor"
        strokeWidth={v === 0 || v === 10 ? 1 : 0.7}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 710 310"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 1. Depth gauge bar (глубиномер) protruding from the right */}
      <rect
        x="630"
        y="132"
        width="70"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.04"
      />

      {/* 2. Main Beam (Штанга штангенциркуля) */}
      <rect
        x="60"
        y="108"
        width="575"
        height="50"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="currentColor"
        fillOpacity="0.03"
      />

      {/* Guide groove (продольный паз на штанге) */}
      <line
        x1="110"
        y1="135"
        x2="630"
        y2="135"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="4 2"
        opacity="0.6"
      />

      {/* Scale tick marks and numbers */}
      <g opacity="0.85">{scaleMarks}</g>

      {/* 3. Fixed head and jaws (Неподвижная часть) */}
      {/* Fixed Outside Jaw (Нижняя неподвижная губка для наружных измерений) */}
      <path
        d="M 60 158 
           L 60 190 
           C 60 220 75 255 102 278 
           L 108 282 
           L 108 158 
           Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.04"
      />
      {/* Measuring flat edge bevel on fixed lower jaw */}
      <line x1="108" y1="160" x2="108" y2="282" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Fixed Inside Jaw (Верхняя неподвижная губка для внутренних измерений) */}
      <path
        d="M 60 108 
           L 60 85 
           C 65 65 80 46 102 33 
           L 108 30 
           L 108 108 
           Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <line x1="108" y1="30" x2="108" y2="108" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* 4. Movable Frame (Подвижная рамка с нониусом) */}
      {/* Slider outer body */}
      <rect
        x="200"
        y="102"
        width="82"
        height="62"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Vernier cutout window */}
      <rect
        x="210"
        y="138"
        width="62"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="#ffffff"
        fillOpacity="0.75"
      />

      {/* Vernier scale ticks */}
      <g opacity="0.9">{vernierMarks}</g>

      {/* Movable Outside Jaw (Нижняя подвижная губка) */}
      <path
        d="M 200 164 
           L 200 282 
           L 206 278 
           C 230 250 248 215 252 164 
           Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <line x1="200" y1="164" x2="200" y2="282" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Movable Inside Jaw (Верхняя подвижная губка) */}
      <path
        d="M 200 102 
           L 200 30 
           L 206 33 
           C 226 50 242 75 246 102 
           Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <line x1="200" y1="30" x2="200" y2="102" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Thumb rest with ribbed grip (Упор для пальца) */}
      <path
        d="M 264 164 
           C 264 175 272 184 282 184 
           L 282 164 
           Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <line x1="269" y1="167" x2="269" y2="178" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="273" y1="167" x2="273" y2="181" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="277" y1="167" x2="277" y2="182" stroke="currentColor" strokeWidth="1" opacity="0.6" />

      {/* Locking screw on top (Стопорный винт) */}
      {/* Base */}
      <rect
        x="233"
        y="96"
        width="16"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Knurled knob */}
      <rect
        x="229"
        y="83"
        width="24"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Knurling ridges on screw */}
      <line x1="233" y1="84" x2="233" y2="95" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="237" y1="84" x2="237" y2="95" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="241" y1="84" x2="241" y2="95" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="245" y1="84" x2="245" y2="95" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="249" y1="84" x2="249" y2="95" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />

      {/* Measurement dimension line between jaws to highlight precision */}
      <g opacity="0.5">
        <line x1="112" y1="230" x2="196" y2="230" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M 112 230 L 118 227 L 118 233 Z" fill="currentColor" />
        <path d="M 196 230 L 190 227 L 190 233 Z" fill="currentColor" />
      </g>
    </svg>
  );
};
