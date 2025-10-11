package com.image.download.store.object;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Log4j2
@Component
public class ObjectStorageInit implements CommandLineRunner {
	private final MinioClient minioClient;

	@Value("${minio.bucket}")
	private String bucketName;

	@Override
	public void run(String... args) throws Exception {
		log.info("Checking if bucket '{}' exists...", bucketName);

		boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());

		if (!found) {
			minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
			log.info("Bucket '{}' created successfully.", bucketName);
		} else {
			log.info("Bucket '{}' already exists.", bucketName);
		}
	}
}
