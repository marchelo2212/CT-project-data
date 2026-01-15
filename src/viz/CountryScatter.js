
import * as d3 from 'd3'

export function CountryScatter(containerSelector, data, { width = 500, height = 400 } = {}) {
    // Gráfico de dispersión D3 estándar
    const container = document.querySelector(containerSelector)
    if (!container) return

    container.innerHTML = ''
    
    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const svg = d3.select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    // Escalas
    // X: Escala logarítmica para Conteo de Papers
    const xDomain = d3.extent(data, d => d.count)
    const xScale = d3.scaleLog()
        .domain([Math.max(1, xDomain[0]), xDomain[1]])
        .range([0, chartWidth])
        .nice()

    // Y: Lineal para Score CT
    const yDomain = d3.extent(data, d => d.mean_score)
    const yScale = d3.scaleLinear()
        .domain([Math.max(0, yDomain[0] - 0.5), yDomain[1] + 0.5])
        .range([chartHeight, 0])
        .nice()

    // Tamaño: ¿Autorías?
    const rScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.authors)])
        .range([3, 15])

    // Coloreado podría ser región o la misma métrica
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data, d => d.count)]) // Color por volumen por ahora para coincidir con el mapa

    // Ejes
    g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).ticks(5, "~s"))
        .call(g => g.select(".domain").attr("stroke", "#334155"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
        .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8"))
        
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 35)
        .attr("fill", "#94a3b8")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Total Papers (Log Scale)")

    g.append("g")
        .call(d3.axisLeft(yScale))
        .call(g => g.select(".domain").attr("stroke", "#334155"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
        .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8"))

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -35)
        .attr("x", -chartHeight / 2)
        .attr("fill", "#94a3b8")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Mean CT Score")

    // Tooltip
    // Reutilizando existente o nuevo
    let tooltip = document.querySelector('#geo-tooltip')
    if (!tooltip) {
        tooltip = document.createElement('div')
        tooltip.id = 'geo-tooltip'
        tooltip.className = 'fixed pointer-events-none bg-slate-900/95 border border-slate-700 p-3 rounded shadow-xl text-sm z-50 opacity-0 transition-opacity'
        document.body.appendChild(tooltip)
    }

    // Nodos
    const circles = g.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d.count))
        .attr("cy", d => yScale(d.mean_score))
        .attr("r", d => rScale(d.authors))
        .attr("fill", "#60a5fa")
        .attr("fill-opacity", 0.6)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseenter", function(event, d) {
            d3.select(this)
                .attr("stroke", "#fbbf24")
                .attr("stroke-width", 2)
                .attr("fill-opacity", 1)
                
            tooltip.style.opacity = 1
            tooltip.innerHTML = `
                <div class="font-bold text-slate-100">${d.id}</div>
                <div class="text-xs text-slate-400 mt-1">
                    <div>Papers: <span class="text-slate-200">${d.count}</span></div>
                    <div>Score: <span class="text-emerald-400">${d.mean_score.toFixed(2)}</span></div>
                    <div>Authors: <span class="text-blue-300">${d.authors}</span></div>
                </div>
            `
            // ¿Resaltar Mapa?
            // ¿Despachar evento personalizado o callback?
        })
        .on("mousemove", (event) => {
            tooltip.style.left = (event.clientX + 10) + 'px'
            tooltip.style.top = (event.clientY + 10) + 'px'
        })
        .on("mouseleave", function() {
            d3.select(this)
                .attr("stroke", "#3b82f6")
                .attr("stroke-width", 1)
                .attr("fill-opacity", 0.6)
            tooltip.style.opacity = 0
        })

    // Etiquetas para países top
    const topCountries = data.sort((a,b) => b.count - a.count).slice(0, 10)
    g.selectAll("text.label")
        .data(topCountries)
        .join("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.count))
        .attr("y", d => yScale(d.mean_score) - rScale(d.authors) - 4)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .style("font-size", "10px")
        .style("pointer-events", "none")
        .text(d => d.id)

}
