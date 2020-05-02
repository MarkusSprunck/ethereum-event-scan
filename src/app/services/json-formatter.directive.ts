import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
    selector: '[appJsonFormatter]'
})
export class JsonFormatterDirective {

    private el: HTMLInputElement;

    constructor(
        private elementRef: ElementRef,
    ) {
        this.el = this.elementRef.nativeElement;
    }

    @HostListener('focus', ['$event.target.value'])
    onFocus(value: any) {
        this.el.value = this.out(value);
    }

    @HostListener('blur', ['$event.target.value'])
    onBlur(value: any) {
        this.el.value = this.into(value);
    }


    into(input: any) {
        return JSON.stringify(JSON.parse(input));
    }

    out(data: any) {
        return JSON.stringify(JSON.parse(data), null, 4);
    }

}
