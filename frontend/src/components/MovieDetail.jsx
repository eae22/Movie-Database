import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './style.css';

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
    return decade;
  };

  const backToList = () => {
    const from = location.state?.from; // 'search' | 'recommend'
    const searchState = location.state?.searchState;

    if (from === 'search') {
      return navigate('/search', { state: { searchState } });
    }

    if (from === 'recommend') {
      return navigate('/recommend', { state: { searchState } });
    }

    navigate(-1);
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
        <button onClick={backToList}>← 이전으로 돌아가기</button>
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
        <button onClick={backToList}>← 이전으로 돌아가기</button>
        <p>영화 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-card">
        <div className="detail-back-layout">
          <button className="detail-back" onClick={backToList}>
            ← 이전으로 돌아가기
          </button>
        </div>

        <h2 className="detail-title">{movie.title}</h2>

        <div className="detail-content-layout">
          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">개봉일</span>
              <span className="meta-value">{movie.release_date}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">국가</span>
              <span className="meta-value">{movie.country}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">러닝타임</span>
              <span className="meta-value">{movie.run_time}분</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">관람등급</span>
              <span className="meta-value">{movie.allowed_age}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">장르</span>
              <span className="meta-value">{movie.genres}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">평균 평점</span>
              <span className="meta-value">
                {movie.avg_rating !== null && movie.avg_rating !== undefined
                  ? Number(movie.avg_rating).toFixed(1)
                  : 'N/A'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">제공 OTT</span>
              <span className="meta-value">{ottList.length > 0 ? ottList.join(', ') : '정보 없음'}</span>
            </div>

            <div className="meta-item meta-item--full">
              <span className="meta-label">예고편</span>
              <span className="meta-value">
                {movie.trailer_url ? (
                  <a className="detail-link" href={movie.trailer_url} target="_blank" rel="noreferrer">
                    예고편 보러가기
                  </a>
                ) : (
                  <span className="detail-dim">예고편 없음</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <h3 className="detail-section-title">감독 정보</h3>
        <div className="detail-section">
          {directors.map((d) => {
            const genderText = d.gender === 'M' ? '남자' : d.gender === 'F' ? '여자' : d.gender;
            return (
              <div key={d.director_id} className="detail-row">
                <div>
                  ⦁ 이름: <span>{d.name}</span>
                </div>
                <div>⦁ {genderText}</div>
                <div>⦁ {d.birth_year}년생</div>
                <div>⦁ 국적: {d.nationality}</div>
              </div>
            );
          })}
        </div>

        {sameDirectorMovies.length > 0 && (
          <>
            <h3 className="detail-section-title">같은 감독의 다른 작품</h3>
            <div className="detail-section">
              {sameDirectorMovies.map((m) => (
                <div key={m.movie_id} className="detail-pill" onClick={() => navigate(`/movie/${m.movie_id}`)}>
                  {m.title}
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="detail-section-title">리뷰</h3>
        {reviews.length === 0 ? (
          <p className="detail-dim">등록된 리뷰가 없습니다.</p>
        ) : (
          <div className="detail-section">
            {reviews.map((r) => (
              <div key={r.review_id} className="review-card">
                <div className="review-top">
                  <div className="review-createdat">{r.created_at}</div>
                  <div className="review-dim">작성자: 익명</div>
                </div>
                <div className="review-bottom">
                  <div className="review-score">평점: {r.rating}</div>
                  <div className="review-comment"> {r.comment}</div>
                </div>
                <p></p>
              </div>
            ))}
          </div>
        )}

        {/* === 같은 나이대 + 같은 성별 리뷰 섹션 === */}
        {viewerInfo && viewerAgeGroup !== null && sameGroupReviews.length > 0 && (
          <>
            <h3 className="detail-section-title">
              나와 같은 {viewerAgeGroup}대 · {viewerInfo.gender === 'M' ? '남성' : '여성'} 리뷰
            </h3>

            <div className="detail-section">
              {sameGroupReviews.map((r) => (
                <div key={r.review_id} className="review-card">
                  <div className="review-top">
                    <div className="review-createdat">{r.created_at}</div>
                    <div className="review-dim">
                      작성자: {r.birth_year}년생, {r.gender === 'M' ? '남' : '여'}
                    </div>
                  </div>
                  <div className="review-bottom">
                    <div className="review-score">평점: {r.rating}</div>
                    <div className="review-comment"> {r.comment}</div>
                  </div>
                  <p></p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;
