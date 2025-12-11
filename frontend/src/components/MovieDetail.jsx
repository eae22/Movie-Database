import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MovieDetail() {
  const { id } = useParams(); // ← URL에서 movieId 가져옴
  const navigate = useNavigate(); // ← 뒤로가기 버튼용

  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const res = await fetch(`http://localhost:3001/movies/${id}`);
      const json = await res.json();
      setData(json);
    };
    fetchDetail();
  }, [id]);

  if (!data) return <p>로딩 중...</p>;

  const { movie, directors, ott_list, reviews, sameDirectorMovies } = data;

  return (
    <div>
      <button onClick={() => navigate(-1)}>← 목록으로 돌아가기</button>

      <h2>{movie.title}</h2>

      <div>개봉일: {movie.release_date}</div>
      <div>국가: {movie.country}</div>
      <div>러닝타임: {movie.run_time}분</div>
      <div>관람등급: {movie.allowed_age}</div>
      <div>장르: {movie.genres}</div>
      <div>평균 평점: {movie.avg_rating ? movie.avg_rating.toFixed(1) : 'N/A'}</div>

      <div>
        트레일러:{' '}
        {movie.trailer_url ? (
          <a href={movie.trailer_url} target="_blank">
            이동
          </a>
        ) : (
          '없음'
        )}
      </div>

      <h3>감독 정보</h3>
      <ul>
        {directors.map((d) => (
          <li key={d.director_id}>
            <strong>{d.name}</strong>
            <div>성별: {d.gender}</div>
            <div>국적: {d.nationality}</div>
            <div>출생연도: {d.birth_year}</div>
          </li>
        ))}
      </ul>

      <h3>OTT 제공</h3>
      <p>{ott_list.join(', ')}</p>

      <h3>리뷰</h3>
      {reviews.length === 0 ? (
        <p>등록된 리뷰가 없습니다.</p>
      ) : (
        <ul>
          {reviews.map((r) => (
            <li key={r.review_id}>
              <div>평점: {r.rating}</div>
              <div>작성자: User {r.user_id}</div>
              <div>코멘트: {r.comment}</div>
              <div>작성일: {r.created_at}</div>
            </li>
          ))}
        </ul>
      )}

      <h3>같은 감독의 다른 작품</h3>
      {sameDirectorMovies.length === 0 ? (
        <p>같은 감독의 다른 작품이 없습니다.</p>
      ) : (
        <ul>
          {sameDirectorMovies.map((m) => (
            <li key={m.movie_id}>{m.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MovieDetail;
