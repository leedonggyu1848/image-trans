package com.image.upload.service;

import com.image.upload.event.CreatedImgObjEvent;
import com.image.upload.event.CreatedImgSourceEvent;
import com.image.upload.event.TranscodeEvent;
import com.image.upload.queue.ProducerService;
import com.image.upload.queue.TopicName;
import com.image.upload.store.FileStorage;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@Service
public class ImageCommandService {
	private final FileStorage fileStorage;
	private final ProducerService producerService;
	private final String IMAGE_ORIGINAL = "ORIGINAL";

	public void processOriginalImage(UUID imgUuid, String title, MultipartFile file) {
		sendCreatedImgSource(imgUuid, title);
		String accessKey = fileStorage.store(imgUuid, IMAGE_ORIGINAL, file);

		sendCreatedImgObj(imgUuid, accessKey, IMAGE_ORIGINAL);
		sendTranscodeEvent(imgUuid, accessKey);
	}

	private void sendTranscodeEvent(UUID imgUuid, String accessKey) {
		TranscodeEvent event = TranscodeEvent.builder()
				.imgUuid(imgUuid.toString())
				.accessKey(accessKey)
				.build();
		producerService.sendMessage(TopicName.TOPIC_TRANSCODE, event);
	}

	private void sendCreatedImgObj(UUID imgUuid, String accessKey, String resolution) {
		CreatedImgObjEvent event = CreatedImgObjEvent.builder()
				.imgUuid(imgUuid.toString())
				.accessKey(accessKey)
				.resolution(resolution)
				.build();
		producerService.sendMessage(TopicName.TOPIC_CREATE_OBJ, event);
	}

	private void sendCreatedImgSource(UUID imgUuid, String title) {
		CreatedImgSourceEvent event = CreatedImgSourceEvent.builder()
				.imgUuid(imgUuid.toString())
				.title(title)
				.build();
		producerService.sendMessage(TopicName.TOPIC_CREATE_SRC, event);
	}
}