import * as d3 from 'd3'

export function SkillGalaxy(containerSelector, rawData, { width = 1000, height = 600 } = {}) {
    const container = d3.select(containerSelector)
    container.selectAll("*").remove()

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("max-width", "100%")
        .style("height", "auto")

    // 1. Procesar Datos
    // Agregar términos por skill_name
    const skillsMap = d3.group(rawData, d => d.skill_name)
    const nodes = Array.from(skillsMap, ([name, records]) => {
        const group = records[0].skill_group
        // Calcular peso: suma de confianza o solo conteo, o usar max base_weight
        // Usemos conteo de términos distintos como proxy para 'tamaño' o suma de base_weight
        const weight = d3.sum(records, d => d.base_weight || 0.5)
        const terms = records.map(d => d.term).join(", ")
        
        return {
            id: name,
            group: group,
            val: weight, // El radio se basará en esto
            terms: terms,
            records: records
        }
    })

    // 2. Escalas y Configuración
    const colorScale = d3.scaleOrdinal()
        .domain(['ct_core_skills', 'transversal_skills'])
        .range(['#10b981', '#a855f7']) // Esmeralda (Core), Púrpura (Transversal)

    // Escala de tamaño
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(nodes, d => d.val)])
        .range([50, 80]) // Radio Min/Max

    // Centros X para los dos grupos
    const xCenter = {
        'ct_core_skills': width * 0.3,
        'transversal_skills': width * 0.7
    }

    // 3. Simulación de Fuerza
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(5)) // Ligera repulsión
        .force("collide", d3.forceCollide().radius(d => sizeScale(d.val) + 2).iterations(2))
        .force("x", d3.forceX(d => xCenter[d.group] || width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))

    // 4. Renderizar
    // Etiquetas de grupo (fondo)
    const labels = [
        { text: "Core Skills", x: width * 0.3, color: '#10b981' },
        { text: "Transversal Skills", x: width * 0.7, color: '#a855f7' }
    ]

    svg.selectAll(".group-label")
        .data(labels)
        .join("text")
        .attr("class", "group-label")
        .attr("x", d => d.x)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .attr("fill", d => d.color)
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .attr("opacity", 0.8)
        .style("text-transform", "uppercase")
        .text(d => d.text)

    // Nodos (Burbujas)
    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "node cursor-pointer")
        .call(drag(simulation))

    // Círculos con Efecto de Resplandor
    // Definir filtro
    const defs = svg.append("defs")
    const filter = defs.append("filter")
        .attr("id", "glow")
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur")
    const feMerge = filter.append("feMerge")
    feMerge.append("feMergeNode").attr("in", "coloredBlur")
    feMerge.append("feMergeNode").attr("in", "SourceGraphic")

    node.append("circle")
        .attr("r", d => sizeScale(d.val))
        .attr("fill", d => colorScale(d.group))
        .attr("fill-opacity", 0.7)
        .attr("stroke", d => d3.rgb(colorScale(d.group)).brighter(0.5))
        .attr("stroke-width", 1.5)
        .attr("filter", "url(#glow)")
    
    // Etiqueta para nodos más grandes
    node.append("text")
        .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", "white")
        .attr("font-size", d => Math.min(12, sizeScale(d.val) * 0.4) + "px") // Escalar fuente
        .style("pointer-events", "none")
        .style("text-shadow", "0 1px 4px rgba(0,0,0,0.8)")

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "fixed pointer-events-none bg-slate-900/95 border border-slate-700 p-4 rounded-lg shadow-2xl z-[100] opacity-0 transition-opacity max-w-sm backdrop-blur-sm")
        
    // Eventos
    node
        .on("mouseover", function(event, d) {
            d3.select(this).select("circle")
                .attr("fill-opacity", 1)
                .attr("stroke", "white")
                .attr("stroke-width", 3)
            
            simulation.alphaTarget(0.1).restart() // Despertar ligeramente

            tooltip.style("opacity", 1)
                .html(`
                    <div class="border-b border-slate-700 pb-2 mb-2">
                        <strong class="text-lg text-slate-100">${d.id}</strong>
                        <span class="block text-xs uppercase tracking-wider mt-1" style="color:${colorScale(d.group)}">${d.group.replace('_', ' ')}</span>
                    </div>
                    <div class="text-xs text-slate-400 mb-1">Associated Terms:</div>
                    <div class="text-sm text-slate-300 leading-relaxed">${d.terms}</div>
                `)
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY + 15) + "px")
        })
        .on("mouseout", function() {
            d3.select(this).select("circle")
                .attr("fill-opacity", 0.7)
                .attr("stroke", d => d3.rgb(colorScale(d.group)).brighter(0.5))
                .attr("stroke-width", 1.5)
            
            simulation.alphaTarget(0)
            tooltip.style("opacity", 0)
        })

    // Tick
    simulation.on("tick", () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`)
    })

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
