package com.image.upload.queue;

public enum TopicName {
	TOPIC_TRANSCODE("transcode"),
	TOPIC_CREATE_OBJ("create-img"),
	TOPIC_CREATE_SRC("create-src");


	private final String topic;

	TopicName(String topic) {
		this.topic = topic;
	}

	public String getTopic() {
		return topic;
	}
}
