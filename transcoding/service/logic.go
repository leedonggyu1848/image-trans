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

func encodingImage(ctx context.Context, objectStorage store.ObjectStorage, eventWriter *store.KafkaEventWriter[event.CreateImageEvent], event transcoding.TranscodeEvent) {
	// 1. MinIO에서 원본 이미지 다운로드
	slog.Info("Downloading original image: %s", event.AccessKey)
	obj, err := objectStorage.Get(ctx, event.AccessKey)
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
	slog.Info("Image decoded successfully. Format: %s", format)

	// 2. 이미지 리사이징 및 업로드
	targetResolutions := map[string]uint{"1080p": 1920, "720p": 1280, "480p": 854}
	transcodedKeys := make(map[string]string)

	for resolution, width := range targetResolutions {
		resizedImg := resize.Resize(width, 0, img, resize.Lanczos3)
		var buffer bytes.Buffer
		if err := jpeg.Encode(&buffer, resizedImg, &jpeg.Options{Quality: 90}); err != nil {
			slog.Info("failed to encode resized image %s: %v", resolution, err)
			continue
		}

		newFileObj := store.FileObject {
			Reader:      &buffer,
			Size:        int64(buffer.Len()),
			ContentType: "image/jpeg",
		}
		defer newFileObj.Close()
		newKey, err := objectStorage.Upload(ctx, event.ImgID, resolution, newFileObj)
		if err != nil {
			slog.Info("failed to upload resized image %s to minio: %v", resolution, err)
			continue
		}

		slog.Info("Successfully uploaded %s (%d bytes) to %s", resolution, newFileObj.Size, newKey)
		transcodedKeys[resolution] = newKey
	}

	for resolution, accessKey := range transcodedKeys {
		createImageEvent := event.CreateImageEvent{
			ImgId:            event.ImgID,
			AccessKey:        accessKey,
			Resolution:       resolution,
		}
		err = eventWriter.WriteEvent(ctx, createImageEvent)
		if err != nil {
			if ctx.Err() == nil {
				slog.Info("failed to write message to kafka: %v", err)
			}
		} else {
			slog.Info("Successfully sent transcode completion message for %s", event.AccessKey)
		}
	}
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
	slog.Info("Worker %d started", config.Id)

	// jobs 채널이 닫힐 때까지 계속해서 작업을 가져와 처리
	for event := range config.Jobs {
		slog.Info("Worker %d processing message: %s", config.Id, event.ImgID)
		encodingImage(ctx, config.ObjectStorage, config.EventWriter, event)
	}

	slog.Info("Worker %d stopped", config.Id)
}