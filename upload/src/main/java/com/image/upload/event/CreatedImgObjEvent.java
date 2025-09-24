package com.image.upload.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
public class CreatedImgObjEvent implements Event {
	private final String imgUuid;
	private final String accessKey;
	private final String resolution;

	@Override
	public String getId() {
		return imgUuid;
	}
}
