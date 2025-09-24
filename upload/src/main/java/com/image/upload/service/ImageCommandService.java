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

	public void processOriginalImage(UUID imgId, String title, MultipartFile file) {
		sendCreatedImgSource(imgId, title);
		String accessKey = fileStorage.store(imgId, IMAGE_ORIGINAL, file);

		sendCreatedImgObj(imgId, accessKey, IMAGE_ORIGINAL);
		sendTranscodeEvent(imgId, accessKey);
	}

	private void sendTranscodeEvent(UUID imgId, String accessKey) {
		TranscodeEvent event = TranscodeEvent.builder()
				.imgId(imgId.toString())
				.accessKey(accessKey)
				.build();
		producerService.sendMessage(TopicName.TOPIC_TRANSCODE, event);
	}

	private void sendCreatedImgObj(UUID imgId, String accessKey, String resolution) {
		CreatedImgObjEvent event = CreatedImgObjEvent.builder()
				.imgId(imgId.toString())
				.accessKey(accessKey)
				.resolution(resolution)
				.build();
		producerService.sendMessage(TopicName.TOPIC_CREATE_OBJ, event);
	}

	private void sendCreatedImgSource(UUID imgId, String title) {
		CreatedImgSourceEvent event = CreatedImgSourceEvent.builder()
				.imgId(imgId.toString())
				.title(title)
				.build();
		producerService.sendMessage(TopicName.TOPIC_CREATE_SRC, event);
	}
}