import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppInfo,
  AppSettings,
  CreateNodeRequest,
  CreateNoteGroupRequest,
  CreateNoteRequest,
  CreateProjectRequest,
  ExportCapabilities,
  ExportRequest,
  ExportResult,
  ImageInfo,
  ManuscriptNode,
  MoveNodeRequest,
  MoveNoteGroupRequest,
  NoteContent,
  NoteGroup,
  NoteSummary,
  ProjectInfo,
  ProjectListEntry,
  SceneReference,
  SaveDocumentRequest,
  SceneContent,
  SceneRelations,
  SearchHit,
  Tag,
  TagSummary,
  UpdateAppSettingsRequest,
  UpdateNodeRequest,
  UpdateNoteGroupRequest,
  UpdateNoteRequest,
  UpdateProjectRequest,
} from '@wortomat/shared';
import { firstValueFrom, type Observable } from 'rxjs';

/**
 * Typisierter Client für das lokale REST-Backend.
 * Die URLs sind relativ: In Electron und im Dev-Server (Proxy) zeigt `/api` aufs Backend.
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

  // Projekt -----------------------------------------------------------------

  currentProject(): Promise<ProjectInfo | null> {
    return this.call(this.http.get<ProjectInfo | null>('/api/project'));
  }

  /** Alle bekannten Projekte, zuletzt verwendete zuerst. */
  listProjects(): Promise<ProjectListEntry[]> {
    return this.call(this.http.get<ProjectListEntry[]>('/api/projects'));
  }

  /** Entfernt ein Projekt aus der Liste; die Datei bleibt erhalten. */
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

  // Manuskript --------------------------------------------------------------

  listNodes(): Promise<ManuscriptNode[]> {
    return this.call(this.http.get<ManuscriptNode[]>('/api/nodes'));
  }

  createNode(request: CreateNodeRequest): Promise<ManuscriptNode> {
    return this.call(this.http.post<ManuscriptNode>('/api/nodes', request));
  }

  updateNode(id: string, request: UpdateNodeRequest): Promise<ManuscriptNode> {
    return this.call(this.http.patch<ManuscriptNode>(`/api/nodes/${id}`, request));
  }

  /** Liefert den kompletten Baum nach dem Verschieben. */
  moveNode(id: string, request: MoveNodeRequest): Promise<ManuscriptNode[]> {
    return this.call(this.http.post<ManuscriptNode[]>(`/api/nodes/${id}/move`, request));
  }

  deleteNode(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/nodes/${id}`));
  }

  sceneContent(id: string): Promise<SceneContent> {
    return this.call(this.http.get<SceneContent>(`/api/scenes/${id}/content`));
  }

  saveSceneContent(id: string, request: SaveDocumentRequest): Promise<SceneContent> {
    return this.call(this.http.put<SceneContent>(`/api/scenes/${id}/content`, request));
  }

  // Notizen (Charaktere, Orte, Forschung) -----------------------------------

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

  noteImages(id: string): Promise<ImageInfo[]> {
    return this.call(this.http.get<ImageInfo[]>(`/api/notes/${id}/images`));
  }

  /** Hängt ein Bild an die Galerie an; liefert die ganze Galerie zurück. */
  addNoteImage(
    id: string,
    image: Blob,
    fileName: string,
    width: number,
    height: number,
  ): Promise<ImageInfo[]> {
    const form = new FormData();
    form.append('file', image, fileName);
    form.append('width', String(width));
    form.append('height', String(height));
    return this.call(this.http.post<ImageInfo[]>(`/api/notes/${id}/images`, form));
  }

  reorderNoteImages(id: string, imageIds: string[]): Promise<ImageInfo[]> {
    return this.call(this.http.put<ImageInfo[]>(`/api/notes/${id}/images`, { imageIds }));
  }

  removeNoteImage(id: string, imageId: string): Promise<ImageInfo[]> {
    return this.call(this.http.delete<ImageInfo[]>(`/api/notes/${id}/images/${imageId}`));
  }

  // Verknüpfungen Szene ↔ Charakter/Ort ----------------------------------------

  sceneLinks(sceneId: string): Promise<NoteSummary[]> {
    return this.call(this.http.get<NoteSummary[]>(`/api/scenes/${sceneId}/links`));
  }

  linkNote(sceneId: string, noteId: string): Promise<NoteSummary[]> {
    return this.call(this.http.post<NoteSummary[]>(`/api/scenes/${sceneId}/links`, { noteId }));
  }

  unlinkNote(sceneId: string, noteId: string): Promise<NoteSummary[]> {
    return this.call(this.http.delete<NoteSummary[]>(`/api/scenes/${sceneId}/links/${noteId}`));
  }

  /** Szenen, in denen eine Notiz vorkommt – in Manuskript-Reihenfolge. */
  noteScenes(noteId: string): Promise<SceneReference[]> {
    return this.call(this.http.get<SceneReference[]>(`/api/notes/${noteId}/scenes`));
  }

  // Tags --------------------------------------------------------------------------

  /** Charaktere, Orte und Tags aller Szenen – für den Szenenfilter. */
  sceneRelations(): Promise<SceneRelations[]> {
    return this.call(this.http.get<SceneRelations[]>('/api/scene-relations'));
  }

  /** Alle verwendeten Tags des Projekts (mit Anzahl der Szenen). */
  listTags(): Promise<TagSummary[]> {
    return this.call(this.http.get<TagSummary[]>('/api/tags'));
  }

  sceneTags(sceneId: string): Promise<Tag[]> {
    return this.call(this.http.get<Tag[]>(`/api/scenes/${sceneId}/tags`));
  }

  /** Vergibt einen Tag per Name (vorhandene werden wiederverwendet). */
  addSceneTag(sceneId: string, name: string): Promise<Tag[]> {
    return this.call(this.http.post<Tag[]>(`/api/scenes/${sceneId}/tags`, { name }));
  }

  removeSceneTag(sceneId: string, tagId: string): Promise<Tag[]> {
    return this.call(this.http.delete<Tag[]>(`/api/scenes/${sceneId}/tags/${tagId}`));
  }

  // Export --------------------------------------------------------------------

  exportCapabilities(): Promise<ExportCapabilities> {
    return this.call(this.http.get<ExportCapabilities>('/api/export/capabilities'));
  }

  /** Desktop: Backend schreibt die Datei an `filePath`. */
  exportToFile(request: ExportRequest & { filePath: string }): Promise<ExportResult> {
    return this.call(this.http.post<ExportResult>('/api/export', request));
  }

  /** Browser-Modus: Datei kommt als Download zurück. */
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

  // Bilder & Suche ----------------------------------------------------------

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
