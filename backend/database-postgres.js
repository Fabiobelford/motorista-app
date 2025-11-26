const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Criar tabelas se não existirem
pool.query(`
  CREATE TABLE IF NOT EXISTS motoristas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL UNIQUE,
    modelo_carro TEXT NOT NULL,
    consumo_medio FLOAT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS custos_operacionais (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL,
    combustivel_preco_km FLOAT,
    manutencao_mensal FLOAT,
    seguro FLOAT,
    ipva FLOAT,
    aluguel_carro FLOAT,
    parcela_financiamento FLOAT,
    outros_custos FLOAT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS registros_diarios (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL,
    data_registro DATE NOT NULL,
    horas_online FLOAT,
    km_rodados FLOAT,
    ganho_bruto FLOAT,
    combustivel_gasto FLOAT,
    outras_despesas FLOAT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
  )
`);

module.exports = pool;
