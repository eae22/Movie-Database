import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import FilterPanel from './components/FilterPanel';
import MovieList from './components/MovieList';

function App() {
  // 샘플 영화 데이터 (백엔드 연동 전)
  const movies = [
    {
      title: '기생충',
      ott: ['넷플릭스'],
      genre: ['스릴러'],
      year: 2019,
      country: 'KOR',
      rating: 5,
      allowed_age: '15+',
    },
    { title: '인터스텔라', ott: ['티빙'], genre: ['SF'], year: 2014, country: 'USA', rating: 4, allowed_age: '12+' },
    {
      title: '극한직업',
      ott: ['넷플릭스'],
      genre: ['코미디'],
      year: 2019,
      country: 'KOR',
      rating: 4,
      allowed_age: '15+',
    },
    {
      title: '겨울왕국',
      ott: ['디즈니플러스'],
      genre: ['뮤지컬'],
      year: 2013,
      country: 'USA',
      rating: 5,
      allowed_age: 'ALL',
    },
  ];

  // 필터 상태
  const [filters, setFilters] = useState({
    ott: [],
    genre: [],
    year: [],
    country: [],
    age: [],
    rating: [],
  });

  // 필터 적용 함수
  const applyFilters = () => {
    let filtered = movies;

    // OTT
    if (filters.ott.length > 0) {
      filtered = filtered.filter((m) => filters.ott.some((o) => m.ott.includes(o)));
    }

    // 장르
    if (filters.genre.length > 0) {
      filtered = filtered.filter((m) => filters.genre.some((g) => m.genre.includes(g)));
    }

    // 연도
    if (filters.year.length > 0) {
      filtered = filtered.filter((m) =>
        filters.year.some((y) => {
          if (y === '1990s') return m.year >= 1990 && m.year < 2000;
          if (y === '2000s') return m.year >= 2000 && m.year < 2010;
          if (y === '2010s') return m.year >= 2010 && m.year < 2020;
          if (y === '2020s') return m.year >= 2020;
          return false;
        })
      );
    }

    // 국가
    if (filters.country.length > 0) {
      filtered = filtered.filter((m) => filters.country.includes(m.country === 'KOR' ? '한국' : '외국'));
    }

    // 관람 등급
    if (filters.age.length > 0) {
      filtered = filtered.filter((m) => filters.age.includes(m.allowed_age));
    }

    // 평점
    if (filters.rating.length > 0) {
      filtered = filtered.filter((m) => filters.rating.some((r) => m.rating >= parseInt(r)));
    }

    return filtered;
  };

  return (
    <div>
      <h1>OTT 영화 탐색 시스템</h1>
      <FilterPanel filters={filters} setFilters={setFilters} />
      <button onClick={applyFilters}>검색</button>
      <MovieList movies={applyFilters()} />
    </div>
  );
}

export default App;
