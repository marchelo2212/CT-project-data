
import * as d3 from 'd3'

export function StreamGraph(containerSelector, rawData, { width = 800, height = 400 } = {}) {
    // containerSelector puede ser una cadena o un elemento DOM
    const container = containerSelector instanceof Element 
        ? d3.select(containerSelector) 
        : d3.select(containerSelector)
    
    container.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 30, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;")

    // 1. Procesar Datos
    // Espera: year, topic, share, topic_label
    // Pivotar a: [{year: 1990, topic_0: 0.1, topic_1: 0.5...}, ...]
    
    // Obtener temas únicos y años
    const years = Array.from(new Set(rawData.map(d => +d.year))).sort((a,b) => a-b)
    const topicIds = Array.from(new Set(rawData.map(d => d.topic)))
    
    // Mapeo para etiquetas y colores
    const topicLabels = new Map()
    rawData.forEach(d => {
        topicLabels.set(d.topic, d.topic_label)
    })

    // Pivotar
    const pivotData = []
    const dataByYear = d3.group(rawData, d => +d.year)
    
    years.forEach(year => {
        const row = { year }
        const records = dataByYear.get(year) || []
        topicIds.forEach(t => row[t] = 0) // init
        records.forEach(r => {
            row[r.topic] = +r.share
        })
        pivotData.push(row)
    })

    // 2. Diseño de Pila
    const stack = d3.stack()
        .keys(topicIds)
        .offset(d3.stackOffsetSilhouette) // flujo centrado
        .order(d3.stackOrderNone)

    const series = stack(pivotData)

    // 3. Escalas
    const x = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([margin.left, width - margin.right])

    const y = d3.scaleLinear()
        .domain([
            d3.min(series, layer => d3.min(layer, d => d[0])),
            d3.max(series, layer => d3.max(layer, d => d[1]))
        ])
        .range([height - margin.bottom, margin.top])

    const colorMap = {
        'ct_core_skills': '#10b981', // Esmeralda-500
        'transversal_skills': '#a855f7', // Púrpura-500
        'Core Skills': '#10b981', 
        'Transversal Skills': '#a855f7'
    }

    const color = d3.scaleOrdinal()
        .domain(topicIds)
        .range(topicIds.map(id => colorMap[id] || '#64748b')) // Alternativa a Slate-500

    // 4. Area Generator
    const area = d3.area()
        .curve(d3.curveBasis) // Sensación orgánica
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))

    // 5. Renderizar
    const g = svg.append("g")

    // Tooltip
    const tooltip = container
        .append("div")
        .attr("class", "fixed pointer-events-none bg-slate-900/90 border border-slate-700 p-2 rounded text-xs shadow-xl z-50 opacity-0 transition-opacity")
    
    g.selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", d => color(d.key))
        .attr("d", area)
        .attr("opacity", 0.9)
        .attr("stroke", "rgba(255,255,255,0.1)")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 1).attr("stroke", "white")
            const label = topicLabels.get(d.key) || `Topic ${d.key}`
            
            tooltip.style("opacity", 1)
                .html(`<div class="font-bold text-slate-200">${label}</div>`)
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY + 15) + "px")
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.9).attr("stroke", "rgba(255,255,255,0.1)")
            tooltip.style("opacity", 0)
        })

    // 6. Eje
    const xAxis = d3.axisBottom(x).tickFormat(d3.format("d")).ticks(width / 80)
    
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .attr("color", "#64748b")
        .select(".domain").remove()

    // Agregar Etiqueta X
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", "10px")
        .text("Year")
}
