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
    onFocus(value) {
        this.el.value = this.out(value);
    }

    @HostListener('blur', ['$event.target.value'])
    onBlur(value) {
        this.el.value = this.into(value);
    }


    into(input) {
        return JSON.stringify(JSON.parse(input));
    }

    out(data) {
        return JSON.stringify(JSON.parse(data), null, 4);
    }

}
