# Beer Mile Córdoba · Landing

Landing de la Beer Mile Córdoba ([@thebeermile.arg](https://www.instagram.com/thebeermile.arg/)): qué es la
carrera, las dos modalidades (Individual y Postas), las reglas y el formulario de lista de espera.

Sitio estático en HTML, CSS y JavaScript, sin frameworks ni paso de build.

## Estructura

```
├── index.html              # landing
├── gracias.html            # confirmación si el formulario se envía sin JavaScript
├── 404.html                # página de error
├── assets/
│   ├── css/main.css        # estilos (tokens de marca arriba de todo)
│   ├── js/main.js          # <beer-glass>, selección de modalidad y envío del formulario
│   ├── fonts/              # Anton y Archivo en woff2 (licencia OFL)
│   └── img/og-image.png    # imagen para compartir en redes (1200×630)
├── favicon.ico / favicon.svg / apple-touch-icon.png / icon-*.png
├── site.webmanifest, robots.txt, sitemap.xml
└── netlify.toml            # deploy, headers y URL del sitio
```

### Cosas para saber

- **Colores y tipografías** salen del kit de marca y están como variables en `:root` de `main.css`
  (`--negro`, `--crema`, `--celeste`, …). El amarillo `--birra` es solo para el líquido de los vasos.
- **Los vasos** son un custom element decorativo:
  ```html
  <beer-glass level="75" motion="slosh"></beer-glass>
  ```
  `level`: 100 (por defecto), 75, 50 o 25. `motion`: animación del líquido (`slosh`, `lap1`…`lap4`, `pour`).
  El tamaño se controla con la variable CSS `--glass-size`.
- **Animaciones**: todas en CSS. Se desactivan si el sistema pide reducir movimiento.
- **`__SITE_URL__`**: en `index.html`, `robots.txt` y `sitemap.xml`. Netlify lo reemplaza en cada deploy por
  la URL del sitio (variable `URL`), porque las vistas previas de WhatsApp e Instagram necesitan URLs absolutas.

## Desarrollo

```bash
npm install      # herramientas de desarrollo (Prettier y html-validate)
npm run dev      # servidor local en http://localhost:8080
npm run format   # formatea todo con Prettier
npm run lint     # chequea formato y valida el HTML (lo mismo que corre en CI)
```

En cada push y pull request, GitHub Actions corre `npm run lint`.

## Deploy en Netlify

El proyecto se conecta desde Netlify a este repo. No hace falta configurar nada en la UI: todo está en
`netlify.toml`. Cada push a `main` publica el sitio.

## Formulario de lista de espera (Netlify Forms)

- El `<form name="lista-de-espera" data-netlify="true">` se detecta en cada deploy. **Form detection** tiene
  que estar activado en _Project configuration → Forms_. Si lo activás después de un deploy, hay que volver a
  deployar para que el formulario aparezca.
- Con JavaScript se envía por AJAX (`fetch("/")`, URL-encoded) y muestra la confirmación en la misma página.
  Sin JavaScript, el envío normal redirige a `/gracias`.
- Los envíos se ven en _Forms → lista-de-espera_ y se exportan a CSV. Para recibir un mail por cada anotado:
  _Forms → Form notifications → Add notification_.
- Tiene un campo trampa (`bot-field`) y Netlify filtra spam con Akismet. Los envíos de prueba con datos de
  relleno (`test@test.com`) suelen ir a **Spam submissions**.

Campos: `nombre`, `email`, `instagram`, `modalidad` (`individual` / `postas` / `nose`), `experiencia`,
`milla`, `mayor`.

## Licencias

Las fuentes Anton y Archivo se distribuyen bajo la SIL Open Font License (`assets/fonts/OFL.txt`).
