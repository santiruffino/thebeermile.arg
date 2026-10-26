/* Beer Mile Córdoba · interacciones de la landing
 *
 * 1. <beer-glass>: vaso decorativo de la marca (SVG).
 * 2. Botones "Quiero esta": preseleccionan la modalidad en el formulario.
 * 3. Formulario de lista de espera: envío por AJAX a Netlify Forms.
 * 4. Eventos de Google Analytics (GA4).
 */

/* ---------------------------------------------------------------
 * 1. <beer-glass level="75" motion="slosh">
 *    level:  100 (por defecto) | 75 | 50 | 25 → cuánta birra tiene
 *    motion: clase de animación del líquido (slosh, lap1…lap4, pour)
 *    Es decorativo: siempre queda oculto para lectores de pantalla.
 * ------------------------------------------------------------- */
const SVG_NS = "http://www.w3.org/2000/svg";

class BeerGlass extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;

    const motions = (this.getAttribute("motion") || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((m) => `glass__beer--${m}`)
      .join(" ");

    this.setAttribute("aria-hidden", "true");
    this.innerHTML = `
      <svg class="glass__svg" viewBox="0 0 60 90" focusable="false">
        <g clip-path="url(#glass-clip)">
          <g class="glass__fill">
            <g class="glass__beer ${motions}">
              <rect class="glass__liquid" x="0" y="8" width="60" height="82" />
              <rect class="glass__foam" x="0" y="8" width="60" height="7" />
            </g>
          </g>
        </g>
        <path class="glass__outline" d="M8 6 L52 6 L46 84 L14 84 Z" />
      </svg>`;
  }
}

if (!customElements.get("beer-glass")) {
  customElements.define("beer-glass", BeerGlass);
}

/* ---------------------------------------------------------------
 * Analytics: manda un evento a GA4 si gtag está cargado.
 * Nunca se envían datos personales (nombre, email, Instagram).
 * ------------------------------------------------------------- */
const track = (name, params = {}) => {
  if (typeof window.gtag === "function") window.gtag("event", name, params);
};

/** Sección donde ocurrió algo: id de la <section>, "header" o "footer". */
const locationOf = (el) => {
  const area = el.closest("section[id], header, footer");
  if (!area) return "otro";
  return area.id || area.tagName.toLowerCase();
};

/* ---------------------------------------------------------------
 * 2 y 3. Lista de espera
 * ------------------------------------------------------------- */
const MODE_LABELS = {
  individual: "Individual",
  postas: "Postas",
  nose: "la modalidad que elijas",
};

const form = document.querySelector(".waitlist-form");

if (form) {
  const success = document.querySelector(".success");
  const errorMsg = form.querySelector(".form-error");
  const submitBtn = form.querySelector('[type="submit"]');

  const pickMode = (mode) => {
    const radio = form.querySelector(`input[name="modalidad"][value="${mode}"]`);
    if (radio) radio.checked = true;
  };

  document.querySelectorAll("[data-pick-mode]").forEach((link) => {
    link.addEventListener("click", () => {
      pickMode(link.dataset.pickMode);
      track("select_mode", { mode: link.dataset.pickMode, source: "tarjeta" });
    });
  });

  // Primera interacción con el formulario (una vez por visita a la página)
  form.addEventListener("focusin", () => track("form_start", { form_name: "lista-de-espera" }), {
    once: true,
  });

  form.querySelectorAll('input[name="modalidad"]').forEach((radio) => {
    radio.addEventListener("change", () => track("select_mode", { mode: radio.value, source: "formulario" }));
  });

  const fillSuccess = (data) => {
    const firstName = String(data.get("nombre") || "")
      .trim()
      .split(/\s+/)[0];
    const values = {
      nombre: firstName || "crack",
      modalidad: MODE_LABELS[data.get("modalidad")] || MODE_LABELS.nose,
      email: String(data.get("email") || ""),
    };
    success.querySelectorAll("[data-success]").forEach((el) => {
      el.textContent = values[el.dataset.success];
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMsg.hidden = true;
    submitBtn.disabled = true;

    const data = new FormData(form);

    try {
      // Netlify Forms solo acepta cuerpos URL-encoded (no JSON).
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Conversión principal: marcarla como "evento clave" en GA4
      track("generate_lead", {
        form_name: "lista-de-espera",
        mode: data.get("modalidad"),
        experience: data.get("experiencia"),
        mile_time: data.get("milla"),
        has_instagram: data.get("instagram") ? "si" : "no",
      });

      fillSuccess(data);
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
    } catch (err) {
      console.error("[lista-de-espera]", err);
      track("form_error", { form_name: "lista-de-espera", error: String(err.message || err).slice(0, 100) });
      errorMsg.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  success.querySelector('[data-action="reset"]').addEventListener("click", () => {
    track("form_reset", { form_name: "lista-de-espera" });
    form.reset();
    success.hidden = true;
    form.hidden = false;
    form.querySelector("#nombre").focus();
  });
}

/* ---------------------------------------------------------------
 * 4. Eventos de navegación
 * ------------------------------------------------------------- */

// Clicks: links internos (CTAs y menú) e Instagram.
// Los "Quiero esta" ya mandan select_mode, así que no se cuentan dos veces.
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || link.hasAttribute("data-pick-mode")) return;

  const href = link.getAttribute("href");
  const text = link.textContent.trim().replace(/\s+/g, " ").slice(0, 60);

  if (href.includes("instagram.com")) {
    track("click_instagram", { location: locationOf(link) });
  } else if (href.startsWith("#") || href === "/") {
    track("cta_click", { link_text: text, destination: href, location: locationOf(link) });
  }
});

// Secciones vistas: cuánta gente llega a cada parte de la landing (una vez por sección).
// Cuenta si la sección queda en pantalla al menos 1 s, así el scroll suave de los
// links del menú no marca como vistas las secciones que solo atraviesa.
if ("IntersectionObserver" in window) {
  const timers = new Map();
  const seen = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const section = entry.target;
        if (!entry.isIntersecting) {
          clearTimeout(timers.get(section));
          return;
        }
        timers.set(
          section,
          setTimeout(() => {
            track("view_section", { section: section.id });
            seen.unobserve(section);
          }, 1000),
        );
      });
    },
    // Cuenta cuando el borde superior de la sección pasa el 60 % de la pantalla
    // (funciona también con secciones más altas que la pantalla).
    { rootMargin: "0px 0px -40% 0px" },
  );
  document.querySelectorAll("main section[id]").forEach((section) => seen.observe(section));
}
