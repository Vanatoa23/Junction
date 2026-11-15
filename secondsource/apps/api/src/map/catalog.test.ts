import { describe, expect, it } from "vitest";
import { MapFacility, MapMovement } from "@secondsource/shared";
import { availableMovements, demoFacilities, demoMovements } from "./catalog";
import { uid } from "../seed/data";

describe("demo map catalog", () => {
  it("has distinct, valid facilities and resolved movement stops", () => {
    expect(demoFacilities.filter((f) => f.kind === "PORT")).toHaveLength(35);
    expect(demoFacilities.filter((f) => f.kind === "LOGISTICS")).toHaveLength(3);
    expect(new Set(demoFacilities.map((f) => f.id)).size).toBe(demoFacilities.length);
    for (const facility of demoFacilities) MapFacility.parse(facility);
    for (const movement of demoMovements) {
      MapMovement.parse(movement);
      expect(movement.basis).toBe("ILLUSTRATIVE");
      expect(movement.sourceUrl).toBeNull();
      expect(MapMovement.safeParse({ ...movement, basis: "VERIFIED" }).success).toBe(false);
      for (const step of movement.steps) {
        if (step.kind === "FACILITY") expect(demoFacilities.some((f) => f.id === step.facilityId)).toBe(true);
      }
    }
  });

  it("only returns movements with placed suppliers and a placed hub", () => {
    expect(availableMovements(new Set(), true)).toEqual([]);
    expect(availableMovements(new Set([uid("edge", 1)]), true).map((r) => r.id)).toEqual(["packaging-via-rotterdam"]);
    expect(availableMovements(new Set([uid("edge", 1)]), false)).toEqual([]);
  });
});
