import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppInfo,
  AppSettings,
  ArcStep,
  CharacterArc,
  CreateArcStepRequest,
  UpdateArcStepRequest,
  ArrangeScenesRequest,
  CreateMapRequest,
  CreateNodeRequest,
  CreateNoteGroupRequest,
  CreateNoteRequest,
  CreateProjectRequest,
  DirectoryListing,
  ExportCapabilities,
  ExportPreview,
  ExportRequest,
  ExportResult,
  ExportSettings,
  ExportSettingsResponse,
  GalleryImage,
  ImageCrop,
  ImageInfo,
  ManuscriptNode,
  MapSummary,
  MoveNodeRequest,
  MoveNoteGroupRequest,
  NoteContent,
  NoteGroup,
  NoteSummary,
  PlaceMap,
  ProofImportResult,
  ProofInbox,
  ProofNotesFile,
  ProofPackage,
  ProjectInfo,
  ProjectListEntry,
  RestoreResult,
  SaveDocumentRequest,
  SceneContent,
  SceneReference,
  SceneRelations,
  SceneText,
  SaveStoryRequest,
  SearchHit,
  StoryMark,
  StoryState,
  Strand,
  StrandColor,
  Tag,
  TagSummary,
  UpdateAppSettingsRequest,
  UpdateMapRequest,
  UpdateNodeRequest,
  UpdateNoteGroupRequest,
  UpdateNoteRequest,
  UpdateProjectRequest,
  WritingDay,
  TrashArea,
  TrashEntry,
} from '@wortomat/shared';
import { firstValueFrom, type Observable } from 'rxjs';

/**
 * The URLs are relative: in Electron and in the dev server (proxy) `/api` points to the backend.
 */
@Injectable({ providedIn: 'root' })
export class WortomatApi {
  private readonly http = inject(HttpClient);

  appInfo(): Promise<AppInfo> {
    return this.call(this.http.get<AppInfo>('/api/app'));
  }

  settings(): Promise<AppSettings> {
    return this.call(this.http.get<AppSettings>('/api/settings'));
  }

  updateSettings(request: UpdateAppSettingsRequest): Promise<AppSettings> {
    return this.call(this.http.patch<AppSettings>('/api/settings', request));
  }

  /** For the file picker (browser mode); without `dir` the default folder. */
  listDirectory(dir?: string): Promise<DirectoryListing> {
    const params: Record<string, string> = dir ? { dir } : {};
    return this.call(this.http.get<DirectoryListing>('/api/files', { params }));
  }

  currentProject(): Promise<ProjectInfo | null> {
    return this.call(this.http.get<ProjectInfo | null>('/api/project'));
  }

  /** Most recently used first. */
  listProjects(): Promise<ProjectListEntry[]> {
    return this.call(this.http.get<ProjectListEntry[]>('/api/projects'));
  }

  /** The file is kept. */
  forgetProject(filePath: string): Promise<void> {
    return this.call(this.http.post<void>('/api/projects/forget', { filePath }));
  }

  createProject(request: CreateProjectRequest): Promise<ProjectInfo> {
    return this.call(this.http.post<ProjectInfo>('/api/project/create', request));
  }

  openProject(filePath: string): Promise<ProjectInfo> {
    return this.call(this.http.post<ProjectInfo>('/api/project/open', { filePath }));
  }

  updateProject(request: UpdateProjectRequest): Promise<ProjectInfo> {
    return this.call(this.http.patch<ProjectInfo>('/api/project', request));
  }

  closeProject(): Promise<void> {
    return this.call(this.http.post<void>('/api/project/close', null));
  }

  listNodes(): Promise<ManuscriptNode[]> {
    return this.call(this.http.get<ManuscriptNode[]>('/api/nodes'));
  }

  createNode(request: CreateNodeRequest): Promise<ManuscriptNode> {
    return this.call(this.http.post<ManuscriptNode>('/api/nodes', request));
  }

  updateNode(id: string, request: UpdateNodeRequest): Promise<ManuscriptNode> {
    return this.call(this.http.patch<ManuscriptNode>(`/api/nodes/${id}`, request));
  }

  /** All scenes at once, e.g. in story order; returns the complete tree. */
  arrangeScenes(request: ArrangeScenesRequest): Promise<ManuscriptNode[]> {
    return this.call(this.http.post<ManuscriptNode[]>('/api/nodes/arrange', request));
  }

  /** Returns the complete tree after moving. */
  moveNode(id: string, request: MoveNodeRequest): Promise<ManuscriptNode[]> {
    return this.call(this.http.post<ManuscriptNode[]>(`/api/nodes/${id}/move`, request));
  }

