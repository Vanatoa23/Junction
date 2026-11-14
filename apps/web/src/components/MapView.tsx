import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import type { MapResponse, MapSupplier, RiskLevel } from "@secondsource/shared";
import { RISK_COLOR } from "../lib/words";

/**
 * The supply-chain map. Hub = our company; one line to each DIRECT supplier (never deeper tiers).
 *  - Base: a bundled world outline (works offline) with muted street tiles on top when online.
 *  - Zoomed out (<= 4): suppliers in the same country merge into a numbered bubble coloured by the worst risk inside.
 *  - Zoomed in: each supplier shows its name (>= 5) and its city (>= 7).
 *  - A disruption is a soft red area at its place; affected suppliers pulse once.
 */
interface Props {
  data: MapResponse;
  selectedId: string | null;
  onSelect: (edgeId: string | null) => void;
  /** Change this to re-fit the view to all suppliers. */
  fitKey: number;
}

const RANK: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const world = feature(worldTopo as any, (worldTopo as any).objects.countries) as unknown as GeoJSON.FeatureCollection;

export function MapView({ data, selectedId, onSelect, fitKey }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const latest = useRef({ data, selectedId, onSelect });
  latest.current = { data, selectedId, onSelect };
  const fitted = useRef(false);

  const draw = () => {
    const map = mapRef.current;
    const group = overlay.current;
    if (!map || !group) return;
    const { data, selectedId, onSelect } = latest.current;
    group.clearLayers();
    const z = map.getZoom();
    const hub = data.hub.lat != null && data.hub.lng != null ? L.latLng(data.hub.lat, data.hub.lng) : null;

    // disruption areas first (underneath)
    for (const inc of data.incidents) {
      if (!inc.point) continue;
      L.circle([inc.point.lat, inc.point.lng], { radius: 90_000, color: "#c2412d", weight: 1, opacity: 0.5, fillColor: "#c2412d", fillOpacity: 0.15, interactive: false }).addTo(group);
      L.marker([inc.point.lat, inc.point.lng], {
        interactive: false, zIndexOffset: 3000,
        icon: L.divIcon({ className: "", html: `<div class="disruption-tag">${esc(inc.headline)}</div>`, iconSize: [0, 0] }),
      }).addTo(group);
    }

    const placed = data.suppliers.filter((s) => s.lat != null && s.lng != null);
    type Item = { pos: L.LatLng; members: MapSupplier[] };
    const items: Item[] = [];
    if (z <= 4) {
      const byCountry = new Map<string, MapSupplier[]>();
      for (const s of placed) byCountry.set(s.country ?? s.edgeId, [...(byCountry.get(s.country ?? s.edgeId) ?? []), s]);
      for (const members of byCountry.values()) {
        const lat = members.reduce((a, m) => a + m.lat!, 0) / members.length;
        const lng = members.reduce((a, m) => a + m.lng!, 0) / members.length;
        items.push({ pos: L.latLng(lat, lng), members });
      }
    } else {
      for (const s of placed) items.push({ pos: L.latLng(s.lat!, s.lng!), members: [s] });
    }

    // lines first so dots sit on top; coloured by the worst risk behind them (green / yellow / red)
    for (const it of items) {
      if (!hub) continue;
      const worst = it.members.reduce<RiskLevel>((w, m) => (RANK[m.risk.level] > RANK[w] ? m.risk.level : w), "LOW");
      const weight = worst === "HIGH" ? 3 : worst === "MEDIUM" ? 2.4 : 1.8;
      L.polyline([hub, it.pos], { color: RISK_COLOR[worst], weight, opacity: worst === "LOW" ? 0.55 : 0.85, interactive: false }).addTo(group);
    }

    for (const it of items) {
      const worst = it.members.reduce<RiskLevel>((w, m) => (RANK[m.risk.level] > RANK[w] ? m.risk.level : w), "LOW");
      const color = RISK_COLOR[worst];
      if (it.members.length > 1) {
        const mk = L.marker(it.pos, {
          icon: L.divIcon({ className: "", html: `<div class="bubble" style="background:${color}">${it.members.length}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
          title: `${it.members.length} suppliers`,
        });
        mk.on("click", () => map.flyTo(it.pos, Math.max(5, z + 2), { duration: 0.6 }));
        mk.addTo(group);
        continue;
      }
      const s = it.members[0]!;
      const selected = s.edgeId === selectedId;
      const pulse = !!s.alert;
      const label = z >= 4.5 ? `<div class="lbl"><b>${esc(s.name)}</b>${z >= 6 && s.city ? `<span>${esc(s.city)}</span>` : ""}</div>` : "";
      const mk = L.marker(it.pos, {
        icon: L.divIcon({
          className: "",
          html: `<div class="sup${selected ? " sel" : ""}${pulse ? " pulse" : ""}" style="--c:${color}"><i></i>${label}</div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        }),
        title: s.name,
      });
      mk.on("click", () => onSelect(s.edgeId));
      mk.addTo(group);
    }

    if (hub) {
      L.marker(hub, {
        zIndexOffset: 1000,
        icon: L.divIcon({ className: "", html: `<div class="hub"><i></i><b>${esc(data.hub.name)}</b></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
      }).addTo(group);
    }
  };

  const fit = () => {
    const map = mapRef.current;
    if (!map) return;
    const { data } = latest.current;
    const pts: L.LatLngExpression[] = data.suppliers.filter((s) => s.lat != null).map((s) => [s.lat!, s.lng!]);
    if (data.hub.lat != null && data.hub.lng != null) pts.push([data.hub.lat, data.hub.lng]);
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [70, 70], maxZoom: 6, animate: false });
    else map.setView([52, 12], 4);
  };

  useEffect(() => {
    if (!el.current || mapRef.current) return;
    const map = L.map(el.current, { minZoom: 2, maxZoom: 13, zoomControl: false, worldCopyJump: true, attributionControl: true, zoomSnap: 0.5 });
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    // Base: a light vector style (OpenFreeMap "positron") that fills the whole view at every zoom and pan.
    // If it cannot load (offline), fall back to the bundled world outline so the dots and lines still make sense.
    let fallback: L.GeoJSON | null = null;
    const showFallback = () => {
      if (fallback) return;
      fallback = L.geoJSON(world, { style: { color: "#cfd5db", weight: 0.8, fillColor: "#f3f4f1", fillOpacity: 1 }, interactive: false }).addTo(map);
      fallback.bringToBack();
    };
    try {
      const gl = (L as any).maplibreGL({ style: "https://tiles.openfreemap.org/styles/positron", attribution: "&copy; OpenFreeMap &copy; OpenMapTiles, data from OpenStreetMap" }).addTo(map);
      const ml = gl.getMaplibreMap?.();
      ml?.on("error", (e: any) => { if (!e?.sourceId && !e?.tile) showFallback(); });
      // the vector layer needs one nudge after its style has loaded, otherwise it stays blank until the first zoom
      const nudge = () => { map.invalidateSize({ pan: false }); map.panBy([1, 0], { animate: false }); map.panBy([-1, 0], { animate: false }); };
      ml?.once("load", nudge);
      ml?.once("idle", nudge);
      for (const ms of [400, 1500, 3000]) window.setTimeout(nudge, ms);
      document.addEventListener("visibilitychange", nudge);
      window.addEventListener("focus", nudge);
      window.setTimeout(() => { if (!navigator.onLine) showFallback(); }, 0);
    } catch {
      showFallback();
    }
    overlay.current = L.layerGroup().addTo(map);
    map.on("zoomend", draw);
    map.on("click", () => latest.current.onSelect(null));
    mapRef.current = map;
    fit();
    draw();
    // the container may get its final size after mount (flex layout): keep Leaflet in sync and re-fit once
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      if (!fitted.current && latest.current.data.suppliers.length) { fit(); fitted.current = true; }
    });
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    draw();
    if (!fitted.current && data.suppliers.length) {
      fit();
      fitted.current = true;
    }
  }, [data, selectedId]);

  useEffect(() => {
    if (fitKey > 0) fit();
  }, [fitKey]);

  // keep the selected supplier visible
  useEffect(() => {
    const s = data.suppliers.find((x) => x.edgeId === selectedId);
    if (s?.lat != null && mapRef.current && !mapRef.current.getBounds().pad(-0.15).contains([s.lat, s.lng!])) mapRef.current.panTo([s.lat, s.lng!]);
  }, [selectedId]);

  return <div ref={el} className="map" aria-label="Map of your suppliers" />;
}

