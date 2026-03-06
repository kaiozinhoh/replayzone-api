import mysql from 'mysql2';

const db = mysql.createPool({
  host: process.env.DB_HOST || 'db.replayzone.com.br',
  user: process.env.DB_USER || 'replayzone',
  password: process.env.DB_PASSWORD || 'Kaio@3005',
  database: process.env.DB_NAME || 'replayzone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00',
});

export const connectDB = () => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      return;
    }
    console.log('Conectado ao banco de dados!');
    connection.release();
  });
};

export default db;
