import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// RDS 연결 풀
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 테스트 API
app.get('/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW()');
    res.json({
      message: 'AWS RDS 연결 성공',
      data: rows,
    });
  } catch (error) {
    res.json({
      message: 'AWS RDS 연결 실패',
      error: error.toString(),
    });
  }
});

// 서버 실행
app.listen(3001, () => {
  console.log('서버 실행 중 → http://localhost:3001/test');
});
