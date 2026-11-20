/**
 * MIT License
 *
 * Copyright (c) 2019-2025 Markus Sprunck (sprunck.markus@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'highlight',
    standalone: true
})

export class HighlightSearch implements PipeTransform {

    transform(value: any, args: any): string {
        const text = String(value ?? '');
        if (!args) {
            return text;
        }
        const regExp = new RegExp(String(args).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        // Only highlight text outside of HTML tags; the markup itself is escaped at its source
        // and additionally sanitized by Angular when bound to innerHTML.
        return text
            .split(/(<[^>]*>)/)
            .map(part => part.startsWith('<') ? part : part.replace(regExp, '<mark>$&</mark>'))
            .join('');
    }
}
