import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusIcon'
})
export class StatusIconPipe implements PipeTransform {

  transform(value: number, args?: any): any {
    let icon = 'question';
    if (value === 0) {
      icon = 'signature';
    } else if (value === 1) {
      icon = 'file-alt';
    } else if (value === 2) {
      icon  = 'check';
    } else if (value === 3) {
     icon = 'check-double'; 
    }
    return `<i class="fa fa-icon fa-${icon}">`;
  }

}
