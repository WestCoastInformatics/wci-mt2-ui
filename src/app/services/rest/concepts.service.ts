import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Concept } from 'src/app/models/concept';
import { Observable } from 'rxjs';
import { RestService, RestWrapper } from './rest.service';

@Injectable({
    providedIn: 'root'
})
export class ConceptsService {

    constructor(private httpClient: HttpClient,
        private restService: RestService) {
    }

    getConcepts(): Observable<RestWrapper<Concept>> {
        return this.restService.makeCall('/concepts');
    }
}