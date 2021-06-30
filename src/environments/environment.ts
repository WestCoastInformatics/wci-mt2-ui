// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

let restUrl = '${RT2GUI_SERVICE_API_URL}';
let snomedBrowserUrl = '${RT2GUI_SNOMED_BROWSER_URL}'

if (restUrl == '${RT2GUI' + '_SERVICE_API_URL}'){
    restUrl = 'http://localhost:8080';
    //restUrl = 'http://localhost:8080';
}

if (snomedBrowserUrl == '${RT2GUI' + '_SNOMED_BROWSER_URL}'){
  snomedBrowserUrl = 'https://browser.ihtsdotools.org/?perspective=full';
}

export const environment = {
    production: false,
    restUrl: restUrl,
    snomedBrowserUrl: snomedBrowserUrl,
    mockRestData: false 
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
