import type { ModuleDef } from "./module";
import ingest from "./ingest";
import onboarding from "./onboarding";
import engine from "./engine";
import map from "./map";
import dependencies from "./map/dependencies";

/** Registry of owned modules. Adding a module = one line here (integrator). */
export const modules: ModuleDef[] = [onboarding, ingest, engine, map, dependencies];