  deleteNode(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/nodes/${id}`));
  }

  /** Newest first. */
  listTrash(): Promise<TrashEntry[]> {
    return this.call(this.http.get<TrashEntry[]>('/api/trash'));
  }

  restoreFromTrash(id: string): Promise<RestoreResult> {
    return this.call(this.http.post<RestoreResult>(`/api/trash/${id}/restore`, {}));
  }

  deleteFromTrash(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/trash/${id}`));
  }

  emptyTrash(area: TrashArea): Promise<void> {
    return this.call(this.http.delete<void>('/api/trash', { params: { area } }));
  }

  sceneContent(id: string): Promise<SceneContent> {
    return this.call(this.http.get<SceneContent>(`/api/scenes/${id}/content`));
  }

  saveSceneContent(id: string, request: SaveDocumentRequest): Promise<SceneContent> {
    return this.call(this.http.put<SceneContent>(`/api/scenes/${id}/content`, request));
  }

  /** The day starts at 4 am. */
  writingToday(): Promise<WritingDay> {
    return this.call(this.http.get<WritingDay>('/api/writing-log/today'));
  }

  /** Paragraphs separated by line breaks. */
  sceneTexts(): Promise<SceneText[]> {
    return this.call(this.http.get<SceneText[]>('/api/scene-texts'));
  }

  /** `from` to `to` (YYYY-MM-DD, inclusive). */
  writingLog(from: string, to: string): Promise<WritingDay[]> {
    return this.call(this.http.get<WritingDay[]>('/api/writing-log', { params: { from, to } }));
  }

  listNotes(): Promise<NoteSummary[]> {
    return this.call(this.http.get<NoteSummary[]>('/api/notes'));
  }

  createNote(request: CreateNoteRequest): Promise<NoteSummary> {
    return this.call(this.http.post<NoteSummary>('/api/notes', request));
  }

  updateNote(id: string, request: UpdateNoteRequest): Promise<NoteSummary> {
    return this.call(this.http.patch<NoteSummary>(`/api/notes/${id}`, request));
  }

  deleteNote(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/notes/${id}`));
  }

  listNoteGroups(): Promise<NoteGroup[]> {
    return this.call(this.http.get<NoteGroup[]>('/api/note-groups'));
  }

  createNoteGroup(request: CreateNoteGroupRequest): Promise<NoteGroup> {
    return this.call(this.http.post<NoteGroup>('/api/note-groups', request));
  }

  updateNoteGroup(id: string, request: UpdateNoteGroupRequest): Promise<NoteGroup> {
    return this.call(this.http.patch<NoteGroup>(`/api/note-groups/${id}`, request));
  }

  moveNoteGroup(id: string, request: MoveNoteGroupRequest): Promise<NoteGroup[]> {
    return this.call(this.http.post<NoteGroup[]>(`/api/note-groups/${id}/move`, request));
  }

  deleteNoteGroup(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/note-groups/${id}`));
  }

  noteContent(id: string): Promise<NoteContent> {
    return this.call(this.http.get<NoteContent>(`/api/notes/${id}/content`));
  }

  saveNoteContent(id: string, request: SaveDocumentRequest): Promise<NoteContent> {
    return this.call(this.http.put<NoteContent>(`/api/notes/${id}/content`, request));
  }

  noteImages(id: string): Promise<GalleryImage[]> {
    return this.call(this.http.get<GalleryImage[]>(`/api/notes/${id}/images`));
  }

  /** Returns the whole gallery. */
  addNoteImage(
    id: string,
    image: Blob,
    fileName: string,
    width: number,
    height: number,
  ): Promise<GalleryImage[]> {
    const form = new FormData();
    form.append('file', image, fileName);
    form.append('width', String(width));
    form.append('height', String(height));
    return this.call(this.http.post<GalleryImage[]>(`/api/notes/${id}/images`, form));
  }

  reorderNoteImages(id: string, imageIds: string[]): Promise<GalleryImage[]> {
    return this.call(this.http.put<GalleryImage[]>(`/api/notes/${id}/images`, { imageIds }));
  }

  setNoteImageCrop(id: string, imageId: string, crop: ImageCrop | null): Promise<GalleryImage[]> {
    return this.call(
      this.http.put<GalleryImage[]>(`/api/notes/${id}/images/${imageId}/crop`, { crop }),
    );
  }

  removeNoteImage(id: string, imageId: string): Promise<GalleryImage[]> {
    return this.call(this.http.delete<GalleryImage[]>(`/api/notes/${id}/images/${imageId}`));
  }

  sceneLinks(sceneId: string): Promise<NoteSummary[]> {
    return this.call(this.http.get<NoteSummary[]>(`/api/scenes/${sceneId}/links`));
  }

  linkNote(sceneId: string, noteId: string): Promise<NoteSummary[]> {
    return this.call(this.http.post<NoteSummary[]>(`/api/scenes/${sceneId}/links`, { noteId }));
  }

  unlinkNote(sceneId: string, noteId: string): Promise<NoteSummary[]> {
    return this.call(this.http.delete<NoteSummary[]>(`/api/scenes/${sceneId}/links/${noteId}`));
  }

  /** In manuscript order. */
  noteScenes(noteId: string): Promise<SceneReference[]> {
    return this.call(this.http.get<SceneReference[]>(`/api/notes/${noteId}/scenes`));
  }

  noteArc(noteId: string): Promise<CharacterArc> {
    return this.call(this.http.get<CharacterArc>(`/api/notes/${noteId}/arc`));
  }

  updateArcSummary(noteId: string, summary: string): Promise<CharacterArc> {
    return this.call(this.http.put<CharacterArc>(`/api/notes/${noteId}/arc`, { summary }));
  }

  createArcStep(noteId: string, request: CreateArcStepRequest): Promise<CharacterArc> {
    return this.call(this.http.post<CharacterArc>(`/api/notes/${noteId}/arc/steps`, request));
  }

  updateArcStep(id: string, request: UpdateArcStepRequest): Promise<CharacterArc> {
    return this.call(this.http.patch<CharacterArc>(`/api/arc-steps/${id}`, request));
  }

  moveArcStep(id: string, beforeId: string | null): Promise<CharacterArc> {
    return this.call(this.http.post<CharacterArc>(`/api/arc-steps/${id}/move`, { beforeId }));
  }

  addArcStepScene(id: string, sceneId: string): Promise<CharacterArc> {
    return this.call(this.http.post<CharacterArc>(`/api/arc-steps/${id}/scenes`, { sceneId }));
  }

  removeArcStepScene(id: string, sceneId: string): Promise<CharacterArc> {
    return this.call(this.http.delete<CharacterArc>(`/api/arc-steps/${id}/scenes/${sceneId}`));
  }

  reorderArcSteps(noteId: string, stepIds: string[]): Promise<CharacterArc> {
    return this.call(this.http.put<CharacterArc>(`/api/notes/${noteId}/arc/steps`, { stepIds }));
  }

  deleteArcStep(id: string): Promise<CharacterArc> {
    return this.call(this.http.delete<CharacterArc>(`/api/arc-steps/${id}`));
  }

  /** Stations of all characters that show in the scene. */
  sceneArcSteps(sceneId: string): Promise<ArcStep[]> {
    return this.call(this.http.get<ArcStep[]>(`/api/scenes/${sceneId}/arc-steps`));
  }

  listMaps(): Promise<MapSummary[]> {
    return this.call(this.http.get<MapSummary[]>('/api/maps'));
  }

  createMap(request: CreateMapRequest): Promise<PlaceMap> {
    return this.call(this.http.post<PlaceMap>('/api/maps', request));
  }

  map(id: string): Promise<PlaceMap> {
    return this.call(this.http.get<PlaceMap>(`/api/maps/${id}`));
  }

  updateMap(id: string, request: UpdateMapRequest): Promise<PlaceMap> {
    return this.call(this.http.patch<PlaceMap>(`/api/maps/${id}`, request));
  }

  mapsWithPlace(noteId: string): Promise<PlaceMap[]> {
    return this.call(this.http.get<PlaceMap[]>(`/api/notes/${noteId}/maps`));
  }

  deleteMap(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/maps/${id}`));
  }

  /** For the scene filter. */
  sceneRelations(): Promise<SceneRelations[]> {
    return this.call(this.http.get<SceneRelations[]>('/api/scene-relations'));
  }

  proofPackage(): Promise<ProofPackage> {
    return this.call(this.http.get<ProofPackage>('/api/proofreading/package'));
  }

  proofCopyToFile(filePath: string): Promise<ExportResult> {
    return this.call(this.http.post<ExportResult>('/api/proofreading/export', { filePath }));
  }

  async proofCopyDownload(): Promise<{ blob: Blob; fileName: string }> {
    const response = await this.call(
      this.http.post('/api/proofreading/export', {}, { observe: 'response', responseType: 'blob' }),
    );
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const encodedName = /filename\*=UTF-8''([^;]+)/.exec(disposition)?.[1];
    return {
      blob: response.body!,
      fileName: encodedName ? decodeURIComponent(encodedName) : 'Korrekturfassung.html',
    };
  }

  proofInbox(): Promise<ProofInbox> {
    return this.call(this.http.get<ProofInbox>('/api/proofreading/inbox'));
  }

  importProofInbox(): Promise<ProofImportResult> {
    return this.call(this.http.post<ProofImportResult>('/api/proofreading/inbox/import', null));
  }

  cleanProofInbox(): Promise<{ deleted: string[] }> {
    return this.call(this.http.post<{ deleted: string[] }>('/api/proofreading/inbox/clean', null));
  }

  importProofNotes(file: ProofNotesFile): Promise<ProofImportResult> {
    return this.call(this.http.post<ProofImportResult>('/api/proofreading/import', file));
  }

  storyMarks(): Promise<StoryMark[]> {
    return this.call(this.http.get<StoryMark[]>('/api/story/marks'));
  }

  /** Replaces the whole order including section marks. */
  saveStory(request: SaveStoryRequest): Promise<StoryState> {
    return this.call(this.http.put<StoryState>('/api/story', request));
  }

  listStrands(): Promise<Strand[]> {
    return this.call(this.http.get<Strand[]>('/api/strands'));
  }

  /** Without a colour the thread gets the least used one. */
  createStrand(name: string, color?: StrandColor): Promise<Strand> {
    return this.call(this.http.post<Strand>('/api/strands', { name, color }));
  }

  updateStrand(id: string, changes: { name?: string; color?: StrandColor }): Promise<Strand> {
    return this.call(this.http.patch<Strand>(`/api/strands/${id}`, changes));
  }

  moveStrand(id: string, beforeId: string | null): Promise<Strand[]> {
    return this.call(this.http.post<Strand[]>(`/api/strands/${id}/move`, { beforeId }));
  }

  /** The scenes stay; they only lose the assignment. */
  deleteStrand(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/strands/${id}`));
  }

  sceneStrands(sceneId: string): Promise<Strand[]> {
    return this.call(this.http.get<Strand[]>(`/api/scenes/${sceneId}/strands`));
  }

  addSceneStrand(sceneId: string, strandId: string): Promise<Strand[]> {
    return this.call(this.http.post<Strand[]>(`/api/scenes/${sceneId}/strands`, { strandId }));
  }

  removeSceneStrand(sceneId: string, strandId: string): Promise<Strand[]> {
    return this.call(this.http.delete<Strand[]>(`/api/scenes/${sceneId}/strands/${strandId}`));
  }

  listTags(): Promise<TagSummary[]> {
    return this.call(this.http.get<TagSummary[]>('/api/tags'));
  }

  sceneTags(sceneId: string): Promise<Tag[]> {
    return this.call(this.http.get<Tag[]>(`/api/scenes/${sceneId}/tags`));
  }

  /** Existing tags are reused. */
  addSceneTag(sceneId: string, name: string): Promise<Tag[]> {
    return this.call(this.http.post<Tag[]>(`/api/scenes/${sceneId}/tags`, { name }));
  }

  removeSceneTag(sceneId: string, tagId: string): Promise<Tag[]> {
    return this.call(this.http.delete<Tag[]>(`/api/scenes/${sceneId}/tags/${tagId}`));
  }

  exportCapabilities(): Promise<ExportCapabilities> {
    return this.call(this.http.get<ExportCapabilities>('/api/export/capabilities'));
  }

  exportSettings(): Promise<ExportSettingsResponse> {
    return this.call(this.http.get<ExportSettingsResponse>('/api/export/settings'));
  }

  saveExportSettings(settings: ExportSettings): Promise<ExportSettings> {
    return this.call(this.http.put<ExportSettings>('/api/export/settings', settings));
  }

  /** `sceneBreak`: `null` for the template default. */
  exportPreview(includeSceneTitles: boolean, sceneBreak: string | null): Promise<ExportPreview> {
    const params: Record<string, string> = { sceneTitles: String(includeSceneTitles) };
    if (sceneBreak !== null) params['sceneBreak'] = sceneBreak;
    return this.call(this.http.get<ExportPreview>('/api/export/preview', { params }));
  }

  exportToFile(request: ExportRequest & { filePath: string }): Promise<ExportResult> {
    return this.call(this.http.post<ExportResult>('/api/export', request));
  }

  async exportDownload(
    request: ExportRequest,
  ): Promise<{ blob: Blob; fileName: string; warnings: string[] }> {
    const response = await this.call(
      this.http.post('/api/export', request, { observe: 'response', responseType: 'blob' }),
    );
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const encodedName = /filename\*=UTF-8''([^;]+)/.exec(disposition)?.[1];
    const warnings = response.headers.get('X-Export-Warnings');
    return {
      blob: response.body!,
      fileName: encodedName ? decodeURIComponent(encodedName) : `Manuskript.${request.format}`,
      warnings: warnings ? (JSON.parse(decodeURIComponent(warnings)) as string[]) : [],
    };
  }

  uploadImage(image: Blob, fileName: string, width: number, height: number): Promise<ImageInfo> {
    const form = new FormData();
    form.append('file', image, fileName);
    form.append('width', String(width));
    form.append('height', String(height));
    return this.call(this.http.post<ImageInfo>('/api/images', form));
  }

  search(query: string): Promise<SearchHit[]> {
    return this.call(this.http.get<SearchHit[]>('/api/search', { params: { q: query } }));
  }

  private call<T>(request: Observable<T>): Promise<T> {
    return firstValueFrom(request);
  }
}
