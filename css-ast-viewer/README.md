# CSS AST Viewer

Herramienta visual para parsear archivos CSS y explorar su AST (Abstract Syntax Tree) como un arbol interactivo en el navegador.

Utiliza **PostCSS** en el servidor para generar el AST y **React** con **Tailwind CSS 4** para renderizar el arbol con una interfaz oscura y moderna.

## Caracteristicas

- **Parser completo de CSS** a traves de PostCSS, soportando todas las features del lenguaje:
  - At-rules: `@media`, `@keyframes`, `@supports`, `@layer`, `@container`, `@scope`, `@font-face`, `@import`, `@charset`
  - Selectores complejos: combinadores, atributos, pseudo-clases (`:nth-child`, `:is()`, `:where()`, `:has()`), pseudo-elementos (`::before`, `::selection`, `::placeholder`)
  - Declaraciones con `!important`
  - Comentarios CSS (`/* ... */`)
  - CSS Nesting nativo (`& .child`)
  - Custom properties (`--variable`)
- **Arbol interactivo** con expand/collapse por doble click y navegacion con teclado (Enter, flechas)
- **Panel de detalles** fijo en el sidebar derecho con informacion del nodo seleccionado
- **Carga de archivos CSS** desde disco mediante boton de upload con validacion de tipo y tamanio
- **CSS de demo** incluido (configuracion Tailwind/shadcn) cargado por defecto
- **Leyenda visual** con colores por tipo de nodo: root, atrule, rule, decl, comment
- **Servidor Express** con API REST, preparado para extender con mas funcionalidades
- **Accesibilidad**: roles ARIA, aria-labels, navegacion por teclado, focus visible

## Arquitectura

```
css-ast-viewer/
  server.js              # API Express (POST /api/parse)
  lib/
    node-to-json.js      # Modulo compartido: convierte AST PostCSS a JSON
  parse-css.js           # Script standalone para parsear CSS a JSON
  vite.config.js         # Vite + Tailwind 4 + proxy al API
  playwright.config.js   # Config Playwright con webServer automatico
  src/
    App.jsx              # Componente principal con upload y panel de detalles
    TreeNode.jsx         # Componente recursivo del arbol (memo + useCallback)
    demo-css.js          # CSS de demo embebido
    index.css            # Estilos base con Tailwind 4
    main.jsx             # Entry point de React
  tests/
    node-to-json.test.js   # 20 unit tests (node:test)
    ast-viewer.spec.js     # 62 tests e2e con Playwright
    comprehensive.css      # CSS de prueba con todas las features del lenguaje
```

## Requisitos

- Node.js >= 18
- npm

## Instalacion

```bash
cd css-ast-viewer
npm install
npx playwright install chromium
```

## Uso

### Desarrollo

Levantar el servidor API y Vite simultaneamente:

```bash
# Ambos juntos (cross-platform via npm-run-all2)
npm run dev

# Por separado
npm run server         # Express en puerto 3334
npx vite --port 3333   # Vite en puerto 3333
```

Abrir http://localhost:3333 en el navegador.

### Cargar un archivo CSS

1. Hacer click en el boton **"Load CSS File"** en la barra superior
2. Seleccionar un archivo `.css` del disco (maximo 5MB)
3. El arbol se actualiza con el AST del archivo cargado
4. Para volver al demo, hacer click en el boton **"Demo"**

### Navegacion por teclado

- **Tab**: navegar entre nodos del arbol
- **Enter / Espacio**: seleccionar nodo y ver detalles
- **Flecha derecha**: expandir nodo con hijos
- **Flecha izquierda**: colapsar nodo con hijos

### Solo parsear (sin UI)

```bash
# Genera src/ast-data.json a partir de input.css (o archivo especificado)
npm run parse
node parse-css.js mi-archivo.css
```

## API

### `POST /api/parse`

Recibe CSS como texto y devuelve el AST en formato JSON.

**Request:**

```json
{
  "css": "body { color: red; }"
}
```

**Response:**

```json
{
  "type": "root",
  "children": [
    {
      "type": "rule",
      "selector": "body",
      "children": [
        {
          "type": "decl",
          "prop": "color",
          "value": "red",
          "important": false,
          "source": { "start": { "line": 1, "column": 8 }, "end": { "line": 1, "column": 18 } }
        }
      ],
      "source": { "start": { "line": 1, "column": 1 }, "end": { "line": 1, "column": 20 } }
    }
  ]
}
```

## Tests

82 tests totales: 20 unit + 62 e2e.

### Unit tests (node:test)

20 tests para la funcion `nodeToJSON` cubriendo todos los tipos de nodo, edge cases y null safety.

```bash
npm run test:unit
```

### E2E tests (Playwright)

62 tests cubriendo la interfaz completa:

| Suite | Tests | Que cubre |
|---|---|---|
| Page Load | 5 | Titulo, Root node, panel de detalles, nombre de archivo, boton upload |
| Demo Tree Structure | 7 | @import, @custom-variant, :root, .dark, @theme, @layer, badges |
| Expand/Collapse | 3 | Expand/collapse por doble click, estado inicial |
| Node Selection | 5 | Click para seleccionar, detalles de rule/atrule/decl, source location |
| Sidebar Sticky | 2 | Sidebar fijo al hacer scroll en el arbol |
| File Upload | 4 | Upload CSS, boton Demo, limpieza de seleccion |
| File Validation | 2 | Rechazo de archivos no-CSS, tree preservado en error |
| API Error Handling | 3 | CSS vacio, campo faltante, respuesta correcta |
| Comments | 2 | Nodos comment, detalles de comentario |
| @font-face | 2 | Parsing y declaraciones |
| @media | 4 | Queries variadas, reglas anidadas |
| @keyframes | 3 | fadeIn, spin, pulse |
| @supports | 2 | display: grid, not |
| @layer | 2 | utilities, components |
| @container | 1 | Container queries |
| Complex Selectors | 8 | Universal, ID, combinadores, atributos, pseudo-clases, pseudo-elementos |
| !important | 1 | Badge en panel de detalles |
| CSS Nesting | 1 | Nesting nativo con & |
| @scope | 1 | Scope at-rule |
| Visual Elements | 4 | Tema oscuro, child counts, guide lines, leyenda |

```bash
# E2E (auto-levanta servidores)
npm run test:e2e

# E2E con navegador visible
npm run test:e2e:headed

# Todos los tests (unit + e2e)
npm test
```

## Stack tecnologico

- **PostCSS 8** - Parser de CSS
- **Express 5** - Servidor API
- **React 19** - UI (memo, useCallback, useMemo)
- **Tailwind CSS 4** - Estilos
- **Vite 8** - Bundler y dev server
- **Playwright** - Tests e2e
- **node:test** - Tests unitarios

## Autor

**Juan Carlos Galindo Navarro**

## Licencia

ISC
