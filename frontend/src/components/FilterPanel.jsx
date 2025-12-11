import React from 'react';

const OTT_OPTIONS = ['넷플릭스', '티빙', '디즈니플러스', '왓챠', '웨이브', '쿠팡플레이'];
const GENRE_OPTIONS = ['드라마', '코미디', '액션', '로맨스', '스릴러', '범죄', '판타지', '뮤지컬', '공포'];
const YEAR_OPTIONS = ['1990s', '2000s', '2010s', '2020s'];
const COUNTRY_OPTIONS = ['한국', '외국'];
const AGE_OPTIONS = ['ALL', '12+', '15+', '19+'];
const RATING_OPTIONS = ['1', '2', '3', '4', '5'];

function FilterPanel({ filters, setFilters }) {
  // 개별 체크박스 토글
  const handleCheckbox = (category, value) => {
    setFilters((prev) => {
      const prevArray = prev[category];

      // 이미 선택 → 제거
      if (prevArray.includes(value)) {
        return { ...prev, [category]: prevArray.filter((v) => v !== value) };
      }

      // 새로 선택 → 추가
      return { ...prev, [category]: [...prevArray, value] };
    });
  };

  // '전체' 체크박스 토글
  const handleSelectAll = (category, allValues) => {
    setFilters((prev) => {
      const allSelected = allValues.every((v) => prev[category].includes(v));

      // 이미 전체 선택 상태라면 전부 해제
      if (allSelected) {
        return { ...prev, [category]: [] };
      }

      // 전체 선택 상태가 아니라면 전체 값 채우기
      return { ...prev, [category]: [...allValues] };
    });
  };

  // '전체' 체크박스의 체크 여부 계산
  const isAllSelected = (category, allValues) => {
    return allValues.length > 0 && allValues.every((v) => filters[category].includes(v));
  };

  return (
    <div>
      {/* OTT 선택 */}
      <section>
        <h3>OTT 플랫폼</h3>
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('ott', OTT_OPTIONS)}
            onChange={() => handleSelectAll('ott', OTT_OPTIONS)}
          />
          전체
        </label>
        {OTT_OPTIONS.map((ott) => (
          <label key={ott}>
            <input type="checkbox" checked={filters.ott.includes(ott)} onChange={() => handleCheckbox('ott', ott)} />
            {ott}
          </label>
        ))}
      </section>

      {/* 장르 선택 */}
      <section>
        <h3>장르</h3>
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('genre', GENRE_OPTIONS)}
            onChange={() => handleSelectAll('genre', GENRE_OPTIONS)}
          />
          전체
        </label>
        {GENRE_OPTIONS.map((genre) => (
          <label key={genre}>
            <input
              type="checkbox"
              checked={filters.genre.includes(genre)}
              onChange={() => handleCheckbox('genre', genre)}
            />
            {genre}
          </label>
        ))}
      </section>

      {/* 연도 선택 */}
      <section>
        <h3>개봉 연도</h3>
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('year', YEAR_OPTIONS)}
            onChange={() => handleSelectAll('year', YEAR_OPTIONS)}
          />
          전체
        </label>
        {YEAR_OPTIONS.map((year) => (
          <label key={year}>
            <input
              type="checkbox"
              checked={filters.year.includes(year)}
              onChange={() => handleCheckbox('year', year)}
            />
            {year}
          </label>
        ))}
      </section>

      {/* 국가 선택 */}
      <section>
        <h3>국가</h3>
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('country', COUNTRY_OPTIONS)}
            onChange={() => handleSelectAll('country', COUNTRY_OPTIONS)}
          />
          전체
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.country.includes('한국')}
            onChange={() => handleCheckbox('country', '한국')}
          />
          한국 영화
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.country.includes('외국')}
            onChange={() => handleCheckbox('country', '외국')}
          />
          외국 영화
        </label>
      </section>

      {/* 관람 등급 선택 */}
      <section>
        <h3>관람 등급</h3>
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('age', AGE_OPTIONS)}
            onChange={() => handleSelectAll('age', AGE_OPTIONS)}
          />
          전체
        </label>
        {AGE_OPTIONS.map((age) => (
          <label key={age}>
            <input type="checkbox" checked={filters.age.includes(age)} onChange={() => handleCheckbox('age', age)} />
            {age}
          </label>
        ))}
      </section>

      {/* 평점 선택 */}
      <section>
        <h3>평점 구간</h3>
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('rating', RATING_OPTIONS)}
            onChange={() => handleSelectAll('rating', RATING_OPTIONS)}
          />
          전체
        </label>
        {RATING_OPTIONS.map((score) => (
          <label key={score}>
            <input
              type="checkbox"
              checked={filters.rating.includes(score)}
              onChange={() => handleCheckbox('rating', score)}
            />
            {score} 이상
          </label>
        ))}
      </section>
    </div>
  );
}

export default FilterPanel;
