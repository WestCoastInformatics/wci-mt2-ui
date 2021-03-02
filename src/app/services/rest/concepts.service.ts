import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Concept } from '../../models/concept';
import { Observable } from 'rxjs';
import { RestApiCallService, RestWrapper } from './rest-api-call.service';

@Injectable({
    providedIn: 'root'
})
export class ConceptsService {

    constructor(private httpClient: HttpClient,
        private restService: RestApiCallService) {
    }

    getConcepts(): Observable<RestWrapper<Concept>> {
        return this.restService.makeCall('/concepts');
    }
}