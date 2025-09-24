package com.image.upload.event;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
public class CreateMetadataRequest {
	private final UUID imageId;
	private final String resolution;
	private final String title;
	private final String s3Url;
}
