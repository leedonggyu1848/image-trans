package com.image.download.queue;

import com.image.download.store.Metadata;
import com.image.download.store.MetadataRepository;
import com.image.event.CreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsumerService {
	private final MetadataRepository metadataRepository;

	@Transactional
	@KafkaListener(topics = "${topic.created}", groupId = "${spring.kafka.consumer.group-id}")
	public void consume(CreatedEvent event) {
		log.info("Consumed message -> {}", event);
		if (metadataRepository.existsByImgIdAndResolution(event.getImgId(), event.getResolution())) {
			log.info("Metadata with imgId {} already exists. Skipping...", event.getImgId());
			return;
		}
		Metadata metadata = Metadata.builder()
				.imgId(event.getImgId())
				.accessKey(event.getAccessKey())
				.resolution(event.getResolution())
				.title(event.getTitle())
				.build();
		metadataRepository.save(metadata);
	}
}
