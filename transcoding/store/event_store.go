package store

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"transcoding/config"

	"github.com/segmentio/kafka-go"
)

type KafkaEventReader[T any] struct {
	config config.KafkaConfig
	reader *kafka.Reader
}

func testConnection(url string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, err := kafka.DialContext(ctx, "tcp", url)
	if err != nil {
		slog.Error("failed to connect to kafka", "error", err)
		return err
	}
	conn.Close()
	return nil
}

func NewKafkaEventReader[T any](cfg config.KafkaConfig, topicName string) (*KafkaEventReader[T], error) {
	if err := testConnection(cfg.URL); err != nil {
		return nil, err
	}

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{cfg.URL},
		GroupID:  cfg.GroupId,
		Topic:    topicName,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})
	return &KafkaEventReader[T]{
		config: cfg,
		reader: r,
	}, nil
}


func (k *KafkaEventReader[T]) Close() error {
	return k.reader.Close()
}

func (k *KafkaEventReader[T]) FetchEvent(ctx context.Context) (*T, *msg, error) {
	m, err := k.reader.FetchMessage(ctx)
	if err != nil {
		if ctx.Err() != nil {
			slog.Info("Context cancelled, exiting consumer loop.")
			return nil, nil, ctx.Err()
		}
		slog.Error("error reading message from Kafka", "error", err)
		return nil, nil, err
	}

	slog.Info("Message received", "topic", m.Topic, "partition", m.Partition, "offset", m.Offset)

	var event T
	if err := json.Unmarshal(m.Value, &event); err != nil {
		slog.Error("failed to unmarshal message", "error", err, "value", string(m.Value))
		return nil, nil, err
	}
	return &event, m, nil
}

func (k *KafkaEventReader[T]) CommitEvent(ctx context.Context, event kafka.Message) error {
	return k.reader.CommitMessages(ctx, event)
}

// kafka writer
type KafkaEventWriter[T any] struct {
	config config.KafkaConfig
	writer *kafka.Writer
}

func NewKafkaEventWriter[T any](cfg config.KafkaConfig, topicName string) (*KafkaEventWriter[T], error) {
	if err := testConnection(cfg.URL); err != nil {
		return nil, err
	}

	w := &kafka.Writer{
		Addr:     kafka.TCP(cfg.URL),
		Topic:    topicName,
		Balancer: &kafka.LeastBytes{},
	}

	return &KafkaEventWriter[T]{
		config: cfg,
		writer: w,
	}, nil
}

func (k *KafkaEventWriter[T]) WriteEvent(ctx context.Context, event T) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		slog.Error("failed to marshal event", "error", err)
		return err
	}
	err = k.writer.WriteMessages(ctx, kafka.Message{Value: eventBytes})
	if err != nil {
		slog.Info("failed to write message to kafka: %v", err)
		return err
	}
	slog.Info("Successfully sent transcode completion message for %s", event.ObjectKey)
	return nil
}

func (k *KafkaEventWriter[T]) Close() error {
	return k.writer.Close()
}