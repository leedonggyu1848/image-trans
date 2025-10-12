package com.image.upload.queue;

import com.image.event.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProducerService {
	private final KafkaTemplate<String, Object> kafkaTemplate;

	public void sendMessage(String topic, Event event) {
		kafkaTemplate.send(topic, event.getId(), event);
		log.info("Produced message to topic: {}, payload: {}", topic, event);
	}
}
