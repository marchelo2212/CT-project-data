import * as d3 from 'd3'

export function ImpactScatter(containerSelector, data, { width = 800, height = 600 } = {}) {
    // Limpiar
    d3.select(containerSelector).selectAll("*").remove()
    
    // Filtrar datos para citas válidas/año
    const validData = data.filter(d => {
        const year = d.openalex?.publication_year || d.year
        return year >= 1990 && year <= new Date().getFullYear() + 1
    })

    const margin = { top: 40, right: 140, bottom: 40, left: 60 } // Margen derecho extra para leyenda
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    // Escalas
    const x = d3.scaleLinear()
        .domain(d3.extent(validData, d => d.openalex?.publication_year || d.year))
        .range([0, innerWidth])
        .nice()

    // Escala Y: Escala logarítmica para Citas (agregar 1 para evitar log(0))
    const y = d3.scaleLog()
        .domain([1, d3.max(validData, d => (d.dimensions?.times_cited || 0)) + 1])
        .range([innerHeight, 0])
        .nice()

    // Escala de Radio: Altmetric Score
    const rScale = d3.scaleSqrt()
        .domain([0, d3.max(validData, d => d.altmetric?.score || 0) || 100])
        .range([3, 20])

    // Escala de Color: Tema (Primer Concepto)
    // Tomaremos los 10 conceptos más frecuentes para color, otros gris
    // Idealmente esto debería pasarse, pero recalculémoslo simplemente aquí o elijamos un concepto primario
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)

    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .attr("color", "#64748b")

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5, "~s")) // Formatear ticks logarítmicos agradablemente
        .attr("color", "#64748b")

    // Etiquetas de Ejes
    svg.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 35)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("class", "text-sm")
        .text("Publication Year")

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("class", "text-sm")
        .text("Citations (Log Scale)")

    // Tooltip
    const tooltip = d3.select(containerSelector)
        .append("div")
        .attr("class", "fixed pointer-events-none bg-slate-900/95 border border-slate-700 p-3 rounded shadow-xl text-xs z-50 opacity-0 transition-opacity max-w-[300px]")

    // Dibujar Círculos
    svg.append("g")
        .selectAll("circle")
        .data(validData)
        .join("circle")
        .attr("cx", d => x(d.openalex?.publication_year || d.year))
        .attr("cy", d => y((d.dimensions?.times_cited || 0) + 1))
        .attr("r", d => rScale(d.altmetric?.score || 0))
        .attr("fill", d => {
            const concept = d.openalex?.concepts?.[0]?.display_name || "Unknown"
            return colorScale(concept)
        })
        .attr("fill-opacity", 0.7)
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 0.5)
        .on("mouseenter", function(event, d) {
             d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2).raise()
             
             const title = d.title || d.openalex?.title || "Untitled"
             const journal = d.journal?.title || d.openalex?.primary_location?.source?.display_name || ""
             const year = d.openalex?.publication_year || d.year
             const cites = d.dimensions?.times_cited || 0
             const altmetric = d.altmetric?.score || 0
             const concept = d.openalex?.concepts?.[0]?.display_name || ""

             tooltip.style("opacity", 1).html(`
                 <div class="font-bold text-slate-200 mb-1">${title}</div>
                 <div class="text-slate-400 mb-2 italic">${journal} (${year})</div>
                 <div class="grid grid-cols-2 gap-2 text-xs">
                     <span class="text-green-400">Citations: ${cites}</span>
                     <span class="text-blue-400">Altmetric: ${Math.round(altmetric)}</span>
                     <div class="col-span-2 text-slate-500 border-t border-slate-700 pt-1 mt-1">${concept}</div>
                 </div>
             `)
        })
        .on("mousemove", (event) => {
            const x = event.clientX + 15
            const y = event.clientY + 15
             tooltip
                .style("left", Math.min(x, window.innerWidth - 320) + "px") // Prevenir desbordamiento
                .style("top", y + "px")
        })
        .on("mouseleave", function() {
            d3.select(this).attr("stroke", "#0f172a").attr("stroke-width", 0.5)
            tooltip.style("opacity", 0)
        })

    // Leyenda (Tamaño)
    const legend = svg.append("g")
        .attr("transform", `translate(${innerWidth + 20}, 20)`)

    legend.append("text").text("Altmetric Score").attr("fill", "#94a3b8").attr("class", "text-xs font-bold")
    
    // Burbujas de Leyenda de Tamaño
    const sizes = [10, 100, 500]
    let currentY = 25
    sizes.forEach(s => {
        const r = rScale(s)
        legend.append("circle")
            .attr("cx", 15)
            .attr("cy", currentY + r)
            .attr("r", r)
            .attr("fill", "none")
            .attr("stroke", "#64748b")
        
        legend.append("line")
            .attr("x1", 15 + r).attr("x2", 40)
            .attr("y1", currentY + r).attr("y2", currentY + r)
            .attr("stroke", "#64748b")
            .attr("stroke-dasharray", "2,2")

        legend.append("text")
            .attr("x", 45)
            .attr("y", currentY + r + 3)
            .text(s)
            .attr("fill", "#64748b")
            .attr("class", "text-[10px]")

        currentY += r * 2 + 10
    })

}
