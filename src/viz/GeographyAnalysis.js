import { GlobalMap } from './GlobalMap.js'
import { CountryScatter } from './CountryScatter.js'

export function GeographyAnalysis(containerSelector, { geoData, worldData }) {
    const container = document.querySelector(containerSelector)
    if (!container) return

    // Plantilla de Encabezado
    const template = `
      <div class="flex flex-col h-full w-full">
        <div class="flex flex-col gap-6 mb-6 shrink-0">
            <h2 class="text-3xl font-bold text-slate-100">Geografía del CT</h2>
            
            <div class="bg-slate-900/50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                <p class="text-slate-300 leading-relaxed text-sm">
                    El desarrollo del Pensamiento Computacional es un fenómeno global con distintos focos de intensidad.
                    Mientras algunos países lideran en volumen de producción, otros destacan por la <strong>calidad y pureza (CT Score)</strong> de su investigación.
                </p>
                <div class="grid grid-cols-2 gap-4 mt-3">
                    <div class="flex items-start gap-2">
                        <span class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <div>
                            <span class="block text-slate-200 font-medium text-xs">Producción vs. Calidad</span>
                            <span class="text-slate-400 text-[10px]">Volumen ≠ profundidad conceptual.</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0"></span>
                        <div>
                            <span class="block text-slate-200 font-medium text-xs">Especialización</span>
                            <span class="text-slate-400 text-[10px]">Algunos países producen menos, pero con CT más "puro".</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
            <!-- Contenedor del Mapa -->
            <div class="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
                <div class="absolute top-4 left-4 z-10 bg-slate-900/90 p-2 rounded border border-slate-700">
                    <h3 class="text-sm font-semibold text-slate-200">5.1 Mapa Global CT</h3>
                    <p class="text-xs text-slate-400">Intensidad (Color) y Volumen</p>
                </div>
                <!-- Superposición de Controles Interactivos (Filtros) -->
                <div class="absolute top-4 right-4 z-10 flex flex-col gap-2">
                     <div class="bg-slate-900/90 p-2 rounded border border-slate-700 text-xs">
                        <span class="text-slate-400 block mb-1">Filtrar por Tipo:</span>
                        <div class="flex flex-col gap-1" id="geo-filters">
                            <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                                <input type="radio" name="geo-filter" value="all" checked class="accent-indigo-500">
                                <span>Todos</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                                <input type="radio" name="geo-filter" value="core" class="accent-emerald-500">
                                <span>Nuclear (Core)</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                                <input type="radio" name="geo-filter" value="broad" class="accent-blue-500">
                                <span>Periférica (Broad)</span>
                            </label>
                        </div>
                     </div>
                </div>

                <div id="viz-geo-map" class="flex-1 w-full h-full"></div>
            </div>

            <!-- Contenedor de Dispersión -->
            <div class="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
                 <div class="absolute top-4 left-4 z-10 bg-slate-900/90 p-2 rounded border border-slate-700">
                    <h3 class="text-sm font-semibold text-slate-200">5.2 Relación Volumen - Calidad</h3>
                </div>
                <div id="viz-geo-scatter" class="flex-1 w-full h-full p-4"></div>
            </div>
        </div>
      </div>
    `

    container.innerHTML = template

    // --- Lógica ---
    let currentFilter = 'all'

    // Función de Agregación de Datos
    const getCountryStats = (filter) => {
        const map = new Map() 

        geoData.forEach(d => {
            if (filter !== 'all' && d.ct_label !== filter) return

            if (!map.has(d.country)) {
                map.set(d.country, { 
                    id: d.country, // Código de 2 letras
                    // Pasar ID numérico si se inyectó previamente en main.js, manejado por la lógica del mapa si es necesario
                    // Realmente necesitamos ID numérico para el Mapa, pero Código de País para las Etiquetas de Dispersión.
                    // d.id fue inyectado en main.js
                    numericId: d.id, 
                    count: 0, 
                    totalScore: 0,
                    authors: 0
                })
            }
            const entry = map.get(d.country)
            entry.count += d.n_papers
            entry.authors += d.total_authorships
            // Promedio ponderado para score
            entry.totalScore += (d.mean_ct_score * d.n_papers)
        })

        return Array.from(map.values()).map(d => ({
            id: d.id, // Alpha-2 para etiquetas
            numericId: d.numericId, // Numérico para TopoJSON
            count: d.count,
            mean_score: d.count > 0 ? d.totalScore / d.count : 0,
            authors: d.authors
        }))
    }

    // Renderizado Inicial
    const renderCharts = () => {
        const stats = getCountryStats(currentFilter)
        
        // Renderizar Mapa
        // Pasar estadísticas pero GlobalMap espera 'id' para coincidir con TopoJSON. 
        // Preparamos 'numericId' en stats. Deberíamos mapearlo correctamente o actualizar GlobalMap para buscar 'numericId'.
        // O más simple: mapear stats para tener 'id' = numericId para la llamada al Mapa.
        const mapStats = stats.map(s => ({ ...s, id: s.numericId })).filter(s => s.id)
        GlobalMap('#viz-geo-map', worldData, mapStats)
        
        // Renderizar Dispersión
        // Usa 'id' (Alpha-2) para etiquetas, que es el "id" predeterminado en `stats`.
        CountryScatter('#viz-geo-scatter', stats)
    }

    renderCharts()

    // Escuchadores de Eventos
    const radios = container.querySelectorAll('input[name="geo-filter"]')
    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            currentFilter = e.target.value
            renderCharts()
        })
    })

    return {}
}
