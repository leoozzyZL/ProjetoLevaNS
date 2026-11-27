import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { getMapRoute } from "../lib/tripRouting";
import "leaflet/dist/leaflet.css";
import "./RouteMap.css";

type Props = { origin: string; destination: string; coordinates?: [number, number][] };

export default function RouteMap({ origin, destination, coordinates }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const [roadSummary, setRoadSummary] = useState("");

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    setStatus("loading");
    setTilesUnavailable(false);
    setRoadSummary("");
    async function draw() {
      try {
        const [L, route] = await Promise.all([
          import("leaflet"),
          coordinates ? Promise.resolve({ coordinates, distanceKm: null, durationMinutes: null }) : getMapRoute(origin, destination),
        ]);
        if (disposed || !container.current) return;
        const points = route.coordinates;
        if (points.length < 2 || points.some(point => point.length !== 2 || !point.every(Number.isFinite))) throw new Error("Rota indisponível");
        const latLngs = points.map(([lon, lat]) => L.latLng(lat, lon));
        const map = L.map(container.current, { scrollWheelZoom: false, attributionControl: true });
        mapRef.current = map;
        map.zoomControl.setPosition("topright");
        const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);
        tiles.on("tileerror", () => { if (!disposed) setTilesUnavailable(true); });
        const line = L.polyline(latLngs, { color: "#0879ce", weight: 5, opacity: .9 }).addTo(map);
        [[latLngs[0], "A", "Partida", origin], [latLngs[latLngs.length - 1], "B", "Chegada", destination]].forEach(([point, letter, label, address]) => {
          const text = document.createElement("span");
          text.textContent = `${label}: ${address}`;
          L.marker(point as L.LatLng, {
            title: `${label}: ${address}`,
            alt: `${label}: ${address}`,
            icon: L.divIcon({ className: `route-map-pin pin-${letter}`, html: String(letter), iconSize: [30, 30], iconAnchor: [15, 15] }),
          }).bindPopup(text).addTo(map);
        });
        map.fitBounds(line.getBounds(), { padding: [28, 28], maxZoom: 15 });
        observer = new ResizeObserver(() => { if (!disposed) map.invalidateSize({ pan: false }); });
        observer.observe(container.current);
        if (route.distanceKm !== null) setRoadSummary(`${route.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km · ${route.durationMinutes} min estimados na rota do mapa`);
        setStatus("ready");
      } catch {
        if (!disposed) { mapRef.current?.remove(); mapRef.current = null; setStatus("error"); }
      }
    }
    void draw();
    return () => { disposed = true; observer?.disconnect(); mapRef.current?.remove(); mapRef.current = null; };
  }, [origin, destination, coordinates, attempt]);

  return <figure className="route-map" aria-label={`Mapa do trajeto de ${origin} para ${destination}`}>
    <div className="route-map-heading"><strong>Trajeto no mapa</strong><span>A · Partida &nbsp; B · Chegada</span></div>
    <div className="route-map-stage">
      <div ref={container} className="route-map-canvas" aria-label="Mapa interativo com a rota por ruas" />
      {status === "loading" && <p className="route-map-overlay" role="status">Carregando o trajeto…</p>}
      {status === "error" && <div className="route-map-overlay" role="status"><p>Não foi possível carregar o mapa agora. O resumo da viagem continua disponível.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>}
    </div>
    {tilesUnavailable && status === "ready" && <p className="route-map-notice" role="status">O mapa de fundo está indisponível. A linha do trajeto continua visível. <button type="button" onClick={() => setAttempt(value => value + 1)}>Recarregar mapa</button></p>}
    <figcaption>{roadSummary && <span>{roadSummary}. </span>}Rota de carro por OSRM. Mapa ilustrativo da viagem simulada, sem rastreamento ao vivo. Nos exemplos, a rota real do mapa pode diferir dos valores fictícios do cenário.</figcaption>
  </figure>;
}
