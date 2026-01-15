# Visualización de Pensamiento Computacional (Viz-App)

Este proyecto es una herramienta de visualización interactiva diseñada para analizar la evolución, estructura intelectual e impacto del campo de "Pensamiento Computacional" (Computational Thinking).

## Declaración de Uso de Datos

Este proyecto utiliza datos bibliográficos, altmétricos y de impacto científico obtenidos mediante APIs y fuentes abiertas especializadas (**Scopus**, **Web of Science**, **OpenAlex**, **Dimensions**, **Altmetric**, **Mendeley** y **Crossref**), empleados exclusivamente con fines académicos y no comerciales.

El tratamiento de los datos se realizó siguiendo buenas prácticas de ciencia abierta, transparencia metodológica y uso responsable:

- **Información Agregada**: Se trabajó únicamente con información agregada y métricas derivadas (conteos de citas, puntuaciones de impacto, clasificaciones de temas).
- **Privacidad**: No se redistribuyen datos en bruto ni información personal identificable.
- **Cumplimiento**: El uso de los datos busca ser ético y conforme a las políticas de acceso y uso de los respectivos proveedores de datos.

## Tecnologías

- **Frontend**: Vite, D3.js, Vanilla SEO
- **Procesamiento de Datos**: Python (Pandas), APIs de OpenAlex/Altmetric

## Ejecución

1.  Instalar dependencias:
    ```bash
    npm install
    ```
2.  Correr servidor de desarrollo:
    ```bash
    npm run dev
    ```
3.  Construir para producción:
    ```bash
    npm run build
    ```
