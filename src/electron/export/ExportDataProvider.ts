import { ChapterLoader } from "../services/loader/ChapterLoader"
import { ChapterEntity } from '../../app/entity/ChapterEntity';
import { Repository, getRepository } from 'typeorm';
import { Logger } from '../services/Logger';
import { BaseEntity } from "../../app/entity/_baseEntity";
import { PartLoader } from "../services/loader/PartLoader";
import { PartEntity } from "../../app/entity/PartEntity";


export class ExportDataProvider {

  public constructor(private partloader: PartLoader) { }

  public collectData(): Promise<string> {
    let html = "";
    let $this = this;
    let repo = getRepository(ChapterEntity);


    return new Promise<string>(function (resolve, reject) {

      $this.partloader.loadAll()      
        .then(function (entities) {
          let parts = entities as BaseEntity[];

          //order chapters and scenes first...
          for (let entity of parts) {
            let part = entity as PartEntity;
            part.children.sort(function (a, b) {
              return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0);
            });
            /*for (let chapter of part.children) {
              chapter.children.sort(function (a, b) {
                return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0);
              });
            }*/
          }


          //append HTML
          for (let entity of parts) {
            let part = entity as PartEntity;
            for (let chapter of part.children) {
              html += `<h1>${chapter.name}</h1>`;
              //for (let scene of chapter.scenes) {
                html += chapter.notes;
              //}
            }            
          }
          resolve(html);
        }).catch(function(err) {
          Logger.error("An errr occured while collecting HTML: " + err);
          reject(err);
        });
    });
  }
}