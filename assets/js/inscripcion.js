/* Inscripción · The Beer Mile ARG
 * Maqueta: sin publicar. Con ?demo=1 usa un backend simulado en memoria.
 * Los valores null se completan cuando Santi los defina (precio, alias). */
(function () {
  "use strict";

  var CONFIG = {
    precio: null, // ARS por corredor. A DEFINIR.
    alias: null, // A DEFINIR (standby).
    plazoHoras: 48,
    edadMinima: 18, // A DEFINIR (asesoría legal)
    maxComprobanteMB: 4,
    deslindeVersion: "v1-borrador",
    endpoints: {
      inscribir: "/.netlify/functions/inscribir",
      comprobante: "/.netlify/functions/comprobante",
      integrante: "/.netlify/functions/integrante",
    },
  };

  var params = new URLSearchParams(window.location.search);
  var DEMO = params.get("demo") === "1";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function money(n) {
    return "$" + Number(n).toLocaleString("es-AR");
  }

  /* ---------- Config en pantalla ---------- */
  $$("[data-config]").forEach(function (el) {
    var v = CONFIG[el.getAttribute("data-config")];
    if (v === null || v === undefined) return;
    el.textContent = el.getAttribute("data-config") === "precio" ? money(v) : v;
  });

  /* ---------- Validaciones ---------- */
  function edad(fechaISO) {
    var n = new Date(fechaISO);
    if (isNaN(n)) return -1;
    var hoy = new Date();
    var e = hoy.getFullYear() - n.getFullYear();
    var m = hoy.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
    return e;
  }

  function validar(form, soloIntegrante) {
    var d = Object.fromEntries(new FormData(form).entries());
    var errores = [];
    var postas = !soloIntegrante && d.modalidad === "postas";

    if (postas && !(d.equipo || "").trim())
      errores.push("Ponele nombre al equipo.");
    ["nombre", "apellido"].forEach(function (k) {
      if (!(d[k] || "").trim()) errores.push("Completá tu " + k + ".");
    });
    if (!/^\d{7,9}$/.test((d.dni || "").replace(/\./g, "")))
      errores.push("Revisá el DNI (solo números).");
    if (edad(d.nacimiento) < 0)
      errores.push("Completá la fecha de nacimiento.");
    else if (edad(d.nacimiento) < CONFIG.edadMinima)
      errores.push("No alcanzás la edad mínima para participar.");
    if (!/^\S+@\S+\.\S+$/.test(d.email || "")) errores.push("Revisá el email.");
    if ((d.celular || "").replace(/\D/g, "").length < 8)
      errores.push("Revisá el celular.");
    if (!/^\d{1,2}:[0-5]\d$/.test((d.milla || "").trim()))
      errores.push("La milla va como mm:ss, por ejemplo 7:30.");
    if (
      !(d.emergencia_nombre || "").trim() ||
      (d.emergencia_telefono || "").replace(/\D/g, "").length < 8
    )
      errores.push("Completá el contacto de emergencia.");
    if (!d.acepta_deslinde) errores.push("Tenés que aceptar el deslinde.");
    if (!soloIntegrante && !d.acepta_no_reembolso)
      errores.push("Tenés que aceptar que no hay reembolso.");
    if (!d.acepta_datos)
      errores.push("Tenés que autorizar el uso de imagen y datos.");

    d.deslindeVersion = CONFIG.deslindeVersion;
    return { datos: d, errores: errores };
  }

  function mostrarError(el, msgs) {
    if (!el) return;
    if (!msgs || !msgs.length) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.textContent = msgs.join(" ");
    el.hidden = false;
  }

  /* ---------- Backend (real o demo) ---------- */
  function token() {
    return Math.random().toString(36).slice(2, 10);
  }

  var mock = {
    inscribir: function (d) {
      var postas = d.modalidad === "postas";
      var vence = new Date(Date.now() + CONFIG.plazoHoras * 3600 * 1000);
      return Promise.resolve({
        codigo: "BM-" + String(Math.floor(Math.random() * 900) + 100),
        monto: CONFIG.precio === null ? null : CONFIG.precio * (postas ? 4 : 1),
        vence: vence.toISOString(),
        integrantes: postas
          ? [1, 2, 3].map(function (i) {
              return { n: i, token: token() };
            })
          : [],
        equipo: d.equipo || "",
      });
    },
    comprobante: function () {
      return Promise.resolve({ ok: true });
    },
    integrante: function () {
      return Promise.resolve({ ok: true, equipo: "Equipo de ejemplo" });
    },
  };

  function llamar(nombre, payload) {
    if (DEMO) return mock[nombre](payload);
    var esForm = payload instanceof FormData;
    return fetch(CONFIG.endpoints[nombre], {
      method: "POST",
      headers: esForm ? undefined : { "Content-Type": "application/json" },
      body: esForm ? payload : JSON.stringify(payload),
    }).then(function (r) {
      if (!r.ok)
        throw new Error(
          "No pudimos procesar el pedido. Probá de nuevo en un rato.",
        );
      return r.json();
    });
  }

  /* ---------- Página de inscripción ---------- */
  var regForm = $("#reg-form");
  if (regForm) {
    var onlyPostas = $$("[data-only='postas']");
    function togglePostas() {
      var postas = regForm.modalidad.value === "postas";
      onlyPostas.forEach(function (el) {
        el.hidden = !postas;
      });
    }
    $$("input[name='modalidad']", regForm).forEach(function (r) {
      r.addEventListener("change", togglePostas);
    });
    togglePostas();

    var regErr = $(".form-error", regForm);
    var regDone = $("#reg-done");
    var estado = {};

    regForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = validar(regForm, false);
      mostrarError(regErr, v.errores);
      if (v.errores.length) return;

      var btn = $("button[type='submit']", regForm);
      btn.disabled = true;
      llamar("inscribir", v.datos)
        .then(function (res) {
          estado = res;
          regForm.hidden = true;
          $("#reg-codigo").textContent = res.codigo;
          $("#reg-vence").textContent = new Date(res.vence).toLocaleString(
            "es-AR",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            },
          );
          $("#reg-monto").textContent =
            res.monto === null ? "A confirmar" : money(res.monto);
          if (res.integrantes && res.integrantes.length) armarLinks(res);
          regDone.hidden = false;
          regDone.focus();
        })
        .catch(function (err) {
          mostrarError(regErr, [err.message]);
          btn.disabled = false;
        });
    });

    function armarLinks(res) {
      var lista = $("#reg-team-list");
      lista.innerHTML = "";
      res.integrantes.forEach(function (m) {
        var url =
          window.location.origin +
          "/integrante.html?t=" +
          encodeURIComponent(m.token) +
          (DEMO ? "&demo=1" : "");
        var li = document.createElement("li");
        var input = document.createElement("input");
        input.type = "text";
        input.readOnly = true;
        input.value = url;
        input.setAttribute("aria-label", "Link del integrante " + m.n);
        var copiar = document.createElement("button");
        copiar.type = "button";
        copiar.className = "btn btn--sky btn--sm";
        copiar.textContent = "Copiar";
        copiar.addEventListener("click", function () {
          if (navigator.clipboard) navigator.clipboard.writeText(url);
          copiar.textContent = "Copiado";
        });
        var wa = document.createElement("a");
        wa.className = "btn btn--sky btn--sm";
        wa.target = "_blank";
        wa.rel = "noopener";
        wa.textContent = "WhatsApp";
        wa.href =
          "https://wa.me/?text=" +
          encodeURIComponent(
            "Completá tus datos para el equipo " +
              (res.equipo || "") +
              " en The Beer Mile: " +
              url,
          );
        li.appendChild(input);
        li.appendChild(copiar);
        li.appendChild(wa);
        lista.appendChild(li);
      });
      $("#reg-team-links").hidden = false;
    }

    var upForm = $("#reg-comprobante");
    upForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $(".form-error", upForm);
      var file = $("#comprobante").files[0];
      if (!file)
        return mostrarError(err, ["Elegí el archivo del comprobante."]);
      if (file.size > CONFIG.maxComprobanteMB * 1024 * 1024)
        return mostrarError(err, [
          "El archivo pesa más de " + CONFIG.maxComprobanteMB + " MB.",
        ]);
      if (!/^(image\/|application\/pdf)/.test(file.type))
        return mostrarError(err, ["Subí una imagen o un PDF."]);
      mostrarError(err, []);
      var fd = new FormData();
      fd.append("codigo", estado.codigo);
      fd.append("comprobante", file);
      var btn = $("button[type='submit']", upForm);
      btn.disabled = true;
      llamar("comprobante", fd)
        .then(function () {
          upForm.hidden = true;
          $("#reg-uploaded").hidden = false;
        })
        .catch(function (ex) {
          mostrarError(err, [ex.message]);
          btn.disabled = false;
        });
    });
  }

  /* ---------- Página del integrante ---------- */
  var memForm = $("#member-form");
  if (memForm) {
    var t = params.get("t");
    var memErr = $(".form-error", memForm);
    if (!t) {
      mostrarError(memErr, [
        "Este link no es válido. Pedile uno nuevo a tu capitán.",
      ]);
      $("button[type='submit']", memForm).disabled = true;
    }
    if (DEMO) $("#mem-equipo").textContent = "de ejemplo";

    memForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = validar(memForm, true);
      mostrarError(memErr, v.errores);
      if (v.errores.length) return;
      v.datos.token = t;
      var btn = $("button[type='submit']", memForm);
      btn.disabled = true;
      llamar("integrante", v.datos)
        .then(function () {
          memForm.hidden = true;
          var done = $("#member-done");
          done.hidden = false;
          done.focus();
        })
        .catch(function (ex) {
          mostrarError(memErr, [ex.message]);
          btn.disabled = false;
        });
    });
  }
})();
