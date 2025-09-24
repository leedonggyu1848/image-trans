package com.image.upload.store;

import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorage {
	String store(UUID imageId, String resolution, MultipartFile file);
}
