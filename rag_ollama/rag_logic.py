# Langchain dependencies
from langchain.document_loaders.pdf import PyPDFDirectoryLoader # Importing PDF loader from Langchain
from langchain.text_splitter import RecursiveCharacterTextSplitter # Importing text splitter from Langchain
from langchain.embeddings import OpenAIEmbeddings # Importing OpenAI embeddings from Langchain
from langchain.schema import Document # Importing Document schema from Langchain
from langchain.vectorstores.chroma import Chroma # Importing Chroma vector store from Langchain
from dotenv import load_dotenv # Importing dotenv to get API key from .env file
from langchain.chat_models import ChatOpenAI # Import OpenAI LLM
from langchain_core.prompts import ChatPromptTemplate
import os # Importing os module for operating system functionalities
import shutil # Importing shutil module for high-level file operations
from langchain_google_community import GoogleDriveLoader

"""
GOOGLE_APPLICATION_CREDENTIALS = " "

googleLoader = GoogleDriveLoader(
    folder_id="1yucgL9WGgWZdM1TOuKkeghlPizuzMYb5",
    token_path="~/.credentials",
    # Optional: configure whether to recursively fetch files from subfolders. Defaults to False.
    recursive=False,
)
googleDocs = googleLoader.load()
"""

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

def split_text(documents: list[Document]):
  """
  Split the text content of the given list of Document objects into smaller chunks.
  Args:
    documents (list[Document]): List of Document objects containing text content to split.
  Returns:
    list[Document]: List of Document objects representing the split text chunks.
  """
  # Initialize text splitter with specified parameters
  text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=300, # Size of each chunk in characters
    chunk_overlap=100, # Overlap between consecutive chunks
    length_function=len, # Function to compute the length of the text
    add_start_index=True, # Flag to add start index to each chunk
  )

  # Split documents into smaller chunks using text splitter
  chunks = text_splitter.split_documents(documents)
  print(f"Split {len(documents)} documents into {len(chunks)} chunks.")

  # Print example of page content and metadata for a chunk
  document = chunks[0]
  print(document.page_content)
  print(document.metadata)

  return chunks # Return the list of split text chunks

#path to the directory to save chroma database
CHROMA_PATH = "chroma"

def save_to_chroma(chunks: list[Document]):
    """
    Save the given list of Document objects to a Chroma database.
    Args:
    chunks (list[Document]): List of Document objects representing text chunks to save.
    Returns:
    None
    """

    #clear out existing data
    if os.path.exists(CHROMA_PATH):
       shutil.rmtree(CHROMA_PATH)
    
    chromaDatabase = Chroma.from_documents(
       chunks,
       OpenAIEmbeddings(),
       persist_directory=CHROMA_PATH
    )

    chromaDatabase.persist()
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

def generate_data_store():
   #function to generate vector database in chroma from documents
   documents = load_documents() #load documents from a source
   chunks = split_text(documents) # splits docs into managable chunks
   save_to_chroma(chunks) #saves the processed data into a data store

load_dotenv()
generate_data_store()

query_text = "Explain how the YOLO method works"

PROMPT_TEMPLATE = """
Answer the question based only on the following context:
{context}
 - -
Answer the question based on the above context: {question}
"""

def query_rag(query_text):
  """
  Query a Retrieval-Augmented Generation (RAG) system using Chroma database and OpenAI.
  Args:
    - query_text (str): The text to query the RAG system with.
  Returns:
    - formatted_response (str): Formatted response including the generated text and sources.
    - response_text (str): The generated response text.
  """
  # YOU MUST - Use same embedding function as before
  embedding_function = OpenAIEmbeddings()

  # Prepare the database
  db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
  
  # Retrieving the context from the DB using similarity search
  results = db.similarity_search_with_relevance_scores(query_text, k=3)

  # Check if there are any matching results or if the relevance score is too low
  if len(results) == 0 or results[0][1] < 0.7:
    print(f"Unable to find matching results.")

  # Combine context from matching documents
  context_text = "\n\n - -\n\n".join([doc.page_content for doc, _score in results])
 
  # Create prompt template using context and query text
  prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
  prompt = prompt_template.format(context=context_text, question=query_text)
  
  # Initialize OpenAI chat model
  model = ChatOpenAI()

  # Generate response text based on the prompt
  response_text = model.predict(prompt)
 
   # Get sources of the matching documents
  sources = [doc.metadata.get("source", None) for doc, _score in results]
 
  # Format and return response including generated text and sources
  formatted_response = f"Response: {response_text}\nSources: {sources}"
  return formatted_response, response_text

# Let's call our function we have defined
formatted_response, response_text = query_rag(query_text)
# and finally, inspect our final response!
print(response_text)
