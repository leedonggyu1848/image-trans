package transcoding

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"transcoding/config"
	"transcoding/event"
	"transcoding/service"
	"transcoding/store"
)


func main() {

	cfg := config.GetConfig()
	eventReader, err := store.NewKafkaEventReader[event.TranscodeEvent](config.GetKafkaConfig(), cfg.TranscodeTopicName)
	if err != nil {
		slog.Error("Failed to initialize Kafka event storage", "error", err)
		return
	}
	defer eventReader.Close()
	eventWriter, err := store.NewKafkaEventWriter[event.CreateImageEvent](config.GetKafkaConfig(), cfg.CreatedTopicName)
	if err != nil {
		slog.Error("Failed to initialize Kafka event storage", "error", err)
		return
	}
	defer eventWriter.Close()
	objectStorage, err := store.NewMinioFileStorage()
	if err != nil {
		slog.Error("Failed to initialize MinIO client", "error", err)
		return
	}

	// if signals is received, gracefully shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigchan
		slog.Info("Shutdown signal received, closing Kafka reader...")
		cancel()
	}()

	var wg sync.WaitGroup
	jobs := make(chan event.TranscodeEvent, cfg.JobCount)
	for i := 0; i < cfg.WorkerCount; i++ {
		wg.Add(1)
		service.ProccessMessages(ctx, service.Worker{
			Wg:            &wg,
			Id:            i,
			ObjectStorage: objectStorage,
			EventWriter:   eventWriter,
			Jobs:          jobs,
		})
	}

	go func() {
		for {
			select {
			case <-ctx.Done(): // Shutdown 신호가 오면 루프 종료
				return
			default:
				event, msg, err := eventReader.FetchEvent(ctx)
				if err != nil {
					if ctx.Err() != nil {
						return
					}
					slog.Info("could not fetch message: ", "err", err)
					continue
				}
				jobs <- *event // 작업을 작업 큐에 보냄

				// 메시지를 처리했다고 Kafka에 알림 (offset commit)
				if err := eventReader.CommitEvent(ctx, msg); err != nil {
					slog.Info("failed to commit messages: ", "err", err)
				}
			}
		}
	}()

}