import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import FilterPanel from './components/FilterPanel';
import MovieList from './components/MovieList';
import MovieDetail from './components/MovieDetail';

function App() {
  const navigate = useNavigate();

  // 필터 상태
  const [filters, setFilters] = useState({
    ott: [],
    genre: [],
    year: [],
    country: [],
    age: [],
    rating: [],
  });

  // 검색 모드: all, title, director
  const [searchMode, setSearchMode] = useState('all');
  const [searchText, setSearchText] = useState('');

  const [movies, setMovies] = useState([]);

  // 정렬 상태를 App.jsx에서 관리 (default: 평점 높은 순)
  const [sortOption, setSortOption] = useState('rating_desc');

  // 쿼리스트링 생성
  const buildQueryString = () => {
    const params = new URLSearchParams();

    if (filters.ott.length > 0) params.append('ott', filters.ott.join(','));
    if (filters.genre.length > 0) params.append('genre', filters.genre.join(','));
    if (filters.year.length > 0) params.append('year', filters.year.join(','));
    // if (filters.country.length > 0) params.append('country', filters.country.join(','));
    if (filters.age.length > 0) params.append('age', filters.age.join(','));

    if (filters.rating.length > 0) {
      const min = Math.min(...filters.rating.map(Number));
      params.append('ratingMin', String(min));
    }

    const trimmed = searchText.trim();
    if (trimmed !== '') {
      if (searchMode === 'title') {
        params.append('title', trimmed);
      } else if (searchMode === 'director') {
        params.append('director', trimmed);
      }
    }

    params.append('sort', 'rating_desc');

    return params.toString();
  };

  // 검색 버튼 + 백엔드 호출
  const applyFilters = async () => {
    try {
      const query = buildQueryString();
      console.log('쿼리:', query);

      const res = await fetch(`http://localhost:3001/movies?${query}`);
      console.log('/movies 응답 상태코드:', res.status);

      const data = await res.json();
      console.log('/movies 응답 데이터:', data);

      // country 필드 샘플 확인
      console.log(
        'country 필드 샘플:',
        data.slice(0, 5).map((m) => ({
          title: m.title,
          country: m.country,
        }))
      );

      let filtered = [...data];

      // 국적 필터는 FE에서 처리
      if (filters.country.length > 0) {
        const wantKorean = filters.country.includes('한국');
        const wantForeign = filters.country.includes('외국');

        console.log('국가 필터 상태:', {
          filtersCountry: filters.country,
          wantKorean,
          wantForeign,
        });

        filtered = filtered.filter((m, idx) => {
          const rawCountry = m.country;
          const c = (m.country || '').trim(); // undefined 방지
          const isKorean = c.includes('대한민국'); // '대한민국'이 들어가면 한국이라고 판단

          // 각 영화별로 로그 찍어보기
          console.log(`[국가필터] idx=${idx}, title=${m.title}, country='${rawCountry}', isKorean=${isKorean}`);

          if (wantKorean && !wantForeign) return isKorean;
          if (!wantKorean && wantForeign) return !isKorean;
          if (wantKorean && wantForeign) return true;
          통과;

          return true;
        });
        console.log('국가 필터 적용 후 개수:', filtered.length);
      }

      // 전체 검색 모드(all)일 때 제목 or 감독으로 추가 필터링
      const trimmed = searchText.trim();
      if (searchMode === 'all' && trimmed !== '') {
        const keyword = trimmed.toLowerCase();
        console.log('전체 검색 키워드:', keyword);

        filtered = filtered.filter((m) => {
          const title = (m.title || '').toLowerCase();
          const directors = (m.directors || '').toLowerCase();

          return title.includes(keyword) || directors.includes(keyword);
        });
        console.log('전체 검색 적용 후 개수:', filtered.length);
      }

      setMovies(filtered);
    } catch (e) {
      console.error('applyFilters 실행 중 에러 발생:', e);
    }
  };

  // 영화 클릭 → 상세 페이지로 이동
  const handleMovieClick = (id) => {
    navigate(`/movie/${id}`);
  };

  return (
    <div>
      <h1>movie-db</h1>
      <Routes>
        {/* 메인 페이지 (필터 + 목록) */}
        <Route
          path="/"
          element={
            <div>
              <FilterPanel filters={filters} setFilters={setFilters} />

              <div>
                <select value={searchMode} onChange={(e) => setSearchMode(e.target.value)}>
                  <option value="all">전체</option>
                  <option value="title">제목 검색</option>
                  <option value="director">감독 이름 검색</option>
                </select>

                <input
                  type="text"
                  placeholder="검색어 입력"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                <button onClick={applyFilters}>검색</button>
              </div>

              {/* 정렬 상태/변경함수를 MovieList로 내려줌 */}
              <MovieList movies={movies} sortOption={sortOption} setSortOption={setSortOption} />
            </div>
          }
        />

        {/* 상세 페이지 */}
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
    </div>
  );
}

export default App;
