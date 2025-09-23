import React, { useState, useEffect, useCallback } from "react";
import ImageCropper from "./ImageCropper";

const ImageUploader = ({ onImageUpload }) => {
  const [imageSrc, setImageSrc] = useState(null);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImageSrc(reader.result.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // 클립보드 붙여넣기 핸들러
  const handlePaste = useCallback((event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => setImageSrc(e.target.result.toString());
        reader.readAsDataURL(file);
        break; // 첫 번째 이미지만 처리
      }
    }
  }, []);

  // 컴포넌트 마운트 시 paste 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  // 자르기 완료 후 처리
  const handleCropComplete = (croppedImage, title) => {
    onImageUpload(croppedImage, title);
    setImageSrc(null); // 모달 닫기
  };

  return (
    <div className="uploader-container">
      <h2>이미지 업로드</h2>
      <div
        className="upload-area"
        onClick={() => document.getElementById("file-input").click()}
      >
        <p>클릭하여 파일을 선택하거나, 이미지를 붙여넣기(Ctrl+V) 하세요.</p>
        <input
          type="file"
          id="file-input"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      {imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setImageSrc(null)}
        />
      )}
    </div>
  );
};

export default ImageUploader;
