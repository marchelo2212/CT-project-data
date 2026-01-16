import './style.css'

import * as d3 from 'd3'
import layoutHtml from './app.html?raw'
import { TimelineChart } from './viz/TimelineChart.js'
import { TemporalPanorama } from './viz/TemporalPanorama.js'
import { NetworkGraph } from './viz/NetworkGraph.js'
import { NetworkAnalysis } from './viz/NetworkAnalysis.js'
import { GlobalMap } from './viz/GlobalMap.js'
import { ImpactScatter } from './viz/ImpactScatter.js'
import { SkillsAnalysis } from './viz/SkillsAnalysis.js' // Nueva Importación
import { GeographyAnalysis } from './viz/GeographyAnalysis.js'
import { ImpactAnalysis } from './viz/ImpactAnalysis.js'
import masterDataUrl from './df_master_base.csv?url'
import timeSeriesUrl from './viz_time_series_all.csv?url'
import impactScatterUrl from './viz_impact_scatter_all.csv?url'
import rankUrl from './viz_impact_rank_impact.csv?url'

import patentsUrl from './Data_sets/patents_ct_clean.csv?url' 
import policyUrl from './Data_sets/policy_ct_clean.csv?url'
import streamUrl from './Data_sets/viz_ct_skills_stream.csv?url'
import heatmapUrl from './Data_sets/viz_ct_skills_heatmap.csv?url'
import skillDictUrl from './skill_dictionary_v3_weighted.csv?url'

const loading = document.getElementById('loading');
if (loading) loading.remove();

document.querySelector('#app').innerHTML = layoutHtml

// Estado
let currentView = 'home' 
let vizData = {
    timeSeries: null,
    impactData: null,
    geoData: null,
    countryCodes: null, // New
    skillsData: [],
    skillsStream: null,
    skillsHeatmap: null,
    networkNodes: null,
    networkEdges: null,
    masterData: null,
    dimensionsData: null,
    rankData: null
}

let networkPeriod = 'p2' // p1 | p2 | p3

// Lógica de Navegación
document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('nav button').forEach(b => {
             b.className = b.className.replace('bg-blue-500/10 text-blue-400 border border-blue-500/20', 'text-slate-400 hover:text-slate-200')
             if (!b.className.includes('text-slate-400')) b.className += ' text-slate-400'
        })
        const target = e.currentTarget
        target.className = target.className.replace('text-slate-400 hover:text-slate-200', 'bg-blue-500/10 text-blue-400 border border-blue-500/20')
        setView(target.dataset.view)
    })
})

function setView(viewName) {
    currentView = viewName
    const container = document.querySelector('#main-view')
    container.innerHTML = '' 
    
    // Ajustes de diseño
    if (viewName === 'network' || viewName === 'map' || viewName === 'geography' || viewName === 'home') {
        container.classList.remove('max-w-7xl', 'mx-auto', 'p-8')
        container.classList.add('w-full', 'h-full', 'p-4')
    } else {
        container.classList.add('max-w-7xl', 'mx-auto', 'p-8')
        container.classList.remove('w-full', 'h-full', 'p-4')
    }
    
    switch(viewName) {
        case 'home': renderHome(); break; 
        case 'evolution': renderEvolution(); break;
        case 'concepts': renderConcepts(); break;
        case 'impact': renderImpact(); break;
        case 'geography': renderGeography(); break;
        case 'network': renderNetwork(); break;
        default: renderEvolution();
    }
}

