const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const nav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setScrolledHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function closeNavigation() {
  nav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
}

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeNavigation);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const active = `.site-nav a[href="#${entry.target.id}"]`;
      navLinks.forEach((link) => link.classList.toggle("is-active", link.matches(active)));
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0,
  },
);

sections.forEach((section) => observer.observe(section));
window.addEventListener("scroll", setScrolledHeader, { passive: true });
setScrolledHeader();

function setupHeroMotion() {
  if (!hero || prefersReducedMotion) return;

  hero.addEventListener(
    "pointermove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--pointer-x", x.toFixed(3));
      hero.style.setProperty("--pointer-y", y.toFixed(3));
    },
    { passive: true },
  );

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--pointer-x", "0");
    hero.style.setProperty("--pointer-y", "0");
  });
}

function setupHeroCanvas() {
  const canvas = document.querySelector("[data-hero-canvas]");
  if (!canvas || prefersReducedMotion) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let particles = [];

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = width < 700 ? 30 : 58;
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: index % 7 === 0 ? 2.4 : 1.4,
    }));
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    particles.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 150) continue;
        const alpha = 1 - distance / 150;
        context.strokeStyle = `rgba(93, 230, 228, ${alpha * 0.22})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }

    particles.forEach((point) => {
      const glow = pointer.active ? Math.max(0, 1 - Math.hypot(point.x - pointer.x, point.y - pointer.y) / 220) : 0;
      context.fillStyle = glow > 0 ? `rgba(143, 196, 63, ${0.35 + glow * 0.45})` : "rgba(255, 255, 255, 0.55)";
      context.beginPath();
      context.arc(point.x, point.y, point.r + glow * 2, 0, Math.PI * 2);
      context.fill();
    });

    requestAnimationFrame(draw);
  }

  hero?.addEventListener(
    "pointermove",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    },
    { passive: true },
  );

  hero?.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  draw();
}

function setupTopicSpotlight() {
  const cards = [...document.querySelectorAll(".topic-card")];
  const label = document.querySelector("[data-topic-label]");
  const letter = document.querySelector("[data-topic-letter]");
  const title = document.querySelector("[data-topic-title]");
  const copy = document.querySelector("[data-topic-copy]");
  const tags = document.querySelector("[data-topic-tags]");
  if (!cards.length || !label || !letter || !title || !copy || !tags) return;

  function setActive(card) {
    cards.forEach((item) => item.classList.toggle("is-active", item === card));
    const topic = card.dataset.topic || "";
    label.textContent = `Focus Area ${topic}`;
    letter.textContent = topic;
    title.textContent = card.querySelector("h3")?.textContent || "";
    copy.textContent = card.querySelector("p")?.textContent?.trim() || "";
    tags.replaceChildren(
      ...(card.dataset.tags || "")
        .split(",")
        .filter(Boolean)
        .map((tag) => {
          const chip = document.createElement("span");
          chip.textContent = tag.trim();
          return chip;
        }),
    );
  }

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => setActive(card));
    card.addEventListener("focus", () => setActive(card));
    card.addEventListener("click", () => setActive(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setActive(card);
    });
  });

  setActive(cards[0]);
}

function setupCountdown() {
  const daysNode = document.querySelector("[data-countdown-days]");
  const statusNode = document.querySelector("[data-countdown-status]");
  const progressNode = document.querySelector("[data-deadline-progress]");
  if (!daysNode || !statusNode || !progressNode) return;

  const start = new Date("2026-06-12T00:00:00+08:00");
  const deadline = new Date("2026-11-07T23:59:59+08:00");

  function update() {
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(remaining / 86400000));
    const total = deadline.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));

    daysNode.textContent = String(days);
    statusNode.textContent = remaining > 0 ? "Submission deadline: Nov. 7, 2026" : "Submission deadline has passed";
    progressNode.style.setProperty("--deadline-progress", `${progress.toFixed(1)}%`);
  }

  update();
  window.setInterval(update, 60 * 60 * 1000);
}

function setupScheduleFocus() {
  const rows = [...document.querySelectorAll(".schedule-table [role='row']")];
  const timeNode = document.querySelector("[data-schedule-time]");
  const titleNode = document.querySelector("[data-schedule-title]");
  const noteNode = document.querySelector("[data-schedule-note]");
  if (!rows.length || !timeNode || !titleNode || !noteNode) return;

  function setActive(row) {
    rows.forEach((item) => item.classList.toggle("is-active", item === row));
    timeNode.textContent = row.querySelector("time")?.textContent || "";
    titleNode.textContent = row.querySelector("span")?.textContent || "";
    noteNode.textContent = row.dataset.note || "";
  }

  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => setActive(row));
    row.addEventListener("focus", () => setActive(row));
    row.addEventListener("click", () => setActive(row));
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setActive(row);
    });
  });

  setActive(rows[0]);
}

function setupReveal() {
  const items = [
    ...document.querySelectorAll(
      ".section-kicker, .section-grid, .heading-row, .value-grid div, .topic-stage, .topic-card, .deadline-panel, .timeline-item, .schedule-focus, .schedule-table [role='row'], .person-card, .bio-panel, .committee-list span, .history-grid article, .signal-strip div",
    ),
  ];
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  items.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.transitionDelay = `${Math.min(index % 8, 5) * 42}ms`;
    revealObserver.observe(item);
  });
}

function setupCardTilt() {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover)").matches) return;
  const cards = [...document.querySelectorAll(".topic-card, .person-card")];

  cards.forEach((card) => {
    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
      },
      { passive: true },
    );

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

setupHeroMotion();
setupHeroCanvas();
setupTopicSpotlight();
setupCountdown();
setupScheduleFocus();
setupReveal();
setupCardTilt();
