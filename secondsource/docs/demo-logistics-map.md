# Demo logistics map

The map includes 35 representative cargo ports across Europe and major international trade regions, plus three European logistics areas. They are **reference locations**, not evidence that a particular supplier uses them. The fictional demo suppliers have three explicitly illustrative product journeys. Dotted paths connect the listed stops in order; they do not trace actual sailing or road routes.

## Add a location

1. Add the port's UN/LOCODE, name and approximate map point to `PORTS` in `packages/shared/src/places.ts`. This also lets incident headlines and risk reasons name the port.
2. Add its code to `PORT_CODES` in `apps/api/src/map/catalog.ts`. For a warehouse or distribution area, add a `LOGISTICS` entry to `logisticsSites` with a stable ID and source URL.
3. Check the UN/LOCODE against the [UNECE publication](https://unlocode.unece.org/publications/) and use a port coordinate from the [NGA World Port Index](https://msi.nga.mil/Publications/WPI) where available. The current coordinates are approximate demonstration pins, not verified terminal entrances. Source URLs document facility identity; they do not prove the exact coordinate.

## Add a journey

Add an ordered `MapMovement` in `apps/api/src/map/catalog.ts`. Steps can refer to a direct supplier edge ID, a facility ID, or the client hub. The API filters out movements whose supplier or hub cannot be placed. For a real route, set `basis` to `REPORTED` or `VERIFIED` and add a shipment or supplier evidence URL. Keep `ILLUSTRATIVE` and a null source for invented demo journeys. The map renders the ordered steps with dotted lines and a product label. Solid supplier risk lines remain separate.

The catalog is a demo fixture. A later data source can return the same `MapFacility` and `MapMovement` shapes without changing `MapView`.
