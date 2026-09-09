# SNOMED REFERENCE SET TOOL

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

## Setup

- Install Node (<https://nodejs.org/en/download/>)
- Run these commands in a command prompt from the root folder of the project to install the Angular CLI and then the project. Review the log to identify vulnerabilities potentially related to older versions of libraries that require updating.

```
npm install -g @angular/cli
npm install
```

There are some properties that need to be configured to the specific environment in:

- /src/environments/environment.ts (for local installs)
- /src/environments/environment.prod.ts (for server installs)

```
export const environment = {
	production: true,
	restUrl: '',
	restContextPath: '/refsetservice/',
	mockRestData: false,
	refsetsExportableAsFreeset: '787778008',
	freesetUrl: 'https://gps.snomed.org',
};
```

For local installs configure the URL to the java backend application using the "restUrl" property in the /src/environments/environment.ts file. This needs to be set appropriately for
single sign on as described below.

## Backend Application

The backend Java application is its own GitHub project. There are additional configuration steps outlined there:

- https://github.com/IHTSDO/snomed-refset-service/tree/main

## Application Authentication

- This application uses single sign on to authenticate with IMS. Users must have accounts in IMS.
- For a local install you will need to install NGINX proxy server and add the following configuration to to the nginx.conf file under the /conf directory, changing the IMS URL and
  port numbers to match you local setup. The standard URL for local server is http://local.ihtsdotools.org:8888

```
http {
    include    mime.types;
	proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
	client_max_body_size 50M;
    server {
		listen		8888;
        server_name localhost;

        ssl_session_timeout  5m;

		# to angular app
        location / {
            proxy_pass http://localhost:4200;
        }
		location /refsetservice {
            proxy_pass http://127.0.0.1:8080/refsetservice;
        }
		location /ims-api {
            proxy_pass https://dev-ims.ihtsdotools.org/api;
            proxy_pass_request_body off;
            proxy_set_header Content-Length "";
            proxy_set_header Accept "application/json";
            proxy_method GET;
        }
    }
}
```

## Local Hybrid Development (UI against a remote API)

You can run the Angular UI on `localhost:4200` against a remote (or local) API without sharing the same origin. The `login()` flow automatically passes `returnUrl=http://localhost:4200` so the API redirects back with the JWT in the URL hash after Entra OAuth — no cross-origin session cookies required.

**Steps:**

1. Set `restUrl` in `src/environments/environment.ts` to a resolvable API host that has CORS open for `localhost:4200`:

    ```ts
    // Same-origin local API:
    restUrl: 'http://localhost:8888';

    // Remote mt2-dev (use the .com alias — the .tools domain may not resolve):
    restUrl: 'https://mt2-dev.westcoastinformatics.com';
    ```

2. Run `ng serve` as normal.
3. Click **Log In** — you will be redirected through Entra and land back on `localhost:4200/?auth_login=success#auth_token=<jwt>`.

> **Note:** The hash-token path requires the API-side changes described in the `SecurityController` plan to be deployed. Until then, run a local API with `ENTRAID_POST_LOGIN_REDIRECT_URI=http://localhost:4200/` as an alternative.
>
> Same-origin cookie-based deployments (hosted environments where UI and API share an origin) are completely unaffected — the hash-token path is only activated when `#auth_token` is present in the redirect URL.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Additional Configuration

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Suggestions for upgrading versions and managing change over time

Run `npm outdated` to understand situations where package.json references are not current versions of things.

Understand the difference between "^" and "~" in package versions and generally be consistent in their use. "^" is generally preferred.

## AI instruction documentation

This repository includes workspace-level AI and Copilot guidance for Angular code generation and custom agent behavior.

- Repository-wide AI coding expectations: `.github/copilot-instructions.md`
- Workspace agent rules and behavior: `.agents/AGENTS.md`
- Shared Angular conventions: `.github/references/angular-shared.md`
- Angular code generation skill: `.agents/skills/angular-developer/SKILL.md`
- Angular customization helper skill: `.github/skills/angular-agent/SKILL.md`
- AI skills setup and extension guidance: `.github/AI_SKILLS_SETUP.md`

> Do not read the large tutorial archive `.github/skills/angular-agent/references/angular-ai-tutorial-reference.md` unless the task explicitly requires tutorial or setup content.
