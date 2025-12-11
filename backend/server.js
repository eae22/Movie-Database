import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
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

// Get /movies (정렬 + 필터 + 검색)
app.get('/movies', async (req, res) => {
  try {
    const { sort = 'rating_desc', ott, genre, year, country, age, ratingMin, title, director } = req.query;

    let sql = `
      SELECT 
        M.movie_id,
        M.title,
        M.release_date,
        YEAR(M.release_date) AS release_year,
        M.run_time,
        M.allowed_age,
        GROUP_CONCAT(DISTINCT G.genre_name) AS genres,
        GROUP_CONCAT(DISTINCT D.name) AS directors,
        AVG(R.rating) AS avg_rating
      FROM Movie M
      JOIN MovieGenre MG ON M.movie_id = MG.movie_id
      JOIN Genre G ON MG.genre_id = G.genre_id
      JOIN MovieDirector MD ON M.movie_id = MD.movie_id
      JOIN Director D ON MD.director_id = D.director_id
      LEFT JOIN Review R ON M.movie_id = R.movie_id
      LEFT JOIN MovieOtt MO ON M.movie_id = MO.movie_id
      LEFT JOIN Ott O ON MO.ott_id = O.ott_id
      WHERE 1=1
    `;

    const params = [];

    // 필터링 조건
    if (ott) {
      const list = ott.split(',');
      sql += ` AND O.ott_name IN (${list.map(() => '?').join(',')}) `;
      params.push(...list);
    }

    if (genre) {
      const list = genre.split(',');
      sql += ` AND G.genre_name IN (${list.map(() => '?').join(',')}) `;
      params.push(...list);
    }

    if (year) {
      const yearList = year.split(',');
      const cond = [];
      yearList.forEach((y) => {
        if (y === '1990s') cond.push('(YEAR(M.release_date) BETWEEN 1990 AND 1999)');
        if (y === '2000s') cond.push('(YEAR(M.release_date) BETWEEN 2000 AND 2009)');
        if (y === '2010s') cond.push('(YEAR(M.release_date) BETWEEN 2010 AND 2019)');
        if (y === '2020s') cond.push('(YEAR(M.release_date) >= 2020)');
      });
      sql += ` AND (${cond.join(' OR ')}) `;
    }

    if (country) {
      const list = country.split(',');
      const cond = [];
      if (list.includes('한국')) cond.push("M.country = 'KOR'");
      if (list.includes('외국')) cond.push("M.country <> 'KOR'");
      sql += ` AND (${cond.join(' OR ')}) `;
    }

    if (age) {
      const list = age.split(',');
      sql += ` AND M.allowed_age IN (${list.map(() => '?').join(',')}) `;
      params.push(...list);
    }

    if (title) {
      sql += ` AND M.title LIKE ? `;
      params.push(`%${title}%`);
    }

    if (director) {
      sql += ` AND D.name LIKE ? `;
      params.push(`%${director}%`);
    }

    sql += ` GROUP BY M.movie_id `;

    if (ratingMin) {
      sql += ` HAVING AVG(R.rating) >= ? `;
      params.push(Number(ratingMin));
    }

    // 정렬 옵션
    let order = '';
    switch (sort) {
      case 'release_asc':
        order = ' ORDER BY M.release_date ASC';
        break;
      case 'release_desc':
        order = ' ORDER BY M.release_date DESC';
        break;
      case 'runtime_asc':
        order = ' ORDER BY M.run_time ASC';
        break;
      case 'runtime_desc':
        order = ' ORDER BY M.run_time DESC';
        break;
      case 'rating_asc':
        order = ' ORDER BY avg_rating ASC';
        break;
      default:
      case 'rating_desc':
        order = ' ORDER BY avg_rating DESC';
        break;
    }
    sql += order;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /movies/:id (영화 상세 정보)
app.get('/movies/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    // 영화 기본 정보 + 장르 + OTT + 평균 평점
    const [movieRows] = await pool.query(
      `
      SELECT 
        M.movie_id,
        M.title,
        DATE_FORMAT(M.release_date, '%Y-%m-%d') AS release_date,
        M.country,
        M.run_time,
        M.allowed_age,
        M.trailer_url,
        GROUP_CONCAT(DISTINCT G.genre_name) AS genres,
        AVG(R.rating) AS avg_rating
      FROM Movie M
      LEFT JOIN MovieGenre MG ON M.movie_id = MG.movie_id
      LEFT JOIN Genre G ON MG.genre_id = G.genre_id
      LEFT JOIN Review R ON M.movie_id = R.movie_id
      WHERE M.movie_id = ?
      GROUP BY M.movie_id
      `,
      [movieId]
    );

    if (movieRows.length === 0) {
      return res.status(404).json({ error: '영화를 찾을 수 없음' });
    }

    // 감독 상세 정보(여러 명 가능)
    const [directors] = await pool.query(
      `
      SELECT 
        D.director_id,
        D.name,
        D.gender,
        D.nationality,
        D.birth_year
      FROM Director D
      JOIN MovieDirector MD ON D.director_id = MD.director_id
      WHERE MD.movie_id = ?
      `,
      [movieId]
    );

    // OTT 목록
    const [otts] = await pool.query(
      `
      SELECT O.ott_name
      FROM Ott O
      JOIN MovieOtt MO ON O.ott_id = MO.ott_id
      WHERE MO.movie_id = ?
      `,
      [movieId]
    );

    // 해당 영화의 리뷰 전체
    const [reviews] = await pool.query(
      `
      SELECT 
        review_id,
        movie_id,
        user_id,
        rating,
        comment,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
      FROM Review
      WHERE movie_id = ?
      ORDER BY created_at DESC
      `,
      [movieId]
    );

    // 동일 감독의 다른 작품 추천
    const [similar] = await pool.query(
      `
      SELECT DISTINCT M2.movie_id, M2.title
      FROM MovieDirector MD1
      JOIN MovieDirector MD2 ON MD1.director_id = MD2.director_id
      JOIN Movie M2 ON MD2.movie_id = M2.movie_id
      WHERE MD1.movie_id = ?
        AND M2.movie_id <> ?
      `,
      [movieId, movieId]
    );

    res.json({
      movie: movieRows[0],
      directors,
      ott_list: otts.map((o) => o.ott_name),
      reviews,
      sameDirectorMovies: similar,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 서버 실행
app.listen(3001, () => {
  console.log('서버 실행 중 → http://localhost:3001/test');
});
