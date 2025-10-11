package com.image.download.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreatedImgObjEvent implements Event {
	private String imgId;
	private String accessKey;
	private String resolution;
	private String title;

	@Override
	public String getId() {
		return imgId;
	}
}

