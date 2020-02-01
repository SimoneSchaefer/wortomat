import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../services/electron/electron.service';
import { MessageRequest, Channel, MessageResponse, ResponseType } from '../../message/Message';
import { OpenProjectService } from '../../services/open-project.service';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit {
  private selectedContentOption: string;
  private selectedFormatOption: string;
  private contentOptions = ["content", "notes"];
  private formatOptions = [ExportFormat.HTML, ExportFormat.PDFLATEX];
  private success : string;
  private error : string;
  private processing: boolean;
  exportForm : FormGroup;
  existingExports = [];
  constructor(private electronService : ElectronService, private openProjectService : OpenProjectService, private formBuilder : FormBuilder, private alertService: AlertService) { }

  ngOnInit() {
    this.exportForm = this.createFormGroup();
    this.loadExports();
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
    return this.formBuilder.group({
      format : ExportFormat.HTML,
      includeName : true,
      includeSummary : false,
      includeDetailedSummary : false,
      includeContent : true
    });      
  }

  onSubmit() {
    const options : ExportOptions = Object.assign({}, this.exportForm.value);
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
