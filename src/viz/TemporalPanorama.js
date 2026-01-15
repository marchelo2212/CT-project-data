import * as d3 from 'd3'

export class TemporalPanorama {
  constructor(containerId, data, masterData) {
    this.containerId = containerId
    this.container = document.querySelector(containerId)
    this.data = data
    this.masterData = masterData || []
    this.isOpen = false
    
    // Actualizado: Incluir 'none' por defecto
    this.activeSeries = new Set(['core', 'broad', 'noise', 'none'])
    
    // Configuración de Etiquetas
    this.labels = ['core', 'broad', 'noise', 'none']
    this.displayNames = {
        'core': 'Nuclear (Core)',
        'broad': 'Periférica (Broad)',
        'noise': 'Aislada (Noise)',
        'none': 'Escasa relevancia (Other)'
    }
    this.colorMap = {
        'core': '#10b981', // Emerald
        'broad': '#3b82f6', // Blue
        'noise': '#64748b',  // Slate
        'none': '#94a3b8'    // Lighter slate
    }

    // Procesar datos: FILTRAR SOLO POR AÑO (mantuvo 'none' dentro)
    this.processedData = this.data
      .filter(d => d.year >= 1990 && d.year <= 2025) 
      .sort((a, b) => a.year - b.year)

    // Pre-calcular Top Papers por Año
    this.topPapers = {}
    if (this.masterData.length > 0) {
        const papersByYear = d3.group(this.masterData, d => +d.year)
        for (const [year, papers] of papersByYear) {
            if (year < 1990 || year > 2025) continue;
            // Find max citations
            // comprobando prioridad de 'cited_by', 'dimensions_times_cited', 'scopus_citations'?
            // El masterData probablemente tiene 'cited_by' como canónico o columna similar de pasos anteriores.
            // Asumamos que 'cited_by' existe y es numérico basado en el contexto anterior.
            const top = d3.greatest(papers, p => +p.cited_by || 0)
            if (top) {
                this.topPapers[year] = {
                    title: top.title,
                    authors: top.authors || 'Unknown',
                    citations: +top.cited_by || 0,
                    doi: top.doi
                }
            }
        }
    }

    this.init()
  }

