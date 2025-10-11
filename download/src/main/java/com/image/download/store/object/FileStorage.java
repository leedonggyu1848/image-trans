package com.image.download.store.object;

import com.image.download.store.FileResource;
import java.util.Optional;


public interface FileStorage {
	Optional<FileResource> download(String accessKey);
	Optional<String> getUrl(String accessKey);
}
