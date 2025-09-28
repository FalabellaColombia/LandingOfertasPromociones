# Landing (CSR) Ofertas y Promociones – Falabella

[Landing de productos](https://www.falabella.com.co/falabella-co/page/descuentos_ofertas_falabella?sid=HO_V1_ENCUENTRALASMEJORESOFERTASYULTIMOSLANZAMIENTOS_OTROS_NA_S38_Aniversario_124) enfocada en mostrar productos en oferta. La información de los productos se gestiona desde de una app interna.

## Descripción general

Esta landing está desplegada en ContentStack y desarrollada con HTML, CSS y JavaScript.

La landing consume una API que proviene de una app interna. Actualmente existen dos versiones de esa app:

- App antigua: construida con Google Sheets + AppSheet.
- App nueva: implementada en React + TypeScript y desplegada en Vercel, utilizando Supabase como base de datos para manejar login y WebSockets. (Esta app se encuentra en proceso de migración hacia sistemas internos corporativos).

## Tecnologías principales

- **HTML + CSS + JavaScript** – Estructura y lógica de la landing
- **ContentStack** – Plataforma de despliegue
- **Google Sheets / AppSheet** – Fuente de datos de la app antigua
- **React + TypeScript + Supabase** – Tecnologías de la app nueva

## Cómo usar el código

La landing puede consumir datos desde dos aplicaciones:

### 1. App antigua (Google Sheets + AppSheet)

En el archivo `/scripts/renderProducts.js` está la constante PRODUCTS_DATA_URL.

Cambia ese valor por la URL del endpoint de Google Sheets.

### 2. App nueva (React + TypeScript + Supabase)

Esta versión tiene un repositorio independiente donde se documenta cómo consumir la API de Supabase y cómo integrarla con la landing.

[Repositorio app nueva](https://github.com/FalabellaColombia/APPLandingOfertasPromociones)

## Despliegue

El proyecto usa ContentStack para alojar los assets y un componente Iframe para cargar el contenido. **ID del iframe (blt057c43bd655af591)**

[Assets en Content](https://app.contentstack.com/#!/stack/blt088e6fffbba20f16/assets/bltb2010959959b4dbd/browse?page=1&page_size=30&popular_view=assets-all&query=%7B%7D)

Como cada cambio con ContentStack obliga a actualizar varios archivos JS. Para evitarlo se recomienda generar un bundle único con esbuild.

### Opcional: Bundle con esbuild

Con esbuild puedes unir todos los scripts en un solo archivo minificado, facilitando carga y mantenimiento.

#### Pasos

1. Inicializar npm

```js
 npm init -y
```

2. Instalar esbuild como dependencia de desarrollo:

```js
npm i esbuild -D
```

3. Configurar el script de build en `package.json`:

```js
 "scripts": { "build": "esbuild scripts/index.js --bundle --minify --outfile=scripts/bundle.js"}
```

4. Crear el archivo scripts/index.js para importar los demás scripts:

```js
import './renderProducts.js';
import './categoryMenu.js';
import './toggleSeoButton.js';
import './iframeHeightManager.js';
```

5. Ejecutar el build:

```js
npm run build
```

Esto generará un archivo único: `scripts/bundle.js`

6. En el archivo index.html:

- Comenta los `<script>` individuales.
- Agrega en su lugar: `<script src="./bundle.js"></script>`


## Fuente de datos: Google Sheets + AppScrip + AppSheet

Actualmente la landing se alimenta desde una Google Sheet, administrada a través de AppSheet.

### ¿Cómo hacerlo paso a paso?

1. **Crea una Sheet** y llama a la hoja: `LandingOfertasFalabella`.
2. **En la primera fila** agrega los siguientes encabezados (respetando el orden):

#### Estructura de la Google Sheet  

| **Campo**          | **Descripción** |
|--------------------|-----------------|
| `id`    | Identificador único del producto (Opcional). |
| `orderSellout`     | Orden de prioridad del producto (Solo numeros). |
| `category`         | Categoría del producto. Debe ser uno de los siguientes valores: <br> Tecnología, Electrohogar, VestuarioMujer, VestuarioHombre, Infantil, Calzado, Belleza, AccesoriosModa, Hogar, Deportes, Otros. <br><br> Puedes usar validación de datos en Google Sheets con lista desplegable. |
| `title`            | Título o nombre del llamado. |
| `urlProduct`       | URL a la PDP o PLP del producto. |
| `urlImage`         | URL de la imagen del producto. |
| `startDate`        | Fecha de inicio de la oferta en formato `YYYY-MM-DD` (zona horaria UTC-5). |
| `endDate`          | Fecha de finalización de la oferta en formato `YYYY-MM-DD` (zona horaria UTC-5). |
| `offerState`       | Estado de la oferta. Debe ser uno de los siguientes valores: <br> _(vacío)_, LANZAMIENTO, SOLO X 24 HORAS, SOLO X 48 HORAS, AGOTADO. |
| `isProductHidden`  | Valor booleano (`true` o `false`). En el menu Insertar de Google Sheet crea una **casilla de verificación**. Si es `true`, el producto **no se muestra** en la landing. |

3. Agrega productos desde la segunda fila.

#### Codigo APPScript

4. Abre el editor de Apps Script desde el menú `Extensiones > Apps Script` y pega el siguiente código:

```javascript
/**
 * Endpoint GET para obtener los datos de la hoja de cálculo
 * Convierte las fechas 'startDate' y 'endDate' a la zona horaria de Colombia (UTC-5)
 * y genera un JSON para ser consumido por el frontend o API cliente.
 */
function doGet() {
  const SHEET_ID = "TU_ID_DE_SHEET"; // ID de la hoja de cálculo
  const SHEET_NAME = "LandingOfertasFalabella"; // Nombre de la pestaña a leer

  // Abrir la hoja de cálculo y obtener la hoja específica
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return sendJsonResponse("ERROR: Sheet not found"); // Validación si no existe la hoja

  // Obtener todos los datos de la hoja como un array bidimensional
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return sendJsonResponse([]); // Si solo hay encabezados o está vacía, retorna array vacío

  // Separar encabezados de filas de datos
  const [headers, ...rows] = data;

  // Obtener índices de las columnas de fechas para formatearlas
  const startDateIndex = headers.indexOf('startDate');
  const endDateIndex = headers.indexOf('endDate');

  // Mapear cada fila a un objeto JSON
  const jsonData = rows.map(row => {
    // Crear un objeto con todas las columnas excepto 'id'
    const obj = Object.fromEntries(
      headers
        .map((key, i) => [key, row[i]])
        .filter(([key]) => key !== 'id') // Omitir la columna 'id' para optimización
    );

    // Formatear startDate a formato ISO con zona horaria UTC-5 (Colombia)
    if (startDateIndex !== -1 && row[startDateIndex]) {
      obj.startDate = Utilities.formatDate(
        new Date(row[startDateIndex]),
        'GMT-5',
        "yyyy-MM-dd'T'HH:mm:ss'-05:00'"
      );
    }

    // Formatear endDate a formato ISO con zona horaria UTC-5 (Colombia)
    if (endDateIndex !== -1 && row[endDateIndex]) {
      obj.endDate = Utilities.formatDate(
        new Date(row[endDateIndex]),
        'GMT-5',
        "yyyy-MM-dd'T'HH:mm:ss'-05:00'"
      );
    }

    return obj; // Retornar objeto con fechas ya formateadas
  });

  // Retornar el JSON final
  return sendJsonResponse(jsonData);
}

/**
 * Función helper para devolver un JSON al cliente
 * @param {any} data - Datos que se convertirán a JSON
 * @returns {ContentService.TextOutput} - JSON listo para consumo
 */
function sendJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}
```

5. Reemplaza `TU_ID_DE_SHEET` por el ID real del documento.
6. Guarda los cambios y haz clic en, Implementar > Nueva implementación.
7. Crea un nuevo deployment tipo Web App:

- Ejecutar como: tú
- Acceso: Cualquiera

8. Copia la URL pública del Web App: Esta será la URL que debes usar como `PRODUCTS_DATA_URL` en `renderProducts.js`.

#### AppSheet  

La gestión de los productos se hace a través de una app creada con **AppSheet**, conectada a la Google Sheet.

- **Acceso:** Las credenciales (usuario y contraseña) se encuentran en el grupo interno de **Microsoft Teams**.  

- **Cambio de Google Sheet:** (Para cargues masivos)  
  1. Inicia sesión en AppSheet.  
  2. Ve al **módulo de Data**.  
  3. Haz clic en **View Source Data**.  
  4. Selecciona la nueva Google Sheet que se quiera usar como fuente.  

## Creación de Staging ("Beta")

El **staging (beta)** se utiliza para validar cómo se verá la landing con un cargue masivo de productos antes de lanzarlo a producción.  
Esto permite revisar la información y el diseño sin arriesgar la data real.

### Flujo recomendado
1. Crear una copia de la Google Sheet y cargar ahí los productos del archivo masivo enviado por el equipo de Sellout.  
2. Exportar la Sheet como CSV.
3. Convertir el CSV a JSON usando [csvjson.com](https://csvjson.com/csv2json) u otra herramienta similar.  
4. Guardar el archivo como `data.json` en el proyecto.  
5. En el archivo `renderProducts.js`, cambiar la constante `PRODUCTS_DATA_URL` para que apunte a `./data.json`.  
6. Desplegar en un entorno de prueba con **Surge**.

### ¿Qué es Surge?
[Surge](https://surge.sh) es una herramienta de línea de comandos que permite desplegar sitios estáticos (HTML, CSS, JS, JSON) de forma rápida y gratuita.  
Es ideal para crear un **entorno temporal de pruebas (staging)** y compartir la URL resultante con el equipo.

#### Instala Surge de forma global

```js
npm install --global surge
```

#### Ejecuta Surge

```js
npx surge
```

## Cachear el JSON con GitHub Actions

Para evitar caídas por límite de uso de Google Sheets/App Script y mejorar la velocidad de carga, la landing siempre debe usar un JSON cacheado en lugar de consultar directamente la Sheet. Así, los usuarios reciben un archivo estático con los productos, sin sobrecargar la API.

### Cómo funciona

1. La Sheet se consulta automáticamente cada hora para obtener datos actualizados.
2. Un workflow de GitHub Actions genera un archivo data.json con esos datos y lo guarda en la rama data-cache.
3. La landing consume siempre data.json, evitando solicitudes directas a Google Sheets y mejorando el rendimiento.

### Edición y actualización manual

#### 1. Forzar la generación del JSON (Forzar cache)

Si necesitas actualizar los datos manualmente:

1. Desde el dashboard principal del repositorio, ir a la pestaña Actions.

2. Buscar el workflow llamado `Update JSON Cache`.

3. Hacer click en el workflow y luego en Run workflow.
Esto ejecutará la generación de `data.json` manualmente y refrescará la caché.

#### 2. Modificar la configuración del workflow

Si necesitas cambiar cómo se genera el JSON:

1. Abrir el archivo del workflow en GitHub:

```js
.github/workflows/update-json.yml
```

2. Editar el YAML.
3. Guardar los cambios y hacer commit; GitHub Actions aplicará la nueva configuración automáticamente.

## Recomendaciones

Para que la landing funcione correctamente, es clave mantener la estructura de sheet sin modificaciones.

### Reglas básicas
- No cambiar ni eliminar los encabezados de la primera fila.  
- Mantener el nombre de la hoja como `LandingOfertasFalabella`.  
- Usar fechas en formato `YYYY-MM-DD` (UTC-5).  
- Respetar el tipo de datos en cada columna (números, texto, booleanos).  
- No dejar celdas requeridas vacías.  

### Imágenes
- Todas las URLs deben estar optimizadas a 200x200 px para no afectar rendimiento ni SEO.  
  - ✅ `.../w=200,h=200,fit=pad`  
  - ❌ `.../w=1500,h=1500,fit=pad`  

### Consistencia
- Usar siempre las mismas categorías (ej: `Electrohogar` vs `electrohogar` genera errores).  
  (Si se cambian o agregan categorias, esto debe hacerse a nivel de todo el proyecto, tanto google sheet como codigo HTML y JS)

### Mantenimiento
- Nunca aplicar scripts adicionales en la Google Sheet.  
  Ejecutar Apps Script directamente sobre la hoja puede corromper el archivo y volverlo irrecuperable.  
- No cargar archivos masivos directamente en la Sheet de producción.  
  Siempre realizar pruebas en un staging (beta) o con una copia de la hoja antes de pasar cambios a producción.  

## Soporte y Autor

Proyecto creado por [@jeisongarzon](https://github.com/jeison0894). Se agradece cualquier tipo de feedback o colaboración.

##  Estado del Proyecto
En desarrollo activo.
