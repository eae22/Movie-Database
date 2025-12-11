import { Router } from 'express';
import pool from '../server.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const [[movie]] = await pool.query(
      `
      SELECT 
        M.*,
        GROUP_CONCAT(DISTINCT G.genre_name SEPARATOR ', ') AS genres,
        GROUP_CONCAT(DISTINCT D.name SEPARATOR ', ') AS directors,
        GROUP_CONCAT(DISTINCT O.ott_name SEPARATOR ', ') AS otts,
        AVG(R.rating) AS avg_rating
      FROM Movie M
      JOIN MovieGenre MG ON M.movie_id = MG.movie_id
      JOIN Genre G ON MG.genre_id = G.genre_id
      JOIN MovieDirector MD ON M.movie_id = MD.movie_id
      JOIN Director D ON MD.director_id = D.director_id
      LEFT JOIN MovieOtt MO ON M.movie_id = MO.movie_id
      LEFT JOIN Ott O ON MO.ott_id = O.ott_id
      LEFT JOIN Review R ON R.movie_id = M.movie_id
      WHERE M.movie_id = ?
      GROUP BY M.movie_id
      `,
      [movieId]
    );

    if (!movie) return res.status(404).json({ error: '영화 없음' });

    const [reviews] = await pool.query('SELECT * FROM Review WHERE movie_id = ? ORDER BY created_at DESC', [movieId]);

    res.json({ movie, reviews });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
