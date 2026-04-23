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

#endpoint for pdf uploading from the website
@bridge.post("/uploadDocument")
async def upload_document(file: UploadFile = File(...), pageId: int = 0):
    
    print("upload endpoint accessed")

    upload_dir = f"../app/uploads/{pageId}"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    
    # save the files to the directory
    with open(file_path, "wb") as f:
        f.write(await file.read())

    print("file saved")

    #load the pdfs into langchain
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    print("documents loaded:", len(documents))

    # adding metadata
    for doc in documents:
        doc.metadata["source"] = file.filename
        doc.metadata["page_id"] = int(pageId)
        doc.metadata["type"] = "pdf"

    print("calling document_addition function")

    #embed into chroma with new data function
    document_addition(documents)
    
    print("completed document_addition")

    return {
        "success": True,
        "message": "Document uploaded and embedded"
    }


