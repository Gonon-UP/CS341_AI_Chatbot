# Research Chatbot

> [!IMPORTANT]
> To access the Chatbot, click this [link](http://10.12.116.143:3000).

Here is the chatbot's tree format:

```
CS341_AI_Chatbot   
└─── app
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
    │   ├─── tests
    │   │       chatLogic.test.js
    │   │       mainScript.test.js
    │   │
    │   └─── uploads
    │        └─── {ChatbotMeetingID}
    │                user_document.pdf
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
        * Note that a `page` is a unique Chatbot Meeting session. 
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
    * `{ChatbotMeetingID}/*`: Contains files uploaded for each Chatbot session (ChatbotMeetingID).
        * These are stored on the VM but are tracked and referenced in the `documents` page in the database as well.
        * When a Chatbot meeting is deleted, all relevant database information and local documents are deleted as well.

### `app/routes` Directory
* `delete*.js`: Files that handle database queries to delete Pages/Topics/URLs/Documents.
* `load*.js`: Files that handle database queries to retrieve Pages/Topics/URLs/Documents.
* `save*.js`: Files that handle database queries to save Pages/Topics/URLs/Documents.
* `users.js` and `index.js`: Files that handle searching on the web for online sources.

# How To Use the Chatbot

![Chatbot Website](./Chatbot.png)

The main functionality of the Chatbot is the middle panel, where the conversation with the LLM occurs. You are able to type in the text area below, and press Enter to query your response.

The website has some functionality to make the user experience more useful and informative.

## The Left Panels
On the left size of the page, you can add `Sources` to upload custom data for the Chatbot to parse and interact with.

The `+ Add Web Sources` button and `↑` button both launch an intuitive popup for source selection. You can search the web, select your desired webpage, and add it to the Chatbot's listed resources. In Upload Documents popup, you can select files from your computer's local directory for Chatbot use.

Below this panel is the `Previous Meetings` section where you can click through the previous sessions you've had with the Chatbot. Each of these pages store their specific URLs, uploaded documents, selected topics, and Chatbot message history. To create a new page, select the `New Page` button in the top right corner of the screen. This will create a fresh interface in which you can manipulate its data for your needs.

## The Right Panels
On the right size of the page, the `Topics` section is where you may select the Chatbot's specific field of expertise. This switches between the LLM models, allowing for a broader range of highly specific information and analysis.

The `Upcoming Tasks` section is a user tool that is meant to keep track of upcoming tasks and deadlines. This is an extra feature and does not impact the Chatbot's responses.