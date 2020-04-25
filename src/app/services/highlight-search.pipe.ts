import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlight'
})

export class HighlightSearch implements PipeTransform {

    transform(value: any, args: any): any {
        if (!args) {
            return value;
        }
        let regExp = new RegExp(   args, 'gi');
        return value.replace(regExp, "<mark>$&</mark>");
    }
}