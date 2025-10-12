package com.image.download.service;

import com.image.download.store.FileResource;
import com.image.download.store.Metadata;
import com.image.download.store.MetadataRepository;
import com.image.download.store.object.FileStorage;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true) // 조회 기능이 대부분이므로 클래스 레벨에 readOnly 설정
public class MetadataService {

	private final MetadataRepository metadataRepository;
	private final FileStorage fileStorage;

	public List<Metadata> getAllMetadata() {
		return metadataRepository.findAll();
	}

	public List<Metadata> getMetadataByTitle(String title) {
		return metadataRepository.findByTitleContainingIgnoreCase(title);
	}

	public List<Metadata> getMetadataByImgId(String imgId) {
		return metadataRepository.findByImgId(imgId);
	}

	public Optional<FileResource> getImageStream(String imageId, String resolution) {
		return metadataRepository.findByImgIdAndResolution(imageId, resolution)
				.flatMap(metadata -> fileStorage.download(metadata.getAccessKey()));
	}

	public Optional<String> getImageUrl(String imageId, String resolution) {
		return metadataRepository.findByImgIdAndResolution(imageId, resolution)
				.flatMap(metadata -> fileStorage.getUrl(metadata.getAccessKey()));
	}
}