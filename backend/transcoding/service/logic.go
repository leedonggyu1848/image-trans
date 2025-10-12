package service

import (
	"bytes"
	"context"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/jpeg"
	_ "image/png"
	"log/slog"
	"sync"
	"transcoding/event"
	"transcoding/store"

	"github.com/nfnt/resize"
)

type target struct {
	Width   uint
	Quality int
}

func encodingImage(ctx context.Context, objectStorage store.ObjectStorage, eventWriter *store.KafkaEventWriter[event.CreateImageEvent], evt event.TranscodeEvent) error {
	// 1. MinIO에서 원본 이미지 다운로드
	slog.Info("Downloading original image", "access key", evt.AccessKey)
	obj, err := objectStorage.Get(ctx, evt.AccessKey)
	if err != nil {
		slog.Info("failed to download from minio", "error", err)
		return err
	}
	defer obj.Close()

	// 2. 원본 이미지 디코딩
	img, originalFormat, err := image.Decode(obj.Reader)
	if err != nil {
		slog.Info("failed to decode image", "error", err)
		return err
	}
	slog.Info("Image decoded successfully.", "format", originalFormat)

	// 3. 목표 해상도 및 품질 설정
	targets := map[string]target{
		"1080p": {Width: 1920, Quality: 90},
		"720p":  {Width: 1280, Quality: 80},
		"480p":  {Width: 854,  Quality: 70},
	}

	transcodedKeys := make(map[string]string)

	// 4. 각 목표에 맞춰 리사이징, WebP 인코딩, 업로드 수행
	for name, t := range targets {

		// 이미지 리사이징
		resizedImg := resize.Resize(t.Width, 0, img, resize.Lanczos3)

		var buffer bytes.Buffer
		// WebP로 인코딩 (지정된 품질 사용)
		if err := jpeg.Encode(&buffer, resizedImg, &jpeg.Options{Quality: t.Quality}); err != nil {
			slog.Info("failed to encode resized image to jpeg", "target", name, "error", err)
			continue
		}

		// 업로드할 파일 객체 생성
		newFileObj := store.FileObject{
			Reader:      &buffer,
			Size:        int64(buffer.Len()),
			ContentType: "image/jpeg",
		}

		// 스토리지에 업로드
		newKey, err := objectStorage.Upload(ctx, evt.ImgID, name, newFileObj)
		if err != nil {
			slog.Info("failed to upload resized jpeg image", "target", name, "error", err)
			continue
		}

		slog.Info("Successfully uploaded jpeg", "target", name, "quality", t.Quality, "size", newFileObj.Size, "newkey", newKey)
		transcodedKeys[name] = newKey
	}

	// 5. 생성된 이미지 정보를 Kafka 이벤트로 전송
	for resolution, accessKey := range transcodedKeys {
		createImageEvent := event.CreateImageEvent{
			ImgId:      evt.ImgID,
			AccessKey:  accessKey,
			Resolution: resolution,
		}
		if err = eventWriter.WriteEvent(ctx, createImageEvent); err != nil {
			if ctx.Err() == nil {
				slog.Info("failed to write message to kafka", "error", err)
			}
		}
	}

	slog.Info("Image transcoding to WebP completed", "image id", evt.ImgID)
	return nil
}

type Worker struct {
	Wg *sync.WaitGroup
	Id int
	ObjectStorage store.ObjectStorage
	EventWriter *store.KafkaEventWriter[event.CreateImageEvent]
	Jobs <- chan event.TranscodeEvent
}

func ProccessMessages(ctx context.Context, config Worker) {
	defer config.Wg.Done()
	slog.Info("Worker started", "id",  config.Id)

	// jobs 채널이 닫힐 때까지 계속해서 작업을 가져와 처리
	for event := range config.Jobs {
		slog.Info("Worker processing message", "id",  config.Id, "image id", event.ImgID)
		if encodingImage(ctx, config.ObjectStorage, config.EventWriter, event) != nil {
			if ctx.Err() == nil {
				slog.Error("Worker failed to process message", "id",  config.Id, "image id", event.ImgID)
			} else {
				slog.Info("Worker context done, stopping processing", "id",  config.Id)
			}

		}
	}

	slog.Info("Worker stopped", "id", config.Id)
}