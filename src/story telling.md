# Historia principal (macro-narrativa)

## **“Cómo emerge, se consolida y se transforma el Pensamiento Computacional como campo científico (1990–2026)”**

Esta historia responde a **tres preguntas centrales**:

1. **¿Cuándo y cómo emerge el CT como campo reconocible?**
2. **¿Cómo se consolida académica y socialmente?**
3. **¿Qué direcciones y tensiones definen su estado actual y futuro cercano?**

Todo lo que ya hiciste (bibliometría, altmétricas, NLP, redes) encaja **naturalmente** en esta narrativa.

---

# Acto I — Emergencia (1990–2012)

**“Antes de que CT fuera CT”**

### Mensaje clave

El Pensamiento Computacional **no nace de golpe**, sino que emerge desde:

- ciencias de la computación,
- educación,
- resolución de problemas,
- pensamiento algorítmico,
  antes de ser nombrado explícitamente.

### Evidencia (datos que ya tienes)

- **Serie temporal (viz_time_series_all.csv)**
  → publicaciones escasas, crecimiento lento.
- **Red p1 (2006–2012)**
  → pocos nodos, citas concentradas, fuerte dependencia de trabajos fundacionales.
- **CT labels**
  → predominio de `broad` y `noise`, pocos `core`.

### Visualizaciones protagonistas

- Línea temporal (zoom 1990–2012).
- Red p1 (pequeña, casi “arqueológica”).
- Tooltip mostrando `ct_membership_score_v2` bajo–medio.

📌 **Interpretación**

> CT existe como práctica y enfoque, pero aún no como campo estructurado.

---

# Acto II — Consolidación (2013–2019)

**“CT se convierte en un campo propio”**

### Mensaje clave

A partir de 2013:

- crece la producción,
- aparecen comunidades claras,
- CT se institucionaliza (currículos, educación STEM, formación docente).

### Evidencia

- **Aumento fuerte en publicaciones**.
- **Red p2 (2013–2019)**
  → comunidades bien definidas, hubs claros.
- **Mayor proporción de `ct_core` y `ct_broad`**.
- **Skills dominantes (NLP)**
  → abstraction, decomposition, algorithmic thinking, debugging.

### Visualizaciones protagonistas

- Red p2 (default del dashboard).
- Colores por `ct_label_v2`.
- Tamaño por `openalex_cited_by_count`.

📌 **Interpretación**

> El CT deja de ser una etiqueta difusa y se convierte en un campo reconocible, con núcleos teóricos y educativos claros.

---

# Acto III — Expansión y tensiones (2020–2026)

**“CT se expande… y se tensiona”**

### Mensaje clave

En los últimos años:

- CT se expande a nuevos dominios,
- se conecta con IA, LLMs, juegos, creatividad,
- pero también **pierde nitidez conceptual**.

### Evidencia

- **Explosión de publicaciones**.
- **Red p3 (2020–2026)**
  → más nodos, más aristas, mayor densidad.
- **Descenso relativo del `ct_core` frente a `broad`** (v2).
- **Skills emergentes**:

  - collaborative learning,
  - creativity,
  - game-based learning,
  - AI-assisted reasoning.

### Visualizaciones protagonistas

- Red p3 (o versión top-400).
- Streamgraph de skills por año.
- Scatter impacto académico vs social.

📌 **Interpretación**

> CT se vuelve transversal y popular, pero enfrenta el riesgo de dilución conceptual.

---

# Sub-historia A — Impacto académico vs impacto social

**“¿Influye CT solo en la academia?”**

### Pregunta

¿Los trabajos más citados son también los más visibles socialmente?

### Evidencia

- **viz_impact_scatter_all.csv**
- Métricas:

  - citas (OpenAlex / Dimensions),
  - Altmetric score,
  - Mendeley readers.

### Mensaje

- Algunos trabajos son **académicamente centrales pero socialmente invisibles**.
- Otros tienen **alto impacto social con menor citación formal**.

📌 **Lectura crítica**

> El impacto del CT no se explica solo por citas académicas.

---

# Sub-historia B — Geografía del CT

**“Dónde se investiga y desde dónde se lidera”**

### Evidencia

- **viz_geo_all.csv** (OpenAlex authorships).
- Variables:

  - país,
  - ct_label,
  - mean_ct_score.

### Mensaje

- EE. UU., China, Europa lideran en volumen.
- Algunos países muestran **alta intensidad CT (score medio alto)** con menor volumen.

📌 **Lectura**

> El liderazgo en CT no es solo cuantitativo, también cualitativo.

---

# Sub-historia C — Definición del CT (NLP + LLM)

**“Qué entendemos realmente por CT”**

### Evidencia

- **skill_dictionary_v1 / v2 / v3**
- Métrica `ct_membership_score_v2`.

### Mensaje

- Existe un **núcleo estable** (abstraction, decomposition, algorithmic thinking).
- Coexiste con habilidades transversales que **no siempre son CT**.
- El uso de LLMs permite **auditar y mejorar** la definición del campo.

📌 **Valor metodológico**

> El proyecto no solo visualiza CT: **lo define críticamente**.

---

# Cierre — Mensaje final

> El Pensamiento Computacional no es un concepto estático.
> Es un campo en evolución, con momentos de emergencia, consolidación y expansión, cuyas fronteras deben ser analizadas críticamente para evitar su dilución.

---

## Por qué esta historia es fuerte (para evaluación)

✔ Usa **todos** los datasets creados
✔ Justifica el uso de NLP y LLMs
✔ Integra bibliometría + altmetría + redes
✔ Tiene **inicio, desarrollo y tensión final**
✔ No es descriptiva: es **interpretativa**
