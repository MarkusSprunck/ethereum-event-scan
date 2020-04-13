import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[jsonFormatter]'
})
export class JsonFormatterDirective {

    constructor(
        private elementRef: ElementRef,
    ) {
        this.el = this.elementRef.nativeElement;
    }

    private el: HTMLInputElement;


    @HostListener("focus", ["$event.target.value"])
    onFocus(value) {
        this.el.value = this.out(value);
    }

    @HostListener("blur", ["$event.target.value"])
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