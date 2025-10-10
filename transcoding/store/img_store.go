package store

import (
	"context"
	"io"
	"log/slog"
	"transcoding/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type FileObject struct {
	Reader      io.Reader
	Size        int64
	ContentType string
}

func (f FileObject) Close() {
	f.Reader.(io.Closer).Close()
}


type ObjectStorage interface {
	Upload(ctx context.Context, imgId string, resolution string, file FileObject) (string, error)
	Get(ctx context.Context, accessKey string) (FileObject, error)
}

type MinioFileStorage struct {
	config config.MinioConfig
	client *minio.Client
}

func generateAccessKey(imageId string, resolution string) string {
	return imageId + "/" + resolution
}

func NewMinioFileStorage() (*MinioFileStorage, error) {
	cfg := config.GetMinioConfig()

	minioClient, err := minio.New(cfg.URL, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, err
	}

	return &MinioFileStorage{
		config: cfg,
		client: minioClient,
	}, nil
}

func (s *MinioFileStorage) Upload(ctx context.Context, imgId string, resolution string, file FileObject) (string, error) {
	accessKey := generateAccessKey(imgId, resolution)
	bucketName := s.config.BucketName
	slog.Info("Uploading file to MinIO", "imageId", imgId, "resolution", resolution, "accessKey", accessKey)

	_, err := s.client.PutObject(ctx, bucketName, accessKey, file.Reader, file.Size, minio.PutObjectOptions{
		ContentType: file.ContentType,
	})
	if err != nil {
		return "", err
	}

	return accessKey, nil
}

func (s *MinioFileStorage) Get(ctx context.Context, accessKey string) (FileObject, error) {
	slog.Info("Fetching file from MinIO", "accessKey", accessKey)
	bucketName := s.config.BucketName

	objInfo, err := s.client.StatObject(ctx, bucketName, accessKey, minio.GetObjectOptions{})
	if err != nil {
		return FileObject{}, err
	}

	objectReader, err := s.client.GetObject(ctx, bucketName, accessKey, minio.GetObjectOptions{})
	if err != nil {
		return FileObject{}, err
	}

	fileObj := FileObject{
		Reader:      objectReader,
		Size:        objInfo.Size,
		ContentType: objInfo.ContentType,
	}

	return fileObj, nil
}
