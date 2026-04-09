from fastapi import FastAPI
from pydantic import BaseModel
from rag_logic import query_rag

bridge = FastAPI()

class Query(BaseModel):
    prompt : str


@bridge.post("/api/generate")
async def generate(query: Query):
    formatted_response, response_text = query_rag(query.prompt)
    
    return {
        "formatted_response": formatted_response,
        "response_text": response_text
        }
