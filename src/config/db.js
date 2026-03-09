import mysql from 'mysql2';

// Host e porta separados (MySQL não aceita "host:porta" no campo host)
const rawHost = process.env.DB_HOST || '181.189.64.66';
const [host, portFromHost] = rawHost.includes(':')
  ? rawHost.split(':')
  : [rawHost, null];
const port = process.env.DB_PORT
  ? parseInt(process.env.DB_PORT, 10)
  : (portFromHost ? parseInt(portFromHost, 10) : 3306);

const db = mysql.createPool({
  host,
  port: Number.isNaN(port) ? 3306 : port,
  user: process.env.DB_USER || 'kaio',
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
