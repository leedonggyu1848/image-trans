package com.image.download.controller;
import com.image.download.service.MetadataService;
import com.image.download.store.Metadata;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/query")
public class QueryController {

	private final MetadataService metadataService;

	@GetMapping("/metadata")
	public List<Metadata> list() {
		return metadataService.getAllMetadata();
	}

	@GetMapping("/metadata/title/{title}")
	public List<Metadata> listByTitle(@PathVariable String title) {
		return metadataService.getMetadataByTitle(title);
	}

	@GetMapping("/metadata/imgId/{imgId}")
	public List<Metadata> listByImgId(@PathVariable String imgId) {
		return metadataService.getMetadataByImgId(imgId);
	}

	@GetMapping("/images/{imageId}/{resolution}")
	public ResponseEntity<InputStreamResource> downloadImage(@PathVariable String imageId, @PathVariable String resolution) {
		return metadataService.getImageStream(imageId, resolution)
				.map(fileResource -> {
					HttpHeaders headers = new HttpHeaders();
					headers.setContentType(MediaType.parseMediaType(fileResource.getContentType()));
					headers.setContentLength(fileResource.getSize());
					headers.setContentDispositionFormData("attachment", imageId);

					return new ResponseEntity<>(new InputStreamResource(fileResource.getInputStream()), headers, HttpStatus.OK);
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping("/images/url/{imageId}/{resolution}")
	public ResponseEntity<String> getImageUrl(@PathVariable String imageId, @PathVariable String resolution) {
		return metadataService.getImageUrl(imageId, resolution)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}
}