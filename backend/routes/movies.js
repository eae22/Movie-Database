import { Router } from 'express';
import pool from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { sort = 'rating_desc', ott, genre, year, country, age, ratingMin, title, director, search } = req.query;

    let sql = `
      SELECT 
        M.movie_id,
        M.title,
        M.country,
        YEAR(M.release_date) AS release_year,
        M.release_date,
        M.run_time,
        M.allowed_age,
        GROUP_CONCAT(DISTINCT G.genre_name SEPARATOR ', ') AS genres,
        GROUP_CONCAT(DISTINCT D.name SEPARATOR ', ') AS directors,
        AVG(R.rating) AS avg_rating
      FROM Movie M
      JOIN MovieGenre MG ON M.movie_id = MG.movie_id
      JOIN Genre G ON MG.genre_id = G.genre_id
      JOIN MovieDirector MD ON M.movie_id = MD.movie_id
      JOIN Director D ON MD.director_id = D.director_id
      LEFT JOIN Review R ON M.movie_id = R.movie_id
      LEFT JOIN MovieOtt MO ON M.movie_id = MO.movie_id
      LEFT JOIN Ott O ON MO.ott_id = O.ott_id
      WHERE 1 = 1
    `;

    const params = [];

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
      const list = year.split(',');
      const cond = [];
      list.forEach((y) => {
        if (y === '1990s') cond.push(`(YEAR(M.release_date) BETWEEN 1990 AND 1999)`);
        if (y === '2000s') cond.push(`(YEAR(M.release_date) BETWEEN 2000 AND 2009)`);
        if (y === '2010s') cond.push(`(YEAR(M.release_date) BETWEEN 2010 AND 2019)`);
        if (y === '2020s') cond.push(`(YEAR(M.release_date) >= 2020)`);
      });
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

    if (search) {
      sql += ` AND (M.title LIKE ? OR D.name LIKE ?) `;
      params.push(`%${search}%`, `%${search}%`);
      console.log('검색 파라미터(search):', search);
    }

    sql += ` GROUP BY M.movie_id `;

    if (ratingMin && ratingMax) {
      sql += ` HAVING AVG(R.rating) BETWEEN ? AND ? `;
      params.push(Number(ratingMin), Number(ratingMax));
    }

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

    console.log('최종 SQL:', sql);
    console.log('params:', params);
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
