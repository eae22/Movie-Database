import { useNavigate } from 'react-router-dom';

function MovieList({ movies, sortOption, setSortOption, enableSort = true, showSort = true, viewerInfo, searchState }) {
  const navigate = useNavigate();

  if (!movies || movies.length === 0) {
    return (
      <div>
        <h2>영화 목록</h2>
        <p>검색 조건에 맞는 영화가 없습니다.</p>
      </div>
    );
  }

  // 날짜 -> 숫자(timestemp)로 변환
  const getReleaseTime = (m) => {
    if (!m.release_date) return 0;
    const t = new Date(m.release_date).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  // 정렬 적용
  const sortedMovies = enableSort
    ? [...movies].sort((a, b) => {
        const ratingA = a.avg_rating === null || a.avg_rating === undefined ? null : Number(a.avg_rating);
        const ratingB = b.avg_rating === null || b.avg_rating === undefined ? null : Number(b.avg_rating);

        switch (sortOption) {
          // 개봉일 기준 최신순
          case 'release_desc':
            return getReleaseTime(b) - getReleaseTime(a);

          // 개봉일 기준 오래된 순
          case 'release_asc':
            return getReleaseTime(a) - getReleaseTime(b);

          // 러닝타임 긴 순
          case 'runtime_desc':
            return (b.run_time || 0) - (a.run_time || 0);
          // 러닝타임 짧은 순
          case 'runtime_asc':
            return (a.run_time || 0) - (b.run_time || 0);

          // 평점 높은 순
          case 'rating_desc': {
            const ra = ratingA ?? -Infinity;
            const rb = ratingB ?? -Infinity;
            return rb - ra;
          }
          // 평점 낮은 순
          case 'rating_asc': {
            const ra = ratingA ?? Infinity;
            const rb = ratingB ?? Infinity;
            return ra - rb;
          }

          default:
            return 0;
        }
      })
    : movies;

  return (
    <div>
      {/* 제목 + 정렬 셀렉트 (옵션) */}
      {enableSort && showSort && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>영화 목록</h2>
          <div>
            <label>
              정렬 기준:&nbsp;
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                {/* 개봉일 기준 */}
                <option value="release_desc">개봉일 최신순</option>
                <option value="release_asc">개봉일 오래된 순</option>

                {/* 평점 기준 */}
                <option value="rating_desc">평점 높은 순</option>
                <option value="rating_asc">평점 낮은 순</option>

                {/* 러닝타임 기준 */}
                <option value="runtime_desc">러닝타임 긴 순</option>
                <option value="runtime_asc">러닝타임 짧은 순</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {!enableSort && <h2>영화 목록</h2>}

      <table>
        <thead>
          <tr>
            <th>제목</th>
            <th>개봉연도</th>
            <th>러닝타임</th>
            <th>관람등급</th>
            <th>장르</th>
            <th>감독</th>
            <th>평균 평점</th>
          </tr>
        </thead>

        <tbody>
          {sortedMovies.map((m) => {
            const rating = m.avg_rating === null || m.avg_rating === undefined ? null : Number(m.avg_rating);

            return (
              <tr
                key={m.movie_id}
                onClick={() =>
                  navigate(`/movie/${m.movie_id}`, {
                    state: {
                      viewerInfo,
                      searchState,
                    },
                  })
                }
              >
                <td>{m.title}</td>
                <td>{m.release_year}</td>
                <td>{m.run_time}분</td>
                <td>{m.allowed_age}</td>
                <td>{m.genres}</td>
                <td>{m.directors}</td>
                <td>{rating !== null && !Number.isNaN(rating) ? rating.toFixed(1) : 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MovieList;
