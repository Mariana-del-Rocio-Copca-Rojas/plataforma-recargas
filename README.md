
# EAV · Control de Recargas — Frontend

Plataforma web de **EAV Centro Universitario (Estudios Aeronáuticos de Veracruz)** para registrar las líneas telefónicas de cada campus (Veracruz, Puebla, CDMX, Monterrey…) y llevar el historial de sus recargas.

Hecha con **HTML, CSS, JavaScript puro y Bootstrap 5** (incluido en `vendor/`, funciona sin internet). No necesita instalar nada ni compilar.

---

## Índice

1. [Cómo ejecutarla](#cómo-ejecutarla)
2. [Páginas](#páginas)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Arquitectura por capas](#arquitectura-por-capas)
5. [Orden de carga de los scripts](#orden-de-carga-de-los-scripts)
6. [Tareas comunes](#tareas-comunes)
7. [Reglas de negocio](#reglas-de-negocio)
8. [Conectar con el backend](#conectar-con-el-backend)
9. [Modelos de datos](#modelos-de-datos)

---

## Cómo ejecutarla

**Opción A: VS Code + Live Server (recomendada)**

1. *Archivo → Abrir carpeta…* y elegir la carpeta `plataforma-recargas`.
2. Instalar las extensiones recomendadas (**Live Server** y **Claude Code**). VS Code las sugiere solo.
3. Clic derecho en `index.html` → *Open with Live Server*. Se abre en http://localhost:5500 y se recarga sola al guardar cambios.

**Opción B: doble clic.** Abrir `index.html` directamente en el navegador. También funciona, pero no se recarga sola.

Usuario demo: `admin@demo.com` / `admin123`

La base empieza vacía: primero crea tus campus y luego registra las líneas de cada uno.

---

## Páginas

| Archivo | Lógica | Qué hace |
|---|---|---|
| `index.html` | `js/pages/login.js` | Inicio de sesión |
| `dashboard.html` | `js/pages/dashboard.js` | Resumen del mes y una tarjeta por campus (crear / eliminar campus) |
| `campus.html?id=…` | `js/pages/campus.js` | Líneas del campus: registrar, editar, eliminar, buscar, filtrar y registrar recarga |
| `linea.html?id=…` | `js/pages/linea.js` | Historial de recargas de una línea (editar, eliminar), filtros por mes y facturación, exportar a CSV |

---

## Estructura de carpetas

```
plataforma-recargas/
├── index.html, dashboard.html, campus.html, linea.html   Páginas (solo estructura HTML)
│
├── css/
│   ├── base.css            Tema EAV: colores, tipografía, ajustes a Bootstrap
│   ├── components.css      Componentes compartidos: tarjetas, tablas, formularios…
│   └── pages/
│       └── login.css       Estilos exclusivos de la pantalla de login
│
├── js/
│   ├── config.js           ★ Configuración: backend, datos de EAV y catálogos (compañías, etc.)
│   │
│   ├── core/               Utilidades básicas, sin dependencias de la app
│   │   ├── formato.js      escapeHtml, money, formatDate, formatPhone, plural
│   │   ├── fechas.js       todayISO, currentMonth, sumarDias, diasRestantes…
│   │   └── session.js      Session (login/logout), requireAuth, getParam
│   │
│   ├── api/                Capa de datos: el ÚNICO lugar que guarda o pide datos
│   │   ├── mock-store.js   "Base de datos" en localStorage (modo demo)
│   │   ├── mock-api.js     Implementación demo de la API
│   │   ├── remote-api.js   Implementación real (peticiones HTTP al backend)
│   │   └── api.js          Elige demo o real según config.js → expone `Api`
│   │
│   ├── domain/
│   │   └── lineas.js       Reglas de negocio: estado vigente / por recargar, resúmenes
│   │
│   ├── ui/                 Componentes de interfaz reutilizables
│   │   ├── navbar.js       Barra superior con el logo EAV y menú de usuario
│   │   ├── notificaciones.js  toast() y confirmar()
│   │   ├── formularios.js  Leer / llenar formularios, mostrar errores, llenar <select>
│   │   ├── badges.js       Etiquetas de color de estado y facturación
│   │   └── recarga-modal.js  Ventana "Registrar / editar recarga" (compartida)
│   │
│   └── pages/              Un archivo por página: conecta todo lo anterior
│       ├── login.js
│       ├── dashboard.js
│       ├── campus.js
│       └── linea.js
│
└── vendor/                 Bootstrap 5 y Bootstrap Icons (no modificar)
```

---

## Arquitectura por capas

Cada capa solo usa las que están **debajo** de ella:

```
  pages/      ← qué hace cada pantalla (eventos, qué se pinta y cuándo)
    │
  ui/         ← piezas visuales reutilizables (barra, avisos, ventanas, etiquetas)
    │
  domain/     ← reglas de negocio (¿la línea está vigente?), sin tocar el HTML
    │
  api/        ← obtener y guardar datos (demo o backend real)
    │
  core/       ← utilidades genéricas (formatos, fechas, sesión)
    │
  config.js   ← valores configurables
```

Principios que sigue el código:

- **Las páginas nunca tocan `localStorage` ni hacen `fetch`.** Siempre usan `Api.xxx()`, así que cambiar al backend real no afecta las páginas.
- **Las reglas de negocio están en un solo lugar** (`domain/lineas.js`), así que el dashboard, el campus y el historial calculan el estado de la misma forma.
- **Los catálogos están en `config.js`.** Los `<select>` de compañías, medios de pago y facturación se llenan desde ahí.
- **Cada página va envuelta en `(() => { ... })()`**, para que sus variables no se mezclen con las de otros archivos.
- Todo texto capturado por el usuario se inserta con `escapeHtml()` para evitar inyección de HTML.

> **¿Por qué no se usan módulos ES (`import` / `export`)?** Los navegadores bloquean los módulos cuando la página se abre con doble clic (`file://`). Con scripts clásicos la plataforma funciona de las dos formas. Cada archivo define funciones u objetos globales con nombres claros (`Api`, `Session`, `RecargaModal`…).

---

## Orden de carga de los scripts

Como los scripts se comparten de forma global, **el orden de las etiquetas `<script>` importa**: cada archivo debe cargarse después de los que usa. Todas las páginas siguen este orden:

```html
vendor/bootstrap/bootstrap.bundle.min.js
js/config.js
js/core/formato.js   js/core/fechas.js   js/core/session.js
js/api/mock-store.js js/api/mock-api.js  js/api/remote-api.js  js/api/api.js
js/domain/lineas.js
js/ui/notificaciones.js  js/ui/formularios.js  js/ui/navbar.js  js/ui/badges.js
js/ui/recarga-modal.js   (solo campus.html y linea.html)
js/pages/<página>.js     (siempre al final)
```

`index.html` (login) solo carga lo que necesita: config, `core/formato`, `core/session`, `api/*`, `ui/formularios` y `pages/login`.

---

## Tareas comunes

| Quiero… | Dónde |
|---|---|
| Agregar o quitar una compañía telefónica | `CATALOGOS.COMPANIAS` en `js/config.js` |
| Cambiar los medios de pago | `CATALOGOS.MEDIOS_PAGO` en `js/config.js` |
| Cambiar estados de facturación o su color | `CATALOGOS.FACTURACION` en `js/config.js` |
| Cambiar con cuántos días de anticipación se avisa el vencimiento | `DIAS_AVISO_VENCIMIENTO` en `js/config.js` |
| Cambiar los colores institucionales | Variables `:root` en `css/base.css` |
| Cambiar el nombre o las siglas que salen en la barra | `APP` en `js/config.js` |
| Cambiar cómo se decide si una línea está vigente | `estadoLinea()` en `js/domain/lineas.js` |
| Agregar un campo a la recarga | El formulario en `js/ui/recarga-modal.js` (y la columna en `js/pages/linea.js`) |
| Borrar todos los datos de prueba | En la consola del navegador: `Api.resetDemo()` y recargar |

---

## Reglas de negocio

Estado de una línea (`domain/lineas.js`):

- **Suspendida:** no se puede recargar y no cuenta en los totales.
- **Con vigencia (días)** en su última recarga: está *Vigente* hasta `fecha + vigencia`. Avisa *Vence en N días* cuando faltan `DIAS_AVISO_VENCIMIENTO` (3) o menos, y después pasa a *Por recargar*.
- **Sin vigencia:** se considera vigente si se recargó en el mes actual.
- **Sin recargas:** *Por recargar*.

Otras reglas:

- El número telefónico tiene 10 dígitos y es único en toda la plataforma.
- No se permiten recargas con fecha futura.
- Eliminar un campus elimina sus líneas y sus recargas. Eliminar una línea elimina su historial.

---

## Conectar con el backend

Hoy los datos se guardan en el `localStorage` del navegador (modo demo). Para usar el backend real, en `js/config.js`:

```js
const API_CONFIG = {
  USE_MOCK: false,
  API_URL: 'https://servidor/api'
};
```

### Contrato de la API que espera el frontend (JSON)

Todas las peticiones (excepto login) envían `Authorization: Bearer <token>`. Si el backend responde `401`, el frontend cierra la sesión.
En caso de error, responder `{ "message": "texto para el usuario" }`.

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user: { id, nombre, email, rol } }` |
| GET | `/campus` | — | `Campus[]` |
| GET | `/campus/:id` | — | `Campus` |
| POST | `/campus` | `{ nombre, direccion }` | `Campus` |
| DELETE | `/campus/:id` | — | 204 |
| GET | `/lineas` | — | `Linea[]` (todas) |
| GET | `/campus/:id/lineas` | — | `Linea[]` |
| GET | `/lineas/:id` | — | `Linea` |
| POST | `/lineas` | `Linea` sin `id` | `Linea` |
| PUT | `/lineas/:id` | `Linea` sin `id` | `Linea` |
| DELETE | `/lineas/:id` | — | 204 |
| GET | `/recargas` | — | `Recarga[]` (todas) |
| GET | `/lineas/:id/recargas` | — | `Recarga[]` ordenadas por fecha desc. |
| POST | `/recargas` | `Recarga` sin `id` | `Recarga` |
| PUT | `/recargas/:id` | `Recarga` sin `id` | `Recarga` |
| DELETE | `/recargas/:id` | — | 204 |

---

## Modelos de datos

```text
Campus  { id, nombre, direccion }
Linea   { id, campusId, numero (10 dígitos, único), compania, departamento, uso,
          estado ("activa" | "suspendida"), notas,
          // recarga habitual (para prellenar):
          montoPlan (número), vigencia (días), paquete }
Recarga { id, lineaId, fecha ("YYYY-MM-DD"), monto (número, 2 decimales),
          vigencia (días), paquete, medio, folio, solicito, realizo,
          facturacion ("Pendiente" | "Solicitada" | "Facturada" | "No requiere factura"),
          observaciones, registradoPor }

medio:    "Efectivo" | "Tarjeta de débito" | "Tarjeta de crédito" |
          "Transferencia bancaria" | "Plataforma / portal" | "Otro"
compania: "Telcel" | "AT&T" | "Movistar" | "Bait" | "Unefon" | "BroMovil" | "Otra"
```
