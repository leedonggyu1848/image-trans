package com.image.download.store.object;

import com.image.download.store.FileResource;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;
import java.io.InputStream;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Slf4j
@Component
public class MinioFileStorage implements FileStorage {
	private final MinioClient minioClient;
	@Value("${minio.bucket}")
	private String bucketName;

	@Override
	public Optional<FileResource> download(String accessKey) {
		try {
			StatObjectResponse stat = minioClient.statObject(
					StatObjectArgs.builder().bucket(bucketName).object(accessKey).build()
			);
			InputStream stream = minioClient.getObject(
					GetObjectArgs.builder().bucket(bucketName).object(accessKey).build()
			);
			return Optional.of(new FileResource(stream, stat.size(), stat.contentType()));
		} catch (Exception e) {
			log.error("Failed to download file from MinIO. accessKey: {}", accessKey, e);
			return Optional.empty();
		}
	}

	@Override
	@Cacheable(cacheNames = "preSignedUrls", key = "#accessKey")
	public Optional<String> getUrl(String accessKey) {
		try {
			String url = minioClient.getPresignedObjectUrl(
					GetPresignedObjectUrlArgs.builder()
							.method(Method.GET)
							.bucket(bucketName)
							.object(accessKey)
							.expiry(5, TimeUnit.MINUTES)
							.build()
			);
			return Optional.of(url);
		} catch (Exception e) {
			return Optional.empty();
		}
	}
}
