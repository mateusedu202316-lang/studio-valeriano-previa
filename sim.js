// Simulador ilustrativo: cílios e sobrancelha mudam conforme o procedimento.
(() => {
  const root = document.querySelector(".sim");
  if (!root) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const $ = s => root.querySelector(s);
  const mk = (parent, tag = "path") => parent.appendChild(document.createElementNS(NS, tag));
  const bez = (a, b, c, t) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c;
  const rnd = i => { const x = Math.sin(i * 91.7) * 4375.5; return x - Math.floor(x) - .5; };

  const LASH = {
    natural: { len: 46, lift: .28, curl: .1, dens: .25, w: 2.2 },
    lifting: { len: 70, lift: 1, curl: .75, dens: .35, w: 2.8 },
    extensao: { len: 90, lift: .95, curl: .6, dens: 1, w: 3 },
  };
  const BROW = {
    natural: { mess: 1, up: 0, len: 32, fill: 0 },
    lamination: { mess: .15, up: 1, len: 46, fill: 0 },
    henna: { mess: .5, up: .25, len: 34, fill: .55 },
  };
  const want = { ...LASH.natural, ...prefix(BROW.natural) }, now = { ...want };
  function prefix(o) { return Object.fromEntries(Object.entries(o).map(([k, v]) => ["b" + k, v])); }

  const gl = $(".s-lash"), gb = $(".s-brow"), fill = $(".s-fill"), iris = $(".s-iris");
  const lashes = Array.from({ length: 45 }, (_, i) => ({ t: .04 + i / 44 * .92, i, el: mk(gl) }));
  const hairs = Array.from({ length: 120 }, (_, i) => ({ t: i / 119, i, el: mk(gb) }));

  const paint = () => {
    for (const { t, i, el } of lashes) {
      const x = bez(150, 390, 650, t), y = bez(300, 120, 290, t);
      const a = (-158 + 136 * t + rnd(i) * 7) * Math.PI / 180;
      const l = now.len * (.72 + .42 * Math.sin(Math.PI * Math.min(1, t * .75 + .18))) * (1 + rnd(i + 50) * .16);
      const dx = Math.cos(a) * l, up = Math.sin(a) * l * now.lift;
      el.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)}Q${(x + dx * .62).toFixed(1)} ${(y + up * .5 + 12 * now.curl).toFixed(1)} ${(x + dx).toFixed(1)} ${(y + up - 8 * now.curl).toFixed(1)}`);
      el.style.strokeWidth = now.w;
      el.style.opacity = i % 2 ? now.dens : 1;
    }
    for (const { t, i, el } of hairs) {
      const band = (rnd(i + 9) + .5) * (34 - 24 * t);
      const x = bez(190, 400, 650, t), y = bez(112, -6, 92, t) + band;
      const base = -62 + 62 * t, lifted = -82 + 66 * t;
      const a = (base + (lifted - base) * now.bup + rnd(i + 3) * 70 * now.bmess) * Math.PI / 180;
      const l = now.blen * (1 - .35 * t);
      el.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)}q${(Math.cos(a) * l * .4).toFixed(1)} ${(Math.sin(a) * l * .7).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`);
    }
    fill.style.opacity = now.bfill;
  };

  const look = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  root.addEventListener("pointermove", e => {
    const r = $("svg").getBoundingClientRect();
    aim.x = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)) * 34;
    aim.y = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)) * 14;
  });

  let visible = false, raf = 0;
  const tick = () => {
    let moving = false;
    for (const k in want) {
      const d = want[k] - now[k];
      if (Math.abs(d) > .002) { now[k] += d * .085; moving = true; } else now[k] = want[k];
    }
    if (moving) paint();
    look.x += (aim.x - look.x) * .1; look.y += (aim.y - look.y) * .1;
    iris.setAttribute("transform", `translate(${look.x.toFixed(2)} ${look.y.toFixed(2)})`);
    raf = visible ? requestAnimationFrame(tick) : 0;
  };
  if (!still) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) tick(); }).observe(root);

  const pick = (attr, map, pre) => root.querySelectorAll(`[${attr}]`).forEach(b => b.addEventListener("click", () => {
    root.querySelectorAll(`[${attr}]`).forEach(x => x.setAttribute("aria-pressed", x === b));
    Object.assign(want, pre ? prefix(map[b.getAttribute(attr)]) : map[b.getAttribute(attr)]);
    if (still) { Object.assign(now, want); paint(); }
  }));
  pick("data-lash", LASH, false); pick("data-brow", BROW, true);

  // Adiciona o efeito à lista usando os mesmos botões dos procedimentos.
  $(".sim-add").addEventListener("click", () => {
    const names = [...root.querySelectorAll("[aria-pressed=true][data-proc]")].map(b => b.dataset.proc);
    names.forEach(n => {
      const b = document.querySelector(`.add[data-add="${n}"]`);
      if (b.getAttribute("aria-pressed") !== "true") b.click();
    });
    $(".sim-note").textContent = names.length ? "Adicionado à sua lista." : "Escolha um efeito primeiro.";
  });
  paint();
})();
