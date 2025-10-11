package com.image.download.store;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetadataRepository extends JpaRepository<Metadata, String> {
	List<Metadata> findByTitleContainingIgnoreCase(String title);
	List<Metadata> findByImgId(String imgId);
	Optional<Metadata> findByImgIdAndResolution(String imgId, String resolution);
}
