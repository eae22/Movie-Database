function MovieList({ movies }) {
  return (
    <div>
      <h2>영화 목록</h2>

      {movies.length === 0 && <p>검색 조건에 맞는 영화가 없습니다.</p>}

      <ul>
        {movies.map((m, idx) => (
          <li key={idx}>
            {m.title} ({m.year}) — 평점 {m.rating} / 관람등급 {m.allowed_age}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MovieList;
