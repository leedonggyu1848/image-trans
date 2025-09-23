import React, { useState, useRef, useEffect } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// 자르기 영역의 초기값을 설정하는 함수
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  // --- 바로 이 부분만 수정하면 됩니다! ---
  // aspect가 undefined (자유 비율)인 경우, 크롭 영역을 100%로 설정
  if (!aspect) {
    return {
      unit: "%",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
  }

  // 그 외의 경우, 기존처럼 중앙에 90% 크기의 영역을 설정
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropper = ({ imageSrc, onCropComplete, onClose }) => {
  const [title, setTitle] = useState("");
  const [crop, setCrop] = useState();
  const imgRef = useRef(null);

  const [aspect, setAspect] = useState(16 / 9);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }, [aspect]);

  const handleCrop = async () => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) {
      alert("이미지를 먼저 잘라주세요.");
      return;
    }
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    const base64Image = canvas.toDataURL("image/jpeg");
    onCropComplete(base64Image, title);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>이미지 자르기 및 제목 입력</h2>

        <div className="aspect-ratio-buttons">
          <button onClick={() => setAspect(16 / 9)}>16:9</button>
          <button onClick={() => setAspect(4 / 3)}>4:3</button>
          <button onClick={() => setAspect(1 / 1)}>1:1</button>
          <button onClick={() => setAspect(undefined)}>자유 비율</button>
        </div>

        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          aspect={aspect}
        >
          <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop me" />
        </ReactCrop>
        <input
          type="text"
          placeholder="이미지 제목을 입력하세요..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="modal-buttons">
          <button onClick={onClose}>취소</button>
          <button onClick={handleCrop}>업로드</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
