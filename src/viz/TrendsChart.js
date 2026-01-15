
import * as d3 from 'd3'

export function TrendsChart(containerSelector, rawData, { width = 800, height = 600 } = {}) {
    const container = containerSelector instanceof Element 
        ? d3.select(containerSelector) 
        : d3.select(containerSelector)
    
    container.selectAll("*").remove()

    // Filtrar ruido (números, palabras cortas)
    const data = rawData.filter(d => {
        const term = d.term.toLowerCase()
        return isNaN(term) && term.length > 3 && !term.includes('202')
    }).map(d => ({
        ...d,
        x: +d.diffusion_n, // Difusión Normalizada
        y: +d.growth_n,    // Crecimiento Normalizado
        size: +d.impact_n, // Impacto Normalizado
        score: +d.trend_score,
        label: d.term
    }))

    const margin = { top: 40, right: 40, bottom: 40, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])

    // Escalas
    // Usar valores máximos reales para "hacer zoom" si los datos están sesgados
    const xMax = d3.max(data, d => d.x) || 1
    const yMax = d3.max(data, d => d.y) || 1
    
    // Agregar 10% de relleno
    const xDomain = [0, xMax * 1.1]
    const yDomain = [0, yMax * 1.1]

    const x = d3.scaleLinear()
        .domain(xDomain) 
        .range([0, innerWidth])

    const y = d3.scaleLinear()
        .domain(yDomain)
        .range([innerHeight, 0])

    const r = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.size) || 1])
        .range([4, 20])

    // Escala de Color: Usar Turbo para alta distinción
    const color = d3.scaleSequential(d3.interpolateTurbo)
        .domain([0, 1])

    // Recortar ruta para mantener elementos ampliados dentro de límites
    svg.append("defs").append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    // Grupo con Zoom
    const chartBody = g.append("g")
        .attr("clip-path", "url(#chart-clip)")
        .attr("class", "chart-body")

    // Cuadrantes (Fondo estático o zoomable? Usualmente líneas estáticas son mejores, pero hagamos zoom para que coincidan con los datos)
    // Realmente, regiones de fondo distintas podrían ser mejores estáticas, pero las líneas de la cuadrícula deberían moverse.
    // Hagamos las líneas guía móviles.
    const guideLines = chartBody.append("g").attr("class", "guides")
    
    guideLines.append("line").attr("x1", innerWidth/2).attr("x2", innerWidth/2).attr("y1", -innerHeight).attr("y2", innerHeight*2)
     .attr("stroke", "#334155").attr("stroke-dasharray", "4")
     .attr("class", "guide-x")

    guideLines.append("line").attr("x1", -innerWidth).attr("x2", innerWidth*2).attr("y1", innerHeight/2).attr("y2", innerHeight/2)
     .attr("stroke", "#334155").attr("stroke-dasharray", "4")
     .attr("class", "guide-y")

    // Etiquetas para Cuadrantes (Estático relativo al contenedor, no zoomable)
    g.append("text").attr("x", innerWidth - 10).attr("y", -10).attr("text-anchor", "end").attr("fill", "#64748b").text("High Growth / High Diffusion")
    g.append("text").attr("x", 10).attr("y", -10).attr("text-anchor", "start").attr("fill", "#64748b").text("Niche / High Growth")

    // Grupos de Ejes
    const xAxisG = g.append("g").attr("transform", `translate(0,${innerHeight})`)
    const yAxisG = g.append("g")

    // Tooltip
    const tooltip = container.append("div")
        .attr("class", "fixed pointer-events-none bg-slate-900 border border-slate-700 p-3 rounded shadow-xl z-50 opacity-0 text-slate-200 text-sm")

    // Comportamiento de Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5]) // zoom 0.5x a 5x
        .translateExtent([[-100, -100], [innerWidth + 100, innerHeight + 100]])
        .on("zoom", (event) => {
            const transform = event.transform
            
            // Re-escalar Ejes
            const zx = transform.rescaleX(x)
            const zy = transform.rescaleY(y)
            
            xAxisG.call(d3.axisBottom(zx).ticks(5))
            yAxisG.call(d3.axisLeft(zy).ticks(5))

            // Actualizar Burbujas y Texto
            chartBody.selectAll("circle")
                .attr("cx", d => zx(d.x))
                .attr("cy", d => zy(d.y))
                // Opcional: mantener tamaño constante o escalar? Mantener constante es usualmente más legible.
                .attr("r", d => r(d.size) ) 

            chartBody.selectAll("text.label")
                .attr("x", d => zx(d.x))
                .attr("y", d => zy(d.y) - r(d.size) - 2)

            // Actualizar Guías
            chartBody.select(".guide-x").attr("x1", zx(0.5)).attr("x2", zx(0.5)) // Assuming 0.5 is center split? 
            // Espera, el código anterior usaba innerWidth/2 lo cual implica centro de píxel, no centro de datos.
            // Los datos son [0, xMax*1.1]. El centro es aproximadamente xMax/2.
            // ¿Nos apegamos al centro visual para cuadrantes o umbral de datos específico?
            // El usuario tenía líneas fijas al centro. ¿Mantenemos líneas en valor de datos 0.5 o centro del dominio por defecto?
            // "Crecimiento / Difusión" usualmente se divide en 0.5 si está normalizado.
            // Asumamos que el valor de datos 0.5 es la división del cuadrante.
            chartBody.select(".guide-x").attr("x1", zx(0.5)).attr("x2", zx(0.5))
            chartBody.select(".guide-y").attr("y1", zy(0.5)).attr("y2", zy(0.5))
        })

    // Ejes Iniciales
    xAxisG.call(d3.axisBottom(x)).attr("color", "#475569")
    yAxisG.call(d3.axisLeft(y)).attr("color", "#475569")

    // SVG escucha al zoom
    svg.call(zoom)
       .on("dblclick.zoom", () => svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity)) // Restablecer en doble clic

    // Burbujas
    const bubbles = chartBody.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", d => r(d.size))
        .attr("fill", d => color(d.score))
        .attr("fill-opacity", 0.8) // Ligeramente más opaco
        .attr("stroke", "#1e293b") // Trazo oscuro para distinción
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 2).attr("fill-opacity", 1)
            tooltip.style("opacity", 1).html(`
                <div class="font-bold text-lg capitalize text-white">${d.label}</div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    <span>Growth:</span> <span class="text-right text-slate-200">${(d.y*100).toFixed(1)}%</span>
                    <span>Diffusion:</span> <span class="text-right text-slate-200">${(d.x*100).toFixed(1)}%</span>
                    <span>Impact Score:</span> <span class="text-right text-slate-200">${d.score.toFixed(2)}</span>
                </div>
            `)
        })
        .on("mousemove", e => {
            tooltip.style("left", (e.clientX+15)+"px").style("top", (e.clientY+15)+"px")
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "#1e293b").attr("stroke-width", 0.5).attr("fill-opacity", 0.8)
            tooltip.style("opacity", 0)
        })

    // Etiquetas
    const topItems = data.sort((a,b) => b.score - a.score).slice(0, 20) // Más etiquetas ya que podemos hacer zoom
    chartBody.selectAll("text.label")
        .data(topItems)
        .join("text")
        .attr("class", "label pointer-events-none")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y) - r(d.size) - 2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text(d => d.label)
        .style("text-shadow", "0 1px 2px black")

}
