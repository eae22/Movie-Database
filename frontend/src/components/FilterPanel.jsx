import React from 'react';

const OTT_OPTIONS = ['넷플릭스', '티빙', '디즈니플러스', '왓챠', '웨이브', '쿠팡플레이'];
const GENRE_OPTIONS = ['드라마', '코미디', '액션', '로맨스', '스릴러', '범죄', '판타지', '뮤지컬', '공포'];
const YEAR_OPTIONS = ['1990s', '2000s', '2010s', '2020s'];
const COUNTRY_OPTIONS = ['한국', '외국'];
const AGE_OPTIONS = ['ALL', '12+', '15+', '19+'];
const RATING_OPTIONS = [
  { label: '1 ~ 2', min: 1, max: 2 },
  { label: '2 ~ 3', min: 2, max: 3 },
  { label: '3 ~ 4', min: 3, max: 4 },
  { label: '4 ~ 5', min: 4, max: 5 },
];

function FilterPanel({ filters, setFilters }) {
  // 개별 체크박스 토글
  const handleCheckbox = (category, value) => {
    setFilters((prev) => {
      const prevArray = prev[category];

      // 구간(min/max) 비교
      const exists = prevArray.some((v) => v.min === value.min && v.max === value.max);

      if (exists) {
        return {
          ...prev,
          [category]: prevArray.filter((v) => !(v.min === value.min && v.max === value.max)),
        };
      }

      return { ...prev, [category]: [...prevArray, value] };
    });
  };

  // '전체' 체크박스 토글
  const handleSelectAll = (category, allValues) => {
    setFilters((prev) => {
      const prevArray = prev[category];

      // 평점 구간(객체 배열) 처리
      if (category === 'rating') {
        const allSelected = allValues.every((v) => prevArray.some((r) => r.min === v.min && r.max === v.max));

        // 전체 선택 → 해제
        if (allSelected) {
          return { ...prev, rating: [] };
        }

        // 전체 선택 아니면 전체 추가
        return { ...prev, rating: [...allValues] };
      }

      // 그 외 문자열 리스트 공통 처리
      const allSelected = allValues.every((v) => prev[category].includes(v));

      if (allSelected) {
        return { ...prev, [category]: [] };
      }

      return { ...prev, [category]: [...allValues] };
    });
  };

  // '전체' 체크박스의 체크 여부 계산
  const isAllSelected = (category, allValues) => {
    // 평점 구간은 min/max 기준으로 비교
    if (category === 'rating') {
      return (
        allValues.length > 0 && allValues.every((v) => filters.rating.some((r) => r.min === v.min && r.max === v.max))
      );
    }

    // 나머지 문자열 기반 필터
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
        {/* 전체 선택 */}
        <label>
          <input
            type="checkbox"
            checked={isAllSelected('rating', RATING_OPTIONS)}
            onChange={() => handleSelectAll('rating', RATING_OPTIONS)}
          />
          전체
        </label>

        {RATING_OPTIONS.map((opt) => (
          <label key={opt.label}>
            <input
              type="checkbox"
              checked={filters.rating.some((r) => r.min === opt.min && r.max === opt.max)}
              onChange={() => handleCheckbox('rating', opt)}
            />
            {opt.label}
          </label>
        ))}
      </section>
    </div>
  );
}

export default FilterPanel;
