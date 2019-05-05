import { EventEmitter } from 'electron';
import { Logger } from '../services/Logger';
//import { LoaderFactory } from '../loader/LoaderFactory';
import { UiMessageHandler } from '../services/UiMessageHandler';
/*import { ExportDataProvider } from '../export/ExportDataProvider';
import { Exporter } from '../export/Exporter';
import { PDFExporter } from '../export/PDFExporter';
import {PDFHTMLExporter } from '../export/PDFHTMLExporter';
import {PDFLatexExporter } from '../export/PDFLatexExporter';
//import { ChapterLoader } from '../loader/ChapterLoader';*/
import { SettingsProvider } from '../services/SettingsProvider';
import { DBService } from '../services/DBService';
import { Initializer } from './Initializer';
import { MessageRequest, MessageResponse, Channel, ResponseType, FileFormat } from "../../app/message/Message"
import { LoaderFactory } from '../services/loader/LoaderFactory';
//import { PartLoader } from '../loader/PartLoader';


/**
 * This class handles communication between web-frontend
 * and electron-backend. 
 * Every Message#Channel is explictely mapped to a specific listener
 */
export class MainWindowEventListener {

    constructor(
        private emitter: EventEmitter,
        private initializer: Initializer,
        private messageHandler: UiMessageHandler,
        private settingsHandler: SettingsProvider,
        private dbHandler: DBService) {

        this.registerOnAppyReadyListener();
        this.registerStoreSettingsListener();
        this.registerLoadAllListener();
      /*  this.registerExportSettingsListener();*/
        this.registerCreateOrUpdateListener();
        this.registerDeleteSingleListener();
        this.registerLoadSingleListener();
        this.registerOpenProjectListener();
        this.registerCloseProjectListener();
        
    }


    /** 
     * Initialize Application,
     * once the frontend has registered
     * 
     * #Channel.APP_READY
     * 
     * Required data: 
     * - no additional data required.
     * 
    */
    private registerOnAppyReadyListener(): void {
        let $this = this;
        console.log('register stuff');
        this.emitter.on(Channel.APP_READY, function (_: any, request: MessageRequest) {
            Logger.info("I'm listening..");
            $this.initialize(request);
        });
    }


