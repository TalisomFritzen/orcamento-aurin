import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDb() {
  return open({
    filename: '/tmp/database.sqlite',
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await openDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      elec REAL DEFAULT 3,
      hydro REAL DEFAULT 3,
      pipe REAL DEFAULT 3,
      mach REAL DEFAULT 3,
      lod300 REAL DEFAULT 3,
      lod400 REAL DEFAULT 6,
      lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Inserir configurações padrão se não existirem
  const count = await db.get('SELECT COUNT(*) as count FROM configurations');
  if (count.count === 0) {
    await db.run(`
      INSERT INTO configurations (elec, hydro, pipe, mach, lod300, lod400) 
      VALUES (3, 3, 3, 3, 3, 6)
    `);
  }
  
  return db;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = await initDb();

  try {
    if (req.method === 'GET') {
      const config = await db.get(`
        SELECT elec, hydro, pipe, mach, lod300, lod400 
        FROM configurations 
        WHERE id = 1
      `);
      res.status(200).json(config || { 
        elec: 3, hydro: 3, pipe: 3, mach: 3, lod300: 3, lod400: 6 
      });
      
    } else if (req.method === 'PUT') {
      const { elec, hydro, pipe, mach, lod300, lod400 } = req.body;
      await db.run(`
        UPDATE configurations 
        SET elec = ?, hydro = ?, pipe = ?, mach = ?, lod300 = ?, lod400 = ?, 
            lastUpdated = CURRENT_TIMESTAMP 
        WHERE id = 1
      `, [elec, hydro, pipe, mach, lod300, lod400]);
      
      res.status(200).json({ message: 'Configurações atualizadas com sucesso!' });
    } else {
      res.status(405).json({ error: 'Método não permitido.' });
    }
  } catch (error) {
    console.error('Erro na API de configurações:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
}