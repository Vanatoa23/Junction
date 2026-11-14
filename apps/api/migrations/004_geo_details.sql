-- Map and supplier details (additive).
-- company/client: where they are (city + coordinates, approximate). Public facts for company; the client row holds our hub.
ALTER TABLE company ADD COLUMN city text, ADD COLUMN lat double precision, ADD COLUMN lng double precision;
ALTER TABLE client ADD COLUMN city text, ADD COLUMN country char(2), ADD COLUMN lat double precision, ADD COLUMN lng double precision;
-- supplier_edge: optional facts the user typed about this supplier (private).
-- details = {supplies, criticality LOW|MEDIUM|HIGH, annualSpendEur, leadTimeDays, contact, notes}
ALTER TABLE supplier_edge ADD COLUMN input_city text, ADD COLUMN details jsonb NOT NULL DEFAULT '{}';
