// Motor do pet: física de molas, estados e reações.
// O desenho fica em character.js. Troque aquele arquivo para ter o seu pet.
import { SVG, GEOMETRY } from './character.js';

const NS = 'http://www.w3.org/2000/svg';
const { CX, CY, R, RX, RY, BASE_YAW = 0, TURN = 0.62 } = GEOMETRY;
const SLEEP_AFTER = 10 * 60 * 1000; // dorme depois de 10 min sem atividade

export function createPet(host, root, pet) {
  host.innerHTML = SVG;
  const q = s => host.querySelector(s);
  const all = q('.pt-all');
  const body = q('.pt-body');
  const ringPos = [...host.querySelectorAll('.pt-ringpos')];
  const ringPaths = [...host.querySelectorAll('.pt-ring')];
  const shadow = q('.pt-shadow');
  const look = q('.pt-look');
  const turn = q('.pt-turn');
  const eyes = q('.pt-eyes');
  const moonsBack = q('.pt-moons-back');
  const moonsFront = q('.pt-moons-front');

  // ---- molas: tudo que mexe passa por aqui, então nada "pula" ----
  const spring = (x, k, c) => ({ x, v: 0, t: x, k, c });
  const S = {
    y: spring(0, 150, 9), // altura (pulos)
    sx: spring(1, 280, 13), // achatar / esticar
    sy: spring(1, 280, 13),
    drop: spring(0, 70, 11), // anel caindo
    tilt: spring(0, 70, 9),
    spin: spring(0, 9, 6), // velocidade do anel
    gap: spring(0, 40, 12), // tracejado do anel (0 = liso)
    famp: spring(2, 6, 5), // flutuar
    bamp: spring(0.02, 6, 5), // respirar
    pulse: spring(0, 20, 9), // pulso do anel (voz)
    rumble: spring(0, 20, 9),
    yaw: spring(BASE_YAW, 22, 9), // rosto girando na esfera
    lx: spring(0, 90, 15), // olhar
    ly: spring(0, 90, 15),
  };
  const step = (s, dt) => {
    s.v += (s.k * (s.t - s.x) - s.c * s.v) * dt;
    s.x += s.v * dt;
  };

  const P = {
    idle: { float: 3, fp: 3.4, breath: 0.022, bp: 3.6, spin: 0 },
    notice: { float: 2, fp: 2.6, breath: 0.015, bp: 2.8, spin: 0 },
    listening: { float: 1.2, fp: 2.2, breath: 0.045, bp: 0.6, spin: 0, pulse: 3.2 },
    thinking: { float: 2.4, fp: 2.4, breath: 0.02, bp: 2.4, spin: 12 },
    working: { float: 0.8, fp: 1.2, breath: 0, bp: 1.2, spin: 60, rumble: 0.8 },
    waiting: { float: 0, fp: 2, breath: 0, bp: 2, spin: 8, hop: 0.75 },
    done: { float: 1.8, fp: 2.8, breath: 0.02, bp: 2.8, spin: 0 },
    error: { float: 0.4, fp: 2, breath: 0, bp: 2, spin: 0, drop: 7, tilt: 32 },
    sleep: { float: 1, fp: 5.5, breath: 0.03, bp: 5.5, spin: 0, drop: 4 },
    drag: { float: 0, fp: 2, breath: 0, bp: 2, spin: 0, sx: 1.22, sy: 0.8 },
  };

  let state = '';
  let near = false;
  let lastActive = Date.now();
  let target = { x: 0, y: 0 };
  let moons = [];
  let shake = 0;
  let hopClock = 0;
  let nextWander = performance.now() + 5000;
  let override = null; // expressão temporária (reações)
  let focusUntil = 0; // olhando para o campo de texto
  const FACE = {
    idle: 'happy', notice: 'open', listening: 'wide', thinking: 'open', working: 'focus',
    waiting: 'wide', done: 'happy', error: 'x', sleep: 'sleep', drag: 'squint',
  };
  const flash = (face, ms) => (override = { face, until: performance.now() + ms });
  const side = () => (root.classList.contains('flip') ? 1 : -1);

  function pickState() {
    const c = root.classList;
    if (c.contains('dragging')) return 'drag';
    if (c.contains('agents-waiting')) return 'waiting';
    if (pet.classList.contains('error')) return 'error';
    if (c.contains('agents-working')) return 'working';
    if (c.contains('agents-done')) return 'done';
    if (c.contains('listening')) return 'listening';
    if (c.contains('thinking')) return 'thinking';
    if (c.contains('open') || near) return 'notice';
    if (Date.now() - lastActive > SLEEP_AFTER) return 'sleep';
    return 'idle';
  }

  // Reação de entrada em cada estado (impulsos nas molas).
  function enter(s, prev) {
    if (prev === 'drag') { S.sy.v += 8; S.sx.v -= 8; S.y.v -= 90; }
    if (prev === 'sleep') { S.y.v -= 70; S.sy.v += 3; }
    if (s === 'notice') { S.sy.v += 7; S.sx.v -= 7; S.y.v -= 150; flash('wide', 380); }
    if (s === 'done') { S.y.v -= 240; S.sx.v += 5; S.sy.v -= 5; S.spin.x = 110; }
    if (s === 'error') shake = 1;
    if (s === 'waiting') hopClock = 0;
    if (s === 'working') { S.sx.v += 3; S.sy.v -= 3; S.spin.x = 30; }
    if (s === 'thinking') { S.y.v -= 50; }
    if (s === 'listening') { S.sy.v += 4; S.sx.v -= 4; S.y.v -= 50; }
  }

  function update() {
    const s = pickState();
    if (s !== 'idle' && s !== 'sleep') lastActive = Date.now();
    if (s === state) return;
    const prev = state;
    state = s;
    host.dataset.state = s;
    enter(s, prev);
  }

  let launching = false;
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => {
    const l = pet.classList.contains('launch');
    if (l && !launching) { S.y.v -= 260; S.sx.v += 6; S.sy.v -= 6; S.spin.x = 120; S.yaw.t += Math.PI * 2; }
    launching = l;
    update();
  }).observe(pet, { attributes: true, attributeFilter: ['class'] });
  setInterval(update, 5000);
  update();

  // Piscar em tempos aleatórios.
  (function blink() {
    setTimeout(() => {
      if (['idle', 'notice', 'waiting', 'listening', 'thinking', 'done'].includes(state)) {
        eyes.classList.add('blink');
        setTimeout(() => eyes.classList.remove('blink'), 130);
        if (Math.random() < 0.2) {
          setTimeout(() => {
            eyes.classList.add('blink');
            setTimeout(() => eyes.classList.remove('blink'), 120);
          }, 260);
        }
      }
      blink();
    }, 2200 + Math.random() * 4200);
  })();

  // Uma lua girando no anel para cada agente ativo.
  function setMoons(n) {
    n = Math.min(n, 5);
    while (moons.length < n) {
      const el = document.createElementNS(NS, 'circle');
      el.setAttribute('r', '3.6');
      el.setAttribute('class', 'pt-moon');
      el.setAttribute('fill', 'url(#pt-moon)');
      moons.push({ el, a: Math.PI / 2 + moons.length * 1.9, k: 0 });
    }
    while (moons.length > n) moons.pop().el.remove();
  }

  let phF = 0, phB = 0, phP = 0, dashOff = 0, clock = 0;
  let lastT = performance.now();
  const f2 = n => n.toFixed(2);

  function frame(t) {
    const dt = Math.min(0.033, Math.max(0.001, (t - lastT) / 1000));
    lastT = t;
    clock += dt;
    const p = P[state] || P.idle;

    // alvos do estado atual
    S.famp.t = p.float; S.bamp.t = p.breath;
    S.spin.t = p.spin; S.pulse.t = p.pulse || 0; S.rumble.t = p.rumble || 0;
    S.drop.t = p.drop || 0; S.tilt.t = p.tilt || 0;
    S.sx.t = p.sx || 1; S.sy.t = p.sy || 1;
    S.gap.t = Math.abs(S.spin.x) > 1.2 ? 6 : 0;

    // precisa de você: pulinhos chamando
    if (p.hop) {
      hopClock -= dt;
      if (hopClock <= 0) {
        hopClock = p.hop;
        S.y.v -= 270; S.sx.v += 6; S.sy.v -= 6;
      }
    }

    // giro do rosto na esfera
    const calm = state === 'idle' || state === 'sleep';
    if (calm && t > nextWander) {
      nextWander = t + 6000 + Math.random() * 9000;
      if (state === 'idle' && Math.random() < 0.35) {
        S.yaw.t += (Math.random() < 0.5 ? -1 : 1) * Math.PI * 2;
      } else {
        S.yaw.t = Math.round(S.yaw.t / (Math.PI * 2)) * Math.PI * 2 +
          (Math.random() < 0.5 ? BASE_YAW : -BASE_YAW) * (0.7 + Math.random() * 0.5);
      }
    }
    if (!calm) {
      const turns = Math.round(S.yaw.x / (Math.PI * 2)) * Math.PI * 2;
      const want = state === 'thinking' ? -0.55
        : t < focusUntil ? side() * 0.55
        : state === 'notice' ? Math.max(-0.7, Math.min(0.7, target.x / 7))
        : state === 'error' ? 0.2 : 0;
      S.yaw.t = turns + want;
    }
    if (Math.abs(S.yaw.t - S.yaw.x) < 0.002 && Math.abs(S.yaw.v) < 0.01 && Math.abs(S.yaw.x) > Math.PI) {
      const k = Math.round(S.yaw.x / (Math.PI * 2)) * Math.PI * 2;
      S.yaw.x -= k; S.yaw.t -= k;
    }

    // olhar
    let tx = target.x * 0.6, ty = target.y;
    if (t < focusUntil) { tx = side() * 5; ty = 1.5; }
    if (state === 'thinking') { tx = -2; ty = -4.5; }
    if (state === 'sleep' || state === 'error') { tx = 0; ty = 1; }
    S.lx.t = tx; S.ly.t = ty;

    for (const k in S) step(S[k], dt);

    phF += (dt * Math.PI * 2) / p.fp;
    phB += (dt * Math.PI * 2) / p.bp;
    phP += dt * Math.PI * 2 * 1.6;
    dashOff -= S.spin.x * dt;
    shake = Math.max(0, shake - dt * 1.6);

    // corpo
    const y = S.y.x + Math.sin(phF) * S.famp.x;
    all.setAttribute('transform', `translate(0 ${f2(y)})`);
    const b = 1 + Math.sin(phB) * S.bamp.x;
    const rx = (Math.random() - 0.5) * S.rumble.x + Math.sin(clock * 46) * 3.4 * shake;
    const ry = (Math.random() - 0.5) * S.rumble.x;
    body.setAttribute('transform',
      `translate(${f2(CX + rx)} ${f2(CY + R + ry)}) scale(${f2(S.sx.x * b)} ${f2(S.sy.x * b)}) translate(${-CX} ${-(CY + R)})`);

    // anel
    for (const g of ringPos) {
      g.setAttribute('transform', `translate(0 ${f2(S.drop.x)}) rotate(${f2(S.tilt.x)} ${CX} ${CY}) translate(${CX} ${CY}) scale(${f2(1 + (S.sx.x - 1) * 0.5)} ${f2(1 + (S.sy.x - 1) * 0.5)}) translate(${-CX} ${-CY})`);
    }
    const w = 4.6 + S.pulse.x * (0.5 + 0.5 * Math.sin(phP));
    const gap = Math.max(0, S.gap.x);
    for (const r of ringPaths) {
      r.style.strokeWidth = f2(w);
      r.style.strokeDasharray = gap < 0.05 ? 'none' : `${f2(20 - gap)} ${f2(gap)}`;
      r.style.strokeDashoffset = f2(dashOff % 20);
    }

    // sombra no chão
    const lift = Math.max(0, -y);
    shadow.setAttribute('transform', `translate(${CX} 104) scale(${f2(Math.max(0.45, 1 - lift / 34))}) translate(${-CX} -104)`);
    shadow.style.opacity = f2(Math.max(0.12, 0.42 - lift / 60));

    // luas
    const mspeed = 0.8 + Math.abs(S.spin.x) * 0.035;
    for (const m of moons) {
      m.a += mspeed * dt;
      m.k = Math.min(1, m.k + dt * 3);
      const mx = CX + RX * Math.cos(m.a);
      const my = CY + RY * Math.sin(m.a);
      m.el.setAttribute('cx', f2(mx));
      m.el.setAttribute('cy', f2(my));
      m.el.setAttribute('r', f2(3.6 * m.k));
      const front = Math.sin(m.a) > 0;
      const parent = front ? moonsFront : moonsBack;
      if (m.el.parentNode !== parent) parent.appendChild(m.el);
    }

    // expressão do rosto
    const face = override && t < override.until ? override.face : FACE[state] || 'happy';
    if (host.dataset.face !== face) host.dataset.face = face;

    // rosto girando na esfera
    const sx = Math.cos(S.yaw.x);
    const fx = Math.sin(S.yaw.x) * R * TURN;
    turn.setAttribute('transform', `translate(${f2(fx)} 0) scale(${Math.max(0.02, Math.abs(sx)).toFixed(3)} 1)`);
    turn.style.opacity = f2(Math.max(0, Math.min(1, (sx - 0.08) * 5)));
    look.setAttribute('transform', `translate(${f2(S.lx.x)} ${f2(S.ly.x)})`);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    // dx/dy: distância do cursor até o centro do bichinho, em pixels físicos.
    look(dx, dy, size) {
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / (size * 1.5));
      target = { x: (dx / d) * k * 5.5, y: (dy / d) * k * 4.5 };
      const wasNear = near;
      near = wasNear ? d < size * 2.1 : d < size * 1.5; // com folga, sem piscar
      if (near) lastActive = Date.now();
      if (near !== wasNear || state === 'sleep') update();
    },
    setAgents(n) {
      setMoons(n);
    },
    // Reações rápidas às ações do usuário.
    react(kind) {
      lastActive = Date.now();
      const now = performance.now();
      switch (kind) {
        case 'type': // digitando: olha para o campo e dá um quique
          focusUntil = now + 1600;
          S.y.v -= 50; S.sy.v += 2.6; S.sx.v -= 2.6;
          break;
        case 'focus':
          focusUntil = now + 2500;
          S.sy.v += 2; S.sx.v -= 2;
          break;
        case 'gulp': // colou: "engole" o conteúdo
          flash('squint', 260);
          S.sx.v += 7; S.sy.v -= 7; S.y.v += 40;
          setTimeout(() => { S.y.v -= 170; S.sy.v += 6; S.sx.v -= 6; S.spin.x = 70; flash('happy', 700); }, 200);
          break;
        case 'go': // mandou a pergunta: aceno e já começa a pensar
          flash('wide', 350);
          S.y.v -= 180; S.ly.v += 60; S.spin.x = 60; S.sx.v -= 5; S.sy.v += 5;
          break;
        case 'no': // campo vazio: balança a cabeça
          flash('squint', 500);
          S.yaw.v += 14;
          setTimeout(() => (S.yaw.v -= 20), 140);
          setTimeout(() => (S.yaw.v += 14), 290);
          setTimeout(() => (S.yaw.v -= 8), 430);
          break;
        case 'talk': // resposta chegando: anel pulsa
          S.pulse.x = Math.min(5, S.pulse.x + 3.2);
          S.spin.x += 18;
          S.sy.v += 2.6; S.sx.v -= 2.6; S.y.v -= 30;
          break;
        case 'happy': // resposta pronta
          flash('happy', 1300);
          S.y.v -= 250; S.sx.v += 6; S.sy.v -= 6; S.spin.x = 90;
          break;
        case 'copy':
          flash('happy', 800);
          S.y.v -= 110; S.sy.v += 3;
          break;
        case 'bye':
          flash('happy', 600);
          S.sy.v -= 3; S.sx.v += 3;
          break;
        case 'heard': // voz reconhecida
          flash('happy', 600);
          S.y.v -= 120; S.spin.x = 40;
          break;
      }
    },
  };
}