    /**
     * Called when user wants to store settings. 
     * 
     * #Channel.SETTINGS_STORED
     * 
     * Required data: 
     * - request.data, which is of type SettingsHandler#SettingsObject
     */
    private registerStoreSettingsListener(): void {
        let $this = this;
        this.emitter.on(Channel.SETTINGS_STORED, function (evt: any, request: MessageRequest) {
            $this.respond(request.identifier, $this.settingsHandler.saveConfiguration(request.data));
        });
    }





  
    /** 
    * 
    * #Channel.OPEN_PROJECT 
    * 
    * Required data: 
    * - request.data.entity, which is of type AbstractBaseEntity
    * 
    * Response: name of the DB connection to use. This name has to be passed for every further request
    */
    private registerOpenProjectListener(): void {
        let $this = this;
        this.emitter.on(Channel.OPEN_PROJECT, function (evt: any, request: MessageRequest) {
            $this.dbHandler.createConnection($this.settingsHandler.getDbNameForProject(request.data.entity))
                .then((result) => $this.respond(request.identifier, ResponseType.SUCCESS, result.name))
                .catch(error => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, error));        
        });
    }


  
    /** 
    * 
    * #Channel.CLOSE_PROJECT 
    * 
    * Required data: 
    * - request.data.connectionName, which is used to find the project database
    */
   private registerCloseProjectListener(): void {
    let $this = this;
    this.emitter.on(Channel.CLOSE_PROJECT, function (evt: any, request: MessageRequest) {
        $this.dbHandler.closeConnection(request.data.connectionName)
            .then((result) => $this.respond(request.identifier, ResponseType.SUCCESS))
            .catch(error => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, error));
        });
    }





    /** 
    * Called to load all entities of type #dataType
    * 
    * #Channel.LOAD_SINGLE 
    * 
    * Required data: 
    * - request.data.dataType, which is of type Message#DataType
    * - request.data.connectionName, which is used to find the project database
    */
   private registerLoadAllListener(): void {
    let $this = this;

    this.emitter.on(Channel.LOAD_ALL, function (evt: any, request: MessageRequest) {
        let loader = LoaderFactory.getLoader(request.data.dataType, request.data.connectionName, $this.dbHandler);
        Logger.debug(`load all: ` + JSON.stringify(request));
        loader.loadAll()
            .then((entities) => $this.respond(request.identifier, ResponseType.SUCCESS, "", {entities: entities}))
            .catch(error => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, error));
    });
}



    /** 
    * Called when an entity shall be created or updated.
    * 
    * #Channel.CREATE_OR_UPDATE 
    * 
    * Required data: 
    * - request.data.dataType, which is of type Message#DataType
    * - request.data.model, which is of type AbstractBaseEntity
    * - request.data.connectionName, which is used to find the project database

    */
    private registerCreateOrUpdateListener(): void {
        let $this = this;
        this.emitter.on(Channel.CREATE_OR_UPDATE, function (evt: any, request: MessageRequest) {
            Logger.info("saving or updating entity of type " + request.data.dataType + " and connection " + request.data.connectionName);
            let loader = LoaderFactory.getLoader(request.data.dataType, request.data.connectionName, $this.dbHandler);
            loader.createOrUpdate(request.data.entity)
                .then((entity) => $this.respond(request.identifier, ResponseType.SUCCESS, "", {entity: entity}))
                .catch(error => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, error));
        });
    }




    /** 
    * Called when user wants to export his/her novel.
    * 
    * #Channel.EXPORT 
    * 
    * Required data:
    * - request.data.format, which is of type #FileFormat
    * - projectId, which is of type number
    */
    /*private registerExportSettingsListener(): void {
        let $this = this;
        this.emitter.on(Channel.EXPORT, function (evt: any, request: MessageRequest) {
            Logger.debug(`export to format ${request.data.format}`)
            let dataProvider = new ExportDataProvider(new PartLoader(), request.data.projectId);
            let exporter : Exporter;
            Logger.info("exporting to " + request.data.format);
            if ((request.data.format) == FileFormat.PDF) {
                exporter = new PDFExporter();
            } else if ((request.data.format) == FileFormat.HTML) {
                exporter = new PDFHTMLExporter();              
            } else if ((request.data.format) == FileFormat.PDFLATEX) {
                exporter = new PDFLatexExporter();              
            }        
            if (exporter) {
                Logger.debug(`export to format ${request.data.format}`)

                exporter.export($this.settingsHandler, dataProvider)
                .then(path => $this.respond(request.identifier, ResponseType.SUCCESS, path))
                .catch(err => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, err));
            }    else {
                Logger.error(`no exporter found`)

            }
        });
    }*/



    /** 
    * Called to load an entity with a specific id
    * 
    * #Channel.LOAD_SINGLE 
    * 
    * Required data: 
    * - request.data.dataType, which is of type Message#DataType
    * - request.data.id, which is of type number
    * - request.data.connectionName, which is used to find the project database

    */
    private registerLoadSingleListener(): void {
        let $this = this;
        this.emitter.on(Channel.LOAD_SINGLE, function (evt: any, request: MessageRequest) {
            let loader = LoaderFactory.getLoader(request.data.dataType, request.data.connectionName, $this.dbHandler);
            loader.loadSingle(request.data.id)
                .then((entity) => $this.respond(request.identifier, ResponseType.SUCCESS, "", {entity: entity}))
                .catch(error => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, error));
        });
    }







    /** 
    * Called to delete an entity with a specific id
    * 
    * #Channel.DELETE_SINGLE 
    * 
    * Required data: 
    * - request.data.dataType, which is of type Message#DataType
    * - request.data.id, which is of type number
    *  - request.data.connectionName, which is used to find the project database

    */
    private registerDeleteSingleListener(): void {
        let $this = this;
        this.emitter.on(Channel.DELETE_SINGLE, function (evt: any, request: MessageRequest) {
            let loader = LoaderFactory.getLoader(request.data.dataType, request.data.connectionName, $this.dbHandler);
            loader.removeSingle(request.data.id)
                .then(() => $this.respond(request.identifier, ResponseType.SUCCESS))
                .catch(error => $this.respond(request.identifier, ResponseType.ERROR_GENERAL, error));
        });
    }




    private initialize(request: MessageRequest) {
        this.initializer.initialize()
            .then(() => this.respond(request.identifier, ResponseType.SUCCESS))
            .catch(error => this.respond(request.identifier, ResponseType.ERROR_GENERAL, error))
    }


    private respond(identifier: string, responsetype: ResponseType, msg?: string, data?: any) {
        Logger.debug("respond (" + responsetype + "): " + msg);
        this.messageHandler.sendResponse(new MessageResponse(identifier, responsetype, msg, data));
    }
}