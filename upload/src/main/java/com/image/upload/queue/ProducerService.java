package com.image.upload.queue;

import com.image.upload.event.CreateMetadataRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProducerService {
	private final KafkaTemplate<String, Object> kafkaTemplate;
	private static final String TOPIC_NAME = "image-metadata-event";

	void sendMetadataEvent(CreateMetadataRequest request) {
		log.info("Sending metadata event to Kafka. title: {}", request.getTitle());
		kafkaTemplate.send(TOPIC_NAME, request);
	}
}
