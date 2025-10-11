package com.image.download.store;

import java.io.InputStream;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class FileResource {
	private final InputStream inputStream;
	private final long size;
	private final String contentType;
}
