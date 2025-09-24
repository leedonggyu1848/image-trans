package com.image.upload.event;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TransCodeRequest {
	private final UUID imageId;
	private final String s3Url;
}