  init() {
    // 1. Inyectar Estructura HTML
    this.container.innerHTML = `
      <div class="mb-6">
        <h2 class="text-3xl font-bold text-slate-100 mb-4">Panorama Temporal</h2>
        <div class="bg-slate-800/50 p-4 rounded-lg border-l-4 border-emerald-500 text-slate-300 space-y-2 text-sm shadow-sm">
            <p>
                Las siguientes visualizaciones son el resultado de un <strong>análisis semántico automatizado</strong> aplicado a todo el corpus bibliográfico. 
                Mediante heurísticas de texto y metadatos, cada publicación ha sido evaluada y clasificada en cuatro niveles de pertenencia al campo del Pensamiento Computacional (CT):
            </p>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                <li class="flex items-start gap-2">
                    <span class="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span><strong class="text-emerald-400">Nuclear (Core):</strong> Evidencia explícita de CT o intersección fuerte entre Educación y Computación.</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></span>
                    <span><strong class="text-blue-400">Periférica (Broad):</strong> Temas relacionados y conexos, pero con menor especificidad.</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="w-2 h-2 mt-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span><strong class="text-slate-400">Aislada (Noise):</strong> Uso de terminología técnica similar (ej. "computación paralela") fuera del contexto educativo.</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="w-2 h-2 mt-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span><strong class="text-slate-500">Escasa relevancia (Other):</strong> Literatura base capturada por búsquedas amplias sin marcadores distintivos.</span>
                </li>
            </ul>
        </div>
      </div>

      <div id="panorama-container" class="mb-8 border border-slate-700 rounded-lg p-4 bg-slate-900/50">
        
        <div id="panorama-content" class="mt-2 space-y-8">
             
             <!-- 1.1 Total Production -->
             <div id="viz-total" class="relative group">
                <h3 class="text-lg font-semibold text-slate-300 mb-2">1.1 Producción Global</h3>
                <div id="chart-total" class="h-[250px] w-full bg-slate-800/20 rounded-lg relative"></div>
                <div class="text-sm text-slate-400 mt-2 italic border-l-2 border-slate-600 pl-3">
                   Evolución del volumen total de publicaciones. Pasa el cursor para ver el <strong>Paper más citado</strong> de cada año.
                </div>
                <!-- Tooltip para Gráfico Total -->
                <div id="total-tooltip" class="absolute pointer-events-none hidden bg-slate-950/95 border border-amber-500/30 p-4 rounded shadow-2xl text-xs text-slate-200 z-50 transition-opacity duration-75 max-w-[300px]"></div>
             </div>

             <!-- Legend Filter (Global) -->
             <div class="flex flex-wrap gap-4 mb-4 justify-end text-sm select-none">
                <div class="text-slate-400 mr-2 flex items-center">Filtros (1.2 & 1.3):</div>
                ${this.labels.map(L => {
                    return `
                    <div class="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" data-series="${L}">
                        <span class="legend-dot w-3 h-3 rounded-full transition-colors" 
                              style="background-color: ${this.colorMap[L]}"></span> 
                        <span class="legend-label text-slate-300">${this.displayNames[L]}</span>
                    </div>`
                }).join('')}
             </div>

             <!-- 1.2 Trend -->
             <div id="viz-trend" class="relative group">
                <h3 class="text-lg font-semibold text-slate-300 mb-2">1.2 Clasificación por Relevancia</h3>
                <div id="chart-trend" class="h-[400px] w-full bg-slate-800/20 rounded-lg relative"></div>
                <div class="text-sm text-slate-400 mt-2 italic border-l-2 border-slate-600 pl-3">
                  <span class="text-slate-500">1990–2006:</span> Difuso &bull;
                  <span class="text-blue-400">2006–2013:</span> Emergente &bull;
                  <span class="text-indigo-400">2013–2020:</span> Consolidado &bull;
                  <span class="text-purple-400">2020–2026:</span> Expansión
                </div>
                <!-- Contenedor de Tooltip Compartido -->
                <div id="trend-tooltip" class="absolute pointer-events-none hidden bg-slate-950/90 border border-slate-700 p-3 rounded shadow-xl text-xs text-slate-200 z-50 transition-opacity duration-75"></div>
             </div>
             
             <!-- Legend Filter (Duplicate for 1.3) -->
             <div class="flex flex-wrap gap-4 mb-4 justify-end text-sm select-none border-t border-slate-800 pt-4 mt-8">
                <div class="text-slate-400 mr-2 flex items-center">Filtros:</div>
                ${this.labels.map(L => {
                    return `
                    <div class="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" data-series="${L}">
                        <span class="legend-dot w-3 h-3 rounded-full transition-colors" 
                              style="background-color: ${this.colorMap[L]}"></span> 
                        <span class="legend-label text-slate-300">${this.displayNames[L]}</span>
                    </div>`
                }).join('')}
             </div>

             <!-- 1.3 Composition -->
             <div id="viz-composition" class="relative group">
                <h3 class="text-lg font-semibold text-slate-300 mb-2">1.3 Proporción CT vs no-CT</h3>
                <div id="chart-composition" class="h-[300px] w-full bg-slate-800/20 rounded-lg relative"></div>
                <div class="text-sm text-slate-400 mt-2 italic border-l-2 border-slate-600 pl-3">
                   Visualiza la tensión entre la literatura <span class="text-emerald-400">Nuclear</span>, <span class="text-blue-400">Periférica</span>, <span class="text-slate-400">Aislada</span> y <span class="text-slate-500">Escasa relevancia</span>.
                </div>
                <div id="composition-tooltip" class="absolute pointer-events-none hidden bg-slate-950/90 border border-slate-700 p-3 rounded shadow-xl text-xs text-slate-200 z-50 transition-opacity duration-75"></div>
             </div>
        </div>
      </div>
    `

    // 2. Escuchadores de Eventos
    // Escuchadores de Leyenda (Adjuntar a todas las instancias)
    const allFilters = this.container.querySelectorAll('[data-series]')
    allFilters.forEach(btn => {
        btn.addEventListener('click', () => {
             const series = btn.getAttribute('data-series')
             
             if (this.activeSeries.has(series)) {
                 this.activeSeries.delete(series)
             } else {
                 this.activeSeries.add(series)
             }
             
             // Sincronizar UI (todos los botones)
             this.updateLegends()
             this.renderCharts()
        })
    })

    // UI Inicialmente activa
    this.renderCharts()
  }

