import * as d3 from 'd3'

export class ImpactAnalysis {
  constructor(containerSelector, data, rankingData, patents = [], policies = []) {
    this.container = d3.select(containerSelector)
    this.data = data
    this.rankingData = rankingData
    this.patents = patents
    this.policies = policies
    
    this.colorMap = {
      'core': '#10b981',   // emerald-500
      'broad': '#3b82f6',  // blue-500
      'peripheral': '#a855f7', // purple-500
      'noise': '#94a3b8',   // slate-400
      'none': '#64748b'    // slate-500
    }
    this.displayNames = {
        'core': 'Nuclear',
        'broad': 'Periférica',
        'noise': 'Aislada',
        'peripheral': 'Periférica', // Agregado para consistencia
        'none': 'Escasa relevancia'
    }
  }

  init() {
    const htmlContent = `
      <div class="space-y-8 animate-in fade-in duration-500">
        <!-- Encabezado -->
        <div class="mb-6">
          <h2 class="text-3xl font-bold text-slate-100 mb-4">Impacto Académico vs Social</h2>
          <div class="bg-slate-800/50 p-4 rounded-lg border-l-4 border-emerald-500 text-slate-300 space-y-2 text-sm shadow-sm">
            <p>
              Esta sección explora la discrepancia entre la influencia en la comunidad científica (Citas) y la visibilidad en la sociedad y medios (Altmetric).
            </p>
            <p class="text-slate-400 italic">
              "Influencia científica ≠ visibilidad social"
            </p>
          </div>
        </div>

        <!-- 2.1 Scatter Plot -->
        <div id="viz-impact-scatter" class="relative group">
           <h3 class="text-lg font-semibold text-slate-300 mb-2">2.1 Dispersión: Citas vs Altmetric</h3>
           <p id="scatter-desc" class="text-sm text-slate-400 mb-4">
             Comparación logarítmica. Tamaño del nodo representa lectores en Mendeley.
           </p>
           <div id="chart-impact-scatter" class="h-[500px] w-full bg-slate-800/20 rounded-lg relative border border-slate-700/30"></div>
           <div id="impact-tooltip" class="fixed pointer-events-none hidden bg-slate-950/90 border border-slate-700 p-3 rounded shadow-xl text-xs text-slate-200 z-[100] transition-opacity duration-75 max-w-xs"></div>
        </div>

        <!-- 2.2 Ranking Bar Chart -->
        <div id="viz-impact-ranking" class="relative group mt-8">
           <h3 class="text-lg font-semibold text-slate-300 mb-2">2.2 Ranking Híbrido</h3>
           <p class="text-sm text-slate-400 mb-4 max-w-4xl">
             Top 10 papers "puente" identificados mediante el <strong>Bridge Index</strong>. Este índice utiliza el <em>Z-score</em> (medida estadística estandarizada) para normalizar y combinar Citas, Altmetric y Mendeley, destacando publicaciones con alto impacto multidimensional.
           </p>
           <div id="chart-impact-ranking" class="h-[600px] w-full bg-slate-800/20 rounded-lg relative border border-slate-700/30"></div>
           <div id="ranking-tooltip" class="fixed pointer-events-none hidden bg-slate-950/90 border border-slate-700 p-3 rounded shadow-xl text-xs text-slate-200 z-50 transition-opacity duration-75"></div>
        </div>

        <!-- Section 2.3: Innovation & Policy -->
        <div class="mt-16 mb-8 border-t border-slate-700/50 pt-8">
            <h3 class="text-xl font-bold text-slate-100 mb-2">2.3 Impacto en Innovación y Políticas</h3>
            <p class="text-slate-400 mb-6 max-w-3xl">
                Más allá de la academia, el impacto del campo se refleja en la propiedad intelectual y la toma de decisiones públicas.
            </p>
            
            <div class="grid grid-cols-1 gap-8">
                <div class="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Evolución Temporal de Patentes</h4>
                        <span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">Total: ${this.patents.length}</span>
                    </div>
                    <div id="chart-patents" class="h-[300px] w-full relative"></div>
                    <div id="patents-details" class="mt-4 pt-4 border-t border-slate-700/50"></div>
                </div>
                
                <div class="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Top Organizaciones (Políticas)</h4>
                        <span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">Total: ${this.policies.length}</span>
                    </div>
                    <div id="chart-policy" class="h-[300px] w-full"></div>
                    <div id="policy-details" class="mt-4 pt-4 border-t border-slate-700/50"></div>
                </div>
            </div>
        </div>
      </div>
    `
    
    this.container.html(htmlContent)
    
    this.renderScatter()
    // Marcador de posición hasta que verifique dónde ponerlo
    this.renderRanking()
    
    if (this.patents.length > 0) {
        this.renderInnovation()
    }
    if (this.policies.length > 0) {
        this.renderPolicy()
    }
  }

