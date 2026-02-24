# Langchain dependencies
from langchain.document_loaders.pdf import PyPDFDirectoryLoader # Importing PDF loader from Langchain
from langchain.text_splitter import RecursiveCharacterTextSplitter # Importing text splitter from Langchain
from langchain.embeddings import OpenAIEmbeddings # Importing OpenAI embeddings from Langchain
from langchain.schema import Document # Importing Document schema from Langchain
from langchain.vectorstores.chroma import Chroma # Importing Chroma vector store from Langchain
from dotenv import load_dotenv # Importing dotenv to get API key from .env file
from langchain.chat_models import ChatOpenAI # Import OpenAI LLM
import os # Importing os module for operating system functionalities
import shutil # Importing shutil module for high-level file operations
from langchain_google_community import GoogleDriveLoader

GOOGLE_APPLICATION_CREDENTIALS = " "

googleLoader = GoogleDriveLoader(
    folder_id="1yucgL9WGgWZdM1TOuKkeghlPizuzMYb5",
    token_path="~/.credentials",
    # Optional: configure whether to recursively fetch files from subfolders. Defaults to False.
    recursive=False,
)
googleDocs = googleLoader.load()


# PDF file directory (where client pdfs will be located)
DATA_PATH = "/data/"
def load_documents():
    """
    This will load pdf docs from the clients directory, then
    returns a list of document objects
    """

    #inits pdf loader with a specified directory
    doc_loader = PyPDFDirectoryLoader(DATA_PATH)

    #loads pdf docs then returns them as a list of Document objects
    return doc_loader.load()

documents = load_documents()

#inspects contents of first document and metadeta
print(documents[0])

print(googleDocs[0])





