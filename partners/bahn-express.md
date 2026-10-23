# Bahn Express — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Exact partner and business problem

**Confirmed:** Junction's Challenge Partner link leads to Bahn Express, the vehicle-transfer business at bahnexpress.fi. It is not Deutsche Bahn. The company describes moving cars for dealerships, customer deliveries, private-seller pickups, rental-fleet moves and imports. Its site offers delivery tracking and vehicle documentation, and explicitly mentions ordering through an API. The reviewed page does not establish public self-service API credentials or a Junction sandbox. [Junction](https://2026.hackjunction.com/#partners) · [Bahn](https://www.bahnexpress.fi/)

**Assessment:** this is a promising operations-research option for our team. The value is not simply drawing routes. A dispatcher must coordinate vehicles, drivers, handover times and onward travel while dealing with cancellations and uncertain arrival times. Those details should become explicit constraints rather than hidden assumptions.

## Likely workflow, with uncertainty kept visible

A proposed prototype can model an order from requested pickup through assignment, collection, transit and handover. This is our modelling choice, not a description of Bahn's internal architecture. Ask the sponsor which steps are actually in scope and which status transitions their data supports.

Useful fields would include order ID, origin, destination, pickup/delivery windows, vehicle constraints, driver availability, travel-time estimates and current status. These fields are a requested schema, not a promised dataset. Driver repositioning after delivery is particularly important: optimizing only the vehicle journey can produce an unusable driver schedule.

## Project hypotheses

| Candidate | Weekend scope | Metric |
|---|---|---|
| Disruption recovery | Cancel one assignment and recompute feasible alternatives | Unserved jobs, late deliveries, replanning time |
| Dispatcher decision board | Rank assignments and explain violated constraints | Feasible assignments and manual decisions avoided |
| Handover evidence assistant | Identify missing items in supplied pickup records/photos | Missing-item detection and false alarms |

Prefer disruption recovery if time windows and travel data are supplied. Prefer evidence completeness if the dataset is mainly documents or images. Avoid a vision system that claims to certify vehicle condition; a weekend model can help flag missing or uncertain evidence, not guarantee the absence of damage.

## Practical build

Use a backend to validate inputs and run a simple greedy scheduling baseline. Then add an improved heuristic or solver only where it changes the outcome. Keep objective weights visible: lateness, unserved orders and repositioning effort should not collapse into an unexplained “AI score.” Record infeasible jobs with a reason.

The interface needs a dispatch table, a route/timeline view and an intervention panel. A judge should be able to remove a driver or change a deadline and immediately see the impact. An LLM can summarize the deterministic changes; it should not invent travel times or overwrite infeasibility.

Start with a fixed travel-time matrix supplied by the sponsor or a clearly labelled synthetic one. Real mapping calls can be an optional adapter. If they fail, use the saved matrix and display its age. Do not pretend straight-line distances are driving times. Store timezone-aware timestamps and clarify whether deadlines refer to local pickup or delivery time.

## Evaluation and team fit

Markus can define the cost function, baseline and sensitivity tests. One developer builds optimization and fixtures, one the backend/state handling, one the interface. Compare every method on identical orders and assumptions. Show at least one easy case, one cancellation and one impossible case. Keep the unsolved orders visible; hiding them makes an apparently efficient schedule misleading.

Pitch capital tied up in vehicles and dispatcher workload as business motivations, but quantify monetary savings only with sponsor-supported assumptions. A simulated improvement in lateness is not a measured production benefit.

## Preparation and mentor questions

Practise a small scheduling exercise, not a pre-built competition solution. Ask about driver location and onward travel, handover windows, electric-vehicle charging, cross-border constraints, API documentation, anonymization and historical outcomes. Check whether the objective is operational efficiency, customer experience or something entirely different.

**Go:** usable order data and a mentor who can validate constraints. **No-go:** no ground truth, inaccessible partner systems or a scope requiring a full logistics platform. Aiven/MariaDB can persist assignments; Cloudinary could manage permitted handover media. Use additional partners only if those capabilities serve the challenge.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