  renderScatter() {
      const container = d3.select('#chart-impact-scatter')
      const width = container.node().clientWidth
      const height = 500
      const margin = { top: 20, right: 100, bottom: 50, left: 60 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      container.selectAll("*").remove()
      const svg = container.append("svg")
          .attr("width", width)
          .attr("height", height)

      // 1. Clip Path
      svg.append("defs").append("clipPath")
         .attr("id", "clip-scatter")
         .append("rect")
         .attr("width", innerWidth)
         .attr("height", innerHeight)
         .attr("x", 0)
         .attr("y", 0)

      const mainGroup = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

      // Filtro de Datos
      const validData = this.data.filter(d => 
          d.openalex_cited_by_count > 0 && d.altmetric_score > 0
      )

      // Actualizar descripción con conteos
      const total = this.data.length
      const shown = validData.length
      d3.select("#scatter-desc").html(`
          Comparación logarítmica. Tamaño del nodo representa lectores en Mendeley. 
          <span class="text-slate-500 block mt-1 text-xs">
            Mostrando <strong class="text-slate-300">${shown}</strong> de <strong class="text-slate-300">${total}</strong> publicaciones. 
            (Filtro: Citas > 0 y Altmetric > 0)
          </span>
      `)

      // Escalas
      const x = d3.scaleLog()
          .domain([0.8, d3.max(validData, d => +d.openalex_cited_by_count) || 1000])
          .range([0, innerWidth])
          .nice()

      const y = d3.scaleLog()
          .domain([0.8, d3.max(validData, d => +d.altmetric_score) || 1000])
          .range([innerHeight, 0])
          .nice()

      const r = d3.scaleSqrt()
          .domain([0, d3.max(validData, d => +d.mendeley_reader_count) || 100])
          .range([3, 15])

      // Grupos de Ejes
      const xAxisG = mainGroup.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .attr("color", "#64748b")
          
      const yAxisG = mainGroup.append("g")
          .attr("color", "#64748b")

      const xAxis = d3.axisBottom(x).ticks(5, "~s")
      const yAxis = d3.axisLeft(y).ticks(5, "~s")

      xAxisG.call(xAxis)
      yAxisG.call(yAxis)

      // Etiquetas de Ejes
      mainGroup.append("text")
         .attr("x", innerWidth/2)
         .attr("y", innerHeight + 40)
         .attr("text-anchor", "middle")
         .attr("fill", "#94a3b8")
         .attr("class", "text-xs uppercase tracking-widest")
         .text("Citas Académicas (OpenAlex)")

      mainGroup.append("text")
         .attr("transform", "rotate(-90)")
         .attr("x", -innerHeight/2)
         .attr("y", -40)
         .attr("text-anchor", "middle")
         .attr("fill", "#94a3b8")
         .attr("class", "text-xs uppercase tracking-widest")
         .text("Impacto Social (Altmetric)")

      // Área de Dispersión (Zoomable)
      const scatterArea = mainGroup.append("g")
          .attr("clip-path", "url(#clip-scatter)")
      
      const tooltip = d3.select("#impact-tooltip")
      this.selectedId = null // Estado para tooltip pegajoso

      // Círculos
      const circles = scatterArea.selectAll("circle")
         .data(validData)
         .join("circle")
         .attr("cx", d => x(+d.openalex_cited_by_count))
         .attr("cy", d => y(+d.altmetric_score))
         .attr("r", d => r(+d.mendeley_reader_count || 0))
         .attr("fill", d => this.colorMap[d.ct_label] || this.colorMap['none'])
         .attr("opacity", 0.6)
         .attr("stroke", "none")
         .attr("class", d => `scatter-point group-${d.ct_label}`)
         .style("cursor", "pointer")
         .on("click", (event, d) => {
             event.stopPropagation()
             
             if (this.selectedId === d.doi) {
                 // Deselect
                 this.selectedId = null
                 tooltip.style("opacity", 0).style("display", "none")
                 circles.attr("opacity", 0.6).attr("stroke", "none")
             } else {
                 // Select
                 this.selectedId = d.doi
                 
                 // Reset others
                 circles.attr("opacity", 0.3).attr("stroke", "none")
                 // Highlight selected
                 d3.select(event.currentTarget).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2).raise()

                 // Show Sticky Tooltip
                 tooltip.style("opacity", 1).style("display", "block")
                 tooltip.html(`
                     <div class="font-bold text-white mb-0.5 line-clamp-2 w-56 leading-tight">${d.title}</div>
                     <div class="text-emerald-400 text-xs mb-1 font-medium">${d.first_author} <span class="text-slate-500 font-normal">et al.</span></div>
                     <div class="text-slate-500 text-[10px] mb-2 font-mono">${d.doi || 'No DOI'}</div>
                     
                     <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] border-t border-slate-700/50 pt-2">
                        <span class="text-slate-400">Año:</span> <span class="text-right text-slate-200">${d.year}</span>
                        <span class="text-slate-400">Tipo:</span> <span class="text-right text-slate-200 capitalize">${d.ct_label}</span>
                        <span class="col-span-2 h-px bg-slate-800 my-0.5"></span>
                        <span class="text-slate-400">Citas (OpenAlex):</span> <span class="text-right text-white font-mono">${d.openalex_cited_by_count}</span>
                        <span class="text-slate-400">Altmetric:</span> <span class="text-right text-blue-300 font-mono">${Math.round(d.altmetric_score)}</span>
                        <span class="text-slate-400">Mendeley:</span> <span class="text-right text-emerald-300 font-mono">${d.mendeley_reader_count || 0}</span>
                        <span class="text-slate-400">Score CT:</span> <span class="text-right text-amber-300 font-mono">${parseFloat(d.ct_score).toFixed(2)}</span>
                     </div>
                 `)
                 // Position near the point (fixed)
                 tooltip.style("left", (event.clientX + 15) + "px").style("top", (event.clientY + 15) + "px")
             }
         })
         .on("mouseenter", (event, d) => {
             if (this.selectedId) return // Ignore hover if sticky mode is active

             d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 2).attr("opacity", 1).raise()
             
             tooltip.style("opacity", 1)
             tooltip.style("display", "block")
             tooltip.html(`
                 <div class="font-bold text-white mb-0.5 line-clamp-2 w-56 leading-tight">${d.title}</div>
                 <div class="text-emerald-400 text-xs mb-1 font-medium">${d.first_author || 'Unknown'} <span class="text-slate-500 font-normal">et al.</span></div>
                 <div class="text-slate-500 text-[10px] mb-2 font-mono">${d.doi || ''}</div>
                 
                 <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] border-t border-slate-700/50 pt-2">
                    <span class="text-slate-400">Citas:</span> <span class="text-right text-slate-200">${d.openalex_cited_by_count}</span>
                    <span class="text-slate-400">Altmetric:</span> <span class="text-right text-blue-300">${Math.round(d.altmetric_score)}</span>
                    <span class="text-slate-400">Score CT:</span> <span class="text-right text-amber-300">${parseFloat(d.ct_score).toFixed(2)}</span>
                 </div>
             `)
         })
         .on("mousemove", (event) => {
             if (this.selectedId) return 
             const x = event.clientX + 15
             const y = event.clientY + 15
             tooltip.style("left", x + "px").style("top", y + "px")
         })
         .on("mouseleave", (event) => {
             if (this.selectedId) return 
             d3.select(event.currentTarget).attr("stroke", "none").attr("opacity", 0.6)
             tooltip.style("opacity", 0).style("display", "none")
         })

