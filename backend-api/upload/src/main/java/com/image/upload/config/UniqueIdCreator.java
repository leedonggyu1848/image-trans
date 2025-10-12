package com.image.upload.config;

import com.github.f4b6a3.ulid.UlidCreator;

public interface UniqueIdCreator {
	static String create() {
		return UlidCreator.getUlid().toString();
	}

}
