import React from 'react';

function FilterPanel({ filters, setFilters }) {
  // 공통 체크박스 처리 함수
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
  return (
    <div>
      {/* OTT 선택 */}
      <section>
        <h3>OTT 플랫폼</h3>
        {['넷플릭스', '티빙', '디즈니플러스', '왓챠', '웨이브', '쿠팡플레이'].map((ott) => (
          <label key={ott}>
            <input type="checkbox" onChange={() => handleCheckbox('ott', ott)} />
            {ott}
          </label>
        ))}
      </section>

      {/* 장르 선택 */}
      <section>
        <h3>장르</h3>
        {['드라마', '코미디', '액션', '로맨스', '스릴러', '범죄', '판타지', '뮤지컬', '공포'].map((genre) => (
          <label key={genre}>
            <input type="checkbox" onChange={() => handleCheckbox('genre', genre)} />
            {genre}
          </label>
        ))}
      </section>

      {/* 연도 선택 */}
      <section>
        <h3>개봉 연도</h3>
        {['1990s', '2000s', '2010s', '2020s'].map((year) => (
          <label key={year}>
            <input type="checkbox" onChange={() => handleCheckbox('year', year)} />
            {year}
          </label>
        ))}
      </section>

      {/* 국가 선택 */}
      <section>
        <h3>국가</h3>
        <label>
          <input type="checkbox" onChange={() => handleCheckbox('country', '한국')} />
          한국 영화
        </label>
        <label>
          <input type="checkbox" onChange={() => handleCheckbox('country', '외국')} />
          외국 영화
        </label>
      </section>

      {/* 관람 등급 선택 */}
      <section>
        <h3>관람 등급</h3>
        {['ALL', '12+', '15+', '19+'].map((age) => (
          <label key={age}>
            <input type="checkbox" onChange={() => handleCheckbox('age', age)} />
            {age}
          </label>
        ))}
      </section>

      {/* 평점 선택 */}
      <section>
        <h3>평점 구간</h3>
        {['1 이상', '2 이상', '3 이상', '4 이상', '5'].map((score) => (
          <label key={score}>
            <input type="checkbox" onChange={() => handleCheckbox('rating', score)} />
            {score}
          </label>
        ))}
      </section>
    </div>
  );
}

export default FilterPanel;
