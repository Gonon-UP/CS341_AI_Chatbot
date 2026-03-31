# Research Chatbot

Here is the chatbot's tree format:

```
CS341_AI_Chatbot   
└───app
    │   .env
    │   aibot.sql
    │   app.js
    │   babel.config.cjs
    │   dbms.js
    │   package-lock.json
    │   package.json
    │
    ├─── public
    │   │   index.html
    │   │
    │   ├─── javascripts
    │   │       chatLogic.js
    │   │       mainScript.js
    │   │
    │   ├─── popups
    │   │       addDocuments.html
    │   │       addSources.html
    │   │
    │   ├─── stylesheets
    │   │       documentPopup.css
    │   │       sourcePopup.css
    │   │       style.css
    │   │
    │   └─── tests
    │           chatLogic.test.js
    │           mainScript.test.js
    │
    └─── routes
            deleteDocument.js
            deletePage.js
            deleteURL.js
            index.js
            loadDocuments.js
            loadPage.js
            loadPages.js
            loadTopics.js
            loadURL.js
            saveDocument.js
            savePage.js
            saveTitle.js
            saveTopics.js
            saveURL.js
            searchWeb.js
            users.js
```

## `app` Directory
This is the main functionality for the chatbot, it utliizes a few different features: `URL and Document Sources`, `SQL Handling`, and `General Website Code`.

### Standalone Files
* `.env`: contains the API key necessary for the URL search functionality to work. This implements the Brave Search API.
* `aibot.sql`: contains the Database structure for the project, including `pages`, `topics`, `urls`, and `documents` tables.
    * Each `page` entry is connected to their own list of `topics`, `urls`, and `documents`, all referenced by their respective page ID.
* `app.js`: routes all of the files in the `app/routes` directory so they might be utilized by the app.
    * Routes contain CRUD and general manipulation of the database.
* `dbms.js`: Database manager that is able to reference the databases, referenced by all `app/routes` files (provided by Dr. Cenek).
* `babel.config.cjs`, `package-lock.json` and `package.json`: reference relevant dependencies and packages necessary for all website functionality.

### `app/public` Directory
* `index.html`: The main HTML file for the website page, contains separate panels for Sources, Previous Meetings, Chatbot, Topics, and Upcoming Tasks.

* `javascripts/`:
    * `chatLogic.js`: Generates the HTML necessary for displaying various data on the website, also does some code validation.
    * `mainScipt.js`: Where all the rest of the JS lives for the website, calls routes to manipulate the database, handles listeners, etc.
* `popups/`:
    * `addDocuments.html`: Defines the popup that appears when you upload documents.
    * `addSources.html`: Defines the popup that appears when you search the web.
* `stylesheets/`:
    * `documentPopup.css`: Stylesheet for the Document Popup
    * `sourcePopup.css`: Stylesheet for the Sources Popup
    * `style.css`: The main stylesheet for the main webpage layout.
* `tests/`:
    * `chatLogic.test.js` and `mainScript.test.js`: Contain Jest testing functions for code coverage.
* `uploads/`:
    * `{pageID}/*`: Contains files uploaded for each Chatbot session (pageID).
        * These are stored on the VM but are tracked and referenced in the `documents` page in the database as well.
        * When a Chatbot meeting is deleted, all relevant database information and local documents are deleted as well.

### `app/routes` Directory
* `delete*.js`:
* `load*.js`:
* `save*.js`:
* `users.js` and `index.js`: 