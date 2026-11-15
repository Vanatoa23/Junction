import { PORTS, type MapFacility, type MapMovement } from "@secondsource/shared";
import { uid } from "../seed/data";

/** Curated demo reference points. Coordinates are approximate map pins, not quay or building surveys. */
const PORT_CODES = [
  "NLRTM", "BEANR", "DEHAM", "FRLEH", "GBFXT", "ESVLC", "ITGOA", "PLGDN", "SEGOT", "FIHEL", "DKAAR", "NOOSL",
  "EETLL", "LVRIX", "LTKLJ", "IEDUB", "PTSIE", "GRPIR", "TRMER", "ROCND", "SIKOP", "HRRJK",
  "CNSHA", "CNNGB", "SGSIN", "KRPUS", "JPYOK", "INNSA", "AEJEA", "USLAX", "USNYC", "CAVAN", "BRSSZ", "ZADUR", "AUMEL",
] as const;

const portSource = "https://unlocode.unece.org/publications/";
const ports: MapFacility[] = PORT_CODES.map((id) => {
  const p = PORTS[id];
  if (!p) throw new Error(`Missing port location for ${id}`);
  return { id, kind: "PORT", name: `Port of ${p.name}`, country: id.slice(0, 2), lat: p.lat, lng: p.lng, positionPrecision: "APPROXIMATE", sourceUrl: portSource };
});

const logisticsSites: MapFacility[] = [
  { id: "logport-i", kind: "LOGISTICS", name: "logport I, Duisburg", country: "DE", lat: 51.392, lng: 6.733, positionPrecision: "APPROXIMATE", sourceUrl: "https://duisport.de/en/logport-locations/" },
  { id: "distripark-maasvlakte", kind: "LOGISTICS", name: "Distripark Maasvlakte", country: "NL", lat: 51.957, lng: 4.059, positionPrecision: "APPROXIMATE", sourceUrl: "https://www.portofrotterdam.com/en/building-port/ongoing-projects/container-exchange-route-cer" },
  { id: "vuosaari-logistics", kind: "LOGISTICS", name: "Vuosaari logistics area", country: "FI", lat: 60.226, lng: 25.17, positionPrecision: "APPROXIMATE", sourceUrl: "https://www.portofhelsinki.fi/en/professionals/cargo-and-passenger-harbours/vuosaari-harbour/" },
];

export const demoFacilities: MapFacility[] = [...ports, ...logisticsSites];

/** Example movements use fictional demo suppliers. They are deliberately not evidence of shipments. */
export const demoMovements: MapMovement[] = [
  {
    id: "packaging-via-rotterdam", product: "Packaging materials", basis: "ILLUSTRATIVE", sourceUrl: null,
    steps: [
      { kind: "SUPPLIER", edgeId: uid("edge", 1) },
      { kind: "FACILITY", facilityId: "logport-i" },
      { kind: "FACILITY", facilityId: "distripark-maasvlakte" },
      { kind: "FACILITY", facilityId: "NLRTM" },
      { kind: "FACILITY", facilityId: "FIHEL" },
      { kind: "FACILITY", facilityId: "vuosaari-logistics" },
      { kind: "HUB" },
    ],
  },
  {
    id: "crates-from-gothenburg", product: "Transport crates", basis: "ILLUSTRATIVE", sourceUrl: null,
    steps: [
      { kind: "SUPPLIER", edgeId: uid("edge", 9) },
      { kind: "FACILITY", facilityId: "SEGOT" },
      { kind: "FACILITY", facilityId: "FIHEL" },
      { kind: "HUB" },
    ],
  },
  {
    id: "ingredients-from-denmark", product: "Ingredients", basis: "ILLUSTRATIVE", sourceUrl: null,
    steps: [
      { kind: "SUPPLIER", edgeId: uid("edge", 5) },
      { kind: "FACILITY", facilityId: "DKAAR" },
      { kind: "FACILITY", facilityId: "FIHEL" },
      { kind: "HUB" },
    ],
  },
];

export function availableMovements(supplierIds: Set<string>, hubPlaced: boolean): MapMovement[] {
  if (!hubPlaced) return [];
  const facilityIds = new Set(demoFacilities.map((f) => f.id));
  return demoMovements.filter((movement) => movement.steps.every((step) =>
    step.kind === "HUB" || (step.kind === "SUPPLIER" ? supplierIds.has(step.edgeId) : facilityIds.has(step.facilityId)),
  ));
}
