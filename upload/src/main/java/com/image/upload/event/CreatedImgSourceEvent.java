package com.image.upload.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
public class CreatedImgSourceEvent implements Event {
	private final String imgUuid;
	private final String title;

	public String getId() {
		return imgUuid;
	}
}
