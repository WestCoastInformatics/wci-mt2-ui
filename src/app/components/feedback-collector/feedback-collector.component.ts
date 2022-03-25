import { Component, Input, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';

declare global {
    interface Window { ATL_JQ_PAGE_PROPS: any; }
  }

window.ATL_JQ_PAGE_PROPS = window.ATL_JQ_PAGE_PROPS || {};

@Component({
    selector: 'feedback-collector',
    templateUrl: './feedback-collector.component.html'
})
export class FeedbackCollectorComponent implements OnInit {

    constructor(
        private router: Router
    ) { }

    ngOnInit() {

        // show feedback button if not on landing page.
        this.router.events.subscribe((event: any) => {
            if (event instanceof RoutesRecognized) {
                if (event.url.split('/')[1] !== '') {
                    this.showFeedbackButton();
                }
            }
        });
    }

    showFeedbackButton() {
        // Requires jQuery!
        jQuery.ajax({
            //url: this.project.url,
            url: "https://jira.ihtsdotools.org/s/ce29ab2ab8a9b98d620a1011508f9997-T/en_USgb930d/64027/64/1.4.27/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?locale=en-US&collectorId=856ac7f3",
            type: 'get',
            cache: true,
            dataType: 'script'
        });

        window.ATL_JQ_PAGE_PROPS =  {
            "triggerFunction": function(showCollectorDialog) {
                jQuery("#submit").on('click', function(e) {
                    e.preventDefault();
                    showCollectorDialog();
                });
            }
        };
    }
}
