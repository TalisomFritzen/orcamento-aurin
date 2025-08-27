import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Conectar ao banco de dados
async function openDb() {
  return open({
    filename: '/tmp/database.sqlite',
    driver: sqlite3.Database
  });
}

// Inicializar banco de dados
async function initDb() {
  const db = await openDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL,
      clientEmail TEXT NOT NULL,
      clientPhone TEXT,
      buildingType TEXT NOT NULL,
      squareMeters REAL NOT NULL,
      difficulty INTEGER,
      discount REAL,
      archModeling BOOLEAN,
      structModeling BOOLEAN,
      elecModeling BOOLEAN,
      hydroModeling BOOLEAN,
      pipeModeling BOOLEAN,
      machModeling BOOLEAN,
      revit24 BOOLEAN,
      revit23 BOOLEAN,
      revit22 BOOLEAN,
      pdf BOOLEAN,
      dwg2d BOOLEAN,
      dwg3d BOOLEAN,
      selectedLod TEXT,
      baseValue REAL,
      difficultyValue REAL,
      disciplineAdditionalValue REAL,
      lodAdditionalValue REAL,
      discountValue REAL,
      totalValue REAL,
      modelingHours REAL,
      workingDays REAL,
      quoteDate TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = await initDb();

  try {
    if (req.method === 'GET') {
      // Buscar todos os orçamentos
      const budgets = await db.all('SELECT * FROM budgets ORDER BY timestamp DESC');
      res.status(200).json(budgets);
      
    } else if (req.method === 'POST') {
      // Salvar novo orçamento
      const budget = req.body;
      
      const result = await db.run(`
        INSERT INTO budgets (
          clientName, clientEmail, clientPhone, buildingType, squareMeters,
          difficulty, discount, archModeling, structModeling, elecModeling,
          hydroModeling, pipeModeling, machModeling, revit24, revit23, revit22,
          pdf, dwg2d, dwg3d, selectedLod, baseValue, difficultyValue,
          disciplineAdditionalValue, lodAdditionalValue, discountValue,
          totalValue, modelingHours, workingDays, quoteDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        budget.clientName, budget.clientEmail, budget.clientPhone,
        budget.buildingType, budget.squareMeters, budget.difficulty,
        budget.discount, budget.archModeling, budget.structModeling,
        budget.elecModeling, budget.hydroModeling, budget.pipeModeling,
        budget.machModeling, budget.revit24, budget.revit23, budget.revit22,
        budget.pdf, budget.dwg2d, budget.dwg3d, budget.selectedLod,
        budget.baseValue, budget.difficultyValue, budget.disciplineAdditionalValue,
        budget.lodAdditionalValue, budget.discountValue, budget.totalValue,
        budget.modelingHours, budget.workingDays, budget.quoteDate
      ]);
      
      res.status(201).json({ 
        message: 'Orçamento salvo com sucesso!', 
        id: result.lastID 
      });
      
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (id === 'clear-all') {
        const result = await db.run('DELETE FROM budgets');
        res.status(200).json({ 
          message: `Todo o histórico (${result.changes} itens) foi limpo.` 
        });
      } else if (id) {
        const result = await db.run('DELETE FROM budgets WHERE id = ?', id);
        if (result.changes === 0) {
          res.status(404).json({ message: 'Orçamento não encontrado.' });
        } else {
          res.status(200).json({ message: 'Orçamento deletado com sucesso!' });
        }
      } else {
        res.status(400).json({ error: 'ID não fornecido.' });
      }
    } else {
      res.status(405).json({ error: 'Método não permitido.' });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
}