       // Comportamiento de Zoom
       const zoom = d3.zoom()
           .scaleExtent([0.5, 20]) 
           .extent([[0, 0], [innerWidth, innerHeight]])
           .on("zoom", (event) => {
               const newX = event.transform.rescaleX(x)
               const newY = event.transform.rescaleY(y)

               xAxisG.call(xAxis.scale(newX))
               yAxisG.call(yAxis.scale(newY))

               circles
                   .attr("cx", d => newX(+d.openalex_cited_by_count))
                   .attr("cy", d => newY(+d.altmetric_score))
           })
       
       // Adjuntar zoom a SVG
       svg.call(zoom)
          .on("dblclick.zoom", null)
          .on("click", () => {
              // Click en fondo limpia selección
              if (this.selectedId) {
                  this.selectedId = null
                  tooltip.style("opacity", 0).style("display", "none")
                  circles.attr("opacity", 0.6).attr("stroke", "none")
              }
          })

       // Leyenda (Interactiva)
       const legend = svg.append("g").attr("transform", `translate(${innerWidth + margin.left + 20}, ${margin.top})`)
       const uniqueEntries = []
       const seenLabels = new Set()
       const keysOrder = ['core', 'broad', 'noise', 'none']
       
       keysOrder.forEach(key => {
           const label = this.displayNames[key]
           if (label && !seenLabels.has(label)) {
                seenLabels.add(label)
                uniqueEntries.push({ key, label, color: this.colorMap[key] })
           }
       })

       // Estado de Filtro
       const activeFilters = new Set(uniqueEntries.map(d => d.key)) // Rastrear CLAVES ('core', etc) no etiquetas

