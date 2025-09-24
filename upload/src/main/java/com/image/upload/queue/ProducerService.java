package com.image.upload.queue;

import com.image.upload.event.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProducerService {
	private final KafkaTemplate<String, Object> kafkaTemplate;

	public void sendMessage(TopicName topic, Event event) {
		kafkaTemplate.send(topic.getTopic(), event.getId(), event);
		log.info("Produced message to topic: {}, payload: {}", topic, event);
	}
}
