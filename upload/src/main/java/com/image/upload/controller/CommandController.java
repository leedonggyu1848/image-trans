package com.image.upload.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/commands")
public class CommandController {
	@PostMapping
	public ResponseEntity<Object> handleCommand(
			@RequestParam("title") String title,
			@RequestParam("file") String file
	) {
		if (file.isEmpty())
			return ResponseEntity.badRequest().body("File is required");
		log.info("Received command to upload image. title: {}", title);
		return ResponseEntity.ok().body("Image upload command received");
	}
}
