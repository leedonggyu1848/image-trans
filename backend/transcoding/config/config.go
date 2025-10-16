package config

import (
	"log/slog"
	"os"
	"strconv"
	"sync"
)

var (
    once sync.Once
    minioConfig  *MinioConfig
    kafkaConfig  *KafkaConfig
    config       *Config
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

type Config struct {
    WorkerCount int
    JobCount int
    TranscodeTopicName string
    CreatedTopicName string
}

func getEnv(key, fallback string) string {
    if value, ok := os.LookupEnv(key); ok {
        return value
    }
    return fallback
}

func GetMinioConfig() MinioConfig {
    slog.Info("called GetMinioConfig")
    if minioConfig == nil {
        slog.Info("Loading Minio configuration from environment variables")
		minioConfig = &MinioConfig{
			URL:             getEnv("MINIO_URL", "localhost:9000"),
			AccessKeyID:     getEnv("MINIO_ROOT_USER", "minioadmin"),
			SecretAccessKey: getEnv("MINIO_ROOT_PASSWORD", "minioadmin"),
			BucketName:      getEnv("MINIO_BUCKET", "image-bucket"),
		}
    }

	return *minioConfig
}

func GetKafkaConfig() KafkaConfig {
    slog.Info("called GetKafkaConfig")
    if kafkaConfig == nil {
        slog.Info("Loading Kafka configuration from environment variables")
        kafkaConfig = &KafkaConfig{
            URL:     getEnv("KAFKA_URL", "localhost:9093"),
            GroupId: getEnv("KAFKA_GROUP_ID", "transcoder-group"),
        }
        slog.Info("kafka url:", "url", kafkaConfig.URL)
    }

    return *kafkaConfig
}

func GetConfig() Config {
    slog.Info("called Config")
    if config == nil {
        slog.Info("Loading application configuration from environment variables")
        nWorker, err := strconv.Atoi(getEnv("WORKER_COUNT", "5"))
        if err != nil {
            slog.Warn("Invalid WORKER_COUNT value, defaulting to 5", "error", err)
            nWorker = 5
        }
        nJob, err := strconv.Atoi(getEnv("JOB_QUEUE_SIZE", "100"))
        if err != nil {
            slog.Warn("Invalid JOB_QUEUE_SIZE value, defaulting to 100", "error", err)
            nJob = 100
        }
        config = &Config{
            WorkerCount: nWorker,
            JobCount: nJob,
            TranscodeTopicName: getEnv("TRANSCODE_TOPIC", "transcode"),
            CreatedTopicName: getEnv("CREATED_TOPIC", "create-img"),
        }
    }
    return *config
}
