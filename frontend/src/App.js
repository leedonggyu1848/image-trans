import React, { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageGallery from "./components/ImageGallery";
import "./App.css";

function App() {
  // 1. 이미지 데이터를 저장할 "보관함" 만들기
  const [images, setImages] = useState([]);

  // 2. 자식(ImageUploader)이 보낸 이미지 데이터를 "multipart/form-data"로 "백엔드"에 보내는 함수
  const handleImageUpload = async (croppedImage, title) => {
    try {
      // 1. Base64 데이터 URL을 Blob 객체로 변환합니다.
      // fetch는 웹 URL 뿐만 아니라 Base64 데이터 URL도 가져올 수 있습니다.
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      // 2. FormData 객체를 생성하고 데이터를 추가합니다.
      const formData = new FormData();
      // formData.append('key', value, filename);
      formData.append("image", blob, `${title}.jpg`); // 'image'라는 키로 파일(blob)을 추가
      formData.append("title", title); // 'title'이라는 키로 텍스트를 추가

      // 3. fetch를 사용해 FormData를 전송합니다.
      // 중요: Content-Type 헤더를 직접 설정하지 않습니다!
      // 브라우저가 FormData를 보낼 때 자동으로 'multipart/form-data'와
      // 필수적인 boundary 값을 포함하여 헤더를 설정해 줍니다.
      const serverResponse = await fetch("http://localhost/image", {
        method: "POST",
        body: formData,
      });

      // 서버 응답이 성공적이지 않으면 에러를 발생시킵니다.
      if (!serverResponse.ok) {
        throw new Error("서버 업로드에 실패했습니다.");
      }

      // 서버로부터 성공 응답으로 받은 이미지 정보를 JSON 형태로 파싱합니다.
      const savedImageFromServer = await serverResponse.json();

      // 서버로부터 받은 최종 데이터로 프론트엔드의 상태를 업데이트합니다.
      setImages((prevImages) => [savedImageFromServer, ...prevImages]);
    } catch (error) {
      // 에러가 발생하면 콘솔에 로그를 남기고 사용자에게 알립니다.
      console.error("이미지 업로드 중 오류 발생:", error);
      alert("이미지 업로드에 실패했습니다. 콘솔을 확인해주세요.");
    }
  };

  // 3. 화면에 보여줄 내용 (HTML과 비슷하게 생겼어요)
  return (
    <div className="App">
      <h1>🖼️ 내 이미지 저장소</h1>
      {/* 'onImageUpload'라는 이름표를 붙여서 2번 함수를 내려보냄 */}
      <ImageUploader onImageUpload={handleImageUpload} />

      {/* 'images'라는 이름표를 붙여서 1번 보관함 데이터를 내려보냄 */}
      <ImageGallery images={images} />
    </div>
  );
}

export default App;
