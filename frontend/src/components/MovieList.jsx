import { useNavigate } from 'react-router-dom';

function MovieList({ movies }) {
  const navigate = useNavigate();

  if (!movies || movies.length === 0) {
    return (
      <div>
        <h2>영화 목록</h2>
        <p>검색 조건에 맞는 영화가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>영화 목록</h2>
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
          {movies.map((m) => {
            const rating = m.avg_rating === null || m.avg_rating === undefined ? null : Number(m.avg_rating);

            return (
              <tr key={m.movie_id} onClick={() => navigate(`/movie/${m.movie_id}`)}>
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
