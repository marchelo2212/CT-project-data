import * as d3 from 'd3'
import { SkillGalaxy } from './SkillGalaxy.js'
import { StreamGraph } from './StreamGraph.js'
import { SkillsHeatmap } from './SkillsHeatmap.js'

export class SkillsAnalysis {
    constructor(containerSelector, skillsData, skillsStream, skillsHeatmap) {
        this.container = d3.select(containerSelector)
        this.skillsData = skillsData
        this.skillsStream = skillsStream
        this.skillsHeatmap = skillsHeatmap
        this.streamFilter = 'all' // all | ct_core_skills | transversal_skills
    }

    init() {
        this.renderLayout()
        this.renderCharts()
    }

    renderLayout() {
        const htmlContent = `
          <div class="mb-6">
            <h2 class="text-3xl font-bold text-slate-100 mb-4">Definición Conceptual (Skills)</h2>
            <div class="bg-slate-800/50 p-4 rounded-lg border-l-4 border-emerald-500 text-slate-300 space-y-2 text-sm shadow-sm">
                <p>
                    La taxonomía de habilidades se construyó integrando marcos teóricos consolidados (como Brennan & Resnick, ISTE y CSTA). 
                    Mediante un análisis de co-ocurrencia y validación semántica, los términos se agruparon en dos dimensiones fundamentales:
                </p>
                <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    <li class="flex items-start gap-2">
                        <span class="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span><strong class="text-emerald-400">Core Skills (Nucleares):</strong> Procesos cognitivos específicos del pensamiento computacional, como la <em>Abstracción</em>, el <em>Pensamiento Algorítmico</em>, la <em>Descomposición</em> y la <em>Depuración</em>.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0"></span>
                        <span><strong class="text-purple-400">Transversal Skills (Transversales):</strong> Competencias generales que se movilizan a través del CT, incluyendo la <em>Resolución de Problemas</em>, la <em>Creatividad</em>, la <em>Colaboración</em> y la <em>Autoeficacia</em>.</span>
                    </li>
                </ul>
            </div>
          </div>
          
          <div class="space-y-6">
              <!-- Gráfico 3.1: Galaxia de Habilidades -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[500px]">
                 <h3 class="text-lg font-bold text-slate-200 mb-2">3.1 Taxonomía de Habilidades</h3>
                 <p class="text-xs text-slate-500 mb-4">Exploración interactiva de Core vs Transversal Skills.</p>
                 <div id="chart-galaxy" class="w-full h-[500px] flex items-center justify-center text-slate-500"></div>
              </div>

              <!-- Gráfico 3.2: Streamgraph -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[350px]">
                 <div class="flex items-center justify-between mb-4">
                     <h3 class="text-lg font-bold text-slate-200">3.2 Evolución de Skills (Streamgraph)</h3>
                     <div class="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800" id="stream-filters">
                        <button data-filter="all" class="px-3 py-1 text-xs rounded transition-colors duration-200 bg-blue-600 text-white">Todos</button>
                        <button data-filter="ct_core_skills" class="px-3 py-1 text-xs rounded transition-colors duration-200 text-slate-400 hover:text-white">Core Skills</button>
                        <button data-filter="transversal_skills" class="px-3 py-1 text-xs rounded transition-colors duration-200 text-slate-400 hover:text-white">Transversal Skills</button>
                     </div>
                 </div>
                 
                 <div id="stream-desc" class="text-sm text-slate-400 mb-4 bg-slate-900/50 p-3 rounded border border-slate-800/50">
                    <span class="font-semibold text-slate-300">Definición:</span> Suma de todas las habilidades identificadas.
                 </div>

                 <div id="chart-stream" class="w-full h-[300px] flex items-center justify-center text-slate-500"></div>
              </div>

              <!-- Gráfico 3.3: Heatmap -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[550px]">
                 <h3 class="text-lg font-bold text-slate-200 mb-2">3.3 Matriz de Intensidad (Heatmap)</h3>
                 <p class="text-xs text-slate-500 mb-4">Skills que definen cada periodo histórico. El color representa la frecuencia relativa (porcentaje de papers que mencionan el skill en un año dado).</p>
                 <div id="chart-heatmap" class="w-full h-[500px] flex items-center justify-center text-slate-500"></div>
              </div>
          </div>
        `
        this.container.html(htmlContent)

        // Adjuntar escuchadores de eventos para filtros
        this.container.selectAll('#stream-filters button').on('click', (event) => {
            const btn = event.currentTarget
            const filter = btn.dataset.filter
            this.setStreamFilter(filter)
            
            // Actualizar UI
            this.container.selectAll('#stream-filters button')
                .attr('class', 'px-3 py-1 text-xs rounded transition-colors duration-200 text-slate-400 hover:text-white')
            
            let activeClass = 'bg-blue-600 text-white'
            if (filter === 'ct_core_skills') activeClass = 'bg-emerald-600 text-white'
            if (filter === 'transversal_skills') activeClass = 'bg-purple-600 text-white'
            
            d3.select(btn).attr('class', `px-3 py-1 text-xs rounded transition-colors duration-200 ${activeClass}`)
        })
    }

