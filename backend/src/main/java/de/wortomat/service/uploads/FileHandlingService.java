package de.wortomat.service.uploads;

import de.wortomat.model.Image;
import de.wortomat.service.StorageConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Service to perform file system operations for the uploaded files.
 */
@Service
public class FileHandlingService {
    @Autowired
    StorageConfigService storageService;

    public void storeFileInFolder(Long novelId, Long itemId, EntityType entityType, Image image, MultipartFile file) throws IOException {
        Path path = Paths.get(storageService.getUploadFolder(novelId, itemId, entityType, image.getId()));
        Path filePath = Paths.get(path.toString(), image.getFileName());
        Files.copy(file.getInputStream(), path.resolve(filePath));
    }

    /**
     * Loads the image for the given parameters from the file system
     *
     * @param novelId the novelId
     * @param itemId the item id (e.g. character, research)
     * @param entityType the entity type - required to located the folder
     * @param fileId the file id
     * @return the loaded resource
     * @throws IOException if th file could not be located
     */
    public Resource load(Long novelId, Long itemId, EntityType entityType, Long fileId) throws IOException {
        return this.getFile(novelId, itemId, entityType, fileId);
    }

    public void deleteFromFolder(Long novelId, Long itemId, EntityType entityType, Long fileId) throws IOException {
        File folder = new File(storageService.getUploadFolder(novelId, itemId, entityType, fileId));
        if (folder.exists()) {
            File[] allContents = folder.listFiles();
            for (File file : allContents) {
                file.delete();
            }
            File parentFolder = folder.getParentFile();
            if (!folder.delete()) {
                System.out.println("could not delete folder");
            }
            if (parentFolder.listFiles().length == 0) {
                parentFolder.delete();
            }
        }
    }

    public Resource getFile(Long novelId, Long itemId, EntityType entityType, Long fileId) throws IOException {
        File folder = new File(storageService.getUploadFolder(novelId, itemId, entityType, fileId));
        File[] files = folder.listFiles();

        if (files == null || files.length != 1) {
            throw new IOException(String.format("Could not read file %d!", fileId));
        }
        Resource resource = new UrlResource(files[0].toPath().toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new IOException("Could not read the file!");
        }
    }
}

