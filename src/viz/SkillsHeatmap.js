
import * as d3 from 'd3'

export function SkillsHeatmap(containerSelector, rawData, { width = 800, height = 500 } = {}) {
    const container = containerSelector instanceof Element 
        ? d3.select(containerSelector) 
        : d3.select(containerSelector)
    
    container.selectAll("*").remove()
    
    // Configuración
    const margin = { top: 30, right: 30, bottom: 50, left: 150 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("font-family", "sans-serif")
        
    // 1. Procesar Datos
    // Espera Formato Largo: {year, skill, frequency}
    const years = Array.from(new Set(rawData.map(d => +d.year))).sort((a,b) => a-b)
    const skills = Array.from(new Set(rawData.map(d => d.skill))).sort()
    
    // Datos planos ya es lo que tenemos, pero asegurar tipos
    const flatData = rawData.map(d => ({
        year: +d.year,
        skill: d.skill,
        value: +d.frequency
    }))

    // 2. Escalas
    const x = d3.scaleBand()
        .domain(years)
        .range([0, innerWidth])
        .padding(0.05)

    const y = d3.scaleBand()
        .domain(skills)
        .range([0, innerHeight])
        .padding(0.05)

    const color = d3.scaleLinear()
        .domain([0, d3.max(flatData, d => d.value)])
        .range(['#3b0764', '#facc15']) // Púrpura-950 a Amarillo-400

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    // 3. Tooltip
    const tooltip = container
        .append("div")
        .attr("class", "fixed pointer-events-none bg-slate-900 border border-slate-700 p-2 rounded text-xs shadow-xl z-50 opacity-0 text-white")

    // 4. Renderizar Rectángulos
    g.selectAll("rect")
        .data(flatData)
        .join("rect")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.skill))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.value))
        .attr("rx", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 1)
            tooltip.style("opacity", 1)
                .html(`
                    <div class="font-bold capitalize">${d.skill.replace(/_/g, ' ')}</div>
                    <div>Year: ${d.year}</div>
                    <div class="text-yellow-300">Frecuencia Relativa: ${(d.value * 100).toFixed(2)}%</div>
                `)
        })
        .on("mousemove", (event) => {
             tooltip
                .style("left", (event.clientX + 10) + "px")
                .style("top", (event.clientY + 10) + "px")
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", null)
            tooltip.style("opacity", 0)
        })

    // 5. Ejes
    // Eje X (Años) - Mostrar cada 5to año si está abarrotado
    const xAxis = d3.axisBottom(x)
        .tickValues(x.domain().filter((d, i) => !(d % 5))) 
        .tickFormat(d3.format("d"));

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .attr("color", "#64748b")
        .select(".domain").remove()

    // Eje Y (Habilidades)
    const yAxis = d3.axisLeft(y).tickFormat(d => d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    
    g.append("g")
        .call(yAxis)
        .attr("color", "#94a3b8")
        .selectAll(".tick text")
        .attr("font-size", "11px")
        .select(".domain").remove()
        
    // Leyenda
    const legendWidth = 200
    const legendHeight = 8
    
    // Definición de Gradiente
    const defs = svg.append("defs")
    const linearGradient = defs.append("linearGradient")
        .attr("id", "heatmap-gradient")
        
    linearGradient.selectAll("stop")
        .data([
            {offset: "0%", color: "#3b0764"},
            {offset: "100%", color: "#facc15"}
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color)

    const legendGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top / 2 - 10})`) // Alineado arriba izquierda

    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", -6)
        .attr("fill", "#94a3b8")
        .attr("font-size", "10px")
        .text("Frecuencia Relativa (Intensidad)")

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)")
        .attr("rx", 2)
        
    // Etiquetas de Leyenda (Min / Max)
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 10)
        .attr("fill", "#64748b")
        .attr("font-size", "9px")
        .text("0%")

    legendGroup.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 10)
        .attr("text-anchor", "end")
        .attr("fill", "#64748b")
        .attr("font-size", "9px")
        .text((d3.max(flatData, d => d.value) * 100).toFixed(0) + "%")
}
