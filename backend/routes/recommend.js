// routes/recommend.js
import { Router } from 'express';

// pool을 직접 import하지 않고,
// 바깥에서 주입받는 함수 형태로 만든다.
function createRecommendRouter(pool) {
  const router = Router();

  // GET /api/recommend?birthYear=2003&gender=여&sort=top5
  router.get('/', async (req, res) => {
    try {
      const { birthYear, gender } = req.query;

      if (!birthYear || !gender) {
        return res.status(400).json({ error: 'birthYear와 gender는 필수입니다.' });
      }

      const birthYearNum = Number(birthYear);
      if (!Number.isFinite(birthYearNum) || birthYear.length !== 4) {
        return res.status(400).json({ error: 'birthYear는 4자리 숫자여야 합니다.' });
      }

      // 1) 나이 / 나이대(10대, 20대, ...) 계산
      const now = new Date();
      const currentYear = now.getFullYear(); // 예: 2025
      const age = currentYear - birthYearNum; // 예: 29

      let decade = Math.floor(age / 10) * 10; // 예: 20
      if (decade < 10) decade = 10; // 10대 미만은 10대로 묶기
      if (decade > 90) decade = 90; // 90대 초과는 90대로 묶기

      // 같은 나이대의 출생연도 범위 계산
      // 예: 20대 → 20~29살 → 출생연도 [currentYear-29, currentYear-20]
      const maxBirthYear = currentYear - decade; // 가장 어린 (예: 2005)
      const minBirthYear = currentYear - (decade + 9); // 가장 나이 많은 (예: 1996)

      // 2) 같은 나이대 + 같은 성별인 유저들 찾기
      const [userRows] = await pool.query(
        `
        SELECT user_id
        FROM User
        WHERE gender = ?
          AND birth_year BETWEEN ? AND ?
        `,
        [gender, minBirthYear, maxBirthYear]
      );

      const sameGroupUserIds = userRows.map((u) => u.user_id);
      const groupSize = sameGroupUserIds.length;

      if (groupSize === 0) {
        return res.json({
          ok: true,
          message: '같은 나이대·성별 사용자 데이터가 없습니다.',
          birthYear,
          gender,
          ageGroup: `${decade}대`,
          usersInGroup: 0,
          genres: [],
          movies: [],
        });
      }

      // 3) 이 유저들이 UserFavGenre에 등록한 장르별 개수 집계
      const userPlaceholders = sameGroupUserIds.map(() => '?').join(',');

      const [favGenreRows] = await pool.query(
        `
        SELECT 
          UFG.genre_id,
          G.genre_name,
          COUNT(*) AS cnt
        FROM UserFavGenre UFG
        JOIN Genre G ON UFG.genre_id = G.genre_id
        WHERE UFG.user_id IN (${userPlaceholders})
        GROUP BY UFG.genre_id, G.genre_name
        `,
        sameGroupUserIds
      );

      if (favGenreRows.length === 0) {
        return res.json({
          ok: true,
          message: '해당 그룹의 선호 장르 데이터가 없습니다.',
          birthYear,
          gender,
          ageGroup: `${decade}대`,
          usersInGroup: groupSize,
          genres: [],
          movies: [],
        });
      }

      // 4) 그룹 인원수의 50% 이상(과반수) 선호 장르만 남기기 + fallback 상위 N개
      let threshold = Math.ceil(groupSize * 0.5); // 50%
      if (threshold < 1) threshold = 1;

      // 인원이 너무 적을 때(3명 이하)는 최소 1명만 좋아해도 OK
      if (groupSize <= 3) {
        threshold = 1;
      }

      // 과반수 이상이 선호하는 장르
      let strongGenres = favGenreRows.filter((row) => row.cnt >= threshold);

      // fallback: 조건 만족 장르가 없으면 선호 카운트 상위 N개 사용
      let usedFallback = false;
      if (strongGenres.length === 0) {
        usedFallback = true;

        const FALLBACK_TOP_K = 3; // 상위 N개 장르 사용
        strongGenres = [...favGenreRows]
          .sort((a, b) => b.cnt - a.cnt) // cnt 내림차순
          .slice(0, FALLBACK_TOP_K); // 상위 N개
      }

      const strongGenreIds = strongGenres.map((g) => g.genre_id);
      const genrePlaceholders = strongGenreIds.map(() => '?').join(',');

      // strongGenreIds, genrePlaceholders까지 구해진 상태라고 가정

      const { sort = 'top' } = req.query; // 기본값: top

      let orderClause = '';

      switch (sort) {
        case 'top': // Top5
          orderClause = `
      ORDER BY 
        avg_rating DESC,
        review_count DESC
      LIMIT 5
    `;
          break;

        case 'hot': // 인기 급상승
          orderClause = `
      ORDER BY
        recent_review_count DESC,
        review_count DESC,
        avg_rating DESC
      LIMIT 5
    `;
          break;

        case 'recent': // 최근 개봉 영화
          orderClause = `
      ORDER BY
        M.release_date DESC
      LIMIT 5
    `;
          break;

        default:
          // 잘못된 값 들어오면 기본은 Top5로
          orderClause = `
      ORDER BY 
        avg_rating DESC,
        review_count DESC
      LIMIT 5
    `;
          break;
      }

      const [movieRows] = await pool.query(
        `
        SELECT 
            M.movie_id,
            M.title,
            M.release_date,
            YEAR(M.release_date) AS release_year,
            M.run_time,
            M.allowed_age,
            M.country,
            GROUP_CONCAT(DISTINCT G.genre_name) AS genres,
            GROUP_CONCAT(DISTINCT D.name) AS directors,
            AVG(R.rating)              AS avg_rating,
            COUNT(R.review_id)         AS review_count,
            SUM(
            CASE 
                WHEN R.created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) 
                THEN 1 ELSE 0 
            END
            ) AS recent_review_count
        FROM Movie M
        JOIN MovieGenre MG ON M.movie_id = MG.movie_id
        JOIN Genre G      ON MG.genre_id = G.genre_id
        JOIN MovieDirector MD ON M.movie_id = MD.movie_id
        JOIN Director D   ON MD.director_id = D.director_id
        LEFT JOIN Review R ON M.movie_id = R.movie_id
        WHERE MG.genre_id IN (${genrePlaceholders})
        GROUP BY M.movie_id
        ${orderClause}
        `,
        strongGenreIds
      );

      return res.json({
        ok: true,
        birthYear,
        gender,
        ageGroup: `${decade}대`,
        usersInGroup: groupSize,
        threshold,
        usedFallback, // fallback 썼는지 여부
        genres: strongGenres, // { genre_id, genre_name, cnt } 배열
        movies: movieRows, // 추천 대상 영화들
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: '서버 오류' });
    }
  });

  return router;
}

export default createRecommendRouter;
