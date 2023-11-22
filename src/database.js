import jsoning from "jsoning";

let settings_db = new jsoning("db/settings.json");
let sched_db = new jsoning("db/scheds.json");

export { settings_db, sched_db };
