# Langchain dependencies
from langchain_community.document_loaders import PyPDFDirectoryLoader # Importing PDF loader from Langchain
from langchain_text_splitters import RecursiveCharacterTextSplitter # Importing text splitter from Langchain
# not nessasary due to using llama3 for imbedding and testing -- from langchain_openai import OpenAIEmbeddings # Importing OpenAI embeddings from Langchain
from langchain_ollama import OllamaEmbeddings, ChatOllama  #imports nessasary functions for langchain to work with llama3 model
from langchain_core.documents import Document # Importing Document schema from Langchain
#from langchain_community.vectorstores import Chroma # Importing Chroma vector store from Langchain
from dotenv import load_dotenv # Importing dotenv to get API key from .env file
# No longer nessasary due to using llama3 for imbedding and testing --  from langchain_openai import ChatOpenAI # Import OpenAI LLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma
from langchain_community.document_loaders import UnstructuredURLLoader
import os # Importing os module for operating system functionalities
import shutil # Importing shutil module for high-level file operations

# ragserver is started via uvicorn server:bridge --host 0.0.0.0 --port 8000 (0.0.0.0 means to listen on all networks) (8000 is ocmmonly used for any python dev but a different port
# should be picked to work with our port exceptions)
# to modify the front end to use the rag, change the ollamaURL const to equal 'http://10.12.116.143:8000/api/generate'

# PDF file directory (where client pdfs will be located)
# website upload path is r"../app/uploads/1"

DATA_PATH = r"../app/uploads"
def load_documents():
    """
    This will load pdf docs from the clients directory, then
    returns a list of document objects
    """
    if not os.path.exists(DATA_PATH):
        raise ValueError(f"website uploads directory doesn't exist: {DATA_PATH}")
    #inits pdf loader with a specified directory
    doc_loader = PyPDFDirectoryLoader(DATA_PATH, glob="**/*.pdf")
    documents = doc_loader.load()
    
    if len(documents) == 0:
        raise ValueError("No pdf documents have been found")
    #loads pdf docs then returns them as a list of Document objects
    return documents

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
  if len(chunks) == 0:
      raise ValueError("No chunks were created")
  print(f"Split {len(documents)} documents into {len(chunks)} chunks.")


  return chunks # Return the list of split text chunks

model = ChatOllama(model="llama3-chatqa", base_url="http://10.12.18.250:6006", temperature=0)

#this function is for doing a normal llm query if there is nothing in the chroma database
def query_llm_only(query_text: str):
    response = model.invoke(query_text)
    return {
        "response": response.content,
        "sources": [],
        "mode": "llm_only"
    }

#path to the directory to save chroma database which houses
#our document objects
CHROMA_PATH = "chroma"

#this is used to reset and rebuild the chroma database
def reset_chroma(chunks: list[Document]):
    """
    this saves the given list of Document objects to a Chroma database.
    Args:
    chunks (list[Document]): List of Document objects representing text chunks to save.
    Returns:
    None (because its just saving data to a Chroma database)
    """

    #clear out existing data
    
    if os.path.exists(CHROMA_PATH):
       
        shutil.rmtree(CHROMA_PATH)
    
    chromaDatabase = Chroma.from_documents(
        chunks, OllamaEmbeddings(model="nomic-embed-text", base_url="http://10.12.18.250:6006"), persist_directory=CHROMA_PATH
    )

    
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

def document_addition(documents):
    
    print("CHROMA PATH (upload):", CHROMA_PATH)

    if not documents:
        print("No documents found.")
        return

    database = Chroma(persist_directory=CHROMA_PATH, embedding_function=OllamaEmbeddings(model="nomic-embed-text", base_url="http://10.12.18.250:6006"))

    chunks = split_text(documents)
    
    #prevents duplicate chunks
    ids = [f"{doc.metadata.get('page_id')}_{doc.metadata.get('source')}_{i}" for i, doc in enumerate(chunks)]
    database.add_documents(chunks, ids=ids)

    print(f"Added {len(chunks)} chunks to the database.")



