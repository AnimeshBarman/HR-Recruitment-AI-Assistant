import os
import shutil
# import json
# import asyncio
import uuid
# import concurrent.futures
# from functools import partial
from typing import List
from dotenv import load_dotenv

# FastApi Imports
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Langchain Imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint, HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

load_dotenv()

app = FastAPI(title="AI HR Recruitment Assistant")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

temp_upload_dir = "temp_uploads"
if not os.path.exists(temp_upload_dir):
    os.makedirs(temp_upload_dir)

session_stores = {}

vector_store = None
# Creating LLM from Hugging Face
llm_endpoint = HuggingFaceEndpoint(
    repo_id="MiniMaxAI/MiniMax-M2",
    huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
    task="conversational",
    max_new_tokens=512,
    temperature=0.1
)

llm = ChatHuggingFace(llm=llm_endpoint)


# Creating Embedding Model from Hugging Face
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-base-en-v1.5")

# FastApi endpoints
@app.get("/")
def root_func():
    return {"message": "Welcome to HR Recruitment AI Assistant"}

def clean_json_output(text: str) -> str:
    # Replace invalid escape sequences
    return text.replace("\\_", "_")


def load_and_analyze_resume(path, jd, analysis_chain):
    filename = os.path.basename(path)
    print(f"Analyzing indivisual resume: {filename}....")

    def load_pages(file_path):
        return PyPDFLoader(file_path).load()
    
    pages = PyPDFLoader(path).load()
    resume_text = " ".join([page.page_content for page in pages])


    analysis = analysis_chain.invoke({
        "jd": jd,
        "resume_content": resume_text
    })

    analysis['id'] = str(uuid.uuid4())
    analysis['filename'] = filename

    return analysis, pages


@app.post("/api/analyze-resumes")
def analyze_resumes(
    jd: str = Form(...),
    resumes: List[UploadFile] = File(...)
):
    session_id = str(uuid.uuid4())
    session_upload_dir = f"temp_uploads_{session_id}"
    os.makedirs(session_upload_dir, exist_ok=True)

    saved_files = []
    for resume_file in resumes:
        file_path = os.path.join(session_upload_dir, resume_file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(resume_file.file, f)
        saved_files.append(file_path)
    
    analysis_prompt = ChatPromptTemplate.from_template(
        """
        You are an expert HR analyst. Analyze the resume based on the job description.
        Provide a detailed analysis in a valid JSON format with keys: "candidate_name", "match_percentage", "strengths", "weaknesses", "summary".
        "candidate_name" must be the full name of the candidate found in the resume.
        "strengths" and "weaknesses" MUST be a JSON list of strings.

        Job Description: {jd}
        Resume content: {resume_content}

        JSON Analysis:
        """
    )
    analysis_chain = analysis_prompt | llm | StrOutputParser() | clean_json_output | JsonOutputParser()

    final_result = []
    all_pages_for_vector_store = []

    for path in saved_files:
        filename = os.path.basename(path)
        print(f"Analyzing: {filename}....")
        try:
            pages = PyPDFLoader(path).load()
            resume_text = " ".join([page.page_content for page in pages])

            analysis = analysis_chain.invoke({
                "jd": jd,
                "resume_content": resume_text
            })

            analysis['id'] = str(uuid.uuid4())
            analysis['filename'] = filename
            final_result.append(analysis)

            candidate_name = analysis.get("candidate_name", filename)
            for page in pages:
                    page.metadata["source"] = filename
                    page.metadata["candidate_name"] = candidate_name
            all_pages_for_vector_store.extend(pages)

        except Exception as e:
                print(f"---ERROR analyzing {filename}")
                import traceback
                traceback.print_exc
                print("--------------------")
                continue

    print("Analysis complete..")

    if not final_result:
        shutil.rmtree(session_upload_dir)
        raise HTTPException(status_code=500, detail="All resume analysis failed..!")

    # Create vector store using the updated pages
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    splits = text_splitter.split_documents(all_pages_for_vector_store)
    vector_store = FAISS.from_documents(splits, embeddings)
    session_stores[session_id] = vector_store
    print(f"Vector store created for session: {session_id}")

    shutil.rmtree(session_upload_dir)
    
    sorted_result = sorted(final_result, key=lambda x: int(x.get('match_percentage', 0)), reverse=True)

    return {"sessionId": session_id, "results": sorted_result}

class ChatRequest(BaseModel):
    sessionId: str
    question: str

def format_docs(docs):
    """Formats retrieved documents to cite the candidate's name."""
    return "\n\n".join(
        f"--- START: Context from {doc.metadata.get('candidate_name', doc.metadata.get('source', 'Unknown'))} ---\n"
        f"{doc.page_content}\n"
        f"--- END: Context from {doc.metadata.get('candidate_name', doc.metadata.get('source', 'Unknown'))} ---"
        for doc in docs
    )

@app.post("/api/chat")
async def chat_with_resumes(request: ChatRequest):
    session_id = request.sessionId
    question = request.question

    if session_id not in session_stores:
        raise HTTPException(status_code=404, detail="Invalid session ID.")

    vector_store = session_stores[session_id]
    retriever = vector_store.as_retriever()

    prompt = ChatPromptTemplate.from_template(
        """
        You are a helpful HR assistant. Answer the question based ONLY on the provided context from the resumes.
        When you use information from a specific resume, you MUST cite the candidate's name (e.g., "According to John Doe's resume...").
        If you don't identify the question just say you don't know.

        CONTEXT FROM RESUMES:
        {context}

        QUESTION:
        {question}

        ANSWER:
        """
    )

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    try:
        answer = rag_chain.invoke(question)
        return {"answer": answer}
    except Exception as e:
        print(f"Error during RAG chain invocation: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the chat request.")