import { useEffect, useRef, useState } from 'react'

interface GoogleMapsRadiusPickerProps {
  centerLat?: number
  centerLng?: number
  radiusKm: number
  onLocationChange: (lat: number, lng: number, address?: string) => void
  onRadiusChange: (radiusKm: number) => void
}

declare global {
  interface Window {
    google?: any
    gm_authFailure?: () => void
  }
}

export default function GoogleMapsRadiusPicker({
  centerLat = -34.6037, // Default Buenos Aires
  centerLng = -58.3816,
  radiusKm = 50,
  onLocationChange,
  onRadiusChange,
}: GoogleMapsRadiusPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const inputSearchRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const circleInstanceRef = useRef<any>(null)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (!apiKey) {
      setLoadError(true)
      return
    }

    if (window.google?.maps) {
      setIsLoaded(true)
      return
    }

    const scriptId = 'google-maps-script'
    if (document.getElementById(scriptId)) {
      setIsLoaded(true)
      return
    }

    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failure. Verifique VITE_GOOGLE_MAPS_API_KEY.')
      setLoadError(true)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=__initGoogleMaps`
    script.async = true
    script.defer = true

    ;(window as any).__initGoogleMaps = () => {
      setIsLoaded(true)
    }

    script.onerror = () => {
      setLoadError(true)
    }

    document.head.appendChild(script)

    return () => {
      delete (window as any).__initGoogleMaps
    }
  }, [apiKey])

  // Inicializar o actualizar mapa interactivo de Google Maps
  useEffect(() => {
    if (!isLoaded || !mapElementRef.current || !window.google?.maps) return

    const center = { lat: centerLat, lng: centerLng }

    if (!mapInstanceRef.current) {
      // Estilo oscuro consistente con el tema neón de LinkedSound
      const darkStyle = [
        { elementType: 'geometry', stylers: [{ color: '#131522' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#131522' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a99ad' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d8bbff' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#a855f7' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2237' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#17192b' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#382b58' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090a12' }] },
      ]

      const map = new window.google.maps.Map(mapElementRef.current, {
        center,
        zoom: radiusKm > 100 ? 8 : radiusKm > 40 ? 10 : 12,
        styles: darkStyle,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      })

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#00e5ff',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      const circle = new window.google.maps.Circle({
        map,
        center,
        radius: radiusKm * 1000,
        fillColor: '#9a63ff',
        fillOpacity: 0.15,
        strokeColor: '#00e5ff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      })

      // Eventos interactivos del mapa y marcador
      map.addListener('click', (e: any) => {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        marker.setPosition(e.latLng)
        circle.setCenter(e.latLng)
        onLocationChange(newLat, newLng)
      })

      marker.addListener('dragend', (e: any) => {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        circle.setCenter(e.latLng)
        onLocationChange(newLat, newLng)
      })

      // Autocomplete de Google Places
      if (inputSearchRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputSearchRef.current, {
          types: ['geocode', 'establishment'],
        })
        autocomplete.bindTo('bounds', map)

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry || !place.geometry.location) return

          const loc = place.geometry.location
          map.setCenter(loc)
          map.setZoom(11)
          marker.setPosition(loc)
          circle.setCenter(loc)
          onLocationChange(loc.lat(), loc.lng(), place.formatted_address || place.name)
        })
      }

      mapInstanceRef.current = map
      markerInstanceRef.current = marker
      circleInstanceRef.current = circle
    } else {
      // Actualizar posición y radio en mapa existente
      mapInstanceRef.current.setCenter(center)
      markerInstanceRef.current?.setPosition(center)
      circleInstanceRef.current?.setCenter(center)
      circleInstanceRef.current?.setRadius(radiusKm * 1000)
    }
  }, [isLoaded, centerLat, centerLng, radiusKm, onLocationChange])

  if (loadError || !apiKey) {
    return (
      <div className="ls-maps-fallback" style={{ padding: '10px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8a99ad' }}>Radio geográfico</span>
          <span style={{ fontSize: '0.82rem', color: '#00e5ff', fontWeight: 700 }}>{radiusKm} km</span>
        </div>
        <input
          type="range"
          min="5"
          max="150"
          step="5"
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#00e5ff', cursor: 'pointer' }}
        />
      </div>
    )
  }

  return (
    <div className="ls-google-maps-radar-picker" style={{ margin: '10px 0' }}>
      <div style={{ marginBottom: '8px' }}>
        <input
          ref={inputSearchRef}
          type="text"
          placeholder="Buscar ciudad o club en Google Maps..."
          className="ls-search-input"
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(15, 19, 37, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.82rem',
          }}
        />
      </div>

      <div
        ref={mapElementRef}
        style={{
          width: '100%',
          height: '180px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 229, 255, 0.25)',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>Radio de radar</span>
        <span style={{ fontSize: '0.84rem', color: '#00e5ff', fontWeight: 700 }}>{radiusKm} km</span>
      </div>
      <input
        type="range"
        min="5"
        max="150"
        step="5"
        value={radiusKm}
        onChange={(e) => onRadiusChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#00e5ff', marginTop: '4px', cursor: 'pointer' }}
      />
    </div>
  )
}
