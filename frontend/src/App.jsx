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

  // 쿼리스트링 생성
  const buildQueryString = () => {
    const params = new URLSearchParams();

    if (filters.ott.length > 0) params.append('ott', filters.ott.join(','));
    if (filters.genre.length > 0) params.append('genre', filters.genre.join(','));
    if (filters.year.length > 0) params.append('year', filters.year.join(','));
    if (filters.country.length > 0) params.append('country', filters.country.join(','));
    if (filters.age.length > 0) params.append('age', filters.age.join(','));

    if (filters.rating.length > 0) {
      const min = Math.min(...filters.rating.map(Number));
      params.append('ratingMin', String(min));
    }

    const trimmed = searchText.trim();
    if (trimmed !== '') {
      if (searchMode === 'all' || searchMode === 'title') params.append('title', trimmed);

      if (searchMode === 'all' || searchMode === 'director') params.append('director', trimmed);
    }

    params.append('sort', 'rating_desc');

    return params.toString();
  };

  // 검색 버튼 + 백엔드 호출
  const applyFilters = async () => {
    const query = buildQueryString();
    console.log('쿼리:', query);

    const res = await fetch(`http://localhost:3001/movies?${query}`);
    console.log('/movies 응답 상태코드:', res.status);
    const data = await res.json();
    console.log('/movies 응답 데이터:', data);
    setMovies(data); // 상태 업데이트해서 MovieList에 반영
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

              <MovieList movies={movies} onMovieClick={handleMovieClick} />
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
