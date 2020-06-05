import {Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {UtilsService} from "./utils.service";
import {ActivatedRoute} from "@angular/router";
import {ProviderService} from "./provider.service";

@Injectable()
export class ThemeService {
    private _darkTheme = new Subject<boolean>();
    isDarkTheme = this._darkTheme.asObservable();

    constructor(private route: ActivatedRoute, public entity: ProviderService) {
        this.route.queryParams.subscribe(params => {
            if (params.dark) {
                this._darkTheme.next(params.dark === 'true');
            }
        });
    }

    setDarkTheme(isDarkTheme: boolean): void {
        this._darkTheme.next(isDarkTheme);
        UtilsService.updateURLParameter('dark', '' + isDarkTheme);
    }
}