def generate_data_store():
   #function to generate vector database in chroma from documents
   #this is to save our processed document into a database for the 
   #model to access

   documents = load_documents() #load documents from a source
   chunks = split_text(documents) # splits docs into managable chunks
   save_to_chroma(chunks) #saves the processed data into a data store
   print("Data store generated")


# this is where the actual query for our main chatbot will be fed from the
# webpage

#query_text = "What does this document describe?"

#this is the templete for how the model will look at the given context and question
#where the context in this case is processed chunks from the database
PROMPT_TEMPLATE = """
If you recieve a question not related to the context, use your normal functionality.
if the question is related, answer the question based only on the following context:

{context}

 ---

if the question is related, answer the question based on the above context: {question}
"""

def query_rag(query_text: str, page_id=None, urls=None):
  
  print("CHROMA PATH (query):", CHROMA_PATH)

  print("Incoming page_id", page_id)
  """
  Query a Retrieval-Augmented Generation (RAG) system using Chroma database and Ollama.
  specfically with the llama3 model for now until the RAG logic is hooked up to the main
  chatbot on the webpage
  Args:
    - query_text (str): The text to query the RAG system with.
  Returns:
    - formatted_response (str): Formatted response including the generated text and sources.
    - response_text (str): The generated response text.
  """
  #this is the ai model to actually perform the imbedding 
  #Make sure to use same embedding function as before
  #its using the imbedding function of llama3 to perform the task
  embedding_function = OllamaEmbeddings(model="nomic-embed-text", base_url="http://10.12.18.250:6006")

  # Prepare the database by setting the db variable with Chroma and its database path
  # and imbedding function
  db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
  
  print("TOTAL DOCS:", len(db.get()["ids"]))

  #originally db._collection.count() == 0:
  if len(db.get()["ids"]) == 0:
      return query_llm_only(query_text)

  # Retrieving the context from the DB using similarity search
  # the parameter k actually determines how much context is retrieved
  # from the database
  results = db.similarity_search_with_relevance_scores(query_text, k=6, filter={"page_id": int(page_id)} if page_id is not None else None)

  #filtered = db.get(where={"page_id": int(page_id)})
  #print("DOCS FOR THIS PAGE:", len(filtered["ids"]))

  if page_id is not None:
    filtered = db.get(where={"page_id": int(page_id)})
    print("DOCS FOR THIS PAGE:", len(filtered["ids"]))
  else:
    filtered = {"ids": []}
    print("No page_id provided → skipping filtered lookup")


  # Check if there are any matching results or if the relevance score is too low
  # this if statement checks the retrieved context for any matching results
  if len(results) == 0 or results[0][1] < 0.2:
    return query_llm_only(query_text)

  print("RESULTS LENGTH:", len(results))
  for doc, score in results:
    print("Score:", score)
    print("Doc page_id:", doc.metadata.get("page_id"))

  # Combine context from matching documents for the llama3 model that is reviewing them to see
  context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
 
  # Create prompt template using context and query text
  prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
  prompt = prompt_template.format(context=context_text, question=query_text)
  #print(prompt)

  # Here we initialize the Ollama chat model (not the imbedding version)
  # this is not the embedding model, this should be the main ollama model from the webpage
  # for now it is the same model that does the embedding
  model = ChatOllama(model="llama3-chatqa", base_url="http://10.12.18.250:6006", temperature=0)
  # note, temperature determines how flambouyant and creative llama3 will be
  # zero will be very deterministic

  # this variable will generate response text based on the previos given prompt
  response = model.invoke(prompt)
  response_text = response.content
  # here we get the sources of the matching documents
  sources = [doc.metadata.get("source", None) for doc, _score in results]
 
  # Format and return response which includes generated text and sources
  # formatted_response = f"Response: {response_text}\nSources: {sources}"
  #return formatted_response, response_text

  return {
          "response" : response_text,
          "sources" : sources,
          "mode" : "rag"
  }


# query_rag function call to have the llama3 model run and anylize the documents
#formatted_response, response_text = query_rag(query_text)


# print statment to display the models response to the data
#print(response_text)

if __name__ == "__main__":
    load_dotenv()
    generate_data_store()


