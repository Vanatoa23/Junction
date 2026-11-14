import { useEffect, useRef, useState } from "react";
import circle from "@turf/circle";
import greatCircle from "@turf/great-circle";
import maplibregl, { type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import type { MapResponse, MapSupplier, RiskLevel } from "@secondsource/shared";
import { RISK_COLOR } from "../lib/words";

interface Props {
  data: MapResponse;
  selectedId: string | null;
  onSelect: (edgeId: string | null) => void;
}

type LngLatTuple = [longitude: number, latitude: number];
type PlacedSupplier = MapSupplier & { lat: number; lng: number };
const isPlaced = (s: MapSupplier): s is PlacedSupplier => s.lat != null && s.lng != null;
const RANK: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const WORLD_CENTER: LngLatTuple = [12, 35];
const world = feature(worldTopo as unknown as Parameters<typeof feature>[0], "countries") as unknown as FeatureCollection<Polygon | MultiPolygon>;

for (const { geometry, properties } of world.features) {
  // Antarctica encircles the pole, so its ring spans the entire map.
  if (properties?.name === "Antarctica") continue;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      // Unwrap rings that cross the date line so the renderer can clip
      // them at the edge instead of drawing a chord across the ocean.
      for (let i = 1; i < ring.length; i++) {
        const vertex = ring[i]!;
        const previousLongitude = ring[i - 1]![0]!;
        vertex[0] = vertex[0]! + 360 * Math.round((previousLongitude - vertex[0]!) / 360);
      }
    }
  }
}

const collection = (features: Feature<Geometry>[]): FeatureCollection => ({ type: "FeatureCollection", features });

const style: StyleSpecification = {
  version: 8,
  projection: { type: "globe" },
  sky: {
    "sky-color": "#111f35",
    "horizon-color": "#a4cbec",
    "fog-color": "#c7daeb",
    "fog-ground-blend": 0.1,
    "horizon-fog-blend": 0.12,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 1, 0.85, 5, 0],
  },
  sources: {
    world: { type: "geojson", data: world, tolerance: 0.125, attribution: "Natural Earth" },
    routes: { type: "geojson", data: collection([]) },
    disruptions: { type: "geojson", data: collection([]) },
  },
  layers: [
    { id: "ocean", type: "background", paint: { "background-color": "#285778" } },
    { id: "land", type: "fill", source: "world", paint: { "fill-color": "#6c818a" } },
    {
      id: "borders", type: "line", source: "world",
      paint: { "line-color": "#a9bbc0", "line-opacity": 0.5, "line-width": 0.7 },
    },
    {
      id: "disruption-area", type: "fill", source: "disruptions",
      paint: { "fill-color": "#f95c4e", "fill-opacity": 0.25, "fill-outline-color": "#ff8b7e" },
    },
    {
      id: "route-outline", type: "line", source: "routes",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#102638", "line-width": ["+", ["get", "width"], 1.5], "line-opacity": 0.65 },
    },
    {
      id: "supplier-routes", type: "line", source: "routes",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": ["get", "color"], "line-width": ["get", "width"], "line-opacity": 0.93 },
    },
  ],
};

function hubPosition({ hub }: MapResponse): LngLatTuple | null {
  return hub.lat != null && hub.lng != null ? [hub.lng, hub.lat] : null;
}

function supplierBounds(data: MapResponse) {
  const bounds = new maplibregl.LngLatBounds();
  const hub = hubPosition(data);
  if (hub) bounds.extend(hub);
  for (const s of data.suppliers.filter(isPlaced)) bounds.extend([s.lng, s.lat]);
  return bounds.isEmpty() ? null : bounds.adjustAntiMeridian();
}

