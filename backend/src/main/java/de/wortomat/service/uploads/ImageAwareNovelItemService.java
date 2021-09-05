package de.wortomat.service.uploads;

import de.wortomat.model.Image;
import de.wortomat.model.ImageAware;
import de.wortomat.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
public class ImageAwareNovelItemService {
    @Autowired
    FileHandlingService fileHandlingService;

    @Autowired
    FileRepository fileRepository;

    /**
     * Copies an uploaded file to the wortomat upload folder
     * and stores the reference to it in the database for the given novelItem
     *
     * The generated folder structure is
     * <pre>~/wortomat/uploads/<novelId>/<entityType>/<itemId>/<fileId>/fileName</pre>
     *
     * @param file the file to be store
     * @param service the service used to store the entity the file belongs to
     * @param novelId the novelId
     * @param itemId the character/research... id
     * @param entityType the entity type, will be part of the created folder path
     *
     * @return the stored image
     * @throws IOException if the file could not be stored on the file system
     */
    @Transactional(rollbackFor = IOException.class)
    public <T extends ImageAware> Image saveForNovelItem(
            MultipartFile file,
            ImageAwareService<T> service,
            Long novelId,
            Long itemId,
            EntityType entityType) throws IOException {

        Image image = saveFileMetaDataInRepository(file);
        addImageToNovelItem(service, novelId, itemId, image);
        this.fileHandlingService.storeFileInFolder(novelId, itemId, entityType, image, file);
        return image;
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
    public Resource load(
            Long novelId,
            Long itemId,
            EntityType entityType,
            Long fileId) throws IOException {
        return this.fileHandlingService.getFile(novelId, itemId, entityType, fileId);
    }


    /**
     * Deletes a given image
     * <ul>
     *     <li>from the file system</li>
     *     <li>from the related novel item</li>
     *     <li>from the file repository</li>
     * </ul>
     * If the file could not be found in the file system at all, this will not be reported as error,
     * but will be swallowed silently.<br>
     * If there are any other issues when deleting the file (e.g. due to missing permissions) the operation
     * will be rolled back.
     *
     * @param service the novel item service (e.g. character, research,...)
     * @param novelId the novel Id
     * @param itemId the item Id
     * @param entityType the entity type (character,...)
     * @param fileId the file id (in the repo)
     *
     * @throws IOException if there was any issue accessing the file (besides when it is missing)
     */
    @Transactional(rollbackFor = IOException.class)
    public  <T extends ImageAware> void delete(
            ImageAwareService<T> service,
            Long novelId,
            Long itemId,
            EntityType entityType,
            Long fileId) throws IOException {
        Optional<Image> imageToDelete = this.fileRepository.findById(fileId);
        imageToDelete.ifPresent(image -> deletefromNovelItem(service, novelId, itemId, image));
        imageToDelete.ifPresent(image -> this.fileRepository.delete(image));

        fileHandlingService.deleteFromFolder(novelId, itemId, entityType, fileId);
    }

    private <T extends ImageAware> void deletefromNovelItem(
            ImageAwareService<T> service,
            Long novelId,
            Long itemId,
            Image imageToDelete) {
        T item = service.get(novelId, itemId);
        item.getImages().remove(imageToDelete);
        service.update(novelId, item);
    }

    private <T extends ImageAware> void addImageToNovelItem(ImageAwareService<T> service, Long novelId, Long itemId, Image image) {
        T item = service.get(novelId, itemId);
        item.getImages().add(image);
        service.update(novelId, item);
    }

    private Image saveFileMetaDataInRepository(MultipartFile file) {
        Image image = new Image();
        image.setFileName(file.getOriginalFilename());
        image = fileRepository.save(image);
        return image;
    }
}
