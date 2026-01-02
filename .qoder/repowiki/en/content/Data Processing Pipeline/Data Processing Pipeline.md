# Data Processing Pipeline

<cite>
**Referenced Files in This Document**   
- [app.py](file://backend/app.py)
- [pdf_processor.py](file://backend/pdf_processor.py)
- [model_client.py](file://backend/model_client.py)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)
- [QuizContainer.jsx](file://frontend/src/components/QuizContainer.jsx)
- [App.jsx](file://frontend/src/App.jsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The Quiz Generator application implements a comprehensive data processing pipeline that transforms user input (PDF documents or text) into interactive multiple-choice quizzes. The system features a robust backend built with Flask that handles document processing, AI model integration, and quiz generation, coupled with a React frontend that provides an intuitive user interface for interaction. The pipeline supports two AI model backends—OpenRouter (cloud-based GPT models) and Ollama (local Mistral 7B)—providing flexibility in deployment and usage. This document details the complete flow from user input through backend processing to quiz generation, including PDF processing, AI model abstraction, prompt engineering, data transformation, and error handling.

## Project Structure
The Quiz Generator application follows a clear separation between frontend and backend components, with well-defined responsibilities and interfaces. The backend directory contains the Flask application, PDF processing utilities, and AI model clients, while the frontend directory houses the React components and user interface elements. Configuration files and scripts support development, testing, and deployment workflows.

```mermaid
graph TD
subgraph "Frontend"
App[App.jsx]
PDFUploader[PDFUploader.jsx]
QuizContainer[QuizContainer.jsx]
QuizCard[QuizCard.jsx]
end
subgraph "Backend"
FlaskApp[app.py]
PDFProcessor[pdf_processor.py]
ModelClient[model_client.py]
end
Frontend --> Backend
Backend --> ExternalAPIs[(External APIs)]
style Frontend fill:#f0f8ff,stroke:#667eea
style Backend fill:#fff0f0,stroke:#e74c3c
style ExternalAPIs fill:#e8f5e8,stroke:#27ae60
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx)
- [app.py](file://backend/app.py)

**Section sources**
- [app.py](file://backend/app.py)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)

## Core Components
The core components of the Quiz Generator application include the Flask backend application, PDF processing module, AI model client abstraction, and React frontend components. These components work together to process user input, extract content, generate quizzes using AI models, and present the results in an interactive format. The system is designed with modularity in mind, allowing for easy extension and maintenance.

**Section sources**
- [app.py](file://backend/app.py)
- [pdf_processor.py](file://backend/pdf_processor.py)
- [model_client.py](file://backend/model_client.py)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)

## Architecture Overview
The Quiz Generator application follows a client-server architecture with a React frontend communicating with a Flask backend via REST APIs. The backend processes user input through a series of well-defined stages: input validation, content extraction, AI model interaction, and response generation. The system supports multiple input methods (PDF upload and text entry) and multiple AI model backends (OpenRouter and Ollama), providing flexibility in usage and deployment.

```mermaid
graph TD
User[(User)] --> Frontend[React Frontend]
Frontend --> Backend[Flask Backend]
Backend --> OpenRouter[OpenRouter API]
Backend --> Ollama[Ollama]
Backend --> PDFProcessing[PDF Processing]
subgraph "Frontend"
PDFUploader[PDFUploader.jsx]
QuizContainer[QuizContainer.jsx]
end
subgraph "Backend"
App[app.py]
PDFProcessor[pdf_processor.py]
ModelClient[model_client.py]
end
PDFProcessing --> pdfplumber[pdfplumber]
PDFProcessing --> pdf2image[pdf2image]
style Frontend fill:#f0f8ff,stroke:#667eea
style Backend fill:#fff0f0,stroke:#e74c3c
style PDFProcessing fill:#fff8e1,stroke:#f39c12
```

**Diagram sources**
- [app.py](file://backend/app.py)
- [pdf_processor.py](file://backend/pdf_processor.py)
- [model_client.py](file://backend/model_client.py)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)

## Detailed Component Analysis

### PDF Processing Component
The PDF processing component handles the extraction of text and images from uploaded PDF documents. It uses pdfplumber for text extraction and pdf2image for image extraction, converting the content into a structured format that can be used for quiz generation. The component normalizes the extracted content by adding page markers and converting images to base64 encoding for transmission to AI models.

```mermaid
flowchart TD
Start([PDF Processing Start]) --> ExtractText["Extract Text with pdfplumber"]
ExtractText --> AddPageMarkers["Add Page Markers"]
AddPageMarkers --> ExtractImages["Extract Images with pdf2image"]
ExtractImages --> ConvertToBase64["Convert Images to Base64"]
ConvertToBase64 --> NormalizeContent["Normalize Content Structure"]
NormalizeContent --> ReturnResult["Return Processed Content"]
style Start fill:#4CAF50,stroke:#388E3C
style ReturnResult fill:#4CAF50,stroke:#388E3C
```

**Diagram sources**
- [pdf_processor.py](file://backend/pdf_processor.py)

**Section sources**
- [pdf_processor.py](file://backend/pdf_processor.py)

### AI Model Client Abstraction
The AI model client abstraction provides a unified interface for interacting with different AI models, currently supporting OpenRouter (cloud-based GPT models) and Ollama (local Mistral 7B). The abstraction uses the Strategy pattern to route requests to the appropriate model based on configuration, with consistent error handling and response normalization across both implementations.

```mermaid
classDiagram
class ModelClient {
<<abstract>>
+generate_quiz_questions(pdf_content, num_questions) List[Dict]
}
class OpenRouterClient {
-client OpenAI
+generate_quiz_questions(pdf_content, num_questions) List[Dict]
-__init__()
}
class OllamaClient {
-client httpx.Client
-model_name String
-base_url String
+generate_quiz_questions(pdf_content, num_questions) List[Dict]
-__init__(model_name, base_url)
-_check_ollama_available() Boolean
}
class ModelClientFactory {
+create_model_client(model_type) ModelClient
}
ModelClient <|-- OpenRouterClient
ModelClient <|-- OllamaClient
ModelClientFactory --> OpenRouterClient
ModelClientFactory --> OllamaClient
style ModelClient fill : #f3e5f5,stroke : #9c27b0
style OpenRouterClient fill : #e8f5e8,stroke : #4caf50
style OllamaClient fill : #e8f5e8,stroke : #4caf50
style ModelClientFactory fill : #fff3e0,stroke : #ff9800
```

**Diagram sources**
- [model_client.py](file://backend/model_client.py)

**Section sources**
- [model_client.py](file://backend/model_client.py)

### Frontend Data Flow
The frontend data flow manages the user interaction from input submission through quiz presentation. The PDFUploader component collects user input and parameters, submits them to the backend, and handles the response. The QuizContainer component manages the quiz state, including user answers and progress, while the QuizCard component renders individual questions with interactive answer options.

```mermaid
sequenceDiagram
participant User as "User"
participant PDFUploader as "PDFUploader"
participant App as "App"
participant Backend as "Backend API"
participant QuizContainer as "QuizContainer"
User->>PDFUploader : Upload PDF or Enter Text
PDFUploader->>App : onQuizGenerated(quizData)
App->>App : Save questions to state and localStorage
App->>QuizContainer : Render quiz questions
User->>QuizContainer : Answer questions
QuizContainer->>App : Update answer state
App->>localStorage : Save answer state
QuizContainer->>User : Display results
alt PDF Upload
PDFUploader->>Backend : POST /api/upload-pdf
Backend-->>PDFUploader : Return quiz questions
else Text Input
PDFUploader->>Backend : POST /api/process-text
Backend-->>PDFUploader : Return quiz questions
end
```

**Diagram sources**
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [QuizContainer.jsx](file://frontend/src/components/QuizContainer.jsx)

**Section sources**
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [QuizContainer.jsx](file://frontend/src/components/QuizContainer.jsx)

## Dependency Analysis
The Quiz Generator application has a well-defined dependency structure with clear separation between frontend and backend components. The backend relies on several Python packages for PDF processing, AI model interaction, and web serving, while the frontend uses React and Axios for UI rendering and API communication. The system is designed to minimize coupling between components, allowing for independent development and testing.

```mermaid
graph TD
backend.app.py --> backend.pdf_processor.py
backend.app.py --> backend.model_client.py
backend.pdf_processor.py --> pdfplumber
backend.pdf_processor.py --> pdf2image
backend.model_client.py --> openai
backend.model_client.py --> httpx
backend.model_client.py --> python-dotenv
frontend.PDFUploader.jsx --> axios
frontend.App.jsx --> frontend.PDFUploader.jsx
frontend.App.jsx --> frontend.QuizContainer.jsx
frontend.QuizContainer.jsx --> frontend.QuizCard.jsx
style backend.app.py fill:#fff0f0,stroke:#e74c3c
style backend.pdf_processor.py fill:#fff0f0,stroke:#e74c3c
style backend.model_client.py fill:#fff0f0,stroke:#e74c3c
style frontend.PDFUploader.jsx fill:#f0f8ff,stroke:#667eea
style frontend.App.jsx fill:#f0f8ff,stroke:#667eea
style frontend.QuizContainer.jsx fill:#f0f8ff,stroke:#667eea
style frontend.QuizCard.jsx fill:#f0f8ff,stroke:#667eea
```

**Diagram sources**
- [app.py](file://backend/app.py)
- [pdf_processor.py](file://backend/pdf_processor.py)
- [model_client.py](file://backend/model_client.py)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)

**Section sources**
- [app.py](file://backend/app.py)
- [requirements.txt](file://backend/requirements.txt)
- [package.json](file://frontend/package.json)

## Performance Considerations
The Quiz Generator application includes several performance considerations to handle large documents and ensure responsive user experience. The system limits PDF file size to 50MB and restricts the number of questions to 20 to prevent excessive processing times. For large documents, the system truncates text content (4000 characters for OpenRouter, 8000 for Ollama) and limits image processing to the first two pages to manage token usage and processing time. The frontend displays a loading indicator during processing to provide user feedback.

**Section sources**
- [app.py](file://backend/app.py)
- [pdf_processor.py](file://backend/pdf_processor.py)
- [model_client.py](file://backend/model_client.py)

## Troubleshooting Guide
The Quiz Generator application includes comprehensive error handling and troubleshooting capabilities. Common issues include missing API keys, unavailable AI models, invalid input files, and processing errors. The system provides specific error messages for each scenario, guiding users toward resolution. For OpenRouter, users must provide a valid API key, while for Ollama, the local server must be running with the Mistral model loaded. The application validates input parameters and provides clear feedback for invalid inputs.

**Section sources**
- [app.py](file://backend/app.py)
- [model_client.py](file://backend/model_client.py)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)

## Conclusion
The Quiz Generator application implements a robust data processing pipeline that transforms user input into interactive quizzes through a well-structured architecture. The system effectively separates concerns between frontend and backend components, provides flexibility in AI model selection, and includes comprehensive error handling and user feedback mechanisms. The modular design allows for easy extension and maintenance, making it a solid foundation for educational technology applications.