function supplierItems(suppliers: PlacedSupplier[], grouped: boolean) {
  const groups = new Map<string, PlacedSupplier[]>();
  for (const s of suppliers) {
    const key = (grouped && s.country) || s.edgeId;
    const members = groups.get(key) ?? [];
    members.push(s);
    groups.set(key, members);
  }
  return [...groups.values()].map((members) => {
    const lng = members[0]!.lng;
    const center: LngLatTuple = [
      members.reduce((sum, s) => sum + lng + ((s.lng - lng + 540) % 360 - 180), 0) / members.length,
      members.reduce((sum, s) => sum + s.lat, 0) / members.length,
    ];
    const risk = members.reduce<RiskLevel>((worst, s) => RANK[s.risk.level] > RANK[worst] ? s.risk.level : worst, "LOW");
    return { members, center, risk };
  });
}

function mapLabel(tag: "b" | "span" | "div", text: string, className = "") {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

export function MapView({ data, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const latest = useRef({ data, selectedId, onSelect });
  latest.current = { data, selectedId, onSelect };
  const [unavailable, setUnavailable] = useState(false);

  function showGlobe(duration = 650) {
    const map = mapRef.current;
    if (!map) return;
    const midpoint = supplierBounds(latest.current.data)?.getCenter();
    const center: LngLatTuple = midpoint
      ? [midpoint.lng, Math.max(-48, Math.min(48, midpoint.lat))]
      : WORLD_CENTER;
    const minimumSide = Math.min(map.getContainer().clientWidth, map.getContainer().clientHeight);
    const radius = minimumSide * 0.46;
    const zoom = Math.log2(radius * 2 * Math.PI * Math.cos(center[1] * Math.PI / 180) / 512);
    map.easeTo({ center, zoom, bearing: 0, pitch: 0, duration });
  }

  function showAll() {
    const map = mapRef.current;
    if (!map) return;
    const bounds = supplierBounds(latest.current.data);
    if (!bounds) {
      showGlobe();
      return;
    }
    const container = map.getContainer();
    const inset = Math.min(86, Math.floor(Math.min(container.clientWidth, container.clientHeight) * 0.15));
    const padding = { top: inset, right: inset, bottom: container.clientWidth > 900 ? 138 : inset, left: inset };
    map.fitBounds(bounds, { padding, maxZoom: 6, pitch: 0, bearing: 0, duration: 650 });
  }

  function draw() {
    const map = mapRef.current;
    const routes = map?.getSource<GeoJSONSource>("routes");
    const disruptions = map?.getSource<GeoJSONSource>("disruptions");
    if (!map || !routes || !disruptions) return;
    for (const marker of markers.current) marker.remove();
    markers.current = [];

    const { data, selectedId, onSelect } = latest.current;
    const zoom = map.getZoom();
    const hub = hubPosition(data);
    const items = supplierItems(data.suppliers.filter(isPlaced), zoom < 4);
    const routeFeatures: Feature<Geometry>[] = [];
    const areas: Feature<Geometry>[] = [];

    function addMarker(center: LngLatTuple, element: HTMLElement) {
      const marker = new maplibregl.Marker({ element })
        .setOpacity(1, 0)
        .setLngLat(center)
        .addTo(map!);
      markers.current.push(marker);
    }

    for (const { members, center, risk } of items) {
      const color = RISK_COLOR[risk];
      if (hub && (hub[0] !== center[0] || hub[1] !== center[1])) {
        const width = risk === "HIGH" ? 3 : risk === "MEDIUM" ? 2.5 : 2;
        const properties = { color, width };
        // Opposite points have no unique shortest path. Pick one through an equatorial midpoint.
        if (Math.abs(hub[1] + center[1]) < 1e-8 && Math.abs(Math.abs(hub[0] - center[0]) % 360 - 180) < 1e-8) {
          const midpoint: LngLatTuple = [(hub[0] + 270) % 360 - 180, 0];
          routeFeatures.push(greatCircle(hub, midpoint, { properties }), greatCircle(midpoint, center, { properties }));
        } else {
          routeFeatures.push(greatCircle(hub, center, { properties }));
        }
      }

      const pin = document.createElement("button");
      pin.type = "button";
      const limited = members.some((member) => member.risk.coverage === "LIMITED");
      if (members.length > 1) {
        pin.className = "bubble";
        pin.style.background = color;
        pin.textContent = String(members.length);
        pin.title = `${members.length} suppliers in ${members[0]!.country}`;
        pin.setAttribute("aria-label", pin.title);
        pin.onclick = (event) => {
          event.stopPropagation();
          const bounds = new maplibregl.LngLatBounds();
          for (const s of members) bounds.extend([s.lng, s.lat]);
          const camera = map.cameraForBounds(bounds.adjustAntiMeridian(), { padding: 110, maxZoom: 7 });
          map.flyTo({ center: camera?.center ?? center, zoom: Math.max(4.65, camera?.zoom ?? 4.65), pitch: 0 });
        };
      } else {
        const s = members[0]!;
        pin.className = `sup${s.edgeId === selectedId ? " sel" : ""}${(s.alert || s.exposures?.length) ? " pulse" : ""}`;
        pin.style.setProperty("--c", color);
        pin.title = s.name;
        pin.setAttribute("aria-label", s.name);
        pin.append(document.createElement("i"));
        if (zoom >= 4.2) {
          const label = mapLabel("div", "", "lbl");
          label.append(mapLabel("b", s.name));
          if (zoom >= 5.4 && s.city) label.append(mapLabel("span", s.city));
          pin.append(label);
        }
        pin.onclick = (event) => {
          event.stopPropagation();
          onSelect(s.edgeId);
        };
      }
      if (limited) {
        pin.classList.add("limited");
        pin.setAttribute("aria-label", `${pin.title}, limited coverage`);
      }
      addMarker(center, pin);
    }

    if (hub) {
      const pin = mapLabel("div", "", "hub");
      pin.append(document.createElement("i"), mapLabel("b", data.hub.name));
      addMarker(hub, pin);
    }
    for (const inc of data.incidents) {
      if (!inc.point) continue;
      const center: LngLatTuple = [inc.point.lng, inc.point.lat];
      areas.push(circle(center, 90, { steps: 48 }));
      const anchor = mapLabel("div", "", "disruption-anchor");
      anchor.append(mapLabel("b", inc.headline, "disruption-tag"));
      addMarker(center, anchor);
    }

    routes.setData(collection(routeFeatures));
    disruptions.setData(collection(areas));
  }

  useEffect(() => {
    if (!el.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el.current,
        style,
        center: WORLD_CENTER,
        minZoom: -1,
        maxZoom: 13,
        maxPitch: 65,
        attributionControl: { compact: true },
      });
    } catch {
      setUnavailable(true);
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-left");
    map.on("load", draw);
    map.on("zoomend", draw);
    map.on("click", () => latest.current.onSelect(null));
    map.once("style.load", () => {
      map.setProjection({ type: "globe" });
      showGlobe(0);
      draw();
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(el.current);
    return () => {
      observer.disconnect();
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => draw(), [data, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const supplier = latest.current.data.suppliers.find((item) => item.edgeId === selectedId);
    if (!map || !supplier || !isPlaced(supplier)) return;
    const location: LngLatTuple = [supplier.lng, supplier.lat];
    const { x, y } = map.project(location);
    const { clientWidth, clientHeight } = map.getContainer();
    if (map.getZoom() < 4 || x < 36 || x > clientWidth - 36 || y < 36 || y > clientHeight - 36) {
      map.flyTo({ center: location, zoom: Math.max(4.65, map.getZoom()), pitch: 0 });
    }
  }, [selectedId]);

  return (
    <>
      <div ref={el} className="map globe-map" aria-label="Globe of your suppliers" />
      {unavailable ? (
        <div className="hint"><b>The globe needs WebGL.</b><p className="muted">You can still find your suppliers in the Suppliers tab.</p></div>
      ) : (
        <div className="map-actions">
          <button className="small" onClick={showAll}>Show all</button>
          <button className="small" onClick={() => showGlobe()}>Globe view</button>
        </div>
      )}
    </>
  );
}

