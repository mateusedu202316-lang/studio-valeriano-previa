(() => {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = v => Math.min(1, Math.max(0, v)), mix = (a, b, t) => a + (b - a) * t;

  // Forma de olho: duas curvas que se abrem em volta do centro.
  const almond = (cx, cy, w, up, down) =>
    `path("M${cx - w} ${cy} C${cx - w * .45} ${cy - up * 1.33} ${cx + w * .45} ${cy - up * 1.33} ${cx + w} ${cy} C${cx + w * .45} ${cy + down * 1.33} ${cx - w * .45} ${cy + down * 1.33} ${cx - w} ${cy}Z")`;

  const hero = $(".hero"), stage = $(".stage"), eye = $(".eye"), img = $(".eye img"), shade = $(".shade");
  const head = $(".hero-top"), low = $(".hero-low"), end = $(".hero-end");
  const EX = .557, EY = .56, RATIO = .5625, SPAN = .58; // posição da íris e largura do olho na foto
  const born = performance.now();
  let vw, vh, cx, cy, W, lastP = -1, lastO = -1;
  const size = () => {
    vw = stage.clientWidth; vh = stage.clientHeight; cx = vw / 2; cy = vh * .55;
    const tall = vh > vw;
    // No celular a foto vira uma faixa inteira, sem ampliar demais.
    W = tall ? vw * 2 : Math.max(vw / 2 / (1 - EX), cy / (EY * RATIO), (vh - cy) / ((1 - EY) * RATIO)) * 1.02;
    eye.classList.toggle("band", tall);
    img.style.width = W + "px";
    img.style.left = cx - EX * W + "px";
    img.style.top = cy - EY * RATIO * W + "px";
    img.style.transformOrigin = `${EX * 100}% ${EY * 100}%`;
    lastP = -1;
  };
  const draw = now => {
    const p = still ? 0 : clamp(-hero.getBoundingClientRect().top / (hero.offsetHeight - vh));
    const o = still ? 1 : 1 - Math.pow(1 - clamp((now - born - 350) / 1300), 3);
    if (p !== lastP || o !== lastO) {
      lastP = p; lastO = o;
      const t = Math.pow(clamp(p / .75), 1.7);
      const w0 = Math.min(vw * .45, 430), h0 = Math.min(w0 * .6, vh * .2);
      const k0 = Math.min(1, Math.max(w0 * 1.02 / ((1 - EX) * W), Math.min(w0 * 1.75 / (W * SPAN), h0 / (.2 * W))));
      eye.style.clipPath = t >= 1 ? "none" : almond(cx, cy, mix(w0, vw * 1.6, t), mix(h0 * o + 1, vh * 1.5, t), mix(h0 * .85 * o + 1, vh * 1.5, t));
      const z = clamp(t / (vh > vw ? 1 : .13)); // a foto cresce antes da abertura, para não mostrar a borda
      img.style.transform = `scale(${mix(k0, 1, z * z * (3 - 2 * z))})`;
      const gone = 1 - clamp(p / .22);
      head.style.opacity = low.style.opacity = gone;
      low.style.visibility = gone ? "" : "hidden";
      end.style.opacity = shade.style.opacity = clamp((p - .7) / .2);
    }
    if (!still) requestAnimationFrame(draw);
  };
  size(); draw(born);
  addEventListener("resize", () => { size(); if (still) draw(performance.now()); });

  const shapes = $$("[data-almond]");
  const shape = () => shapes.forEach(f => {
    const w = f.clientWidth, h = f.clientHeight;
    f.style.clipPath = almond(w / 2, h / 2, w / 2, h / 2, h / 2);
  });
  shape(); addEventListener("resize", shape);

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
  }), { threshold: .2 });
  $$("[data-rise], .draw").forEach(e => io.observe(e));

  // Apresentação: cada fala acende ao chegar no meio da tela e a foto se aproxima devagar.
  const says = $$(".say"), ana = $(".ana"), portrait = $(".ana-photo img");
  const talk = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("on", e.isIntersecting)), { rootMargin: "-25% 0px -25%" });
  says.forEach(e => talk.observe(e));
  if (!still) addEventListener("scroll", () => {
    const r = ana.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) portrait.style.transform = `scale(${1.08 - .08 * clamp((innerHeight - r.top) / r.height)})`;
  }, { passive: true });

  const tabs = $$(".tabs a");
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    tabs.forEach(a => a.classList.toggle("on", a.hash === "#" + e.target.id));
    const on = $(".tabs a.on");
    on.parentNode.scrollTo({ left: on.offsetLeft - 20, behavior: still ? "auto" : "smooth" });
  }), { rootMargin: "-35% 0px -60%" });
  $$("[data-cat]").forEach(c => spy.observe(c));

  // Guia: abre o procedimento sugerido.
  $$("[data-go]").forEach(b => b.addEventListener("click", () => {
    const d = document.getElementById(b.dataset.go);
    d.open = true; d.classList.remove("flash"); void d.offsetWidth; d.classList.add("flash");
    $("summary", d).focus({ preventScroll: true });
    d.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
  }));

  // Lista de procedimentos. O link do WhatsApp dela não aceita texto pronto, por isso copiamos.
  const picked = new Set(), bar = $(".bar"), adds = $$("[data-add]"), send = $(".bar .btn");
  const message = () => `Oi, Ana Júlia! Vim pelo site e quero saber sobre: ${[...picked].join(", ")}.`;
  const refresh = () => {
    adds.forEach(b => {
      const on = picked.has(b.dataset.add);
      b.setAttribute("aria-pressed", on);
      b.textContent = on ? "Escolhido" : "Quero este";
    });
    bar.classList.toggle("on", picked.size > 0);
    $("b", bar).textContent = picked.size === 1 ? "1 procedimento escolhido" : `${picked.size} procedimentos escolhidos`;
    $("span", bar).textContent = [...picked].join(", ");
    send.textContent = "Copiar e abrir WhatsApp";
  };
  adds.forEach(b => b.addEventListener("click", () => {
    const n = b.dataset.add;
    picked.has(n) ? picked.delete(n) : picked.add(n);
    refresh();
  }));
  $(".clear").addEventListener("click", () => { picked.clear(); refresh(); });
  send.addEventListener("click", () => {
    navigator.clipboard?.writeText(message()).then(() => { send.textContent = "Copiado! É só colar lá"; }, () => {});
  });

  const strip = $(".strip");
  $$("[data-move]").forEach(b => b.addEventListener("click", () =>
    strip.scrollBy({ left: b.dataset.move * strip.clientWidth * .7, behavior: still ? "auto" : "smooth" })));
  let down = null, dragged = false;
  strip.addEventListener("pointerdown", e => { dragged = false; if (e.pointerType === "mouse") down = { x: e.clientX, l: strip.scrollLeft }; });
  addEventListener("pointermove", e => {
    if (!down) return;
    const d = e.clientX - down.x;
    if (Math.abs(d) > 5) dragged = true;
    strip.scrollLeft = down.l - d;
  });
  addEventListener("pointerup", () => { down = null; });

  const light = $(".light");
  $$("[data-full]").forEach(b => b.addEventListener("click", () => {
    if (dragged) { dragged = false; return; }
    const i = $("img", light);
    i.src = b.dataset.full; i.alt = $("img", b).alt; light.showModal();
  }));
  light.addEventListener("click", e => { if (e.target.tagName !== "IMG") light.close(); });
})();
