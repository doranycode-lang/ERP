import { pgTable, serial, text, boolean, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pacientesTable = pgTable("pacientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  nasc: text("nasc").notNull().default(""),
  sexo: text("sexo").notNull().default(""),
  bi: text("bi").notNull().default(""),
  nif: text("nif").notNull().default(""),
  nacionalidade: text("nacionalidade").notNull().default("Angolana"),
  estadoCivil: text("estado_civil").notNull().default(""),
  profissao: text("profissao").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  telefone2: text("telefone2").notNull().default(""),
  email: text("email").notNull().default(""),
  endereco: text("endereco").notNull().default(""),
  grupoSanguineo: text("grupo_sanguineo").notNull().default(""),
  fatorRh: text("fator_rh").notNull().default(""),
  alergias: text("alergias").notNull().default(""),
  patologiasCronicas: text("patologias_cronicas").notNull().default(""),
  medicacaoHabitual: text("medicacao_habitual").notNull().default(""),
  contactoEmergenciaNome: text("contacto_emergencia_nome").notNull().default(""),
  contactoEmergenciaTel: text("contacto_emergencia_tel").notNull().default(""),
  empresa: text("empresa").notNull().default(""),
  processo: text("processo").notNull().default(""),
  medico: text("medico").notNull().default(""),
  nAmostra: text("n_amostra").notNull().default(""),
  recolha: text("recolha").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPacienteSchema = createInsertSchema(pacientesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPaciente = z.infer<typeof insertPacienteSchema>;
export type Paciente = typeof pacientesTable.$inferSelect;

export const resultadosTable = pgTable("resultados", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").notNull(),
  pacienteNome: text("paciente_nome").notNull().default(""),
  data: text("data").notNull().default(""),
  dataEmissao: text("data_emissao").notNull().default(""),
  parametros: jsonb("parametros").notNull().default([]),
  tecnicoNome: text("tecnico_nome").notNull().default(""),
  observacoes: text("observacoes").notNull().default(""),
  estado: text("estado").notNull().default("rascunho"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResultadoSchema = createInsertSchema(resultadosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResultado = z.infer<typeof insertResultadoSchema>;
export type Resultado = typeof resultadosTable.$inferSelect;

export const examesCustomTable = pgTable("exames_custom", {
  id: serial("id").primaryKey(),
  categoria: text("categoria").notNull(),
  nome: text("nome").notNull(),
  parametros: jsonb("parametros").notNull().default([]),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExameCustomSchema = createInsertSchema(examesCustomTable).omit({ id: true, createdAt: true });
export type InsertExameCustom = z.infer<typeof insertExameCustomSchema>;
export type ExameCustom = typeof examesCustomTable.$inferSelect;

export const reagentesTable = pgTable("reagentes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  exameCodigo: text("exame_codigo").notNull().default(""),
  exameNome: text("exame_nome").notNull().default(""),
  fornecedor: text("fornecedor").notNull().default(""),
  unidade: text("unidade").notNull().default(""),
  stockAtual: integer("stock_atual").notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull().default(0),
  precoUnitario: numeric("preco_unitario", { precision: 12, scale: 2 }).notNull().default("0"),
  lote: text("lote").notNull().default(""),
  dataValidade: text("data_validade").notNull().default(""),
  observacoes: text("observacoes").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReagenteSchema = createInsertSchema(reagentesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReagente = z.infer<typeof insertReagenteSchema>;
export type Reagente = typeof reagentesTable.$inferSelect;

export const funcionariosTable = pgTable("lab_funcionarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cargo: text("cargo").notNull().default("Técnico de laboratório"),
  email: text("email").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFuncionarioSchema = createInsertSchema(funcionariosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFuncionario = z.infer<typeof insertFuncionarioSchema>;
export type Funcionario = typeof funcionariosTable.$inferSelect;

export const parceirosTable = pgTable("lab_parceiros", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  instituicao: text("instituicao").notNull().default(""),
  nif: text("nif").notNull().default(""),
  email: text("email").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertParceiroSchema = createInsertSchema(parceirosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertParceiro = z.infer<typeof insertParceiroSchema>;
export type Parceiro = typeof parceirosTable.$inferSelect;

export const solicitacoesTable = pgTable("lab_solicitacoes", {
  id: serial("id").primaryKey(),
  parceiroId: integer("parceiro_id"),
  parceiroNome: text("parceiro_nome").notNull().default(""),
  pacienteId: integer("paciente_id").notNull(),
  pacienteNome: text("paciente_nome").notNull().default(""),
  exames: jsonb("exames").notNull().default([]),
  urgente: boolean("urgente").notNull().default(false),
  estado: text("estado").notNull().default("pendente"),
  observacoes: text("observacoes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSolicitacaoSchema = createInsertSchema(solicitacoesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSolicitacao = z.infer<typeof insertSolicitacaoSchema>;
export type Solicitacao = typeof solicitacoesTable.$inferSelect;
