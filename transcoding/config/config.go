package config

import (
	"log/slog"
	"os"
	"sync"
)

var (
    once sync.Once
    minioConfig  MinioConfig
    kafkaConfig  KafkaConfig
)

type MinioConfig struct {
    URL             string
    AccessKeyID     string
    SecretAccessKey string
    BucketName      string
}

type KafkaConfig struct {
    URL      string
    GroupId  string
}

func getEnv(key, fallback string) string {
    if value, ok := os.LookupEnv(key); ok {
        return value
    }
    return fallback
}

func GetMinioConfig() MinioConfig {
	once.Do(func() {
        slog.Info("Loading Minio configuration from environment variables")
		minioConfig = MinioConfig{
			URL:             getEnv("MINIO_URL", "localhost:9000"),
			AccessKeyID:     getEnv("MINIO_ROOT_USER", "minioadmin"),
			SecretAccessKey: getEnv("MINIO_ROOT_PASSWORD", "minioadmin"),
			BucketName:      getEnv("MINIO_BUCKET", "image-bucket"),
		}
	})

	return minioConfig
}

func GetKafkaConfig() KafkaConfig {
    once.Do(func() {
        slog.Info("Loading Kafka configuration from environment variables")
        kafkaConfig = KafkaConfig{
            URL:     getEnv("KAFKA_URL", "localhost:9095"),
            GroupId: getEnv("KAFKA_GROUP_ID", "transcoder-group"),
        }
    })

    return kafkaConfig
}
