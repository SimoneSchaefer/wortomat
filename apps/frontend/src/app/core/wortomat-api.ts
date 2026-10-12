import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AppInfo,
  CreateNodeRequest,
  CreateProjectRequest,
  ImageInfo,
  ManuscriptNode,
  MoveNodeRequest,
  ProjectInfo,
  SaveSceneContentRequest,
  SceneContent,
  SearchHit,
  UpdateNodeRequest,
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

  // Projekt -----------------------------------------------------------------

  currentProject(): Promise<ProjectInfo | null> {
    return this.call(this.http.get<ProjectInfo | null>('/api/project'));
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

  saveSceneContent(id: string, request: SaveSceneContentRequest): Promise<SceneContent> {
    return this.call(this.http.put<SceneContent>(`/api/scenes/${id}/content`, request));
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
