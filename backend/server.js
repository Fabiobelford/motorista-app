const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./database-postgres');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ROTA 1: Cadastrar novo motorista
app.post('/api/motoristas', async (req, res) => {
  const { nome, telefone, modelo_carro, consumo_medio } = req.body;

  if (!nome || !telefone || !modelo_carro || !consumo_medio) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO motoristas (nome, telefone, modelo_carro, consumo_medio) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome, telefone, modelo_carro, consumo_medio]
    );
    res.status(201).json({ 
      mensagem: 'Motorista cadastrado com sucesso',
      id: result.rows[0].id 
    });
  } catch (err) {
    if (err.message.includes('motoristas_telefone_key')) {
      return res.status(400).json({ erro: 'Telefone já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

// ROTA 2: Listar todos os motoristas
app.get('/api/motoristas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM motoristas ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar motoristas' });
  }
});

// ROTA 3: Obter detalhes de um motorista
app.get('/api/motoristas/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM motoristas WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Motorista não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar motorista' });
  }
});

// ROTA 4: Registrar custos operacionais
app.post('/api/custos/:motorista_id', async (req, res) => {
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

  try {
    await pool.query(
      `INSERT INTO custos_operacionais 
      (motorista_id, combustivel_preco_km, manutencao_mensal, seguro, ipva, aluguel_carro, parcela_financiamento, outros_custos) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [motorista_id, combustivel_preco_km, manutencao_mensal, seguro, ipva, aluguel_carro, parcela_financiamento, outros_custos]
    );
    res.status(201).json({ mensagem: 'Custos registrados com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar custos' });
  }
});

// ROTA 5: Registrar ganhos e gastos diários
app.post('/api/registros/:motorista_id', async (req, res) => {
  const { motorista_id } = req.params;
  const { 
    data_registro,
    horas_online, 
    km_rodados, 
    ganho_bruto, 
    combustivel_gasto, 
    outras_despesas 
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO registros_diarios 
      (motorista_id, data_registro, horas_online, km_rodados, ganho_bruto, combustivel_gasto, outras_despesas) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [motorista_id, data_registro, horas_online, km_rodados, ganho_bruto, combustivel_gasto, outras_despesas]
    );
    res.status(201).json({ mensagem: 'Registro salvo com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar' });
  }
});

// ROTA 6: Obter histórico de registros de um motorista
app.get('/api/registros/:motorista_id', async (req, res) => {
  const { motorista_id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM registros_diarios WHERE motorista_id = $1 ORDER BY data_registro DESC',
      [motorista_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar registros' });
  }
});

// ROTA 7: Calcular lucro do dia
app.get('/api/lucro-dia/:motorista_id/:data', async (req, res) => {
  const { motorista_id, data } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM registros_diarios WHERE motorista_id = $1 AND data_registro = $2',
      [motorista_id, data]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }
    
    const registro = result.rows[0];
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
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao calcular lucro' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
