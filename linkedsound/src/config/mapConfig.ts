import type { StyleSpecification } from 'maplibre-gl'

const cartoApiKey = (import.meta.env.VITE_CARTO_API_KEY || '').trim()
const cartoKeyQuery = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : ''

export const CARTO_DARK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyQuery}`,
        `https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyQuery}`,
        `https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyQuery}`,
        `https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyQuery}`,
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
}

// Usa tiles oscuros de CARTO cuando VITE_CARTO_API_KEY esta definida;
// si falta la clave, usa OpenFreeMap Dark como estilo de respaldo visible.
export const CARTO_DARK_MAP_STYLE: string | StyleSpecification = cartoApiKey
  ? CARTO_DARK_RASTER_STYLE
  : 'https://tiles.openfreemap.org/styles/dark'
