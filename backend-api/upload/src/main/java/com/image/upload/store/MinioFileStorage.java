package com.image.upload.store;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import java.io.InputStream;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@Component
public class MinioFileStorage implements FileStorage {
	private final MinioClient minioClient;
	@Value("${minio.bucket}")
	private String bucketName;

	@Override
	public String store(String imgId, String resolution, MultipartFile file) {
		String accessKey = generateAccessKey(imgId, resolution);
		try {
			minioClient.putObject(
					PutObjectArgs.builder()
							.bucket(bucketName)
							.object(accessKey)
							.stream(file.getInputStream(), file.getSize(), -1)
							.contentType(file.getContentType())
							.build()
			);
		} catch (Exception e) {
			throw new RuntimeException("Failed to store file in MinIO", e);
		}
		return accessKey;
	}

	private String generateAccessKey(String imageId, String resolution) {
		return imageId + "/" + resolution;
	}
}
