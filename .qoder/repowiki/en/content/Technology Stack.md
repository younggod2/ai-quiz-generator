# Technology Stack

<cite>
**Referenced Files in This Document**   
- [requirements.txt](file://backend/requirements.txt)
- [package.json](file://frontend/package.json)
- [Makefile](file://Makefile)
- [app.py](file://backend/app.py)
- [model_client.py](file://backend/model_client.py)
- [pdf_processor.py](file://backend/pdf_processor.py)
- [.env.example](file://backend/.env.example)
- [playwright.config.js](file://e2e/playwright.config.js)
- [App.jsx](file://frontend/src/App.jsx)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)
- [QuizContainer.jsx](file://frontend/src/components/QuizContainer.jsx)
- [start.sh](file://start.sh)
</cite>

## Table of Contents
1. [Frontend Technologies](#frontend-technologies)
2. [Backend Technologies](#backend-technologies)
3. [AI Integration](#ai-integration)
4. [Development Tools](#development-tools)
5. [Version Requirements](#version-requirements)
6. [Compatibility Notes](#compatibility-notes)
7. [Installation Guidance](#installation-guidance)

## Frontend Technologies

The frontend of the Quiz Generator application is built using modern JavaScript technologies with a focus on component-based architecture and efficient state management.

### React for UI Components
React serves as the core framework for building the user interface of the Quiz Generator application. The application follows a component-based architecture with three main components: `App.jsx`, `PDFUploader.jsx`, and `QuizContainer.jsx`. The `App` component manages global state including quiz questions, loading status, and error messages using React's `useState` and `useEffect` hooks. It implements persistence by storing quiz data in localStorage, allowing users to resume their session after page reloads. The `PDFUploader` component provides the interface for users to upload PDF files or input text directly, with support for drag-and-drop functionality and real-time validation. The `QuizContainer` component manages the quiz-taking experience with navigation controls, answer tracking, and results calculation. The UI is designed to be responsive and user-friendly, with clear visual feedback for loading states and errors.

**Section sources**
- [App.jsx](file://frontend/src/App.jsx)
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)
- [QuizContainer.jsx](file://frontend/src/components/QuizContainer.jsx)

### Axios for API Communication
Axios is used as the HTTP client for all API communications between the frontend and backend services. The `PDFUploader` component utilizes Axios to send both multipart form data for PDF uploads and JSON payloads for text processing requests. When uploading a PDF file, Axios configures the request with `Content-Type: multipart/form-data` to properly handle the file attachment along with form fields such as the number of questions and selected AI model. For text processing, Axios sends a standard JSON request with the text content and configuration parameters. The implementation includes comprehensive error handling that captures both network errors and API-level errors, providing meaningful feedback to users through the application's error state management. Axios's promise-based interface integrates seamlessly with React's asynchronous operations, allowing for smooth loading state transitions during API calls.

**Section sources**
- [PDFUploader.jsx](file://frontend/src/components/PDFUploader.jsx)

### Playwright for End-to-End Testing
Playwright is implemented as the end-to-end testing framework to ensure the reliability and functionality of the Quiz Generator application. The test suite is configured in `playwright.config.js` with a timeout of 60 seconds per test and parallel execution enabled for efficient test runs. The configuration sets the base URL to `http://localhost:3000` and includes advanced features like trace recording on first retry, screenshot capture only on failure, and video recording retained on failure for comprehensive debugging. In non-CI environments, the configuration automatically starts the application servers using the `start.sh` script, ensuring tests run against a live instance. The test suite includes smoke tests, navigation tests, and workflow-specific tests that validate the complete user journey from PDF upload to quiz completion. Playwright's multi-browser support is available through commented configurations for Firefox and WebKit, allowing for cross-browser testing when needed.

**Section sources**
- [playwright.config.js](file://e2e/playwright.config.js)

## Backend Technologies

The backend of the Quiz Generator application is designed as a RESTful API service that processes user inputs and coordinates AI model interactions.

### Flask for API Endpoints
Flask serves as the web framework for the backend API, providing lightweight and efficient routing for the application's endpoints. The `app.py` file defines three primary endpoints: `/api/health` for service availability checking, `/api/upload-pdf` for processing uploaded PDF files, and `/api/process-text` for handling direct text input. The application uses Flask-CORS to enable cross-origin resource sharing, allowing the frontend React application to communicate with the backend server. File uploads are handled with proper validation for file type (PDF only) and size (maximum 50MB), with temporary storage managed through Python's `tempfile` module. The API implements comprehensive error handling with appropriate HTTP status codes (400 for client errors, 500 for server errors) and descriptive error messages. Request validation includes checking for required parameters such as the number of questions (1-20 range) and supported model types (openrouter or ollama-mistral).

**Section sources**
- [app.py](file://backend/app.py)

### pdfplumber for Text Extraction from PDFs
pdfplumber is utilized for extracting text content from uploaded PDF documents with high accuracy and structural preservation. The `pdf_processor.py` file implements the `extract_text_from_pdf` function which opens PDF files and iterates through each page to extract text content. The implementation includes page markers (e.g., "СТРАНИЦА 1") to maintain document structure in the extracted text, which helps AI models understand the context and organization of the content. The text extraction process is wrapped in exception handling to gracefully manage corrupted or unreadable PDF files. The extracted text is then combined with image data to provide a comprehensive representation of the PDF content to the AI models, enabling them to generate relevant quiz questions based on both textual and visual information present in the document.

**Section sources**
- [pdf_processor.py](file://backend/pdf_processor.py)

### pdf2image for Image Extraction
pdf2image is employed to convert PDF pages into image format for AI processing, particularly when using vision-capable models. The `extract_images_from_pdf` function in `pdf_processor.py` uses pdf2image to convert each PDF page into a PNG image at 200 DPI resolution. The resulting images are encoded in base64 format and included in the processed content sent to AI models. This capability allows the application to leverage multimodal AI models that can analyze both text and visual content from the PDF, such as diagrams, charts, or images that may contain important information for generating quiz questions. The implementation limits the number of images sent to the AI model to optimize token usage and processing time, typically sending only the first two pages' images when available.

**Section sources**
- [pdf_processor.py](file://backend/pdf_processor.py)

### httpx for HTTP Requests to AI Services
httpx is used as the HTTP client for making requests to external AI services, providing both synchronous and asynchronous capabilities with improved performance over traditional HTTP libraries. In the `model_client.py` file, httpx is used by the `OllamaClient` class to communicate with the local Ollama API server. The client is configured with a timeout of 100 seconds to accommodate the potentially long response times of local AI models. The implementation uses httpx's Client class to maintain a persistent connection, improving efficiency when making multiple requests. The library's robust error handling allows the application to distinguish between network errors, timeout errors, and API-level errors, providing appropriate feedback to users. httpx's support for JSON requests and responses simplifies the interaction with the Ollama API's REST interface, enabling seamless integration with the local AI model execution.

**Section sources**
- [model_client.py](file://backend/model_client.py)

## AI Integration

The Quiz Generator application features a flexible AI integration system that supports both cloud-based and local model execution.

### OpenRouter API for Cloud-Based GPT-4 Processing
The application integrates with the OpenRouter API to access cloud-based GPT-4 models for quiz generation. The `OpenRouterClient` class in `model_client.py` implements the interface to the OpenRouter service, using the OpenAI Python library with a custom base URL pointing to OpenRouter's API endpoint. The implementation dynamically selects between `gpt-4o-mini` for text-only processing and `gpt-4o` for multimodal processing (when images are present in the PDF). The system uses a carefully crafted system prompt that specifies the desired output format as JSON with multiple-choice questions, ensuring consistent parsing of the AI's response. The application handles API authentication through the `OPENROUTER_API_KEY` environment variable, with validation to ensure the key is present before attempting API calls. Error handling includes specific responses for credit exhaustion, guiding users to the OpenRouter website to replenish their account balance.

**Section sources**
- [model_client.py](file://backend/model_client.py)
- [.env.example](file://backend/.env.example)

### Ollama for Local Mistral 7B Execution
Ollama provides the capability to run AI models locally, with the application specifically supporting the Mistral 7B model for offline quiz generation. The `OllamaClient` class in `model_client.py` manages the connection to the local Ollama server running on `http://localhost:11434`. The implementation includes health checks to verify the Ollama server is running and the Mistral model is available, with automatic attempts to download the model if missing. The start.sh script enhances this integration by automatically launching the Ollama server if not already running, creating a seamless user experience. The local execution path uses a similar prompt structure to the cloud version but is optimized for the capabilities of the Mistral 7B model. This local option provides users with a privacy-preserving alternative that doesn't require sending document content to external servers, while also eliminating ongoing API costs.

**Section sources**
- [model_client.py](file://backend/model_client.py)
- [start.sh](file://start.sh)

## Development Tools

The development workflow is supported by a comprehensive set of tools that automate tasks and ensure code quality.

### Makefile for Workflow Automation
The Makefile provides a unified interface for common development tasks, abstracting complex command sequences into simple, memorable commands. Key targets include `install` for setting up all dependencies, `start` for launching the application, `test` for running end-to-end tests, and `clean` for removing temporary files. The `check` target verifies the installation status of all dependencies, ensuring a consistent development environment. The `test-smoke` target includes sophisticated logic to detect the presence of required API keys or Ollama configuration, providing helpful guidance when prerequisites are missing. Color-coded output enhances readability of command execution, with green for success, yellow for warnings, and red for errors. The Makefile also includes a `setup-hooks` target to configure Git hooks, integrating testing into the version control workflow.

**Section sources**
- [Makefile](file://Makefile)

### Git Hooks for Pre-Commit and Pre-Push Validation
Git hooks are implemented to enforce code quality and prevent broken code from being committed or pushed to the repository. The pre-commit hook performs syntax checking to catch basic errors before they are committed, allowing for quick iteration during development. The pre-push hook is more comprehensive, running the full suite of end-to-end tests to ensure that the application functions correctly before code is shared with the team. This two-tiered approach balances development speed with code quality, allowing developers to commit frequently while ensuring that only thoroughly tested code reaches the shared repository. The setup process is automated through the `setup-hooks` Makefile target, which ensures the hooks are executable and properly configured.

**Section sources**
- [Makefile](file://Makefile)

### GitHub Actions for CI/CD
The application is configured for continuous integration and deployment through GitHub Actions, with the workflow designed to automatically run tests in the CI environment. The Playwright configuration detects when running in CI (`process.env.CI`) and adjusts behavior accordingly, disabling automatic server startup to avoid port conflicts in the containerized environment. The CI pipeline would typically include steps for installing dependencies, running the application servers, and executing the end-to-end test suite, providing immediate feedback on code changes. Test retries are enabled in CI (2 retries) to mitigate flakiness, while parallel execution is limited to a single worker in CI to avoid resource contention. The HTML reporter generates comprehensive test reports that can be archived as build artifacts for detailed analysis of test results.

**Section sources**
- [playwright.config.js](file://e2e/playwright.config.js)

## Version Requirements

The Quiz Generator application has specific version requirements for its core dependencies to ensure compatibility and stability.

### Python 3.8+
The backend application requires Python 3.8 or higher, as specified by the use of modern Python features in the codebase. The virtual environment setup in the `install:backend` script uses `python3 -m venv venv` to create an isolated environment, ensuring dependency isolation. The specific Python packages and their versions are defined in `requirements.txt`, with Flask 3.0.0 as the web framework, httpx 0.27.2 for HTTP requests, and pdfplumber 0.10.3 for PDF text extraction. These versions are selected for their stability and compatibility with Python 3.8+ features. The application leverages type hints and other modern Python syntax that require at least Python 3.8 for proper execution.

**Section sources**
- [requirements.txt](file://backend/requirements.txt)

### Node.js 16+
The frontend application and development tools require Node.js 16 or higher, as indicated by the `@types/node` version 20.10.0 in package.json, which supports modern JavaScript features. The frontend dependencies include React 18.2.0, which has minimum Node.js version requirements for its build tools and development server. The Playwright testing framework also requires a modern Node.js version to support its asynchronous features and browser automation capabilities. The Makefile and shell scripts assume the availability of modern shell features that are compatible with the Node.js 16+ ecosystem. The concurrent execution of backend and frontend servers through the start.sh script relies on Node.js tools that perform optimally with Node.js 16+.

**Section sources**
- [package.json](file://frontend/package.json)
- [package.json](file://package.json)

## Compatibility Notes

The Quiz Generator application is designed with cross-platform compatibility in mind, but has some important considerations for different operating systems and environments.

The application has been tested on Unix-like systems (Linux and macOS) and should work on Windows with WSL (Windows Subsystem for Linux) or Git Bash. The shell scripts use bash-specific features and may not work with standard Windows Command Prompt or PowerShell without modification. The file path handling assumes Unix-style paths, which could cause issues on native Windows systems. The Ollama integration requires a compatible version of the Ollama server that supports the REST API on port 11434, which is available on all major platforms. The PDF processing libraries (pdfplumber and pdf2image) have dependencies on system libraries that may need to be installed separately on some Linux distributions. The application's reliance on localhost for service communication assumes that port 3000, 5001, and 11434 are available and not blocked by firewalls or other applications.

## Installation Guidance

To install and run the Quiz Generator application, follow these steps:

1. Ensure Python 3.8+ and Node.js 16+ are installed on your system
2. Clone the repository and navigate to the project directory
3. Run `make install` to install all dependencies for both frontend and backend
4. Create a `.env` file in the backend directory with your OpenRouter API key or enable Ollama testing
5. Run `make start` to launch the application servers
6. Access the application at http://localhost:3000

For development, you can run the servers independently using `npm run start:backend` and `npm run start:frontend` from the root directory. To run tests, use `make test` for end-to-end tests or `make test-smoke` for a quick smoke test. The application logs are stored in `backend.log`, `frontend.log`, and `ollama.log` for troubleshooting issues. If using Ollama, ensure the Mistral model is downloaded with `ollama pull mistral` before starting the application.