# AI HR Recruitment Assistant

An intelligent HR tool designed to streamline the recruitment process. This application allows HR professionals to upload a job description and multiple resumes, automatically ranking the candidates based on suitability. It also features a chat interface to ask in-depth questions about the resume content.

## 🚀 Features

* **Automated Resume Ranking:** Instantly rank a batch of resumes against a specific job description to find the best-matched candidates.
* **JD-Resume Matching:** Uses AI to analyze and score candidate suitability based on skills, experience, and other criteria.
* **Conversational Q&A:** Chat directly with the system to ask specific questions about the uploaded resumes (e.g., "Which candidate has experience in Python?").
* **Modern UI:** A clean, responsive user interface built for ease of use.

## 🛠️ Tech Stack

This project is built with a modern, decoupled architecture:

### Backend
* **Python**
* **FastAPI:** For high-performance API creation.
* **LangChain:** To power the AI logic, RAG (Retrieval-Augmented Generation), and document analysis.
* **Vector Store (e.g., FAISS/Chroma):** For efficient similarity search on resume data.

### Frontend
* **React (with Vite):** For a fast and modern web interface.
* **Tailwind CSS:** For utility-first styling.
* **Shadcn UI:** For pre-built, accessible React components.

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

* Node.js (v18 or higher)
* Python (v3.10 or higher)
* An API key from an LLM provider (like Hugging Face, OpenAI, etc.)

### 1. Clone the Repository

```bash
git clone [https://github.com/AnimeshBarman/HR-Recruitment-AI-Assistant.git](https://github.com/AnimeshBarman/HR-Recruitment-AI-Assistant.git)
cd HR-Recruitment-AI-Assistant