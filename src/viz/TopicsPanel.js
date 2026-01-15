
import * as d3 from 'd3'

export function TopicsPanel(containerSelector, rawData, { width = 800 } = {}) {
    const container = containerSelector instanceof Element 
        ? d3.select(containerSelector) 
        : d3.select(containerSelector)
    
    container.selectAll("*").remove()

    // Envoltura
    const wrapper = container.append("div")
        .attr("class", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6")

    // Procesar Datos
    // Espera: topic, top_words (string)
    const topics = rawData.map(d => ({
        id: d.topic,
        words: d.top_words
            .replace(/"/g, '') // Eliminar comillas
            .split(',')
            .map(w => w.trim())
            .filter(w => w)
    }))

    // Tarjetas
    const cards = wrapper.selectAll("div.topic-card")
        .data(topics)
        .join("div")
        .attr("class", "topic-card bg-slate-900 border border-slate-800 rounded-lg p-5 transition-all hover:border-slate-600 hover:shadow-lg group")

    // Encabezado
    const header = cards.append("div").attr("class", "flex items-center justify-between mb-3")
    
    header.append("h4")
        .attr("class", "text-lg font-bold text-slate-200")
        .text(d => `Topic ${d.id}`)
    
    header.append("span")
        .attr("class", "text-slate-500 text-xs font-mono bg-slate-800 px-2 py-1 rounded")
        .text(d => `${d.words.length} terms`)

    // Nube de Palabras / Insignias
    const cloud = cards.append("div").attr("class", "flex flex-wrap gap-2")

    cloud.selectAll("span")
        .data(d => d.words)
        .join("span")
        .attr("class", (d, i) => {
            // Primeras 3 palabras son "primarias" -> resaltadas
            const base = "px-2 py-1 rounded text-xs border "
            return i < 3 
                ? base + "bg-blue-500/10 text-blue-300 border-blue-500/20 font-semibold"
                : base + "bg-slate-800 text-slate-400 border-slate-700"
        })
        .text(d => d)

}
