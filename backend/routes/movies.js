import { Router } from 'express';
import pool from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { sort = 'rating_desc', ott, genre, year, country, age, ratingMin, title, director } = req.query;

    let sql = `
      SELECT 
        M.movie_id,
        M.title,
        YEAR(M.release_date) AS release_year,
        M.release_date,
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
    console.log(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
