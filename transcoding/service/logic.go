package service

import (
	"bytes"
	"context"
	"image"
	"image/jpeg"
	"log/slog"
	"sync"
	"transcoding/event"
	"transcoding/store"

	"github.com/nfnt/resize"
)

func encodingImage(ctx context.Context, objectStorage store.ObjectStorage, eventWriter *store.KafkaEventWriter[event.CreateImageEvent], evt event.TranscodeEvent) {
	// 1. MinIO에서 원본 이미지 다운로드
	slog.Info("Downloading original image", "access key", evt.AccessKey)
	obj, err := objectStorage.Get(ctx, evt.AccessKey)
	if err != nil {
		slog.Info("failed to download from minio: %v", err)
		return
	}
	defer obj.Close()

	img, format, err := image.Decode(obj.Reader)
	if err != nil {
		slog.Info("failed to decode image: %v", err)
		return
	}
	slog.Info("Image decoded successfully.", "format", format)

	// 2. 이미지 리사이징 및 업로드
	targetResolutions := map[string]uint{"1080p": 1920, "720p": 1280, "480p": 854}
	transcodedKeys := make(map[string]string)

	for resolution, width := range targetResolutions {
		resizedImg := resize.Resize(width, 0, img, resize.Lanczos3)
		var buffer bytes.Buffer
		if err := jpeg.Encode(&buffer, resizedImg, &jpeg.Options{Quality: 90}); err != nil {
			slog.Info("failed to encode resized image", "resolution", resolution, "error", err)
			continue
		}

		newFileObj := store.FileObject {
			Reader:      &buffer,
			Size:        int64(buffer.Len()),
			ContentType: "image/jpeg",
		}
		defer newFileObj.Close()
		newKey, err := objectStorage.Upload(ctx, evt.ImgID, resolution, newFileObj)
		if err != nil {
			slog.Info("failed to upload resized image", "resolution", resolution, "error", err)
			continue
		}

		slog.Info("Successfully uploaded", "resolution",  resolution, "size", newFileObj.Size, "newkey", newKey)
		transcodedKeys[resolution] = newKey
	}

	for resolution, accessKey := range transcodedKeys {
		createImageEvent := event.CreateImageEvent{
			ImgId:            evt.ImgID,
			AccessKey:        accessKey,
			Resolution:       resolution,
		}
		err = eventWriter.WriteEvent(ctx, createImageEvent)
		if err != nil {
			if ctx.Err() == nil {
				slog.Info("failed to write message to kafka", "error", err)
			}
		}
	}
	slog.Info("Image transcoding completed", "image id", evt.ImgID)
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
		slog.Info("Worker %d processing message", "id",  config.Id, "image id", event.ImgID)
		encodingImage(ctx, config.ObjectStorage, config.EventWriter, event)
	}

	slog.Info("Worker stopped", "id", config.Id)
}