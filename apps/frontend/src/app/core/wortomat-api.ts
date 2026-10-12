import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppInfo,
  AppSettings,
  CreateNodeRequest,
  CreateNoteRequest,
  CreateProjectRequest,
  ImageInfo,
  ManuscriptNode,
  MoveNodeRequest,
  NoteContent,
  NoteSummary,
  ProjectInfo,
  ProjectListEntry,
  SceneReference,
  SaveDocumentRequest,
  SceneContent,
  SearchHit,
  Tag,
  TagSummary,
  UpdateAppSettingsRequest,
  UpdateNodeRequest,
  UpdateNoteRequest,
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
