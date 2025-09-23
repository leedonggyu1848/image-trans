import React, { useState } from "react";

const ImageCard = ({ image }) => {
  const [copyText, setCopyText] = useState("링크 복사");

  const handleCopyLink = () => {
    // 실제 백엔드가 있다면 이곳에 고유 이미지 URL을 넣습니다.
    // 현재는 base64 데이터를 클립보드에 복사합니다. (매우 길 수 있음)
    navigator.clipboard.writeText(image.src);
    setCopyText("복사 완료!");
    setTimeout(() => setCopyText("링크 복사"), 2000);
  };

  return (
    <div className="image-card">
      <img src={image.src} alt={image.title} className="card-image" />
      <p className="card-title">{image.title}</p>
      <div className="card-overlay">
        <h3>{image.title}</h3>
        <div className="card-actions">
          {/* 실제 백엔드에서는 화질별로 다른 URL을 제공해야 합니다.
                      여기서는 같은 이미지 소스를 사용하고 파일명만 다르게 지정합니다.
                    */}
          <a href={image.src} download={`${image.title}-high.jpg`}>
            고화질
          </a>
          <a href={image.src} download={`${image.title}-medium.jpg`}>
            중화질
          </a>
          <a href={image.src} download={`${image.title}-low.jpg`}>
            저화질
          </a>
          <button onClick={handleCopyLink}>{copyText}</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
