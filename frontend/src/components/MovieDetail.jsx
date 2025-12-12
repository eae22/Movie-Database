import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const viewerInfo = location.state?.viewerInfo || null;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const getAgeGroup = (birthYear) => {
    const yearNum = Number(birthYear);
    if (!Number.isFinite(yearNum)) return null;

    const currentYear = new Date().getFullYear();
    const age = currentYear - yearNum;
    let decade = Math.floor(age / 10) * 10;

    if (decade < 10) decade = 10;
    if (decade > 90) decade = 90;
    return decade; // 20 → 20대
  };

  const backToRecommend = () => {
    const searchState = location.state?.searchState;

    if (searchState) {
      // 검색 상태를 들고 /recommend 로 이동
      navigate('/recommend', { state: { searchState } });
    } else {
      // 직접 /recommend로만 이동 (검색 상태 없음)
      navigate('/recommend');
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:3001/movies/${id}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `요청 실패 (status ${res.status})`);
        }
        const json = await res.json();
        console.log('영화 상세 응답:', json);
        setData(json);
      } catch (e) {
        console.error('영화 상세 에러:', e);
        setError(e.message);
      }
    };
    fetchDetail();
  }, [id]);

  if (error) {
    return (
      <div>
        <button onClick={backToRecommend}>← 목록으로 돌아가기</button>
        <p>영화 정보를 불러오는 중 오류가 발생했습니다.</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return <p>로딩 중...</p>;

  // data 구조 보호
  const movie = data.movie || {};
  const directors = Array.isArray(data.directors) ? data.directors : [];
  const ottList = Array.isArray(data.ott_list) ? data.ott_list : [];
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  const sameDirectorMovies = Array.isArray(data.sameDirectorMovies) ? data.sameDirectorMovies : [];

  let sameGroupReviews = [];
  let viewerAgeGroup = null;

  if (viewerInfo && viewerInfo.birthYear && viewerInfo.gender) {
    viewerAgeGroup = getAgeGroup(viewerInfo.birthYear);
    if (viewerAgeGroup !== null) {
      const currentYear = new Date().getFullYear();

      sameGroupReviews = reviews.filter((r) => {
        if (!r.birth_year || !r.gender) return false;

        const reviewerGroup = getAgeGroup(r.birth_year);
        return reviewerGroup === viewerAgeGroup && r.gender === viewerInfo.gender;
      });
    }
  }

  if (!movie.movie_id) {
    return (
      <div>
        <button onClick={backToRecommend}>← 목록으로 돌아가기</button>
        <p>영화 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={backToRecommend}>← 목록으로 돌아가기</button>

      <h2>{movie.title}</h2>

      <div>개봉일: {movie.release_date}</div>
      <div>국가: {movie.country}</div>
      <div>러닝타임: {movie.run_time}분</div>
      <div>관람등급: {movie.allowed_age}</div>
      <div>장르: {movie.genres}</div>
      <div>
        평균 평점:{' '}
        {movie.avg_rating !== null && movie.avg_rating !== undefined ? Number(movie.avg_rating).toFixed(1) : 'N/A'}
      </div>
      <div>제공하는 OTT: {ottList.length > 0 ? ottList.join(', ') : '정보 없음'}</div>

      <div>
        {' '}
        {movie.trailer_url ? (
          <a href={movie.trailer_url} target="_blank" rel="noreferrer">
            예고편 보러가기
          </a>
        ) : (
          '없음'
        )}
      </div>

      <h3>감독 정보</h3>
      <div>
        {directors.map((d) => {
          const genderText = d.gender === 'M' ? '남자' : d.gender === 'F' ? '여자' : d.gender;
          return (
            <div key={d.director_id} style={{ marginBottom: '12px' }}>
              <div>이름: {d.name}</div>
              <div>성별: {genderText}</div>
              <div>국적: {d.nationality}</div>
              <div>출생연도: {d.birth_year}</div>
            </div>
          );
        })}
      </div>

      {sameDirectorMovies.length > 0 && (
        <>
          <h3>같은 감독의 다른 작품</h3>
          {sameDirectorMovies.map((m) => (
            <div key={m.movie_id} onClick={() => navigate(`/movie/${m.movie_id}`)}>
              {m.title}
            </div>
          ))}
        </>
      )}

      <h3>리뷰</h3>
      {reviews.length === 0 ? (
        <p>등록된 리뷰가 없습니다.</p>
      ) : (
        <div>
          {reviews.map((r) => (
            <div key={r.review_id}>
              <div>평점: {r.rating}</div>
              <div>작성자: User {r.user_id}</div>
              <div>한줄평: {r.comment}</div>
              <div>작성일시: {r.created_at}</div>
            </div>
          ))}
        </div>
      )}

      {/* === 같은 나이대 + 같은 성별 리뷰 섹션 === */}
      {viewerInfo && viewerAgeGroup !== null && sameGroupReviews.length > 0 && (
        <>
          <h3>
            나와 같은 {viewerAgeGroup}대 · {viewerInfo.gender === 'M' ? '남성' : '여성'} 리뷰
          </h3>

          <div>
            {sameGroupReviews.map((r) => (
              <div key={r.review_id} style={{ marginBottom: '12px' }}>
                <div>평점: {r.rating}</div>
                <div>
                  작성자: User {r.user_id} ({r.birth_year}년생, {r.gender === 'M' ? '남' : '여'})
                </div>
                <div>한줄평: {r.comment}</div>
                <div>작성일시: {r.created_at}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MovieDetail;
