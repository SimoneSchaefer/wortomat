import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppInfo,
  AppSettings,
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
  ImageInfo,
  ManuscriptNode,
  MapSummary,
  MoveNodeRequest,
  MoveNoteGroupRequest,
  NoteContent,
  NoteGroup,
  NoteSummary,
  PlaceMap,
  ProjectInfo,
  ProjectListEntry,
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

  /** Ordnerinhalt für den Dateiauswahl-Dialog (Browser-Modus); ohne `dir` der Standardordner. */
  listDirectory(dir?: string): Promise<DirectoryListing> {
    const params: Record<string, string> = dir ? { dir } : {};
    return this.call(this.http.get<DirectoryListing>('/api/files', { params }));
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

  /** Heute geschriebene Wörter (Schreib-Log; der Tag beginnt um 4 Uhr). */
  writingToday(): Promise<WritingDay> {
    return this.call(this.http.get<WritingDay>('/api/writing-log/today'));
  }

  /** Reiner Text aller Szenen (Absätze durch Zeilenumbrüche getrennt). */
  sceneTexts(): Promise<SceneText[]> {
    return this.call(this.http.get<SceneText[]>('/api/scene-texts'));
  }

  /** Schreib-Log je Tag von `from` bis `to` (YYYY-MM-DD, inklusive). */
  writingLog(from: string, to: string): Promise<WritingDay[]> {
    return this.call(this.http.get<WritingDay[]>('/api/writing-log', { params: { from, to } }));
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

  // Karten ------------------------------------------------------------------------

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

  /** Karten, auf denen ein Ort eingezeichnet ist. */
  mapsWithPlace(noteId: string): Promise<PlaceMap[]> {
    return this.call(this.http.get<PlaceMap[]>(`/api/notes/${noteId}/maps`));
  }

  deleteMap(id: string): Promise<void> {
    return this.call(this.http.delete<void>(`/api/maps/${id}`));
  }

  // Tags --------------------------------------------------------------------------

  /** Charaktere, Orte und Tags aller Szenen – für den Szenenfilter. */
  sceneRelations(): Promise<SceneRelations[]> {
    return this.call(this.http.get<SceneRelations[]>('/api/scene-relations'));
  }

  // Reihenfolge der Handlung -------------------------------------------------

  storyMarks(): Promise<StoryMark[]> {
    return this.call(this.http.get<StoryMark[]>('/api/story/marks'));
  }

  /** Ersetzt die ganze Reihenfolge samt Abschnittsmarken; liefert Baum und Marken neu. */
  saveStory(request: SaveStoryRequest): Promise<StoryState> {
    return this.call(this.http.put<StoryState>('/api/story', request));
  }

  // Handlungsstränge --------------------------------------------------------

  /** Alle Stränge in ihrer Reihenfolge (mit Anzahl der Szenen). */
  listStrands(): Promise<Strand[]> {
    return this.call(this.http.get<Strand[]>('/api/strands'));
  }

  /** Ohne Farbe bekommt der Strang die bisher seltenste. */
  createStrand(name: string, color?: StrandColor): Promise<Strand> {
    return this.call(this.http.post<Strand>('/api/strands', { name, color }));
  }

  updateStrand(id: string, changes: { name?: string; color?: StrandColor }): Promise<Strand> {
    return this.call(this.http.patch<Strand>(`/api/strands/${id}`, changes));
  }

  /** Liefert alle Stränge in der neuen Reihenfolge. */
  moveStrand(id: string, beforeId: string | null): Promise<Strand[]> {
    return this.call(this.http.post<Strand[]>(`/api/strands/${id}/move`, { beforeId }));
  }

  /** Die Szenen bleiben, sie verlieren nur die Zuordnung. */
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

  /** Was sich der Export-Dialog für das geöffnete Buch gemerkt hat. */
  exportSettings(): Promise<ExportSettingsResponse> {
    return this.call(this.http.get<ExportSettingsResponse>('/api/export/settings'));
  }

  saveExportSettings(settings: ExportSettings): Promise<ExportSettings> {
    return this.call(this.http.put<ExportSettings>('/api/export/settings', settings));
  }

  exportPreview(includeSceneTitles: boolean): Promise<ExportPreview> {
    return this.call(
      this.http.get<ExportPreview>('/api/export/preview', {
        params: { sceneTitles: String(includeSceneTitles) },
      }),
    );
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
