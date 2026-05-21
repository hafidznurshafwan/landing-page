// ═══════════════════════════════════════════
// CURSOR — adaptive via elementFromPoint
// ═══════════════════════════════════════════
const cur = document.getElementById("cur");
const ring = document.getElementById("cur-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;

// Dark bg colors we treat as "dark"
function bgIsDark(el) {
  if (!el || !(el instanceof Element)) return false;
  let node = el;
  while (node && node instanceof Element && node !== document.body) {
    const bg = getComputedStyle(node).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (m) {
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a < 0.05) {
        node = node.parentElement;
        continue;
      }
      const lum = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
      return lum < 0.35;
    }
    node = node.parentElement;
  }
  return false;
}

let hovering = false;

function updateCursor(overrideEl) {
  cur.style.transform = `translate(${mx - 6}px,${my - 6}px)`;
  if (hovering && !overrideEl) return;
  cur.style.visibility = "hidden";
  ring.style.visibility = "hidden";
  const el = overrideEl || document.elementFromPoint(mx, my);
  cur.style.visibility = "";
  ring.style.visibility = "";
  if (!el || !(el instanceof Element)) return;
  // walk up DOM with alpha >= 0.5 threshold
  let node = el;
  while (node && node instanceof Element) {
    const bg = getComputedStyle(node).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (m) {
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a >= 0.5) {
        const lum = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
        const dark = lum < 0.35;
        cur.classList.toggle("light", dark);
        ring.classList.toggle("light", dark);
        return;
      }
    }
    node = node.parentElement;
  }
}

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  updateCursor();
});
// on scroll: just reposition dot, don't re-check bg color

// smooth ring
(function tickRing() {
  rx += (mx - rx) * 0.2;
  ry += (my - ry) * 0.2;
  ring.style.transform = `translate(${rx - 18}px,${ry - 18}px)`;
  requestAnimationFrame(tickRing);
})();

// hover state — check bg from parent card context, not the small element itself
document.querySelectorAll("a,button").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    hovering = true;
    cur.classList.add("big");
    ring.classList.add("big");
    // walk up to find a meaningful background (card or section level)
    let node = el;
    let dark = false;
    while (node && node instanceof Element) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (m) {
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (a >= 0.5) {
          const lum = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
          dark = lum < 0.35;
          break;
        }
      }
      node = node.parentElement;
    }
    cur.classList.toggle("light", dark);
    ring.classList.toggle("light", dark);
  });
  el.addEventListener("mouseleave", () => {
    hovering = false;
    cur.classList.remove("big");
    ring.classList.remove("big");
    updateCursor();
  });
});

// ═══════════════════════════════════════════
// PARALLAX — multi-layer creative
// ═══════════════════════════════════════════
const heroFast = document.querySelectorAll(".parallax-fast");
const heroMed = document.querySelectorAll(".parallax-med");
const heroSlow = document.querySelectorAll(".parallax-slow");
const secHeads = document.querySelectorAll(".sec-headline");
const avatarCard = document.querySelector(".about-avatar-card");
const featProj = document.querySelector(".proj-featured");
const contactHead = document.querySelector(".contact-headline");

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}
// progress of element: 0 = just entered bottom, 1 = center of screen, 2 = exited top
function elProgress(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return (vh - r.top) / (vh + r.height);
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const sy = window.scrollY;
    const vh = window.innerHeight;

    // ── Hero layers
    heroSlow.forEach(
      (el) => (el.style.transform = `translateY(${sy * 0.08}px)`),
    );
    heroMed.forEach(
      (el) => (el.style.transform = `translateY(${sy * 0.15}px)`),
    );
    heroFast.forEach(
      (el) =>
        (el.style.transform = `translateY(${sy * 0.28}px) scale(${1 - sy * 0.00012})`),
    );

    // ── Section headlines — slide from slight left + fade (CSS handles fade via .rv)
    secHeads.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      const p = clamp((vh - r.top) / vh, 0, 1);
      const x = (1 - p) * -20;
      el.style.transform = `translateX(${x}px)`;
    });

    // ── Avatar counter-parallax — rises as you scroll down
    if (avatarCard) {
      const r = avatarCard.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = clamp(elProgress(avatarCard), 0, 1);
        avatarCard.style.transform = `translateY(${(0.5 - p) * -28}px)`;
      }
    }

    // ── Contact headline — slow drift up
    if (contactHead) {
      const r = contactHead.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = clamp(elProgress(contactHead), 0, 1);
        contactHead.style.transform = `translateY(${(1 - p) * 30}px)`;
      }
    }

    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// no mouse tilt — keeping it clean

// ── Featured card hover — match pcard behavior
let featHovered = false;
if (featProj) {
  featProj.addEventListener("mouseenter", () => {
    featHovered = true;
    featProj.style.transition =
      "transform .3s cubic-bezier(.25,.46,.45,.94), box-shadow .3s";
    featProj.style.transform = "translateY(-4px)";
    featProj.style.boxShadow = "0 14px 36px rgba(0,0,0,.28)";
  });
  featProj.addEventListener("mouseleave", () => {
    featHovered = false;
    featProj.style.transition =
      "transform .3s cubic-bezier(.25,.46,.45,.94), box-shadow .3s";
    featProj.style.transform = "";
    featProj.style.boxShadow = "";
  });
}

// ═══════════════════════════════════════════
// REVEAL — re-triggers on scroll up then down
// ═══════════════════════════════════════════
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove("rv-out");
        setTimeout(() => entry.target.classList.add("vis"), i * 70);
      } else {
        const r = entry.target.getBoundingClientRect();
        if (r.bottom < 0) {
          entry.target.classList.remove("vis");
          entry.target.classList.add("rv-out");
        }
      }
    });
  },
  { threshold: 0.08 },
);

document.querySelectorAll(".rv").forEach((el) => revealObs.observe(el));
