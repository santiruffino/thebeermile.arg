/* Beer Mile Córdoba · interacciones de la landing
 *
 * 1. <beer-glass>: vaso decorativo de la marca (SVG).
 * 2. Botones "Quiero esta": preseleccionan la modalidad en el formulario.
 * 3. Formulario de lista de espera: envío por AJAX a Netlify Forms.
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
    link.addEventListener("click", () => pickMode(link.dataset.pickMode));
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

      fillSuccess(data);
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
    } catch (err) {
      console.error("[lista-de-espera]", err);
      errorMsg.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  success.querySelector('[data-action="reset"]').addEventListener("click", () => {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    form.querySelector("#nombre").focus();
  });
}