       uniqueEntries.forEach((item, i) => {
           const g = legend.append("g")
               .attr("transform", `translate(0, ${i*25})`)
               .style("cursor", "pointer")
               .on("click", function() {
                   // Alternar Filtro
                   if (activeFilters.has(item.key)) {
                       activeFilters.delete(item.key)
                       d3.select(this).style("opacity", 0.5)
                   } else {
                       activeFilters.add(item.key)
                       d3.select(this).style("opacity", 1)
                   }
                   
                   // Actualizar Círculos mapeando item.key a ct_label
                   // Nota: Necesitamos manejar el mapeo 'broad'/'peripheral' si es necesario.
                   // Idealmente 'item.key' coincide con 'd.ct_label' aproximadamente.
                   // Los datos tienen 'ct_label' como 'core', 'broad', 'noise', 'none'
                   
                   // Actualizar visibilidad
                   circles.style("display", d => {
                        // Manejar el caso 'peripheral' manualmente si es necesario
                        let label = d.ct_label
                        if (label === 'peripheral') label = 'broad' // normalization
                        
                        // Filtramos basándonos en las claves de la LEYENDA que son core, broad, noise, none
                        // Así que comprobamos si la etiqueta del círculo está en activeFilters
                        // También comprobar mapeo 'peripheral'
                        if(label === 'peripheral' && activeFilters.has('broad')) return "block"
                        
                        return activeFilters.has(label) ? "block" : "none"
                   })
               })

           g.append("circle")
                .attr("r", 6)
                .attr("fill", item.color)
                
           g.append("text")
                .attr("x", 12)
                .attr("y", 4)
                .text(item.label)
                .attr("fill", "#cbd5e1")
                .attr("class", "text-xs select-none")
       })
  }

  renderRanking() {
      const container = d3.select('#chart-impact-ranking')
      const width = container.node().clientWidth
      const height = 650 // Altura aumentada para mejor ajuste
      const margin = { top: 70, right: 30, bottom: 50, left: 250 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      container.selectAll("*").remove()
      const svg = container.append("svg")
          .attr("width", width)
          .attr("height", height)

      const mainGroup = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

      console.log('DEBUG: Datos de Clasificación Iniciales:', this.rankingData ? this.rankingData.length : 'null')

      // Datos Crudos: El usuario proporcionó un conjunto de datos deduplicado, así que lo usamos directamente.
      const rawData = this.rankingData || []
      
      console.log('DEBUG: Datos Crudos (Todos):', rawData.length)

      // Leyenda y Estado de Filtro
      const uniqueEntries = []
      // ... (código existente) ...
      const seenLabels = new Set()
      const keysOrder = ['core', 'broad', 'noise', 'none']
      
      keysOrder.forEach(key => {
          const label = this.displayNames[key]
          if (label && !seenLabels.has(label)) {
               seenLabels.add(label)
               uniqueEntries.push({ key, label, color: this.colorMap[key] })
          }
      })
      
      const activeFilters = new Set(keysOrder)
      
      // Función de Actualización
      const update = () => {
          // 1. Filtro
          const currentData = rawData.filter(d => {
              // Confiar en contenido CSV, filtrar principalmente por Etiqueta
              let label = d.ct_label_v2 || d.ct_label || 'none'
              
              // Normalizar etiquetas
              if (label === 'peripheral') label = 'broad'
              
              // Asegurar que etiqueta es una de las claves de visualización, sino por defecto 'none'
              if (!['core', 'broad', 'noise', 'none'].includes(label)) {
                  label = 'none'
              }
              
              return activeFilters.has(label)
          })
          
          console.log('DEBUG: Datos Actuales (Filtrados por Etiqueta):', currentData.length)

          // 2. Ordenar y Top 10
          currentData.sort((a,b) => b.bridge_index - a.bridge_index)
          const topData = currentData.slice(0, 10)
          
          console.log('DEBUG: Datos Top (Corte Final):', topData.length)

          // 3. Escalas
          const x = d3.scaleLinear()
              .domain([0, d3.max(topData, d => d.bridge_index) || 10])
              .range([0, innerWidth])
              .nice()

          const y = d3.scaleBand()
              .domain(topData.map(d => d.doi))
              .range([0, innerHeight])
              .padding(0.2)

          // 4. Actualizar Ejes
          mainGroup.selectAll(".axis-g").remove() // Redibujado limpio
          
          const xAxis = d3.axisBottom(x)
          const yAxis = d3.axisLeft(y).tickFormat(d => {
              const item = topData.find(r => r.doi === d)
              return item ? item.title_short : d
          })

          mainGroup.append("g")
              .attr("class", "axis-g")
              .attr("transform", `translate(0,${innerHeight})`)
              .call(xAxis)
              .attr("color", "#64748b")
              .select(".domain").remove()

          const yAxisG = mainGroup.append("g")
              .attr("class", "axis-g")
              .call(yAxis)
              .attr("color", "#cbd5e1")
          
          yAxisG.select(".domain").remove()
          yAxisG.selectAll(".tick text")
              .style("font-size", "11px")
              .style("cursor", "help")
              .call(function(text) {
                  // Lógica de Ajuste de Texto con Máx Líneas
                  text.each(function(d) {
                      // Buscar datos para tooltip de título completo
                      const item = topData.find(r => r.doi === d)
                      const fullTitle = item ? item.title : d
                      
                      const width = 230
                      const maxLines = 2
                      let text = d3.select(this),
                          words = text.text().replace(/…/g, "...").split(/\s+/).reverse(), // Sanitizar y dividir
                          word,
                          line = [],
                          lineNumber = 0,
                          lineHeight = 1.1, 
                          y = text.attr("y"),
                          dy = parseFloat(text.attr("dy")),
                          tspan = text.text(null).append("tspan").attr("x", -9).attr("y", y).attr("dy", dy + "em")
                      
                      // Agregar tooltip para título completo
                      text.append("title").text(fullTitle)

                      while (word = words.pop()) {
                          line.push(word)
                          tspan.text(line.join(" "))
                          if (tspan.node().getComputedTextLength() > width) {
                              line.pop()
                              tspan.text(line.join(" "))
                              
                              // Comprobar si alcanzamos líneas máx
                              if (lineNumber >= maxLines - 1) {
                                  // Truncar y agregar elipsis
                                  let currentText = tspan.text()
                                  // Truncamiento simple: remover últimos caracteres hasta que encaje con ...
                                  while (tspan.node().getComputedTextLength() > width && currentText.length > 0) {
                                      currentText = currentText.slice(0, -1)
                                      tspan.text(currentText + "...")
                                  }
                                  break // Dejar de procesar este texto
                              }

                              line = [word]
                              tspan = text.append("tspan").attr("x", -9).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word)
                          }
                      }
                      
                      // Corrección de Centro Vertical (Desplazar hacia arriba la mitad de la altura total agregada)
                      if (lineNumber > 0) {
                          const shift = (lineNumber * lineHeight) / 2
                          text.selectAll('tspan').attr('dy', function(d, i) {
                              // dy original es aproximadamente 0.32em. Para índice 0, desplazar hacia arriba.
                              // Desplazamiento simple: (i * lineHeight + dy) - shift
                              return ((i * lineHeight) + dy - shift) + "em"
                          })
                      }
                  })
              })

          // 5. Actualizar Barras
          const tooltip = d3.select("#ranking-tooltip")

          mainGroup.selectAll("rect")
              .data(topData, d => d.doi)
              .join(
                  enter => enter.append("rect")
                      .attr("x", 0)
                      .attr("y", d => y(d.doi))
                      .attr("height", y.bandwidth())
                      .attr("width", 0) // Animar desde 0
                      .attr("rx", 2)
                      .attr("fill", d => this.colorMap[d.ct_label_v2 || d.ct_label] || this.colorMap['none'])
                      .style("cursor", "pointer")
                      .call(enter => enter.transition().duration(500).attr("width", d => x(d.bridge_index))),
                  update => update.transition().duration(500)
                      .attr("y", d => y(d.doi))
                      .attr("width", d => x(d.bridge_index))
                      .attr("height", y.bandwidth())
                      .attr("fill", d => this.colorMap[d.ct_label_v2 || d.ct_label] || this.colorMap['none']),
                  exit => exit.transition().duration(300).attr("width", 0).remove()
              )
              .on("mouseenter", (event, d) => {
                  d3.select(event.currentTarget).attr("opacity", 0.8)
                  tooltip.style("display", "block").style("opacity", 1)
                  // Contenido de Tooltip
                  tooltip.html(`
                      <div class="font-bold text-white mb-0.5 w-64 leading-tight">${d.title}</div>
                      <div class="text-emerald-400 text-xs mb-1 font-medium">${d.first_author || 'Unknown'} <span class="text-slate-500 font-normal">et al.</span></div>
                      <div class="text-slate-500 text-[10px] mb-2 font-mono">${d.doi}</div>
                      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-slate-700/50 pt-2">
                        <span class="text-slate-400">Bridge Index:</span>
                        <span class="text-emerald-300 font-mono text-right font-bold">${d.bridge_index.toFixed(2)}</span>
                        <span class="text-blue-300 font-mono text-right">Impact Index:</span>
                        <span class="text-blue-300 font-mono text-right">${d.impact_index.toFixed(2)}</span>
                        <span class="col-span-2 h-px bg-slate-700/50 my-1"></span>
                        <span class="text-slate-400">Año:</span> <span class="text-right text-slate-200">${d.year}</span>
                        <span class="text-slate-400">Tipo:</span> <span class="text-right text-slate-200 capitalize">${d.ct_label_v2 || d.ct_label}</span>
                        <span class="text-slate-500">Citas:</span>
                        <span class="text-slate-200 text-right font-mono">${d.openalex_cited_by_count}</span>
                        <span class="text-slate-500">Altmetric:</span>
                        <span class="text-slate-200 text-right font-mono">${d.altmetric_score}</span>
                      </div>
                  `)
              })
              .on("mousemove", (event) => {
                  tooltip.style("left", (event.clientX + 15) + "px")
                         .style("top", (event.clientY + 15) + "px")
              })
              .on("mouseleave", (event) => {
                   d3.select(event.currentTarget).attr("opacity", 1)
                   tooltip.style("opacity", 0).style("display", "none")
              })
          
          // Etiqueta Eje X
          mainGroup.selectAll(".x-label").remove()
          mainGroup.append("text")
              .attr("class", "x-label text-xs uppercase tracking-widest")
              .attr("x", innerWidth / 2)
              .attr("y", innerHeight + 40)
              .attr("text-anchor", "middle")
              .attr("fill", "#94a3b8")
              .text("Bridge Index (Min Z-Score)")
      }

      // Renderizar Leyenda (Horizontal, Arriba-Izquierda)
      const legend = mainGroup.append("g")
          .attr("transform", `translate(0, -45)`) 

      uniqueEntries.forEach((item, i) => {
          // Espaciado horizontal: i * 130 píxeles
          const g = legend.append("g")
              .attr("transform", `translate(${i * 130}, 0)`)
              .style("cursor", "pointer")
              .on("click", function() {
                  const isActive = activeFilters.has(item.key)
                  if (isActive) {
                      activeFilters.delete(item.key)
                      d3.select(this).style("opacity", 0.5)
                  } else {
                      activeFilters.add(item.key)
                      d3.select(this).style("opacity", 1)
                  }
                  update() // Re-renderizar barras
              })

          g.append("circle")
              .attr("r", 5)
              .attr("fill", item.color)
              .attr("cy", -1) // Alinear verticalmente con texto

          g.append("text")
              .attr("x", 10)
              .attr("y", 3)
              .text(item.label)
              .attr("fill", "#cbd5e1")
              .attr("class", "text-[11px] font-medium select-none")
      })

      // Renderizado Inicial
      update()
  }



  renderInnovation() {
      // Ayudante para gráfico de barras horizontal
      // 1. Gráfico P1: Evolución de Patentes (Gráfico de Línea)
      const container = d3.select("#chart-patents")
      container.selectAll("*").remove()
      const width = container.node().clientWidth
      const height = 300
      const margin = { top: 20, right: 120, bottom: 30, left: 40 } // Margen derecho para leyenda

      const svg = container.append("svg")
          .attr("width", width)
          .attr("height", height)

      // Procesamiento de Datos
      const statusMap = {
          'Active': 'Granted',
          'Active - Reinstated': 'Granted',
          'Granted': 'Granted',
          'Abandoned': 'Abandoned',
          'Ceased': 'Abandoned',
          'Expired - Fee Related': 'Abandoned',
          'Pending': 'Pending',
          '': 'Pending' // Predeterminado para vacío
      }

      const years = d3.range(2006, 2026) 
      const yearStatusCounts = {}

      this.patents.forEach(p => {
          const year = parseInt(p.year)
          if (!year || year < 2006 || year > 2025) return 

          const rawStatus = p.legal_status || ''
          const status = statusMap[rawStatus] || 'Pending'

          const key = `${year}-${status}`
          if (!yearStatusCounts[key]) yearStatusCounts[key] = { count: 0, titles: [] }
          
          yearStatusCounts[key].count++
          if (yearStatusCounts[key].titles.length < 5) { // Mantener top 5 para tooltip
              yearStatusCounts[key].titles.push(p.title)
          }
      })

      const categories = ['Granted', 'Abandoned', 'Pending']
      const colors = {
          'Granted': '#10b981',   // Emerald
          'Abandoned': '#ef4444', // Red
          'Pending': '#f59e0b'    // Amber
      }

      // Preparar datos para D3
      const seriesData = categories.map(status => {
          return {
              status: status,
              values: years.map(year => {
                  const key = `${year}-${status}`
                  const data = yearStatusCounts[key] || { count: 0, titles: [] }
                  return { year, count: data.count, titles: data.titles, status }
              })
          }
      })

      // Escalas
      const x = d3.scaleLinear()
          .domain(d3.extent(years))
          .range([margin.left, width - margin.right])

      const y = d3.scaleLinear()
          .domain([0, d3.max(seriesData, s => d3.max(s.values, d => d.count))])
          .nice()
          .range([height - margin.bottom, margin.top])

      // Ejes
      const xAxis = g => g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")))
          .call(g => g.select(".domain").attr("stroke", "#475569"))
          .call(g => g.selectAll(".tick line").attr("stroke", "#475569"))
          .call(g => g.selectAll("text").attr("fill", "#94a3b8"))

      const yAxis = g => g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right))) // Líneas de cuadrícula de ancho completo
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").attr("stroke", "#334155").attr("stroke-opacity", 0.5).attr("stroke-dasharray", "2,2"))
          .call(g => g.selectAll("text").attr("fill", "#94a3b8"))

      svg.append("g").call(xAxis)
      svg.append("g").call(yAxis)

      // Líneas
      const line = d3.line()
          .x(d => x(d.year))
          .y(d => y(d.count))
          .curve(d3.curveMonotoneX)

      svg.selectAll(".line")
          .data(seriesData)
          .join("path")
          .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", d => colors[d.status])
          .attr("stroke-width", 2)
          .attr("d", d => line(d.values))

      // Puntos e Interacción
      const tooltip = d3.select("#impact-tooltip") // Reutilizar tooltip

      categories.forEach(status => {
          const group = svg.append("g")
          
          group.selectAll("circle")
              .data(seriesData.find(s => s.status === status).values)
              .join("circle")
              .attr("cx", d => x(d.year))
              .attr("cy", d => y(d.count))
              .attr("r", 3)
              .attr("fill", colors[status])
              .attr("stroke", "#1e293b")
              .attr("stroke-width", 1)
              .on("mouseenter", (event, d) => {
                  if (d.count === 0) return

                  d3.select(event.currentTarget)
                      .attr("r", 6)
                      .attr("stroke", "white")
                      .attr("stroke-width", 2)

                  const titleList = d.titles.map(t => `<li class="truncate text-slate-400">• ${t}</li>`).join("")
                  
                  const moreCount = d.count - d.titles.length
                  const moreText = moreCount > 0 ? `<div class="mt-1 text-xs text-slate-500 italic">+${moreCount} más</div>` : ""

                  tooltip.style("display", "block")
                      .html(`
                          <div class="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">${d.status} (${d.year})</div>
                          <div class="text-2xl font-bold text-white mb-2">${d.count} <span class="text-xs font-normal text-slate-400">patentes</span></div>
                          <ul class="text-xs space-y-1 max-w-[220px] overflow-hidden">
                              ${titleList}
                          </ul>
                          ${moreText}
                      `)
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 10) + "px")
              })
              .on("mouseleave", (event) => {
                  d3.select(event.currentTarget)
                      .attr("r", 3)
                      .attr("stroke", "#1e293b")
                      .attr("stroke-width", 1)
                  tooltip.style("display", "none")
              })
      })

      // Leyenda (Arriba Derecha)
      const legend = svg.append("g")
          .attr("transform", `translate(${width - 100}, ${margin.top})`)
      
      categories.forEach((status, i) => {
          const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`)
          g.append("rect")
              .attr("width", 12)
              .attr("height", 12)
              .attr("rx", 2)
              .attr("fill", colors[status])
          
          g.append("text")
              .attr("x", 18)
              .attr("y", 10)
              .text(status)
              .attr("fill", "#cbd5e1")
              .attr("font-size", "11px")
      })

      // ---------------------------------------------------------
      // Agregar Texto y Tabla Top 5
      // ---------------------------------------------------------
      const details = d3.select("#patents-details")
      details.html("")

      // Texto Explicativo
      details.append("p")
        .attr("class", "text-sm text-slate-400 mb-6 leading-relaxed")
        .html(`
            La actividad de patentamiento en Pensamiento Computacional muestra una tendencia creciente, 
            con un aumento notable en solicitudes "Active" y "Pending" en los últimos años, lo que sugiere 
            un interés comercial sostenido y en expansión.
        `)

      // Procesamiento de Datos para Top 5 Jurisdicciones
      const jurisdictionStats = {}
      this.patents.forEach(p => {
        const cc = p.jurisdiction || 'Unknown'
        // Normalizar: si es necesario, mapear códigos a nombres completos. Manteniendo códigos por ahora.
        if(!jurisdictionStats[cc]) jurisdictionStats[cc] = { count: 0, inventors: new Set() }
        jurisdictionStats[cc].count++
        if(p.inventors) {
            // Inventores separados por ';'
            p.inventors.split(';').forEach(inv => {
                const name = inv.trim()
                if(name) jurisdictionStats[cc].inventors.add(name)
            })
        }
      })

      const top5 = Object.entries(jurisdictionStats)
          .sort((a,b) => b[1].count - a[1].count)
          .slice(0, 5)

      // Renderizar Tabla
        const tableContainer = details.append("div").attr("class", "overflow-x-auto")
        
        tableContainer.append("h5")
            .attr("class", "text-xs font-bold text-slate-300 uppercase tracking-wider mb-3")
            .text("Top 5 Países con más patentes")

        const table = tableContainer.append("table")
            .attr("class", "w-full text-left text-sm text-slate-400")
        
        // Encabezado
        const thead = table.append("thead")
            .attr("class", "bg-slate-800/50 text-xs text-slate-300 uppercase")
        
        thead.append("tr").html(`
            <th class="px-4 py-2 rounded-tl-lg">País</th>
            <th class="px-4 py-2 text-right rounded-tr-lg">Patentes</th>
        `)

        // Cuerpo
        const tbody = table.append("tbody")
        
        top5.forEach(([country, stats], index) => {
            const row = tbody.append("tr")
                .attr("class", "border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group relative cursor-help")
            
            row.html(`
                <td class="px-4 py-3 font-medium text-slate-200">${country}</td>
                <td class="px-4 py-3 text-right">${stats.count}</td>
            `)

            // Tooltip para Inventores
            // ¿Usamos la lógica de tooltip existente pero activada al pasar el mouse sobre la fila?
            // ¿O simple atributo title? El usuario pidió "Tooltip".
            // Usemos el tooltip D3 que tenemos.
            
            row.on("mouseenter", (event) => {
                const uniqueInventors = stats.inventors.size
                const topInventors = Array.from(stats.inventors).slice(0, 5).join("<br/>")
                const moreInv = stats.inventors.size > 5 ? `+${stats.inventors.size - 5} más` : ""

                d3.select("#impact-tooltip")
                    .style("display", "block")
                    .html(`
                        <div class="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">Inventores (${country})</div>
                        <div class="text-xs text-slate-300 mb-2">Total: <span class="text-white font-bold">${uniqueInventors}</span> inventores</div>
                        <div class="text-[10px] text-slate-400 leading-tight">
                            ${topInventors}
                            <div class="text-slate-500 italic mt-1">${moreInv}</div>
                        </div>
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
            })
            .on("mouseleave", () => {
                d3.select("#impact-tooltip").style("display", "none")
            })
        })

  }

  renderPolicy() {
      // 2. Gráfico P2: Evolución de Políticas (Gráfico de Barras Apiladas)
      const container = d3.select("#chart-policy")
      container.selectAll("*").remove()
      const width = container.node().clientWidth
      const height = 300
      const margin = { top: 20, right: 120, bottom: 30, left: 40 }

      const svg = container.append("svg")
          .attr("width", width)
          .attr("height", height)
      
      // Procesamiento de Datos
      // Filtrar para años válidos
      const data = this.policies.map(d => ({
          year: parseInt(d.year),
          type: d.publisher_type_primary || 'Other'
      })).filter(d => d.year >= 2006 && d.year <= 2025)

      const yearsState = d3.range(2006, 2026)
      const types = Array.from(new Set(data.map(d => d.type))).sort()
      


      // Pivotar datos: [{year: 2010, Government: 5, Nonprofit: 2 ...}, ...]
      const pivotedData = yearsState.map(year => {
          const yearData = { year }
          types.forEach(t => yearData[t] = 0)
          
          data.filter(d => d.year === year).forEach(d => {
              yearData[d.type]++
          })
          return yearData
      })


      // Pila
      const stack = d3.stack().keys(types)
      const stackedData = stack(pivotedData)

      // Paleta de Colores (Distinta)
      const colorScale = d3.scaleOrdinal()
          .domain(types)
          .range(d3.schemeTableau10) // High contrast palette

      // Escalas
      const x = d3.scaleBand()
          .domain(yearsState)
          .range([margin.left, width - margin.right])
          .padding(0.2)

      const yMax = d3.max(stackedData, layer => d3.max(layer, d => d[1])) || 10

      const y = d3.scaleLinear()
          .domain([0, yMax])
          .nice()
          .range([height - margin.bottom, margin.top])

      // Ejes
      const xAxis = g => g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).tickValues(yearsState.filter(y => y % 2 === 0)).tickFormat(d3.format("d"))) // Mostrar cada 2 años
          .call(g => g.select(".domain").attr("stroke", "#475569"))
          .call(g => g.selectAll(".tick line").attr("stroke", "#475569"))
          .call(g => g.selectAll("text").attr("fill", "#94a3b8"))

      const yAxis = g => g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").attr("stroke", "#334155").attr("stroke-opacity", 0.5).attr("stroke-dasharray", "2,2"))
          .call(g => g.selectAll("text").attr("fill", "#94a3b8"))

      svg.append("g").call(xAxis)
      svg.append("g").call(yAxis)

      // Barras
      const layer = svg.selectAll(".layer")
          .data(stackedData)
          .join("g")
          .attr("class", "layer")
          .attr("fill", d => colorScale(d.key))

      layer.selectAll("rect")
          .data(d => d)
          .join("rect")
          .attr("x", d => x(d.data.year))
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[1]))
          .attr("width", x.bandwidth())
          .attr("rx", 1)

      // Interacción de Tooltip
      const tooltip = d3.select("#impact-tooltip")
      
      // Seleccionar solo barras, no rectángulos de leyenda
      svg.selectAll(".layer rect")
          .on("mouseenter", (event, d) => {
              // d es [y0, y1], d.data es la fila, d3.select(this.parentNode).datum().key es el tipo
              const type = d3.select(event.currentTarget.parentNode).datum().key
              const count = d[1] - d[0]
              const year = d.data.year
              
              if (count === 0) return

              d3.select(event.currentTarget).attr("opacity", 0.8).attr("stroke", "white").attr("stroke-width", 1)

              // ¿Calcular porcentaje o total para ese año?
              const total = d3.sum(Object.values(d.data).filter(v => typeof v === 'number' && v !== d.data.year))
              
              tooltip.style("display", "block")
                  .html(`
                      <div class="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">${type} (${year})</div>
                      <div class="text-xl font-bold text-white">${count} <span class="text-xs font-normal text-slate-400">políticas</span></div>
                      <div class="text-xs text-slate-500 mt-1">Total ese año: ${total}</div>
                  `)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 10) + "px")
          })
          .on("mouseleave", (event) => {
              d3.select(event.currentTarget).attr("opacity", 1).attr("stroke", "none")
              tooltip.style("display", "none")
          })

      // Leyenda
      const legend = svg.append("g")
          .attr("transform", `translate(${width - 110}, ${margin.top})`)

      types.forEach((type, i) => {
          const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`)
          g.append("rect")
              .attr("width", 12)
              .attr("height", 12)
              .attr("rx", 2)
              .attr("fill", colorScale(type))
          
          g.append("text")
              .attr("x", 18)
              .attr("y", 10)
              .text(type.length > 15 ? type.substring(0,15)+"..." : type)
              .attr("fill", "#cbd5e1")
              .attr("font-size", "11px")
              .append("title").text(type) // Texto completo al pasar el mouse
      })

      // ---------------------------------------------------------
      // Agregar Detalles: Texto y Tabla Top 5
      // ---------------------------------------------------------
      const details = d3.select("#policy-details")
      details.html("")

      // Texto Explicativo
      details.append("p")
        .attr("class", "text-sm text-slate-400 mb-6 leading-relaxed")
        .html(`
            Las políticas públicas en Pensamiento Computacional han evolucionado desde iniciativas aisladas 
            hacia estrategias nacionales integrales. Inicialmente impulsadas por organizaciones sin fines de lucro, 
            ahora vemos un rol predominante de los gobiernos (Government) estableciendo marcos curriculares formales.
        `)

      // Procesamiento de Datos para Tabla
      const countryStats = {}
      this.policies.forEach(p => {
          const country = p.country_name || "Unknown"
          const type = p.publisher_type_primary || "Other"
          
          if (!countryStats[country]) {
              countryStats[country] = { total: 0, types: {} }
          }
          countryStats[country].total++
          if (!countryStats[country].types[type]) countryStats[country].types[type] = 0
          countryStats[country].types[type]++
      })

      const topCountries = Object.entries(countryStats)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)

      // Renderizar Tabla
      const tableContainer = details.append("div").attr("class", "overflow-x-auto")
      tableContainer.append("h5")
          .attr("class", "text-xs font-bold text-slate-300 uppercase tracking-wider mb-3")
          .text("Top 5 Países con más documentos de política pública")

      const table = tableContainer.append("table")
          .attr("class", "w-full text-left text-sm text-slate-400")
      
      const thead = table.append("thead")
          .attr("class", "bg-slate-800/50 text-xs text-slate-300 uppercase")
      
      thead.append("tr").html(`
          <th class="px-4 py-2 rounded-tl-lg">País</th>
          <th class="px-4 py-2">Tipo de Publisher</th>
          <th class="px-4 py-2 text-right">Documentos</th>
          <th class="px-4 py-2 text-right rounded-tr-lg">Total</th>
      `)

      const tbody = table.append("tbody")

      topCountries.forEach(([country, stats]) => {
          const typeEntries = Object.entries(stats.types).sort((a,b) => b[1] - a[1]) // Ordenar tipos por conteo
          
          typeEntries.forEach((entry, i) => {
             const row = tbody.append("tr")
                 .attr("class", `border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${i === typeEntries.length -1 ? 'border-slate-600' : ''}`)
             
             // Celda de País (solo para el primer tipo)
             if (i === 0) {
                 row.append("td")
                    .attr("class", "px-4 py-3 font-medium text-slate-200 align-top")
                    .attr("rowspan", typeEntries.length)
                    .text(country)
             }
             
             // Celda de Tipo
             row.append("td")
                 .attr("class", "px-4 py-3 align-top")
                 .html(`<span class="inline-block w-2 h-2 rounded-full mr-2" style="background-color: ${colorScale(entry[0])}"></span>${entry[0]}`)

             // Celda de Conteo
             row.append("td")
                 .attr("class", "px-4 py-3 text-right text-slate-300")
                 .text(entry[1])

             // Celda de Total (solo para el primer tipo)
             if (i === 0) {
                 row.append("td")
                    .attr("class", "px-4 py-3 text-right font-bold text-white align-top")
                    .attr("rowspan", typeEntries.length)
                    .text(stats.total)
             }
          })
      })
  }
}
