const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ROTA 1: Cadastrar novo motorista
app.post('/api/motoristas', (req, res) => {
  const { nome, telefone, modelo_carro, consumo_medio } = req.body;

  if (!nome || !telefone || !modelo_carro || !consumo_medio) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  db.run(
    'INSERT INTO motoristas (nome, telefone, modelo_carro, consumo_medio) VALUES (?, ?, ?, ?)',
    [nome, telefone, modelo_carro, consumo_medio],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ erro: 'Telefone já cadastrado' });
        }
        return res.status(500).json({ erro: 'Erro ao cadastrar' });
      }
      res.status(201).json({ 
        mensagem: 'Motorista cadastrado com sucesso',
        id: this.lastID 
      });
    }
  );
});

// ROTA 2: Listar todos os motoristas
app.get('/api/motoristas', (req, res) => {
  db.all('SELECT * FROM motoristas ORDER BY criado_em DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar motoristas' });
    }
    res.json(rows);
  });
});

// ROTA 3: Obter detalhes de um motorista
app.get('/api/motoristas/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM motoristas WHERE id = ?', [id], (err, motorista) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar motorista' });
    }
    if (!motorista) {
      return res.status(404).json({ erro: 'Motorista não encontrado' });
    }
    res.json(motorista);
  });
});

// ROTA 4: Registrar custos operacionais
app.post('/api/custos/:motorista_id', (req, res) => {
  const { motorista_id } = req.params;
  const { 
    combustivel_preco_km, 
    manutencao_mensal, 
    seguro, 
    ipva, 
    aluguel_carro,
    parcela_financiamento,
    outros_custos 
  } = req.body;

  db.run(
    `INSERT INTO custos_operacionais 
    (motorista_id, combustivel_preco_km, manutencao_mensal, seguro, ipva, aluguel_carro, parcela_financiamento, outros_custos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [motorista_id, combustivel_preco_km, manutencao_mensal, seguro, ipva, aluguel_carro, parcela_financiamento, outros_custos],
    function(err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao registrar custos' });
      }
      res.status(201).json({ mensagem: 'Custos registrados com sucesso' });
    }
  );
});

// ROTA 5: Registrar ganhos e gastos diários
app.post('/api/registros/:motorista_id', (req, res) => {
  const { motorista_id } = req.params;
  const { 
    data_registro,
    horas_online, 
    km_rodados, 
    ganho_bruto, 
    combustivel_gasto, 
    outras_despesas 
  } = req.body;

  db.run(
    `INSERT INTO registros_diarios 
    (motorista_id, data_registro, horas_online, km_rodados, ganho_bruto, combustivel_gasto, outras_despesas) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [motorista_id, data_registro, horas_online, km_rodados, ganho_bruto, combustivel_gasto, outras_despesas],
    function(err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao registrar' });
      }
      res.status(201).json({ mensagem: 'Registro salvo com sucesso' });
    }
  );
});

// ROTA 6: Obter histórico de registros de um motorista
app.get('/api/registros/:motorista_id', (req, res) => {
  const { motorista_id } = req.params;
  
  db.all(
    'SELECT * FROM registros_diarios WHERE motorista_id = ? ORDER BY data_registro DESC',
    [motorista_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao buscar registros' });
      }
      res.json(rows);
    }
  );
});

// ROTA 7: Calcular lucro do dia
app.get('/api/lucro-dia/:motorista_id/:data', (req, res) => {
  const { motorista_id, data } = req.params;
  
  db.get(
    'SELECT * FROM registros_diarios WHERE motorista_id = ? AND data_registro = ?',
    [motorista_id, data],
    (err, registro) => {
      if (err || !registro) {
        return res.status(404).json({ erro: 'Registro não encontrado' });
      }
      
      const lucro = registro.ganho_bruto - registro.combustivel_gasto - (registro.outras_despesas || 0);
      res.json({ 
        ganho_bruto: registro.ganho_bruto,
        combustivel_gasto: registro.combustivel_gasto,
        outras_despesas: registro.outras_despesas || 0,
        lucro_liquido: lucro,
        horas_online: registro.horas_online,
        km_rodados: registro.km_rodados,
        ganho_por_hora: (lucro / registro.horas_online).toFixed(2),
        ganho_por_km: (lucro / registro.km_rodados).toFixed(2)
      });
    }
  );
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
