package com.image.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class TranscodeEvent implements Event {
	private String imgId;
	private String accessKey;

	public String getId() {
		return imgId;
	}
}
