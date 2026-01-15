import * as d3 from 'd3'
import * as topojson from 'topojson-client'

export function GlobalMap(containerSelector, worldData, countryStats, { width = 800, height = 600 } = {}) {
  // Limpiar anterior
  d3.select(containerSelector).selectAll("*").remove()
  removeTooltip(containerSelector)

  const container = d3.select(containerSelector)
  const svg = container
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", [0, 0, width, height])
    .style("display", "block")
    .style("cursor", "grab")

  // Proyección
  const projection = d3.geoOrthographic()
    .fitExtent([[10, 10], [width - 10, height - 10]], { type: "Sphere" })
    .rotate([0, 0]) // Rotación inicial

  const path = d3.geoPath(projection)

  // Datos
  const countries = topojson.feature(worldData, worldData.objects.countries).features
  // ID Mapa (string) -> Objeto de Datos
  const statsMap = new Map(countryStats.map(d => [String(d.id), d]))

  // Escala de Color (basada en conteo de publicaciones para consistencia)
  const maxCount = d3.max(countryStats, d => d.count) || 0
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, Math.sqrt(maxCount)]) // Raíz cuadrada para mejor distribución

  // Tooltip
  const tooltip = d3.select(containerSelector)
    .append("div")
    .attr("class", "fixed pointer-events-none bg-slate-900/90 border border-slate-700 p-3 rounded shadow-xl text-sm z-50 opacity-0 transition-opacity")

  // Comportamiento de Arrastre (Rotar)
  const drag = d3.drag()
    .on("drag", (event) => {
      const rotate = projection.rotate()
      const k = 75 / projection.scale()
      projection.rotate([
        rotate[0] + event.dx * k,
        rotate[1] - event.dy * k
      ])
      svg.selectAll("path").attr("d", path)
    })
    
  svg.call(drag)

  // Renderizar
  const g = svg.append("g")

  // Fondo de Agua / Esfera
  g.append("path")
    .datum({ type: "Sphere" })
    .attr("d", path)
    .attr("fill", "#0f172a")
    .attr("stroke", "#1e293b")
    .attr("stroke-width", 1)

  // Países
  g.selectAll("path.country")
    .data(countries)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => {
      const id = String(d.id)
      const stat = statsMap.get(id)
      return stat ? colorScale(Math.sqrt(stat.count)) : "#1e293b" 
    })
    .attr("stroke", "#334155")
    .attr("stroke-width", 0.5)
    .on("mouseover", function(event, d) {
       d3.select(this).attr("stroke", "#ffff00").attr("stroke-width", 1.5).raise()
       
       const id = String(d.id)
       const stat = statsMap.get(id)
       
       tooltip.style("opacity", 1).html(`
          <div class="font-bold text-slate-200 mb-1">${d.properties.name || 'Country ' + id}</div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span class="text-slate-400">Pubs:</span>
            <span class="text-slate-200 font-mono text-right">${stat ? d3.format(',')(stat.count) : 0}</span>
            
            <span class="text-slate-400">Citations:</span>
            <span class="text-green-400 font-mono text-right">${stat ? d3.format(',')(stat.citations || 0) : 0}</span>
            
            <span class="text-slate-400">Altmetric:</span>
            <span class="text-blue-400 font-mono text-right">${stat ? d3.format(',')(Math.round(stat.altmetric || 0)) : 0}</span>
          </div>
       `)
    })
    .on("mousemove", (event) => {
        tooltip
          .style("left", (event.clientX + 15) + "px")
          .style("top", (event.clientY + 15) + "px")
    })
    .on("mouseout", function(event, d) {
       const id = String(d.id)
       const stat = statsMap.get(id)
       d3.select(this)
         .attr("stroke", "#334155")
         .attr("stroke-width", 0.5)
         
       tooltip.style("opacity", 0)
    })

  // Agregar Graticula (opcional por estilo)
  const graticule = d3.geoGraticule()
  g.append("path")
    .datum(graticule())
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.1)
    .attr("stroke-opacity", 0.1)

}

function removeTooltip(containerSelector) {
    d3.select(containerSelector).selectAll("div").remove()
}
