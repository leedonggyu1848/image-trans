package com.image.upload.queue;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TopicName {
	TOPIC_TRANSCODE("transcode"),
	TOPIC_CREATE_OBJ("create-img");
	private final String topic;
}
