import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../services/electron/electron.service';
import { MessageRequest, Channel, MessageResponse, ResponseType } from '../../message/Message';
import { OpenProjectService } from '../../services/open-project.service';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { ExportSettings } from './export.settings.model';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit {
  selectedContentOption: string;
  selectedFormatOption: string;
  contentOptions = ["title", "summary", "extended_summary", "content"];
  formatOptions = [ExportFormat.HTML, ExportFormat.PDFLATEX];
  processing: boolean;
  exportForm : FormGroup;
  existingExports = [];
  constructor(private electronService : ElectronService,
     private openProjectService : OpenProjectService, 
     private formBuilder : FormBuilder, 
     private alertService: AlertService
     ) { }

  ngOnInit() {
    this.exportForm = this.createFormGroup();
    this.loadExports();
  }


  getExportSettings() : ExportSettings {
    let state = localStorage.getItem('export_settings');
    if (state) {
        return JSON.parse(state);
    } else {
        return new ExportSettings();
    }
  }

  saveExportSettings() {
    localStorage.setItem('export_settings', JSON.stringify(this.exportForm.value));
  }

  loadExports() {
    let $this = this;
    this.electronService.send(new MessageRequest(Channel.LOAD_EXPORTS, function (evt, response: MessageResponse) {
      if (response.responseType === ResponseType.SUCCESS) {
        $this.existingExports = response.data.filenames.sort().reverse();
      }
    }));
  }

  createFormGroup() {
    const settings = this.getExportSettings();
    return this.formBuilder.group({
      format : settings.format,
      include: new FormControl(settings.include),
      author: settings.author,
      title: settings.title,
      isbn: settings.isbn,
      pageHeight: settings.pageHeight,
      pageWidth: settings.pageWidth,
      marginInner: settings.marginInner,
      marginOuter: settings.marginOuter,
      marginTop: settings.marginTop,
      marginBottom: settings.marginBottom
    });      
  }

  onSubmit() {
    this.saveExportSettings();
    const options : ExportSettings = this.getExportSettings()
    let $this = this;
    $this.processing = true;
    this.electronService.send(new MessageRequest(Channel.EXPORT, function (evt, response: MessageResponse) {
      $this.processing = false;
      if (response.responseType === ResponseType.SUCCESS) {
        $this.alertService.success('EXPORT.SUCCESS');
        $this.loadExports();
      } else {
        $this.alertService.error('EXPORT.ERROR');
      }
    }, {
        options : options,                 
        connectionName : $this.openProjectService.identifier 
    }));
  }


  openExport(filename: string) {
    this.electronService.send(new MessageRequest(Channel.OPEN_EXPORT, function (evt, response: MessageResponse) {
    }, {filename: filename}));

  }

  export(): void {
    
  }

}


export class ExportOptions {
  format : ExportFormat;
  includeName : boolean;
  includeSummary : boolean;
  includeDetailedSummary : boolean
}

export enum ExportFormat {
  HTML = "HTML",
  //PDF,
  PDFLATEX = "PDFLATEX"

}
