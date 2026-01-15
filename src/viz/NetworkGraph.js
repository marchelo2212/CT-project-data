import * as d3 from 'd3'

// Ayudante de limpieza global
function removeTooltip(containerSelector) {
    const node = d3.select(containerSelector).node()
    if (node) {
        if (node._tooltipId) d3.select(`#${node._tooltipId}`).remove()
        if (node._resizeObserver) node._resizeObserver.disconnect()
    }
}

export function NetworkGraph(containerSelector, { nodes, links }, { width = 800, height = 600 } = {}) {
  // Limpiar anterior
  d3.select(containerSelector).selectAll("*").remove()
  removeTooltip(containerSelector)

  const container = d3.select(containerSelector)
  const svg = container
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("style", "display: block; width: 100%; height: 100%; background: #0f172a; cursor: grab;")

  // Agregar un elemento de agrupación para zoom
  const g = svg.append("g")

  // Comportamiento de Zoom
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform)
    })

  svg.call(zoom)

  // Simulación
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    // La fuerza central se actualizará al cambiar el tamaño, establecida inicialmente al centro actual
    .force("center", d3.forceCenter(container.node().clientWidth / 2, container.node().clientHeight / 2))
    .force("collide", d3.forceCollide().radius(d => d.r + 5))

  // Renderizar Enlaces
  const link = g.append("g")
    .attr("stroke", "#475569")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value))

  // 0. Escala de Color
  const colorMap = {
      'core': '#10b981',      // Emerald-500
      'broad': '#3b82f6',     // Blue-500
      'noise': '#64748b',     // Slate-500
      'none': '#94a3b8',      // Slate-400
      'unknown': '#475569'
  }

  // Renderizar Nodos
  const node = g.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", d => d.r)
    .attr("fill", d => colorMap[d.group] || colorMap['unknown'])
    .attr("stroke", "#1e293b")
    .attr("stroke-width", 2)
    .call(drag(simulation))

  // Etiquetas
  const label = g.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text(d => d.id)
    .attr("font-size", "10px")
    .attr("fill", "#cbd5e1")
    .attr("text-anchor", "middle")
    .attr("pointer-events", "none")
    .attr("dy", d => -d.r - 5)

  // Tick de Simulación
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)

    label
      .attr("x", d => d.x)
      .attr("y", d => d.y)
  })

  // Redimensionamiento Responsivo
  const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
           const { width, height } = entry.contentRect
           simulation.force("center", d3.forceCenter(width / 2, height / 2))
           simulation.alpha(0.3).restart()
      }
  })
  resizeObserver.observe(container.node())
  
  container.node()._resizeObserver = resizeObserver

  // 1. Leyenda Interactiva
  const legendId = `legend-net-${Math.random().toString(36).substr(2, 9)}`
  const legend = d3.select(containerSelector).append("div")
      .attr("id", legendId)
      .attr("class", "absolute top-4 left-4 flex flex-col gap-2 bg-slate-900/90 p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-sm z-10")

  const categories = [
      { id: 'core', label: 'Nuclear (Core)', color: colorMap['core'] },
      { id: 'broad', label: 'Periférica (Broad)', color: colorMap['broad'] },
      { id: 'noise', label: 'Aislada (Noise)', color: colorMap['noise'] },
      { id: 'unknown', label: 'Escasa relevancia', color: colorMap['unknown'] }
  ]

  // Rastrear filtros activos
  const activeFilters = new Set(categories.map(c => c.id))

  const legendItems = legend.selectAll(".legend-item")
      .data(categories)
      .join("div")
      .attr("class", "flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-1 rounded transition-colors")
      .on("click", (event, d) => {
          if (activeFilters.has(d.id)) {
              activeFilters.delete(d.id)
          } else {
              activeFilters.add(d.id)
          }
          updateVisibility()
          updateLegendUI()
      })

  function updateLegendUI() {
      legendItems.html(d => `
          <div class="w-3 h-3 rounded-full border border-slate-600 transition-all ${activeFilters.has(d.id) ? 'scale-110' : 'opacity-50 grayscale'}" style="background-color: ${d.color}; box-shadow: ${activeFilters.has(d.id) ? `0 0 8px ${d.color}40` : 'none'}"></div>
          <span class="text-xs font-medium ${activeFilters.has(d.id) ? 'text-slate-200' : 'text-slate-500'}">${d.label}</span>
      `)
  }
  
  function updateVisibility() {
      const isVisible = d => activeFilters.has(d.group || 'unknown')
      
      node.transition().duration(300)
          .attr("opacity", d => isVisible(d) ? 1 : 0.05)
          .attr("pointer-events", d => isVisible(d) ? "all" : "none")
      
      label.transition().duration(300)
           .attr("opacity", d => isVisible(d) ? 1 : 0)

      link.transition().duration(300)
          .attr("opacity", l => (isVisible(l.source) && isVisible(l.target)) ? 0.6 : 0.05)
  }

  // Renderizado Inicial
  updateLegendUI()


  // Lógica de Tooltip
  const tooltipId = `tooltip-net-${Math.random().toString(36).substr(2, 9)}`
  const tooltip = d3.select("body")
    .append("div")
    .attr("id", tooltipId)
    .attr("class", "fixed hidden z-50 bg-slate-900/95 text-slate-100 text-xs p-3 rounded border border-slate-700 shadow-xl pointer-events-none max-w-xs")
  
  // Adjuntar ID de tooltip al contenedor
  container.node()._tooltipId = tooltipId

  node
    .on("mouseover", (event, d) => {
        if (!activeFilters.has(d.group || 'unknown')) return

        tooltip.style("display", "block")
        
        const connectedIds = new Set()
        connectedIds.add(d.id)
        links.forEach(l => {
            if (l.source.id === d.id) connectedIds.add(l.target.id)
            if (l.target.id === d.id) connectedIds.add(l.source.id)
        })
        
        node.attr("opacity", n => {
            if (!activeFilters.has(n.group || 'unknown')) return 0.05
            return connectedIds.has(n.id) ? 1 : 0.1
        })
        
        link
            .attr("opacity", l => {
                 if (!activeFilters.has(l.source.group || 'unknown') || !activeFilters.has(l.target.group || 'unknown')) return 0.05
                 return (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.05
            })
            .attr("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "#fbbf24" : "#475569") // Resaltar con Ámbar
    })
    .on("mousemove", (event, d) => {
        if (!activeFilters.has(d.group || 'unknown')) return

        const title = d.title || d.id
        const year = d.year || 'N/A'
        const score = d.ct_membership_score_v2 ? d.ct_membership_score_v2.toFixed(3) : 'N/A'
        const journal = d.journal || 'Unknown Source'
        const author = d.authors ? d.authors.split(';')[0] : 'Unknown Author' // Mostrar primer autor
        const doi = d.id
        
        // Conceptos pueden ser un array o string
        let concepts = d.top_concepts || ''
        if (Array.isArray(concepts)) concepts = concepts.join(', ')
        
        tooltip
            .html(`
                <div class="font-bold text-amber-400 mb-1 line-clamp-2">${title}</div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400 mb-2 text-[10px]">
                    <span class="col-span-2 text-slate-300 border-b border-slate-700 pb-1 mb-1">${author}, et al.</span>
                    <span>Year: <span class="text-slate-200">${year}</span></span>
                    <span>Score: <span class="text-slate-200">${score}</span></span>
                    <span class="col-span-2 truncate" title="${journal}">${journal}</span>
                    <span class="col-span-2 font-mono text-slate-500 text-[9px] truncate">${doi}</span>
                </div>
                <div class="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Concepts</div>
                <div class="text-slate-300 leading-tight line-clamp-3">${concepts}</div>
            `)
            .style("left", `${event.clientX + 15}px`)
            .style("top", `${event.clientY + 15}px`)
    })
    .on("mouseout", () => {
        tooltip.style("display", "none")
        updateVisibility() // Restaurar estado de visibilidad
        link.attr("stroke", "#475569")
    })

  // Ayudante de Arrastre con arreglo de Zoom
  // Al hacer zoom, las coordenadas pueden cambiar, pero d3.drag generalmente lo maneja si se adjunta a nodos
  // Sin embargo, es posible que queramos deshabilitar el zoom mientras se arrastra o asegurar que funcionen bien juntos.
  // d3.drag estándar funciona bien dentro de d3.zoom si la validación es correcta.
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }
    
    function dragged(event) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  }
}
