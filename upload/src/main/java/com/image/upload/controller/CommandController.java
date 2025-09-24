package com.image.upload.controller;

import com.image.upload.service.ImageCommandService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/command")
public class CommandController {
	private final ImageCommandService imageCommandService;

	@PostMapping
	public ResponseEntity<Object> processOriginal(
			@RequestParam("title") String title,
			@RequestParam("file") MultipartFile file
	) {
		if (file.isEmpty())
			return ResponseEntity.badRequest().body("File is required");
		log.info("Received command to upload image. title: {}", title);
		UUID fileId = UUID.randomUUID();
		imageCommandService.processOriginalImage(fileId, title, file);
		return ResponseEntity.ok().build();
	}
}
