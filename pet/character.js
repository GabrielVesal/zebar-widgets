// Desenho do pet. Este é o robô padrão.
//
// Quer outro pet? Troque o SVG abaixo mantendo estas classes, que o motor
// (engine.js) usa para animar:
//   .pt-all          tudo que pula/flutua
//   .pt-body         corpo (estica, achata, respira)
//   .pt-turn         rosto que gira (olhar de lado)
//   .pt-look         olhos que seguem o mouse
//   .pt-eyes         os dois olhos (piscar)
//   .pt-eye          cada olho, com as 7 expressões (e-happy, e-open...)
//   .pt-shadow       sombra no chão
//   .pt-moons-back / .pt-moons-front   onde entram as luas dos agentes
//   #pt-moon         gradiente usado nas luas
// E ajuste GEOMETRY: CX/CY = centro, R = raio do corpo,
// RX/RY = órbita das luas, BASE_YAW = quanto o rosto fica virado parado,
// TURN = quanto o rosto anda para o lado quando gira.

export const GEOMETRY = { CX: 60, CY: 58, R: 31, RX: 50, RY: 11, BASE_YAW: -0.3, TURN: 0.28 };

const eye = x => `
  <g class="pt-eye" transform="translate(${x} 0)">
    <path class="e-happy" d="M-4.2 1 Q0 -4.6 4.2 1"/>
    <rect class="e-open" x="-2.6" y="-4" width="5.2" height="8" rx="2.6"/>
    <rect class="e-wide" x="-3.6" y="-5.2" width="7.2" height="10.4" rx="3.6"/>
    <path class="e-focus" d="M-4 0 L4 0"/>
    <path class="e-x" d="M-3 -3 L3 3 M3 -3 L-3 3"/>
    <path class="e-sleep" d="M-4.2 -1 Q0 3.4 4.2 -1"/>
    <path class="e-squint" d="${x < 0 ? 'M-3.5 -3.4 L3 0 L-3.5 3.4' : 'M3.5 -3.4 L-3 0 L3.5 3.4'}"/>
  </g>`;

export const SVG = `
<svg viewBox="0 0 120 120" class="pt-svg" aria-hidden="true">
  <defs>
    <linearGradient id="pt-head" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.55" stop-color="#dfe4ec"/>
      <stop offset="1" stop-color="#9ea8b6"/>
    </linearGradient>
    <radialGradient id="pt-headshade" cx="0.3" cy="0.25" r="0.9">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#1b2433" stop-opacity="0.35"/>
    </radialGradient>
    <linearGradient id="pt-visor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d2535"/>
      <stop offset="1" stop-color="#04060b"/>
    </linearGradient>
    <linearGradient id="pt-metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7d8796"/>
      <stop offset="0.5" stop-color="#c3cad4"/>
      <stop offset="1" stop-color="#6f7988"/>
    </linearGradient>
    <radialGradient id="pt-moon" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
      <stop offset="0.35" style="stop-color:var(--ring)"/>
      <stop offset="1" style="stop-color:var(--ring-lo)"/>
    </radialGradient>
    <filter id="pt-glow" filterUnits="userSpaceOnUse" x="-30" y="-20" width="60" height="40">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="pt-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <clipPath id="pt-vclip"><rect x="35" y="41" width="50" height="33" rx="12"/></clipPath>
  </defs>

  <ellipse class="pt-shadow" cx="60" cy="104" rx="24" ry="4.5"/>

  <g class="pt-all">
    <g class="pt-moons-back"></g>

    <g class="pt-body">
      <!-- antena -->
      <path d="M60 31 L60 20" stroke="#8d96a3" stroke-width="2.6" stroke-linecap="round"/>
      <circle class="pt-bulb-glow" cx="60" cy="17" r="7" filter="url(#pt-blur)"/>
      <circle class="pt-bulb" cx="60" cy="17" r="4.3"/>
      <circle cx="58.6" cy="15.6" r="1.3" fill="#fff" opacity="0.8"/>

      <!-- orelhas -->
      <rect x="21" y="49" width="10" height="20" rx="5" fill="url(#pt-metal)"/>
      <rect x="89" y="49" width="10" height="20" rx="5" fill="url(#pt-metal)"/>
      <rect class="pt-ear" x="23.5" y="54" width="3" height="10" rx="1.5"/>
      <rect class="pt-ear" x="93.5" y="54" width="3" height="10" rx="1.5"/>

      <!-- pescoço -->
      <rect x="51" y="84" width="18" height="8" rx="3" fill="#6f7988"/>

      <!-- cabeça -->
      <rect x="28" y="30" width="64" height="58" rx="20" fill="url(#pt-head)"/>
      <rect x="28" y="30" width="64" height="58" rx="20" fill="url(#pt-headshade)"/>
      <rect x="28.6" y="30.6" width="62.8" height="56.8" rx="19.5" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1.2"/>
      <ellipse cx="44" cy="36" rx="9" ry="3" fill="#fff" opacity="0.8" filter="url(#pt-blur)"/>

      <!-- visor -->
      <rect x="35" y="41" width="50" height="33" rx="12" fill="url(#pt-visor)"/>
      <rect x="35" y="41" width="50" height="33" rx="12" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="1"/>
      <g clip-path="url(#pt-vclip)">
        <g class="pt-face" transform="translate(60 57.5)">
          <g class="pt-turn">
            <g class="pt-look">
              <g class="pt-eyes" filter="url(#pt-glow)">${eye(-10)}${eye(10)}</g>
            </g>
          </g>
        </g>
        <path d="M37 47 Q50 41 66 42 L62 44 Q48 44 38 50 Z" fill="#fff" opacity="0.14"/>
      </g>

      <!-- boca: um risquinho -->
      <path class="pt-mouth" d="M55 80.5 Q60 82.5 65 80.5" fill="none" stroke="#7d8796" stroke-width="1.6" stroke-linecap="round"/>
    </g>

    <g class="pt-moons-front"></g>
  </g>

  <text class="pt-alert" x="94" y="32">!</text>
  <g class="pt-zz"><text x="90" y="34">z</text><text x="98" y="24">z</text></g>
</svg>`;
