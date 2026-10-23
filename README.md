# Beer Mile Córdoba · Landing

Landing de la Beer Mile Córdoba ([@thebeermile.arg](https://www.instagram.com/thebeermile.arg/)): qué es la carrera, las dos modalidades (Individual y Postas), las reglas y el formulario de lista de espera.

Es un sitio estático: un solo `index.html`, sin build ni dependencias. Las fuentes (Anton y Archivo) se cargan desde Google Fonts.

## Deploy en Netlify

1. En Netlify: **Add new project → Import an existing project → GitHub** y elegí este repo.
2. No toques build ni publish: ya están en `netlify.toml`. El build solo reemplaza `__SITE_URL__` en `index.html` por la URL del sitio.
3. Deploy.

## Formulario de lista de espera

Usa **Netlify Forms**: el `<form name="lista-de-espera" data-netlify="true">` se detecta solo en cada deploy.

- Los envíos se ven en Netlify → el proyecto → **Forms → lista-de-espera**. Desde ahí se exportan a CSV.
- Para recibir un mail por cada anotado: **Project configuration → Notifications → Emails and webhooks → Form submission notifications**.
- Si no aparece el formulario después del primer deploy, revisá que **Form detection** esté activado en **Project configuration → Forms**.
- Tiene un campo trampa (`bot-field`) contra spam.

Campos que llegan: `nombre`, `email`, `instagram`, `modalidad` (`individual` / `postas` / `nose`), `experiencia`, `milla`, `mayor`.

## Probar en local

```bash
python3 -m http.server 8080
```

El formulario solo guarda datos una vez deployado en Netlify (en local va a mostrar el mensaje de error al enviar).

## Metadata para compartir

- `og-image.png` (1200×630): la imagen que aparece al compartir el link por WhatsApp, Instagram, Facebook, X o LinkedIn. Sale de la plantilla `og-imagen` del kit de marca.
- Las etiquetas Open Graph y de X usan URLs absolutas. Netlify las completa con su variable `URL` en cada deploy, así que si cambiás de dominio no hay que tocar nada.
- Favicons, ícono para iPhone (`apple-touch-icon.png`), `site.webmanifest` y datos estructurados (schema.org) con el link al Instagram.
- Para chequear la vista previa después del deploy: [opengraph.xyz](https://www.opengraph.xyz/) o el [Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/). WhatsApp guarda la vista previa en caché: si la cambiás, puede tardar en actualizarse.
