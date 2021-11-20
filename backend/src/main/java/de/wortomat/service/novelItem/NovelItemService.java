package de.wortomat.service.novelItem;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.model.Image;
import de.wortomat.repository.FileRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.FileHandlingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public abstract class NovelItemService<T extends IGroupingNovelItem<S>, S extends INovelItem<T>> {

    @Autowired
    FileHandlingService fileHandlingService;

    @Autowired
    FileRepository fileRepository;

    abstract GroupingNovelItemService<T, S> getParentService();
    abstract NovelItemRepository<S> getRepository();
    abstract EntityType getEntityType();

    /**
     * Stores the new item in the database as child of the specified parent
     * @param novelId the novelId
     * @param partId the parent id
     * @param chapter the child
     * @return the stored item
     */
    public S create(Long novelId, Long partId, S chapter) {
        return prepareAndSave(chapter, novelId, partId);
    }


    /**
     * Updates an existing item in the database with the specified data
     * @param novelId the novelId
     * @param partId the parent id
     * @param chapter the child to update
     * @return the stored item
     */
    public S update(Long novelId, Long partId, S chapter) {
        return prepareAndSave(chapter, novelId, partId);
    }



    /**
     * Deletes an existing item in the database
     * @param novelId the novelId
     * @param chapterId the child id
     * @return the stored item
     */
    public void delete(Long novelId, Long chapterId) {
        this.getRepository().deleteById(chapterId);
    }

    public S get(Long novelId, Long partId, Long itemId) {
        return this.getRepository().findById(itemId).orElseThrow(NotFoundException::new);
    }

    /**
     * Copies an uploaded file to the wortomat upload folder
     * and stores the reference to it in the database for the given novelItem
     *
     * The generated folder structure is
     * <pre>~/wortomat/uploads/<novelId>/<entityType>/<itemId>/<fileId>/fileName</pre>
     *
     * @param file the file to be store
     * @param novelId the novelId
     * @param itemId the character/research... id
     * @param entityType the entity type, will be part of the created folder path
     *
     * @return the stored image
     * @throws IOException if the file could not be stored on the file system
     */
    @Transactional(rollbackFor = IOException.class)
    public Image saveForNovelItem(
            MultipartFile file,
            Long novelId,
            Long parentId,
            Long itemId,
            EntityType entityType) throws IOException {

        Image image = saveFileMetaDataInRepository(file);
        addImageToNovelItem(novelId, parentId, itemId, image);
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
     * @param novelId the novel Id
     * @param itemId the item Id
     * @param entityType the entity type (character,...)
     * @param fileId the file id (in the repo)
     *
     * @throws IOException if there was any issue accessing the file (besides when it is missing)
     */
    @Transactional(rollbackFor = IOException.class)
    public  void delete(
            Long novelId,
            Long parentId,
            Long itemId,
            EntityType entityType,
            Long fileId) throws IOException {
        Optional<Image> imageToDelete = this.fileRepository.findById(fileId);
        imageToDelete.ifPresent(image -> deletefromNovelItem(novelId, parentId, itemId, image));
        imageToDelete.ifPresent(image -> this.fileRepository.delete(image));

        fileHandlingService.deleteFromFolder(novelId, itemId, entityType, fileId);
    }

    private void deletefromNovelItem(
            Long novelId,
            Long parentId,
            Long itemId,
            Image imageToDelete) {
        S item = get(novelId, parentId, itemId);
        item.getImages().remove(imageToDelete);
        update(novelId, parentId, item);
    }

    private void addImageToNovelItem(Long novelId, Long parentId, Long itemId, Image image) {
        S item = get(novelId, parentId, itemId);
        item.getImages().add(image);
        update(novelId, parentId, item);
    }

    private Image saveFileMetaDataInRepository(MultipartFile file) {
        Image image = new Image();
        image.setFileName(file.getOriginalFilename());
        image = fileRepository.save(image);
        return image;
    }


    private S prepareAndSave(S child, Long novelId, Long parentId) {
        T parent = getParentService().get(novelId, parentId);
        child.setParent(parent);
        ensurePosition(child, novelId, parentId);
        return save(novelId, child, parent);
    }

    private S save(Long novelId, S child, T parent) {
        this.getRepository().save(child);

        parent.getChildren().add(child);
        getParentService().update(novelId, parent);
        return child;
    }

    private void ensurePosition(S child, Long novelId, Long parentId) {
        if (child.getId() == null) {
            child.setPosition((getMaxPosition(novelId, parentId)));
        }
    }

    private int getMaxPosition(Long novelId, Long partId) {
        S maxPosition = this.getMaxPositionItem(novelId, partId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

    private S getMaxPositionItem(Long novelId, Long parentId) {
        T parent = getParentService().get(novelId, parentId);
        List<S> children = parent.getChildren();
        if (children.size() > 0) {
            return children.get(children.size() - 1);
        }
        return null;
    }
}
