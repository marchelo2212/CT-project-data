
import { NetworkGraph } from './NetworkGraph.js'

export function NetworkAnalysis(containerSelector, { networkData, onPeriodChange }) {
    const container = document.querySelector(containerSelector)
    if (!container) return

    // Plantilla de Encabezado coincidiendo con SkillsAnalysis
    const headerHTML = `
        <div class="flex flex-col gap-6 mb-6">
            <h2 class="text-3xl font-bold text-slate-100">Estructura Intelectual</h2>
            
            <div class="bg-slate-900/50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                <p class="text-slate-300 leading-relaxed text-sm">
                    La estructura intelectual del Pensamiento Computacional revela una evolución desde comunidades fragmentadas hacia una red densamente conectada.
                    El análisis de co-citación identifica papers <strong>Nucleares (Core)</strong> que fundamentan el campo, rodeados por una capa <strong>Periférica (Broad)</strong> que conecta con otras disciplinas.
                </p>
                <div class="grid grid-cols-2 gap-4 mt-3">
                    <div class="flex items-start gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                        <div>
                            <span class="block text-slate-200 font-medium text-xs">Jerárquica (P1)</span>
                            <span class="text-slate-400 text-[10px]">Estructura inicial centralizada.</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                        <div>
                            <span class="block text-slate-200 font-medium text-xs">Densa (P2)</span>
                            <span class="text-slate-400 text-[10px]">Fortalecimiento de conexiones internas.</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                        <div>
                            <span class="block text-slate-200 font-medium text-xs">Fragmentada (P3)</span>
                            <span class="text-slate-400 text-[10px]">Expansión y diversificación temática.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Controles de Periodo y Contenedor del Gráfico -->
        <div class="flex flex-col h-[calc(100vh-280px)] min-h-[600px] gap-4">
            <header class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-200">4.1 Redes de Co-citación</h3>
                <div class="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800" id="net-period-controls">
                    <!-- Botones inyectados por main.js o manejados aquí -->
                </div>
            </header>
            
            <div id="viz-network-graph" class="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
                 <div class="absolute inset-0 flex items-center justify-center text-slate-500">Loading Graph...</div>
            </div>
        </div>
    `

    container.innerHTML = headerHTML

    // retornar identificadores de puntos de montaje para uso de main.js
    return {
        graphContainer: '#viz-network-graph',
        controlsContainer: '#net-period-controls'
    }
}
