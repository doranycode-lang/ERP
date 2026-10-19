import { DatabaseSync } from "node:sqlite";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

export function openDatabase(path = process.env.HOSPITAL_DATABASE_FILE || "./data/hospital.sqlite") {
  const file = path === ":memory:" ? path : resolve(path);
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file, { timeout: 5000 });
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospitals(
      id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 160),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS memberships(
      user_id TEXT NOT NULL REFERENCES users(id), hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      role TEXT NOT NULL CHECK(role IN('admin','recepcao','medico','enfermagem','laboratorio','financeiro','farmacia','auditor')),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),
      PRIMARY KEY(user_id,hospital_id)
    );
    CREATE TABLE IF NOT EXISTS sessions(
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL, revoked_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ix_session_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS patients(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      code TEXT NOT NULL, name TEXT NOT NULL, birth_date TEXT, phone TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(hospital_id,code),
      UNIQUE(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS partners(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN('seguradora','empresa','instituicao')),
      reference TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS coverages(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      partner_id TEXT NOT NULL, policy TEXT NOT NULL, percent INTEGER NOT NULL CHECK(percent BETWEEN 0 AND 100),
      starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,patient_id) REFERENCES patients(hospital_id,id),
      FOREIGN KEY(hospital_id,partner_id) REFERENCES partners(hospital_id,id),
      CHECK(ends_on>=starts_on)
    );
    CREATE INDEX IF NOT EXISTS ix_coverages_scope ON coverages(hospital_id,patient_id);
    CREATE TABLE IF NOT EXISTS encounters(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'aberta' CHECK(status IN('aberta','concluida')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(hospital_id,id),
      FOREIGN KEY(hospital_id,patient_id) REFERENCES patients(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS lab_orders(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, encounter_id TEXT NOT NULL,
      exam TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'solicitado'
        CHECK(status IN('solicitado','colhido','validado','cancelado')),
      result TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,encounter_id) REFERENCES encounters(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS stock_items(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      sku TEXT NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'un',
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0),
      price_cents INTEGER NOT NULL DEFAULT 0 CHECK(price_cents>=0),
      UNIQUE(hospital_id,sku), UNIQUE(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS stock_movements(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, item_id TEXT NOT NULL,
      delta INTEGER NOT NULL CHECK(delta<>0), reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,item_id) REFERENCES stock_items(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS service_entries(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      partner_id TEXT, coverage_id TEXT, description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
      partner_cents INTEGER NOT NULL DEFAULT 0 CHECK(partner_cents>=0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(hospital_id,id),
      FOREIGN KEY(hospital_id,patient_id) REFERENCES patients(hospital_id,id),
      FOREIGN KEY(hospital_id,partner_id) REFERENCES partners(hospital_id,id),
      FOREIGN KEY(coverage_id) REFERENCES coverages(id),
      CHECK(partner_cents<=amount_cents),
      CHECK((partner_id IS NULL AND partner_cents=0) OR partner_id IS NOT NULL)
    );
    CREATE TABLE IF NOT EXISTS patient_payments(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents>0), reference TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,patient_id) REFERENCES patients(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS partner_payments(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL,
      service_id TEXT NOT NULL, partner_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
      reference TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,service_id) REFERENCES service_entries(hospital_id,id),
      FOREIGN KEY(hospital_id,partner_id) REFERENCES partners(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS appointments(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      begins_at TEXT NOT NULL, professional TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'marcada' CHECK(status IN('marcada','atendida','cancelada')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hospital_id,professional,begins_at),
      FOREIGN KEY(hospital_id,patient_id) REFERENCES patients(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS triage_notes(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, encounter_id TEXT NOT NULL,
      pressure TEXT, temperature TEXT, pulse TEXT, observations TEXT NOT NULL DEFAULT '',
      recorded_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,encounter_id) REFERENCES encounters(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS nursing_notes(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, encounter_id TEXT NOT NULL,
      intervention TEXT NOT NULL, recorded_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,encounter_id) REFERENCES encounters(hospital_id,id)
    );
    CREATE TABLE IF NOT EXISTS dispensations(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      item_id TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0),
      reason TEXT NOT NULL, recorded_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id,patient_id) REFERENCES patients(hospital_id,id),
      FOREIGN KEY(hospital_id,item_id) REFERENCES stock_items(hospital_id,id)
    );
    CREATE INDEX IF NOT EXISTS ix_appointments_scope ON appointments(hospital_id,begins_at);
    CREATE INDEX IF NOT EXISTS ix_nursing_scope ON nursing_notes(hospital_id,encounter_id);
    CREATE INDEX IF NOT EXISTS ix_triage_scope ON triage_notes(hospital_id,encounter_id);
    CREATE INDEX IF NOT EXISTS ix_dispensations_scope ON dispensations(hospital_id,patient_id);
    CREATE TABLE IF NOT EXISTS audit_events(
      id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ix_patients_hospital ON patients(hospital_id,created_at);
    CREATE INDEX IF NOT EXISTS ix_service_patient ON service_entries(hospital_id,patient_id,created_at);
    CREATE INDEX IF NOT EXISTS ix_service_partner ON service_entries(hospital_id,partner_id,created_at);
    CREATE INDEX IF NOT EXISTS ix_audit_hospital ON audit_events(hospital_id,created_at);
  `);
  return db;
}
export function atomic(db, operation) {
  db.exec("BEGIN IMMEDIATE");
  try { const value = operation(); db.exec("COMMIT"); return value; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}
