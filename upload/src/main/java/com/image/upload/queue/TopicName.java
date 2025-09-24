package com.image.upload.queue;

public enum TopicName {
	TOPIC_TRANSCODE("transcode"),
	TOPIC_CREATE("create");

	private final String topic;

	TopicName(String topic) {
		this.topic = topic;
	}

	public String getTopic() {
		return topic;
	}
}
