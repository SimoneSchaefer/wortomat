import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../services/electron/electron.service';
import { MessageRequest, Channel, MessageResponse, ResponseType } from '../../message/Message';
import { OpenProjectService } from '../../services/open-project.service';

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
  constructor(private electronService : ElectronService, private openProjectService : OpenProjectService) { }

  ngOnInit() {
  }

  export(): void {
    let $this = this;
    $this.processing = true;
    $this.success = "";
    $this.error = "";
    let options = {
      format : ExportFormat.HTML
    }
    this.electronService.send(new MessageRequest(Channel.EXPORT, function (evt, response: MessageResponse) {
      $this.processing = true;
      if (response.responseType === ResponseType.SUCCESS) {
        $this.success = response.msg;
      } else {
        $this.error = response.msg;
      }
    }, {
        options : options,                 
        connectionName : $this.openProjectService.identifier 
    }));
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
