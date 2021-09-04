package de.wortomat.service;

import de.wortomat.model.Image;
import de.wortomat.repository.FileRepository;
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

@Service
public class FileService {
    @Autowired
    StorageConfigService storageService;

    @Autowired
    FileRepository fileRepository;

    public Image save(MultipartFile file) throws IOException {
        Image image = saveInRepository(file);
        storeInFolder(image, file);
        return image;
    }

    private void storeInFolder(Image image, MultipartFile file) throws IOException {
        Path path = Paths.get(storageService.getUploadFolder(image.getId()));
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
        Path filePath = Paths.get(path.toString(), image.getFileName());
        Files.copy(file.getInputStream(), path.resolve(filePath));
    }

    private Image saveInRepository(MultipartFile file) {
        Image image = new Image();
        image.setFileName(file.getOriginalFilename());
        image = fileRepository.save(image);
        return image;
    }

    public Resource load(Long fileId) throws IOException {
        return this.getFile(fileId);
    }

    public void delete(Long fileId) throws IOException {
        Resource file = getFile(fileId);
        file.getFile().delete();
    }

    private Resource getFile(Long fileId) throws IOException {
        File folder = new File(storageService.getUploadFolder(fileId));
        File[] files = folder.listFiles();

        if (files == null || files.length != 1) {
            throw new RuntimeException(String.format("Could not read file %d!", fileId));
        }
        Resource resource = new UrlResource(files[0].toPath().toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Could not read the file!");
        }
    }
}

