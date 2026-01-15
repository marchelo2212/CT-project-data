import * as d3 from 'd3'

// Ayudante de limpieza global
function removeTooltip(containerSelector) {
    const node = d3.select(containerSelector).node()
    if (node && node._tooltipId) {
        d3.select(`#${node._tooltipId}`).remove()
    }
}

export function TimelineChart(containerSelector, rawData, { width = 800, height = 300 } = {}) {
  // Clear previous
  d3.select(containerSelector).selectAll("*").remove()
  // Clear previous tooltip if any
  removeTooltip(containerSelector)

  const margin = { top: 20, right: 30, bottom: 30, left: 50 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(containerSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  // Procesar Datos: Agrupar por Etiqueta
  // Esperamos: ct_label en ['broad', 'core', 'noise']
  const categories = ['broad', 'core', 'noise']
  const colors = {
      'broad': '#3b82f6', // Blue
      'core': '#10b981',  // Emerald
      'noise': '#64748b'  // Slate
  }

  // Pivotar datos: { year: 1990, broad: 10, core: 5, noise: 2 }
  const years = Array.from(new Set(rawData.map(d => +d.year))).sort((a,b) => a-b)
  const pivotData = years.map(year => {
      const records = rawData.filter(d => +d.year === year)
      const row = { year }
      categories.forEach(cat => {
          const rec = records.find(r => r.ct_label === cat)
          row[cat] = rec ? (rec.n_papers || rec.count || 0) : 0
      })
      return row
  })

  // Eje X
  const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, innerWidth])

  // Eje Y (Máximo a través de todas las categorías? O apilado? "Multi-capa" usualmente significa capas superpuestas o apiladas.
  // Dado la narrativa "Core dentro de Broad", usualmente son subconjuntos.
  // Pero aquí 'broad', 'core', 'noise' son etiquetas mutuamente excluyentes en el conjunto de datos?
  // 'ct_label' usualmente asigna UNA etiqueta por paper. Así que son apilados o separados.
  // Asumamos apilados para mostrar volumen total, o líneas para mostrar tendencias.
  // "Gráfico de línea multi-capa" -> probablemente Líneas.
  // Pero típicamente "Evolución" implica volumen. Hagamos Área Apilada?
  // O solo líneas/áreas superpuestas.
  // Usemos LÍNEAS con relleno de área ligera, no apiladas (para ver tendencias individuales).
  const maxVal = d3.max(pivotData, d => Math.max(d.broad, d.core, d.noise))
  const y = d3.scaleLinear()
    .domain([0, maxVal]).nice()
    .range([innerHeight, 0])

  // Dibujar Áreas/Líneas por categoría
  categories.forEach(cat => {
      const area = d3.area()
        .x(d => x(d.year))
        .y0(innerHeight)
        .y1(d => y(d[cat]))
        .curve(d3.curveMonotoneX)

      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d[cat]))
        .curve(d3.curveMonotoneX)

      // Área
      svg.append("path")
        .datum(pivotData)
        .attr("fill", colors[cat])
        .attr("fill-opacity", 0.1)
        .attr("d", area)

      // Línea
      svg.append("path")
        .datum(pivotData)
        .attr("fill", "none")
        .attr("stroke", colors[cat])
        .attr("stroke-width", 2)
        .attr("d", line)
  })

  // Ejes
  svg.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .attr("color", "#64748b")

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5))
    .attr("color", "#64748b")

  // Superposición Interactiva
  const overlay = svg.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
  
  // Tooltip
   const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`
   const tooltip = d3.select("body").append("div")
    .attr("id", tooltipId)
    .attr("class", "fixed hidden z-50 bg-slate-800 text-slate-100 text-xs p-2 rounded border border-slate-700 pointer-events-none shadow-lg")
    
   d3.select(containerSelector).node()._tooltipId = tooltipId

   overlay.on("mousemove", function(event) {
        const [mx] = d3.pointer(event)
        const year = Math.round(x.invert(mx))
        const d = pivotData.find(row => row.year === year)

        if (d) {
             const xPos = event.clientX + 15
             const yPos = event.clientY - 30
             
             tooltip
                .style("display", "block")
                .style("left", `${xPos}px`)
                .style("top", `${yPos}px`)
                .html(`
                    <div class="font-bold mb-2 border-b border-slate-600 pb-1">${d.year}</div>
                    <div class="space-y-1">
                        ${categories.map(cat => `
                            <div class="flex justify-between gap-4 items-center">
                                <div class="flex items-center gap-1">
                                    <span class="w-2 h-2 rounded-full" style="background-color: ${colors[cat]}"></span>
                                    <span class="capitalize text-slate-300">${cat}</span>
                                </div>
                                <span class="font-mono">${d[cat]}</span>
                            </div>
                        `).join('')}
                    </div>
                `)
             
             // Línea de hover
             svg.selectAll(".hover-line").remove()
             svg.append("line").attr("class", "hover-line")
                .attr("x1", x(d.year)).attr("x2", x(d.year))
                .attr("y1", 0).attr("y2", innerHeight)
                .attr("stroke", "#475569").attr("stroke-width", 1).attr("stroke-dasharray", "2,2")
             
             // Puntos de hover
             svg.selectAll(".hover-dot").remove()
             categories.forEach(cat => {
                 svg.append("circle").attr("class", "hover-dot")
                    .attr("cx", x(d.year))
                    .attr("cy", y(d[cat]))
                    .attr("r", 4)
                    .attr("fill", colors[cat])
                    .attr("stroke", "#fff").attr("stroke-width", 1)
             })
        }
    })
    .on("mouseleave", () => {
        tooltip.style("display", "none")
        svg.selectAll(".hover-dot").remove()
        svg.selectAll(".hover-line").remove()
    })
    
    // La leyenda es gestionada por HTML en main.js
}

