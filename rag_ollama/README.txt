to activate the backend rag logic, go into rag_ollama, (directory where this readme file is, 
and run in the command console, source raglogic/bin/activate

then, run uvicorn ragserver:bridge --host 0.0.0.0 --port 8000

then go into CS341chatbot/app and run npm start

you should be running the uvicorn and npm start in seperate terminals.

happy websiting!
