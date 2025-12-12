import React, { useState } from 'react';
import MovieList from './MovieList';

function RecommendFilter() {
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');

  const [moviesTop, setMoviesTop] = useState([]);
  const [moviesHot, setMoviesHot] = useState([]);
  const [moviesRecent, setMoviesRecent] = useState([]);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 4자리 숫자인지 검사
    if (!/^\d{4}$/.test(birthYear)) {
      alert('출생 연도 4자리를 정확히 입력해 주세요. 예) 2003');
      return;
    }
    const yearNum = Number(birthYear);

    // 범위 검사 (1900 ~ 2025)
    if (yearNum < 1900 || yearNum > 2025) {
      alert('출생 연도 범위가 올바르지 않습니다.');
      return;
    }
    if (!gender) {
      alert('성별을 선택해 주세요.');
      return;
    }

    try {
      setLoading(true);

      const buildUrl = (sort) => {
        const params = new URLSearchParams({
          birthYear,
          gender,
          sort, // top / hot / recent
        });
        return `http://localhost:3001/api/recommend?${params.toString()}`;
      };

      const [topRes, hotRes, recentRes] = await Promise.all([
        fetch(buildUrl('top')).then((r) => r.json()),
        fetch(buildUrl('hot')).then((r) => r.json()),
        fetch(buildUrl('recent')).then((r) => r.json()),
      ]);

      console.log('Top5 응답:', topRes);
      console.log('인기 급상승 응답:', hotRes);
      console.log('최근 개봉 응답:', recentRes);

      setMoviesTop(topRes.movies || []);
      setMoviesHot(hotRes.movies || []);
      setMoviesRecent(recentRes.movies || []);

      setHasSearched(true);
    } catch (err) {
      console.error(err);
      alert('추천 API 호출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* 출생연도 */}
        <section>
          <h3>출생 연도</h3>
          <input
            type="text"
            placeholder="예) 2002"
            maxLength={4}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          />
        </section>

        {/* 성별 */}
        <section>
          <h3>성별</h3>
          <label>
            <input
              type="radio"
              name="gender"
              value="M"
              checked={gender === 'M'}
              onChange={(e) => setGender(e.target.value)}
            />
            남
          </label>

          <label>
            <input
              type="radio"
              name="gender"
              value="F"
              checked={gender === 'F'}
              onChange={(e) => setGender(e.target.value)}
            />
            여
          </label>
        </section>

        <button type="submit" disabled={loading}>
          {loading ? '추천 검색 중…' : '추천 검색'}
        </button>
      </form>

      {/* 추천 검색을 한 이후에만 결과 섹션 보여주기 */}
      {hasSearched && (
        <div style={{ marginTop: '24px' }}>
          <h2>Top5 (평점 상위)</h2>
          {moviesTop.length > 0 ? (
            <MovieList movies={moviesTop} enableSort={false} showSort={false} />
          ) : (
            <p style={{ color: '#666' }}>Top5 추천 결과가 없습니다.</p>
          )}

          <h2 style={{ marginTop: '32px' }}>인기 급상승</h2>
          {moviesHot.length > 0 ? (
            <MovieList movies={moviesHot} enableSort={false} showSort={false} />
          ) : (
            <p style={{ color: '#666' }}>인기 급상승 추천 결과가 없습니다.</p>
          )}

          <h2 style={{ marginTop: '32px' }}>최근 개봉 영화</h2>
          {moviesRecent.length > 0 ? (
            <MovieList movies={moviesRecent} enableSort={false} showSort={false} />
          ) : (
            <p style={{ color: '#666' }}>최근 개봉 추천 결과가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default RecommendFilter;