    renderCharts() {
        this.renderGalaxy()
        this.renderStream()
        this.renderHeatmap()
    }

    renderGalaxy() {
        if (this.skillsData && this.skillsData.length > 0) {
            SkillGalaxy('#chart-galaxy', this.skillsData, {
                width: document.getElementById('chart-galaxy').clientWidth,
                height: 500
            })
        }
    }

    renderStream() {
        const descContainer = d3.select('#stream-desc')
        let descText = "Suma de todas las habilidades identificadas."
        
        if (this.streamFilter === 'ct_core_skills') {
            descText = "Habilidades nucleares y prácticas técnicas específicas del Pensamiento Computacional, como la Abstracción, el Pensamiento Algorítmico, la Depuración y la Programación."
        } else if (this.streamFilter === 'transversal_skills') {
            descText = "Competencias educativas generales y factores socio-emocionales que interactúan con el CT, como la Resolución de Problemas, la Creatividad, la Colaboración y la Autoeficacia."
        }
        
        descContainer.html(`<span class="font-semibold text-slate-300">Definición:</span> ${descText}`)

        if (this.skillsStream && this.skillsStream.length > 0) {
             // Filtrar Datos
             let filteredStreamData = this.skillsStream
             if (this.streamFilter !== 'all') {
                 filteredStreamData = this.skillsStream.filter(d => d.skill_group === this.streamFilter)
             }
    
             // Mapear datos a formato StreamGraph
             const streamInput = filteredStreamData.map(d => ({
                 year: d.year,
                 topic: d.skill_group,
                 topic_label: d.skill_group === 'ct_core_skills' ? 'Core Skills' : 'Transversal Skills',
                 share: d.freq_norm_by_papers || 0
             }))
             
             StreamGraph('#chart-stream', streamInput, {
                 width: document.getElementById('chart-stream').clientWidth,
                 height: 300
             })
        } else {
             document.getElementById('chart-stream').innerHTML = 'No stream data available'
        }
    }

    renderHeatmap() {
        if (this.skillsHeatmap && this.skillsHeatmap.length > 0) {
             const heatmapInput = this.skillsHeatmap.map(d => ({
                 year: d.year,
                 skill: d.skill_name,
                 frequency: d.freq_norm_by_papers || 0
             }))
    
             SkillsHeatmap('#chart-heatmap', heatmapInput, {
                 width: document.getElementById('chart-heatmap').clientWidth,
                 height: 500
             })
        } else {
             document.getElementById('chart-heatmap').innerHTML = 'No heatmap data available'
        }
    }

    setStreamFilter(filter) {
        this.streamFilter = filter
        this.renderStream()
    }
}
