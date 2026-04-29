from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from rag_logic import query_rag

from fastapi.middleware.cors import CORSMiddleware

from rag_logic import document_addition

from langchain_community.document_loaders import PyPDFLoader
import os

bridge = FastAPI()

bridge.add_middleware(
        CORSMiddleware,
    allow_origins=["*"],  # later replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# gets the models needed
class Query(BaseModel):
    prompt : str
    page_id: int | None = None

#endpoint for the chatbot
@bridge.post("/api/generate")
async def generate(query: Query):
    #formatted_response, response_text = query_rag(query.prompt)
    result = query_rag(query.prompt, page_id=query.page_id)
    return result


class IngestRequest(BaseModel):
    pageId: int
    filePath: str
    fileName: str
    documentId: int | None = None

#endpoint for ingesting documents so they still go into the sql database
@bridge.post("/ingestDocument")
async def ingest_document(data: IngestRequest):

    full_path = f"../app/{data.filePath}"

    print("Ingesting:", full_path)

    if not os.path.exists(full_path):
        return {"success": False, "error": "File not found"}

    # 1. Load PDF
    loader = PyPDFLoader(full_path)
    documents = loader.load()

    # 2. Add metadata
    for doc in documents:
        doc.metadata["page_id"] = data.pageId
        doc.metadata["source"] = data.fileName
        doc.metadata["document_id"] = data.documentId

    # 3. Add to vector DB
    document_addition(documents)

    return {
        "success": True,
        "message": "Document embedded into RAG",
        "documentId": data.documentId
    }


#endpoint for pdf uploading from the website
@bridge.post("/uploadDocument")
async def upload_document(document: UploadFile = File(...), pageId: int = 0):
    
    print("upload endpoint accessed")

    upload_dir = f"../app/uploads/{pageId}"
    os.makedirs(upload_dir, exist_ok=True)
    

    #set the file path
    file_path = os.path.join(upload_dir, document.filename)
    
    # save the files to the directory
    with open(file_path, "wb") as f:
        f.write(await document.read())

    file_size = os.path.getsize(file_path)

    print("file saved")

    #load the pdfs into langchain
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    print("documents loaded:", len(documents))

    # adding metadata
    for doc in documents:
        doc.metadata["source"] = document.filename
        doc.metadata["page_id"] = int(pageId)
        doc.metadata["type"] = "pdf"

    print("calling document_addition function")

    #embed into chroma with new data function
    document_addition(documents)
    
    print("completed document_addition")

    return {
        "success": True,
        "message": "Document uploaded and embedded",
        "document": {
            "document_id": 1,  # temp
            "file_name": document.filename,
            "original_name": document.filename,
            "file_size": os.path.getsize(file_path),
            "page_number": pageId

        }
    }


