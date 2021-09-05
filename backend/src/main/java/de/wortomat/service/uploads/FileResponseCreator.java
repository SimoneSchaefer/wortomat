package de.wortomat.service.uploads;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class FileResponseCreator {

    public ResponseEntity<Resource> generateHttpFileResponse(Resource resource) {
        String[] splitFileName = Objects.requireNonNull(resource.getFilename()).split("\\.");
        String contentType = "";
        if (splitFileName.length > 0) {
            contentType = "image/" + splitFileName[splitFileName.length - 1];
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" +resource.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

}
