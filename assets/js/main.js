const state = {
  language: localStorage.getItem("l38-language") || "vi",
};

document.documentElement.classList.add("js");

const selectors = {
  header: document.querySelector("[data-header]"),
  nav: document.querySelector(".main-nav"),
  menuToggle: document.querySelector("[data-menu-toggle]"),
  language: document.querySelector("[data-language]"),
  heroStats: document.querySelector("[data-hero-stats]"),
  services: document.querySelector("[data-services]"),
  capabilities: document.querySelector("[data-capabilities]"),
  markets: document.querySelector("[data-markets]"),
  stats: document.querySelector("[data-stats]"),
  values: document.querySelector("[data-values]"),
  scrollTop: document.querySelector("[data-scroll-top]"),
};

const getValue = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);

async function loadLanguage(language) {
  const response = await fetch(`./assets/lang/${language}.json`);
  if (!response.ok) throw new Error(`Cannot load language: ${language}`);
  return response.json();
}

function setTextContent(translations) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = getValue(translations, element.dataset.i18n);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attribute, path] = pair.split(":").map((value) => value.trim());
      const value = getValue(translations, path);
      if (attribute && typeof value === "string") {
        element.setAttribute(attribute, value);
      }
    });
  });

  document.documentElement.lang = state.language;
  document.title = translations.meta.title;
}

function renderServices(items) {
  selectors.services.innerHTML = items
    .map(
      (item, index) => `
        <article class="service-card reveal">
          <span class="service-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${item.title}</h3>
          <ul>${item.items.map((line) => `<li>${line}</li>`).join("")}</ul>
        </article>
      `,
    )
    .join("");
}

function renderCapabilities(items) {
  selectors.capabilities.innerHTML = items.map((item) => `<span>${item}</span>`).join("");
}

function renderMarkets(items) {
  selectors.markets.innerHTML = items.map((item) => `<div class="market-pill reveal">${item}</div>`).join("");
}

function renderStats(items) {
  selectors.heroStats.innerHTML = items
    .slice(0, 3)
    .map(
      (item) => `
        <span class="hero-stat">
          <strong>${item.value}</strong>
          <small>${item.label}</small>
        </span>
      `,
    )
    .join("");

  selectors.stats.innerHTML = items
    .map(
      (item) => `
        <article class="stat-card reveal">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </article>
      `,
    )
    .join("");
}

function renderValues(items) {
  selectors.values.innerHTML = items
    .map(
      (item) => `
        <article class="value-card reveal">
          <h3>${item.title}</h3>
          <p>${item.copy}</p>
        </article>
      `,
    )
    .join("");
}

function applyRevealObserver() {
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));
}

async function applyLanguage(language) {
  state.language = language;
  localStorage.setItem("l38-language", language);
  selectors.language.value = language;

  const translations = await loadLanguage(language);
  setTextContent(translations);
  renderServices(translations.services.items);
  renderCapabilities(translations.capacity.items);
  renderMarkets(translations.markets.items);
  renderStats(translations.stats.items);
  renderValues(translations.values.items);
  applyRevealObserver();
}

function setupNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".main-nav a[href^='#']")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { threshold: 0.38 },
  );

  sections.forEach((section) => observer.observe(section));
}

function closeMenu() {
  selectors.nav.classList.remove("is-open");
  selectors.menuToggle.classList.remove("is-open");
  selectors.menuToggle.setAttribute("aria-expanded", "false");
}

function setupHeader() {
  const updateHeader = () => {
    selectors.header.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  selectors.menuToggle.addEventListener("click", () => {
    const isOpen = selectors.nav.classList.toggle("is-open");
    selectors.menuToggle.classList.toggle("is-open", isOpen);
    selectors.menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!selectors.header.contains(event.target)) closeMenu();
  });
}

function setupScrollTop() {
  const button = selectors.scrollTop;
  if (!button) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const updateButton = () => {
    const isVisible = window.scrollY > Math.max(480, window.innerHeight * 0.72);

    button.classList.toggle("is-visible", isVisible);
    button.setAttribute("aria-hidden", String(!isVisible));
    button.tabIndex = isVisible ? 0 : -1;
  };

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  });

  updateButton();
  window.addEventListener("scroll", updateButton, { passive: true });
}

function setupLanguageSwitcher() {
  selectors.language.value = state.language;
  selectors.language.addEventListener("change", (event) => {
    applyLanguage(event.target.value);
  });
}

function setupImageFallbacks() {
  document.querySelectorAll("img[data-image-fallback]").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const fallback = image.dataset.imageFallback;
        if (fallback && image.src !== fallback) {
          image.src = fallback;
        }
      },
      { once: true },
    );
  });
}

document.querySelector("[data-year]").textContent = new Date().getFullYear();
setupImageFallbacks();
setupHeader();
setupScrollTop();
setupNavigation();
setupLanguageSwitcher();
applyLanguage(state.language).catch(() => applyLanguage("vi"));