  updateLegends() {
      const allBtns = this.container.querySelectorAll('[data-series]')
      allBtns.forEach(btn => {
          const series = btn.getAttribute('data-series')
          const dot = btn.querySelector('.legend-dot')
          const label = btn.querySelector('.legend-label')

          if (this.activeSeries.has(series)) {
              // Activo
              dot.style.backgroundColor = this.colorMap[series]
              dot.classList.remove('opacity-50')
              label.classList.remove('line-through', 'opacity-50')
          } else {
              // Inactivo
              dot.style.backgroundColor = '#475569' // slate-600
              dot.classList.add('opacity-50')
              label.classList.add('line-through', 'opacity-50')
          }
      })
  }

  renderCharts() {
    // Limpiar anterior
    document.querySelector('#chart-total').innerHTML = ''
    document.querySelector('#chart-trend').innerHTML = ''
    document.querySelector('#chart-composition').innerHTML = ''
    
    this.renderTotalChart()
    this.renderTrendChart()
    this.renderCompositionChart()
  }

  renderTotalChart() {
    const margin = {top: 20, right: 30, bottom: 30, left: 40}
    const width = document.querySelector('#chart-total').clientWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const svg = d3.select('#chart-total')
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // Agregar datos por año (total n_papers)
    const dataByYear = d3.rollup(this.processedData, 
        v => d3.sum(v, d => d.n_papers), 
        d => d.year
    )
    const chartData = Array.from(dataByYear, ([year, total]) => ({year, total}))
        .sort((a,b) => a.year - b.year)

    // Escalas
    const x = d3.scaleBand()
        .range([0, width])
        .domain(chartData.map(d => d.year))
        .padding(0.2)
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.total)])
        .range([height, 0])

    // Ejes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      // .call(d3.axisBottom(x).tickValues(x.domain().filter((d,i) => !(i%5)))) // Show every 5 years?
      .call(d3.axisBottom(x).tickValues([1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025]))
      .attr('class', 'text-xs text-slate-400')
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('class', 'text-xs text-slate-400')


    // Barras
    const bars = svg.selectAll('rect')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('x', d => x(d.year))
      .attr('y', d => y(d.total))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.total))
      .attr('fill', '#94a3b8')

    // Interacción (Estilo unificado con línea vertical)
    const tooltip = document.querySelector('#total-tooltip')
    
    // Contenedor de efectos de mouse
    const mouseG = svg.append('g').attr('class', 'mouse-over-effects').style('opacity', 0)
    
    mouseG.append('line')
        .attr('class', 'mouse-line')
        .style('stroke', 'white')
        .style('stroke-width', '1px')
        .style('stroke-dasharray', '2 2')
        .style('opacity', '0.5')
        .attr('y1', 0)
        .attr('y2', height)

    // Rectángulo de Superposición
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', () => {
          mouseG.style('opacity', 0)
          tooltip.classList.add('hidden')
          bars.attr('fill', '#94a3b8') // restablecer barras
      })
      .on('mouseover', () => {
           mouseG.style('opacity', 1)
           tooltip.classList.remove('hidden')
      })
      .on('mousemove', (event) => {
          const [mx] = d3.pointer(event)
          
          // Calcular año desde Escala de Banda
          const step = x.step()
          const index = Math.floor(mx / step)
          const domain = x.domain()
          
          // comprobaciones de límites
          if (index < 0 || index >= domain.length) return
          
          const year = domain[index]
          const xPos = x(year) + x.bandwidth()/2
          
          // Mover Línea al centro de la banda
          mouseG.select('.mouse-line').attr('transform', `translate(${xPos}, 0)`)
          
          // Resaltar barra activa
          bars.attr('fill', d => d.year === year ? '#fbbf24' : '#94a3b8') // amber-400

          // Datos de Tooltip
          const d = chartData.find(c => c.year === year)
          if (!d) return

          // Encontrar top paper
          const topPaper = this.topPapers[year]
          
          let paperHtml = ''
          if (topPaper) {
              paperHtml = `
              <div class="mt-2 pt-2 border-t border-slate-600">
                  <div class="text-[10px] uppercase text-amber-500 font-bold mb-1">Paper más citado (${topPaper.citations} cit.)</div>
                  <div class="italic text-white mb-1 leading-tight">"${topPaper.title}"</div>
                  <div class="text-slate-400 truncate">${topPaper.authors}</div>
              </div>`
          }

          tooltip.innerHTML = `
              <div class="font-bold text-lg text-slate-100 mb-1">${year}</div>
              <div class="text-slate-300">Producción total: <span class="text-white font-mono font-bold">${d.total}</span> docs</div>
              ${paperHtml}
          `
          
          // Posicionar Tooltip (Seguir mouse)
          // Usar evento directamente o puntero d3
          // ¿Los otros gráficos usan lógica de desplazamientos fijos? ¿O siguen al mouse?
          // Usuario solicitó: "mostrar la información en la posición del mouse".
          const [tooltipX, tooltipY] = d3.pointer(event)
          
          let left = tooltipX + 20
          if (left > width - 200) left = tooltipX - 220
          
          tooltip.style.left = `${left}px`
          tooltip.style.top = `${tooltipY}px`
      })
  }

  renderTrendChart() {
    const margin = {top: 20, right: 30, bottom: 30, left: 40}
    const width = document.querySelector('#chart-trend').clientWidth - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const svg = d3.select('#chart-trend')
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // Escalas
    const x = d3.scaleLinear()
      .domain([1990, 2026])
      .range([0, width])
    
    // Filtrar datos basados en activeSeries
    const visibleData = this.processedData.filter(d => this.activeSeries.has(d.ct_label))
    const maxVal = d3.max(visibleData, d => +d.n_papers) || 100
    
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .range([height, 0])

    // Ejes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')))
      .attr('class', 'text-xs text-slate-400')

    svg.append('g')
      .call(d3.axisLeft(y))
      .attr('class', 'text-xs text-slate-400')
      
    // Marcadores de Contexto
    const markers = [
        {year: 2006, label: 'Emergente'},
        {year: 2013, label: 'Consolidado'},
        {year: 2020, label: 'Expansión'}
    ]
    markers.forEach(m => {
        const xPos = x(m.year)
        // Línea discontinua vertical
        svg.append('line')
           .attr('x1', xPos).attr('x2', xPos)
           .attr('y1', 0).attr('y2', height)
           .attr('stroke', '#475569') // slate-600
           .attr('stroke-width', 1)
           .attr('stroke-dasharray', '4 4')
           .style('opacity', 0.5)
        
        // Etiqueta en la parte superior
        svg.append('text')
           .attr('x', xPos + 5)
           .attr('y', 10)
           .text(m.label)
           .attr('class', 'text-[10px] fill-slate-500 uppercase tracking-wider')
           .style('font-size', '10px')
           .style('fill', '#64748b')
    })
    
    // Agregar etiqueta "Difuso" (Pre-2006)
    svg.append('text')
       .attr('x', x(1998))
       .attr('y', 10)
       .text('Difuso')
       .attr('class', 'text-[10px] fill-slate-500 uppercase tracking-wider')
       .style('font-size', '10px')
       .style('fill', '#64748b')
       .style('text-anchor', 'middle')

    // Líneas
    const groups = d3.group(visibleData, d => d.ct_label)
    
    this.labels.forEach(label => {
        if (!this.activeSeries.has(label)) return
        
        const dataGroup = groups.get(label) || []
        dataGroup.sort((a,b) => a.year - b.year)

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.n_papers))
            .curve(d3.curveMonotoneX)

        svg.append('path')
            .datum(dataGroup)
            .attr('fill', 'none')
            .attr('stroke', this.colorMap[label])
            .attr('stroke-width', 2)
            .attr('d', line)
            .style('opacity', label === 'none' ? 0.6 : 1) // desvanecer ligeramente línea none
    })
    
    // Superposición Interactiva
    this.setupInteraction(svg, x, y, width, height, visibleData, '#chart-trend', '#trend-tooltip')
  }

  renderCompositionChart() {
     const dataByYear = d3.group(this.processedData, d => d.year)
     const pivotData = []
     const activeKeys = this.labels.filter(l => this.activeSeries.has(l))

     for (const [year, values] of dataByYear) {
         if (year < 1990 || year > 2025) continue;
         const row = { year: year }
         let total = 0
         
         // Only sum active keys
         activeKeys.forEach(k => {
             const found = values.find(d => d.ct_label === k)
             const val = found ? +found.n_papers : 0
             row[k] = val
             total += val
         })
         
         if (total > 0) {
             activeKeys.forEach(k => row[k] = (row[k] / total) * 100)
             pivotData.push(row)
         }
     }
     pivotData.sort((a,b) => a.year - b.year)

    const margin = {top: 10, right: 30, bottom: 30, left: 40}
    const width = document.querySelector('#chart-composition').clientWidth - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const svg = d3.select('#chart-composition')
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([1990, 2025]).range([0, width])
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0])

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')))
      .attr('class', 'text-xs text-slate-400')
    svg.append('g').call(d3.axisLeft(y)).attr('class', 'text-xs text-slate-400')
    
    // Pila
    if (activeKeys.length > 0) {
        // ¿Ordenar claves específicamente? ¿Poner 'none' al fondo?
        // d3.stack por defecto usa índice.
        // ¿Queremos 'none' al fondo o arriba? Fondo es mejor para el piso de ruido.
        // Aseguremos que 'none' sea el ÚLTIMO en el array si lo queremos arriba, o primero si fondo
        // Realmente el orden de pila d3: keys[0] es el más bajo si el orden de área sigue.
        
        // Ordenemos activeKeys para que 'none' sea PRIMERO (fondo), luego noise, broad, core (top)
        const orderPriority = ['none', 'noise', 'broad', 'core']
        activeKeys.sort((a,b) => orderPriority.indexOf(a) - orderPriority.indexOf(b))

        const stackedData = d3.stack().keys(activeKeys)(pivotData)
        const area = d3.area()
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            
        svg.selectAll('mylayers')
            .data(stackedData)
            .enter()
            .append('path')
            .attr('d', area)
            .style('fill', d => this.colorMap[d.key])
            .style('opacity', 0.8)
    }

    // Agregar Interacción
    // Reutilizamos setupInteraction pero necesitamos coincidir con la escala.
    // Sin embargo, el gráfico 1.3 es 0-100%, pero setupInteraction espera valores lineales crudos para puntos.
    // Por ahora, un tooltip válido es mejor que los puntos. ¿Podemos pasar una escala Y ficticia o bandera para saltar puntos?
    // Realmente, puntos en "valor de fila" en una escala 0-100 es incorrecto. 150 papers > 100%.
    // Pasar una escala y "nula" para señalar "saltar puntos" podría ser una actualización rápida para setupInteraction.
    
    // Pasemos 'isPercentage: true' como un argumento especializado o manejado dentro del método.
    // Actualizando firma de setupInteraction en el siguiente paso.
    this.setupInteraction(svg, x, null, width, height, this.processedData, '#chart-composition', '#composition-tooltip')
  }

  setupInteraction(svg, x, y, width, height, visibleData, containerSelector, tooltipSelector) {
      // Línea Vertical Compartida
      const mouseG = svg.append('g').attr('class', 'mouse-over-effects').style('opacity', 0)
      
      mouseG.append('line')
        .attr('class', 'mouse-line')
        .style('stroke', 'white')
        .style('stroke-width', '1px')
        .style('stroke-dasharray', '2 2')
        .style('opacity', '0.5')
        .attr('y1', 0)
        .attr('y2', height)

      // Círculos para cada serie (Solo si la escala Y se proporciona/lineal)
      let mousePerLine = null
      if (y) {
          const activeKeys = this.labels.filter(l => this.activeSeries.has(l))
          mousePerLine = mouseG.selectAll('.mouse-per-line')
            .data(activeKeys)
            .enter()
            .append('g')
            .attr('class', 'mouse-per-line')

          mousePerLine.append('circle')
            .attr('r', 4)
            .style('stroke', d => this.colorMap[d])
            .style('fill', '#1e293b') // slate-900
            .style('stroke-width', 2)
      }

      // Rectángulo de Superposición
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', () => {
            mouseG.style('opacity', 0)
            document.querySelector(tooltipSelector).classList.add('hidden')
        })
        .on('mouseover', () => {
             mouseG.style('opacity', 1)
             document.querySelector(tooltipSelector).classList.remove('hidden')
        })
        .on('mousemove', (event) => {
            const [mx] = d3.pointer(event)
            const year = Math.round(x.invert(mx))
            
            // Mover Línea
            mouseG.select('.mouse-line').attr('transform', `translate(${x(year)}, 0)`)
            
            // Mover círculos y recopilar texto
            let tooltipHtml = `<strong class="block mb-1 text-slate-100">${year}</strong>`
            
            // Obtener datos para este año
            const dataForYear = this.processedData.filter(d => d.year === year)
            if (dataForYear.length === 0) return

            if (mousePerLine && y) {
                mousePerLine.attr('transform', (k) => {
                    const item = dataForYear.find(d => d.ct_label === k)
                    const val = item ? item.n_papers : 0
                    return `translate(${x(year)},${y(val)})`
                })
            }
            
            // Lógica de Contenido de Tooltip
            const total = d3.sum(dataForYear, d => d.n_papers)
            
            // Ordenar para visualización de tooltip (Orden semántico: Core -> Broad -> Noise -> None)
            const displayOrder = ['core', 'broad', 'noise', 'none']
            
            // Iteramos etiquetas para mostrar todas las capaces
            displayOrder.forEach(label => {
                const item = dataForYear.find(d => d.ct_label === label)
                // Si está activo y existe (o es 0 pero queremos mostrar 0?)
                if (this.activeSeries.has(label)) {
                     const val = item ? item.n_papers : 0
                     const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0
                     
                     let labelName = this.displayNames[label] || label
                     
                     tooltipHtml += `
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${this.colorMap[label]}"></span>
                            <span class="capitalize w-auto min-w-[100px] text-slate-300">${labelName}:</span>
                            <span class="font-mono text-white">${val}</span>
                            <span class="text-xs text-slate-500">(${pct}%)</span>
                        </div>
                     `
                }
            })

            // Posicionar Tooltip
            const tooltip = document.querySelector(tooltipSelector)
            tooltip.innerHTML = tooltipHtml
            
            let tx = x(year) + 50
            let ty = d3.pointer(event)[1] 
            if (tx > width - 160) tx = x(year) - 190
            
            tooltip.style.left = `${tx}px`
            tooltip.style.top = `${ty}px`
        })
  }
}