function renderHome() {
    const container = document.querySelector('#main-view')
    container.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-start overflow-y-auto pt-4">
             <div style="width: 100%; max-width: 1000px; margin-bottom: 2rem;">
                <div style="position: relative; padding-bottom: 133.33%; padding-top: 0; height: 0;">
                    <div style="width: 100%;"><div style="position: relative; padding-bottom: 107.5%; padding-top: 0; height: 0;"><iframe title="TF-Visualización de datos Inicio" frameborder="0" width="1200" height="1290" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://view.genially.com/69689955e22f2a6c013c7db1" type="text/html" allowscriptaccess="always" allowfullscreen="true" scrolling="yes" allownetworking="all"></iframe> </div> </div> 
                </div> 
            </div>
        </div>
    `
}

async function init() {
  try {
    console.time('Load Data')
    
    // Precargar conjuntos de datos principales
    // Contando fuentes: 
    // 1. viz_time_series_all.csv
    // 2. viz_impact_scatter_all.csv
    // 3. viz_geo_all.csv
    // 4. skill_dictionary_v2.csv
    // 5. viz_topic_streams.csv
    // 6. df_master_base.csv
    // 7. dimensions_data.jsonl
    // 8. countries-110m.json
    // 9. country-codes.json
    // Los archivos de red se cargan bajo demanda (6 archivos: nodos/aristas * 3 períodos)
    
    const [ts, imp, geo, sk, dummyStream, master, rank, dimText, patents, policies, skillStream, skillHeatmap, countryCodes] = await Promise.all([
        d3.csv(timeSeriesUrl, d3.autoType),
        d3.csv(impactScatterUrl, d3.autoType),
        d3.csv(`${import.meta.env.BASE_URL}data/viz_geo_all.csv`, d3.autoType),
        d3.csv(skillDictUrl, d3.autoType),
        Promise.resolve([]), // streamUrl faltante/omitido
        d3.csv(masterDataUrl, d3.autoType),
        d3.csv(rankUrl, d3.autoType), // Cargar Datos de Clasificación
        Promise.resolve(''), // dimensionsUrl removed
        d3.csv(patentsUrl, d3.autoType).catch(() => []), 
        d3.csv(policyUrl, d3.autoType).catch(() => []),
        d3.csv(streamUrl, d3.autoType).catch(() => []), // Nuevos Datos de Stream
        d3.csv(heatmapUrl, d3.autoType).catch(() => []), // Nuevos Datos de Mapa de Calor
        d3.json(`${import.meta.env.BASE_URL}data/country-codes.json`).catch(e => []) // Cargar Mapeo
    ])

    vizData.timeSeries = ts
    // Enriquecer datos de impacto con autores de los datos maestros
    const masterMap = new Map(master.map(d => [d.doi, d]))
    
    vizData.impactData = imp.map(d => {
        const masterRecord = masterMap.get(d.doi)
        const authors = masterRecord ? masterRecord.authors : "Unknown"
        const firstAuthor = authors ? authors.split(';')[0].split(',')[0] : "Unknown" 
        return {
            ...d,
            authors: authors,
            first_author: firstAuthor
        }
    })
    vizData.geoData = geo
    vizData.countryCodes = countryCodes // Almacenar códigos
    vizData.skillsData = sk
    vizData.skillsStream = skillStream
    vizData.skillsHeatmap = skillHeatmap
    vizData.masterData = master
    vizData.rankData = rank.map(d => {
        const masterRecord = masterMap.get(d.doi)
        const authors = masterRecord ? masterRecord.authors : "Unknown"
        const firstAuthor = authors ? authors.split(';')[0].split(',')[0] : "Unknown" 
        return {
            ...d,
            authors: authors,
            first_author: firstAuthor
        }
    })
    


    // Datos de Patentes (CSV cargado directamente)
    vizData.patentsData = patents || []

    // Datos de Políticas (CSV cargado directamente)
    vizData.policyData = policies || []

    console.timeEnd('Load Data')
    updateStats()
    console.timeEnd('Load Data')
    updateStats()
    setView('home') 

  } catch (err) {
    console.error(err)
    const targetEl = document.querySelector('#main-view') || document.querySelector('#app')
    if (targetEl) {
      targetEl.innerHTML = `
        <div class="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200 m-4">
          <h3 class="font-bold text-lg mb-2">Initialization Error</h3>
          <p>${err.message}</p>
          <pre class="text-xs mt-2 opacity-75">${err.stack}</pre>
        </div>
      `
    }
  }
}    

function updateStats() {
    // 1. Fuentes Analizadas
    // Conteo manual de archivos involucrados en el pipeline de visualización
    // 13 original + 2 new Dimensions files (Patents + Policy) + Geo files = 17
    const sourceCount = 17
    document.querySelector('#stat-sources').textContent = sourceCount

    if (vizData.masterData) {
        // 2. Ítems Procesados (Filas en df_master_base)
        document.querySelector('#stat-items').textContent = d3.format(',')(vizData.masterData.length)

        // 3. Investigadores (Autores únicos) y Citas
        const uniqueAuthors = new Set()
        let totalCitations = 0
        vizData.masterData.forEach(d => {
            if (d.authors) {
                // Dividir por punto y coma y recortar
                d.authors.split(';').forEach(author => {
                    const name = author.trim()
                    if (name) uniqueAuthors.add(name)
                })
            }
            if (d.cited_by) {
                totalCitations += parseFloat(d.cited_by) || 0
            }
        })
        document.querySelector('#stat-researchers').textContent = d3.format(',')(uniqueAuthors.size)
        document.querySelector('#stat-citations').textContent = d3.format(',')(Math.round(totalCitations))

        // 4. Patentes
        // Usar conteo del archivo de patentes cargado
        let patentCount = vizData.patentsData ? vizData.patentsData.length : 0
        document.querySelector('#stat-patents').textContent = d3.format(',')(patentCount)

        // 5. Política Pública (nueva estadística)
        let policyCount = vizData.policyData ? vizData.policyData.length : 0
        document.querySelector('#stat-policy').textContent = d3.format(',')(policyCount)
    }
}


function renderEvolution() {
    const container = document.querySelector('#main-view')
    // La limpieza del contenedor es manejada por init de TemporalPanorama si pasamos ID, ¿pero aquí TemporalPanorama adjunta al innerHTML?
    // Realmente TemporalPanorama toma ID, ¿pero main.js lo limpia en setView?
    // Vamos a comprobar setView. setView limpia innerHTML (línea 49).
    // Así que renderEvolution solo necesita llamar a new TemporalPanorama.
    
    // Pasamos '#main-view' como el contenedor.
    // TemporalPanorama inyectará su propio HTML en él.
    
    if (vizData.timeSeries) {
        new TemporalPanorama('#main-view', vizData.timeSeries, vizData.masterData)
    } else {
        container.innerHTML = '<div class="text-slate-500">No time series data available</div>'
    }
}

function renderImpact() {
    const container = document.getElementById('main-view')
    
    // Siempre crear fresco por ahora para evitar problemas de estado    // 4. Análisis de Impacto (Dispersión + Clasificación)
    const impactViz = new ImpactAnalysis(
        '#main-view', 
        vizData.impactData, 
        vizData.rankData, 
        vizData.patentsData, 
        vizData.policyData
    ) 
    impactViz.init()
}


function renderConcepts() {
    // Usa el nuevo componente SkillsAnalysis
    const conceptsViz = new SkillsAnalysis(
        '#main-view', 
        vizData.skillsData, 
        vizData.skillsStream, 
        vizData.skillsHeatmap
    )
    conceptsViz.init()
}



function renderGeography() {
     const container = document.querySelector('#main-view')
     container.innerHTML = `
        <div id="viz-geo" class="w-full h-full text-slate-500 flex items-center justify-center">Loading Maps...</div>
     `
 
     // Necesitamos pasar:
     // 1. worldData (Topología)
     // 2. geoData (Estadísticas por país/tipo)
     // 3. Mapeo si es necesario. 
     // Preprocesaremos geoData para incluir ID Numérico si es posible, usando countryCodes.
 
     Promise.all([
         d3.json(`${import.meta.env.BASE_URL}data/world-110m.json`)
     ]).then(([worldData]) => {
          if(!worldData) {
              container.innerHTML = 'Error loading World Topology'; return;
          }
 
          // ¿Inyectar IDs numéricos en geoData?
          // vizData.geoData has 'country' = 'US'
          // vizData.countryCodes has 'alpha-2': "US", 'country-code': "840"
          // Creamos una búsqueda
          const codeMap = new Map()
          if(vizData.countryCodes) {
              vizData.countryCodes.forEach(c => {
                   codeMap.set(c['alpha-2'], c['country-code'])
              })
          }
 
          // ¿Preprocesar geoData para agregar id numérico para que GeographyAnalysis no tenga que preocuparse por ello?
          // O pasar codeMap a GeographyAnalysis.
          // ¿Pasamos codeMap dentro de geoData o separado?
          // Más limpio: Mapearlo aquí.
          const enrichedGeo = vizData.geoData.map(d => ({
              ...d,
              id: codeMap.get(d.country) || null
          }))
 
          // ¿Filtrar filas sin ID si es estricto? O dejar que GlobalMap lo maneje.
          // GlobalMap usa ID numérico para coincidir con TopoJSON.
 
          const el = document.querySelector('#viz-geo')
          if(el) {
              el.id = 'viz-geo-container' // Renombrar para evitar confusión
              GeographyAnalysis('#viz-geo-container', { 
                  geoData: enrichedGeo, 
                  worldData 
              })
          }
     }).catch(e => {
         console.error(e)
         container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-red-400 p-4">
                <div class="font-bold mb-2">Error initializing Geography View</div>
                <div class="text-sm bg-slate-900 p-2 rounded border border-red-900/50">
                    ${e.message}<br>
                    <span class="text-xs text-slate-500">Path: ${import.meta.env.BASE_URL}data/world-110m.json</span>
                </div>
            </div>
        `
     })
}

