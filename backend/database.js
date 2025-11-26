const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'motoristas.db'), (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('✅ Banco de dados conectado');
  }
});

// Criar tabelas se não existirem
db.serialize(() => {
  // Tabela de motoristas
  db.run(`
    CREATE TABLE IF NOT EXISTS motoristas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL UNIQUE,
      modelo_carro TEXT NOT NULL,
      consumo_medio REAL NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de custos operacionais
  db.run(`
    CREATE TABLE IF NOT EXISTS custos_operacionais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      motorista_id INTEGER NOT NULL,
      combustivel_preco_km REAL,
      manutencao_mensal REAL,
      seguro REAL,
      ipva REAL,
      aluguel_carro REAL,
      parcela_financiamento REAL,
      outros_custos REAL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
    )
  `);

  // Tabela de registros diários
  db.run(`
    CREATE TABLE IF NOT EXISTS registros_diarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      motorista_id INTEGER NOT NULL,
      data_registro DATE NOT NULL,
      horas_online REAL,
      km_rodados REAL,
      ganho_bruto REAL,
      combustivel_gasto REAL,
      outras_despesas REAL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
    )
  `);
});

module.exports = db;
