import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'highlight',
  standalone: true
})

export class HighlightSearch implements PipeTransform {

  transform(value: any, args: any): any {
    if (!args) {
      return value;
    }
    const regExp = new RegExp(args, 'gi');
    return value.replace(regExp, '<mark>$&</mark>');
  }
}
