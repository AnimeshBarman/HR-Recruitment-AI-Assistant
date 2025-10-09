import os
import shutil
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
    "http://localhost:5173"
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


vector_store = None
# Creating LLM from Hugging Face
llm_endpoint = HuggingFaceEndpoint(
    repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
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


@app.post("/analyze-resumes")
async def analyze_resumes(
    jd: str = Form(...),
    resumes: List[UploadFile] = File(...)
):
    global vector_store

    saved_files = []
    for resume_file in resumes:
        file_path = os.path.join(temp_upload_dir, resume_file.filename)

        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(resume_file.file, f)
            saved_files.append(file_path)
        finally:
            resume_file.file.close()
    
    # Creating vector store
    all_pages = [page for path in saved_files for page in PyPDFLoader(path).load()]
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    splits = text_splitter.split_documents(all_pages)
    vector_store = FAISS.from_documents(splits, embeddings)
    print("Vector store created successfully for chat..")

    analysis_prompt = ChatPromptTemplate.from_template(
        """
        You are an expert HR analyst. Analyze the resume based on the job description.
        Provide a detailed analysis in a valid JSON format with keys: "match_percentage", "strengths", "weaknesses", "summary".
        IMPORTANT: The JSON output must be properly formatted. Do not include any invalid escape characters like `\_`.
        Job Description: {jd}
        Resume content: {resume_content}

        JSON Analysis:
        """
    )

    analysis_chain = analysis_prompt | llm | JsonOutputParser()

    final_result = []

    for path in saved_files:
        filename = os.path.basename(path)
        print(f"Analyzing individual resume: {filename}...")

        pages = PyPDFLoader(path).load()
        resume_text = " ".join([page.page_content for page in pages])

        analysis = analysis_chain.invoke({
            "jd": jd,
            "resume_content": resume_text
        })
        # match_percentage, strength, weakness, summary + filename(add extra field)
        analysis['filename'] = filename
        final_result.append(analysis)

    #Clean up temporary files
    for path in saved_files:
        os.remove(path)
    
    sorted_result = sorted(final_result, key=lambda x: int(x.get('match_percentage', 0)), reverse=True)
    return sorted_result

# Pydantic model for the Chat
class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat_with_resumes(request: ChatRequest):
    if not vector_store:
        raise HTTPException(status_code=400, detail="Resumes not processed yet..!")

    # Define Retriever
    retriever = vector_store.as_retriever()

    prompt = ChatPromptTemplate.from_template(
        """
        Answer the following question based only on the provided resume context.
        If you don't know the answer from the context, just say you don't know.

        Context: {context}

        Question: {question}
        """
    )

    # Implementing the RAG Chain
    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = rag_chain.invoke(request.question)
    return {"Answer": answer}
