import jsoning from "jsoning";

let settings_db = new jsoning("db/settings.json");
let sched_db = new jsoning("db/scheds.json");
let chat_memory_db = new jsoning("db/chat.json");

export { settings_db, sched_db, chat_memory_db };