function renderNetwork() {
     const container = document.querySelector('#main-view')
     container.innerHTML = `
      <div id="viz-network" class="h-full w-full"></div>
     `
    
    // Cargar período de red específico
    // Nombres de archivo: net_nodes_p1_2006_2012.csv, etc. ahora en public/data
    const suffix = networkPeriod === 'p1' ? 'p1_2006_2012' : 
                   networkPeriod === 'p2' ? 'p2_2013_2019' : 'p3_2020_2026'

    Promise.all([
        d3.csv(`${import.meta.env.BASE_URL}data/net_nodes_${suffix}.csv`, d3.autoType),
        d3.csv(`${import.meta.env.BASE_URL}data/net_edges_${suffix}.csv`, d3.autoType)
    ]).then(([nodes, edges]) => {
        // Inicializar Diseño del Contenedor y Encabezado
        // Solo inicializamos el diseño una vez o si el innerHTML fue limpiado, pero dado que redibujamos P1/P2/P3 podríamos volver a renderizar.
        // Mejor: Comprobar si existe el encabezado. Pero más simple: Renderizar Diseño cada vez (bastante rápido) o mejor, comprobar si el contenedor tiene hijos.
        
        let graphContainerSelector = '#viz-network-graph'
        
        // Renderizar Estructura del Contenedor si no está presente (o simplemente sobrescribir para actualizar el estado del botón activo si es necesario, aunque el estado es global)
        // Realmente, deberíamos renderizar el Diseño primero, luego renderizar el gráfico dentro de él.
        
        const containers = NetworkAnalysis('#viz-network', { 
            networkData: null, 
            onPeriodChange: (p) => window.setNetPeriod(p) 
        })
        
        // Inyectar Botones
        const controls = document.querySelector(containers.controlsContainer)
        if(controls) {
            controls.innerHTML = `
                <button class="px-3 py-1 rounded ${networkPeriod==='p1'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}" onclick="window.setNetPeriod('p1')">P1 (2006-12)</button>
                <button class="px-3 py-1 rounded ${networkPeriod==='p2'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}" onclick="window.setNetPeriod('p2')">P2 (2013-19)</button>
                <button class="px-3 py-1 rounded ${networkPeriod==='p3'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}" onclick="window.setNetPeriod('p3')">P3 (2020-26)</button>
            `
        }

        const el = document.querySelector(containers.graphContainer)
        if(el) {
            const rScale = d3.scaleSqrt()
                .domain([0, d3.max(nodes, d => d.openalex_cited_by_count || 0)])
                .range([2, 20])

            // Crear Mapa desde Datos Maestros para enriquecimiento
            const masterMap = new Map(vizData.masterData.map(d => [d.doi, d]))

            // Mapear formato estándar de nodos y enriquecer
            const mappedNodes = nodes.map(n => {
                const master = masterMap.get(n.doi)
                return {
                    id: n.doi, // Usar DOI como ID
                    ...n,
                    r: rScale(n.openalex_cited_by_count || 0),
                    group: n.ct_label_v2 || 'unknown',
                    // Campos enriquecidos
                    authors: master?.authors || n.authors || 'Unknown',
                    journal: master?.journal || n.journal || 'Unknown',
                    title: master?.title || n.title || n.id
                }
            })
            
            const nodeMap = new Map(mappedNodes.map(n => [n.id, n]))
            const validLinks = edges.filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
                .map(e => ({
                    source: e.source,
                    target: e.target,
                    weight: e.weight || 1
                }))
            
            NetworkGraph(containers.graphContainer, { nodes: mappedNodes, links: validLinks }, { 
                width: el.clientWidth, 
                height: el.clientHeight 
            })
        }
    }).catch(err => {
        console.error(err)
        const el = document.getElementById('viz-network')
        if(el) el.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-red-400 p-4">
                <div class="font-bold mb-2">Error loading network ${suffix}</div>
                <div class="text-sm bg-slate-900 p-2 rounded border border-red-900/50">
                    ${err.message}<br>
                    <span class="text-xs text-slate-500">Path: ${import.meta.env.BASE_URL}data/net_nodes_${suffix}.csv</span>
                </div>
            </div>
        `
    })
}

// Exponer setter para onclick en línea
window.setNetPeriod = (p) => {
    networkPeriod = p
    renderNetwork()
}

init()
