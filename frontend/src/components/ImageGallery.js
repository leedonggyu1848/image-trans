import React, { useState, useEffect, useMemo } from "react";
import ImageCard from "./ImageCard";

const ITEMS_PER_PAGE = 9; // 한 번에 보여줄 이미지 수

const ImageGallery = ({ images }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // 검색어에 따라 이미지 필터링
  const filteredImages = useMemo(
    () =>
      images.filter((image) =>
        image.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [images, searchTerm]
  );

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    // 스크롤이 페이지 맨 아래에 가까워졌는지 확인
    if (
      window.innerHeight + document.documentElement.scrollTop + 100 >=
      document.documentElement.offsetHeight
    ) {
      // 보여줄 아이템 수 증가
      setVisibleCount((prevCount) => prevCount + ITEMS_PER_PAGE);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 검색어가 변경되면 스크롤 및 아이템 수 초기화
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm]);

  return (
    <div className="gallery-container">
      <h2>갤러리</h2>
      <input
        type="text"
        className="search-bar"
        placeholder="제목으로 이미지 검색..."
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredImages.length > 0 ? (
        <div className="image-grid">
          {filteredImages.slice(0, visibleCount).map((image) => (
            <ImageCard key={image.id} image={image} />
          ))}
        </div>
      ) : (
        <p>표시할 이미지가 없습니다. 이미지를 업로드해보세요!</p>
      )}
    </div>
  );
};

export default ImageGallery;
