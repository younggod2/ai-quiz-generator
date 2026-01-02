# Troubleshooting Guide

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [TESTING.md](file://TESTING.md)
- [backend/app.py](file://backend/app.py)
- [backend/model_client.py](file://backend/model_client.py)
- [backend/pdf_processor.py](file://backend/pdf_processor.py)
- [backend/.env.example](file://backend/.env.example)
- [start.sh](file://start.sh)
- [Makefile](file://Makefile)
- [frontend/scripts/generate-test-pdf.js](file://frontend/scripts/generate-test-pdf.js)
</cite>

## Table of Contents
1. [Setup Problems](#setup-problems)
2. [Configuration Errors](#configuration-errors)
3. [Runtime Issues](#runtime-issues)
4. [AI Integration Problems](#ai-integration-problems)
5. [Testing-Specific Issues](#testing-specific-issues)
6. [Network Troubleshooting](#network-troubleshooting)
7. [Known Limitations and Workarounds](#known-limitations-and-workarounds)

## Setup Problems

This section addresses common issues encountered during the initial setup of the Quiz Generator application, including Python/Node.js version compatibility and dependency installation failures.

### Python/Node.js Version Issues

**Symptom**: Installation fails with version compatibility errors or commands not found.

**Cause**: The application requires specific minimum versions of Python and Node.js that are not installed or not properly configured in the system PATH.

**Solution**:
1. Verify Python version:
   ```bash
   python3 --version
   ```
   Ensure Python 3.8 or higher is installed. If not, install it from [python.org](https://www.python.org/downloads/) or using package managers:
   - macOS: `brew install python3`
   - Linux: `sudo apt install python3 python3-pip` (Ubuntu/Debian)

2. Verify Node.js version:
   ```bash
   node --version
   ```
   Ensure Node.js 16 or higher is installed. If not, install it from [nodejs.org](https://nodejs.org/) or using package managers:
   - macOS: `brew install node`
   - Linux: `sudo apt install nodejs npm`

3. If multiple Python versions exist, ensure `python3` points to Python 3.8+:
   ```bash
   which python3
   python3 --version
   ```

4. For Node.js, consider using nvm (Node Version Manager) to manage versions:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 16
   nvm use 16
   ```

**Section sources**
- [README.md](file://README.md#L15-L36)

### Dependency Installation Failures

**Symptom**: `make install` fails with package installation errors or missing modules.

**Cause**: Network issues, missing build tools, or permission problems during dependency installation.

**Solution**:
1. Run the installation command:
   ```bash
   make install
   ```

2. If the command fails, check for specific error messages:
   - For Python dependencies: ensure pip is updated (`python3 -m pip install --upgrade pip`)
   - For Node.js dependencies: clear npm cache if needed (`npm cache clean --force`)

3. Verify virtual environment creation in backend:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. Check that `backend/venv` directory exists and contains the virtual environment.

5. For frontend, ensure `frontend/node_modules` is created:
   ```bash
   cd frontend
   npm install
   ```

6. If behind a corporate firewall, configure npm registry:
   ```bash
   npm config set registry http://registry.npmjs.org/
   ```

**Section sources**
- [start.sh](file://start.sh#L47-L63)
- [Makefile](file://Makefile#L21-L24)

## Configuration Errors

This section covers issues related to missing or incorrect configuration files and environment variables.

### Missing .env File

**Symptom**: Application starts but shows warnings about missing API keys, or OpenRouter functionality doesn't work.

**Cause**: The required `.env` file is missing from the backend directory, which should contain the OpenRouter API key.

**Solution**:
1. Create the `.env` file in the backend directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit the `.env` file to add your OpenRouter API key:
   ```bash
   OPENROUTER_API_KEY=your_actual_api_key_here
   ```

3. Obtain an API key from [openrouter.ai](https://openrouter.ai) if you don't have one.

4. Verify the file exists and contains the correct key:
   ```bash
   cat backend/.env
   ```

5. Restart the application to load the new configuration.

**Section sources**
- [backend/.env.example](file://backend/.env.example)
- [README.md](file://README.md#L49-L50)

### Invalid API Keys

**Symptom**: Authentication errors when using OpenRouter, with messages about invalid or missing API keys.

**Cause**: The API key in the `.env` file is incorrect, expired, or has insufficient credits.

**Solution**:
1. Verify the API key format in `backend/.env`:
   ```bash
   grep OPENROUTER_API_KEY backend/.env
   ```
   The key should be a long alphanumeric string without spaces.

2. Test the API key directly with curl:
   ```bash
   curl -H "Authorization: Bearer your_api_key_here" https://openrouter.ai/api/v1/auth
   ```

3. Check your OpenRouter account balance at [openrouter.ai/settings/credits](https://openrouter.ai/settings/credits).

4. Regenerate the API key on the OpenRouter website if needed.

5. Restart the application after updating the key.

**Section sources**
- [backend/app.py](file://backend/app.py#L168-L170)
- [backend/model_client.py](file://backend/model_client.py#L66-L68)

## Runtime Issues

This section addresses problems that occur when running the application, including port conflicts and PDF processing failures.

### Port Conflicts

**Symptom**: Application fails to start with "address already in use" errors or services are not accessible on expected ports.

**Cause**: The default ports (3000 for frontend, 5001 for backend, 11434 for Ollama) are being used by other processes.

**Solution**:
1. Check which processes are using the required ports:
   ```bash
   # Check frontend port
   lsof -i :3000
   # Check backend port
   lsof -i :5001
   # Check Ollama port
   lsof -i :11434
   ```

2. Stop conflicting processes:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill
   # Kill process on port 5001
   lsof -ti:5001 | xargs kill
   ```

3. Alternatively, modify the start script to use different ports (requires code changes in start.sh and configuration files).

4. Restart the application:
   ```bash
   make start
   ```

**Section sources**
- [start.sh](file://start.sh#L197-L198)

### PDF Processing Failures

**Symptom**: PDF upload fails with "PDF document empty or cannot be processed" error.

**Cause**: The PDF file is corrupted, password-protected, or exceeds processing limitations.

**Solution**:
1. Verify the PDF file is valid and can be opened with a standard PDF viewer.

2. Check file size - maximum allowed is 50MB:
   ```bash
   ls -lh your-file.pdf
   ```

3. Ensure the PDF is not password-protected or encrypted.

4. Test with a simple PDF file to isolate the issue.

5. Check backend logs for specific error messages:
   ```bash
   cat backend.log
   ```

6. Ensure poppler is installed for image extraction:
   - macOS: `brew install poppler`
   - Linux: `sudo apt install poppler-utils`

7. For text-only PDFs, ensure they contain selectable text (not just images of text).

**Section sources**
- [backend/app.py](file://backend/app.py#L93-L95)
- [backend/pdf_processor.py](file://backend/pdf_processor.py#L20-L32)

## AI Integration Problems

This section covers issues related to AI model integration, including OpenRouter rate limits and Ollama connection errors.

### OpenRouter Rate Limits

**Symptom**: "Insufficient credits in OpenRouter" or "402 Payment Required" errors when generating quizzes.

**Cause**: The OpenRouter API key has exceeded its rate limits or has insufficient credits for the requested operation.

**Solution**:
1. Check your current balance and rate limits at [openrouter.ai/settings/credits](https://openrouter.ai/settings/credits).

2. Reduce the number of questions requested to lower token usage.

3. Wait for rate limit reset (typically per-minute limits).

4. Upgrade your OpenRouter plan or add more credits.

5. Consider using the local Mistral model via Ollama as an alternative.

6. Implement retry logic with exponential backoff in the application code if needed.

**Section sources**
- [backend/model_client.py](file://backend/model_client.py#L146-L151)

### Ollama Connection Errors

**Symptom**: "Ollama server unavailable" or "model not found" errors when using the local Mistral model.

**Cause**: Ollama service is not running, the Mistral model is not downloaded, or there are network connectivity issues.

**Solution**:
1. Verify Ollama is installed:
   ```bash
   ollama --version
   ```

2. Start the Ollama service:
   ```bash
   ollama serve
   ```

3. Pull the Mistral model:
   ```bash
   ollama pull mistral
   ```

4. Check available models:
   ```bash
   ollama list
   ```

5. Test the Ollama API directly:
   ```bash
   curl http://localhost:11434/api/tags
   ```

6. Verify the model client can connect in the application:
   ```bash
   # Check if port 11434 is accessible
   nc -z localhost 11434
   ```

7. Restart the application to re-establish connection.

**Section sources**
- [start.sh](file://start.sh#L69-L164)
- [backend/model_client.py](file://backend/model_client.py#L154-L261)

## Testing-Specific Issues

This section addresses problems encountered during testing, including failing E2E tests, missing test PDF files, and pre-push hook failures.

### Failing E2E Tests

**Symptom**: End-to-end tests fail with various error messages when running `make test`.

**Cause**: Multiple potential causes including missing test files, service unavailability, or configuration issues.

**Solution**:
1. Ensure all services are running before testing:
   ```bash
   make start
   ```

2. Generate the test PDF file:
   ```bash
   npm run generate-test-pdf
   ```

3. Verify the test PDF exists:
   ```bash
   ls frontend/e2e/fixtures/sample.pdf
   ```

4. Check that ports 3000 and 5001 are available.

5. Run tests with verbose output to identify specific failures:
   ```bash
   npm run test:e2e:debug
   ```

6. Check test logs in `test-results/` and `playwright-report/` directories.

7. Clean test artifacts and retry:
   ```bash
   make clean
   make test
   ```

**Section sources**
- [TESTING.md](file://TESTING.md#L74-L85)
- [frontend/scripts/generate-test-pdf.js](file://frontend/scripts/generate-test-pdf.js)

### Missing Test PDF Files

**Symptom**: Tests fail with "file not found" errors related to test PDFs.

**Cause**: The test PDF fixture file has not been generated.

**Solution**:
1. Generate the test PDF:
   ```bash
   npm run generate-test-pdf
   ```

2. Or use the Makefile command:
   ```bash
   make generate-test-pdf
   ```

3. Verify the file was created:
   ```bash
   ls -la frontend/e2e/fixtures/sample.pdf
   ```

4. Check that the frontend directory structure is correct and writable.

5. If the script fails, verify Node.js dependencies are installed:
   ```bash
   cd frontend
   npm install
   ```

**Section sources**
- [frontend/scripts/generate-test-pdf.js](file://frontend/scripts/generate-test-pdf.js)
- [TESTING.md](file://TESTING.md#L64-L72)

### Pre-push Hook Failures

**Symptom**: Git push fails with test execution errors in the pre-push hook.

**Cause**: The pre-push hook runs tests automatically and they are failing, or dependencies need to be installed.

**Solution**:
1. Run the pre-push tests manually to see detailed output:
   ```bash
   make test-pre-push
   ```

2. Install missing dependencies:
   ```bash
   make install
   ```

3. Generate the test PDF if missing:
   ```bash
   make generate-test-pdf
   ```

4. Fix any code issues causing test failures.

5. If urgently needed, bypass the hook (not recommended):
   ```bash
   git push --no-verify
   ```

6. Ensure Git hooks are executable:
   ```bash
   make setup-hooks
   ```

**Section sources**
- [Makefile](file://Makefile#L87-L93)
- [TESTING.md](file://TESTING.md#L108-L123)

## Network Troubleshooting

This section provides diagnostic commands and tips for resolving API connectivity issues.

### Service Status and Logs

Use these commands to check service status and view logs:

```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Check if frontend is running
curl http://localhost:3000

# Check if Ollama is running
curl http://localhost:11434/api/tags

# View backend logs
cat backend.log

# View frontend logs
cat frontend.log

# View Ollama logs
cat ollama.log

# Check port usage
lsof -i :3000
lsof -i :5001
lsof -i :11434
```

### API Connectivity Issues

**Symptom**: Services are running but API calls fail or timeout.

**Cause**: Firewall restrictions, network configuration issues, or CORS problems.

**Solution**:
1. Test API endpoints directly:
   ```bash
   # Test backend health check
   curl -v http://localhost:5001/api/health
   
   # Test PDF upload (with actual file)
   curl -X POST -F "file=@test.pdf" -F "num_questions=5" http://localhost:5001/api/upload-pdf
   ```

2. Check CORS configuration in backend/app.py - Flask-CORS should be properly configured.

3. Verify network connectivity between frontend and backend - the frontend proxy should be set to http://localhost:5001 in package.json.

4. Check for firewall rules blocking the required ports.

5. Test with different network interfaces if available.

6. Use browser developer tools to inspect network requests and responses.

**Section sources**
- [backend/app.py](file://backend/app.py#L10-L11)
- [frontend/package.json](file://frontend/package.json#L45)

## Known Limitations and Workarounds

This section documents known application limitations and provides workarounds.

### PDF Size Constraints

**Limitation**: Maximum PDF size is 50MB.

**Workaround**:
1. Split large PDFs into smaller files using tools like `pdfseparate` or online services.
2. Convert PDFs to lower resolution to reduce file size.
3. Extract only relevant pages needed for quiz generation.
4. Use command-line tools to compress PDFs:
   ```bash
   gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output.pdf input.pdf
   ```

### Text Length Limits

**Limitation**: 
- OpenRouter: up to 4000 characters of text
- Mistral 7B: up to 8000 characters of text

**Workaround**:
1. For long documents, extract key sections manually before processing.
2. Use document summarization tools to reduce content length.
3. Process documents in sections and combine results.
4. Focus on specific chapters or sections most relevant for quiz generation.

**Section sources**
- [README.md](file://README.md#L154-L155)
- [backend/model_client.py](file://backend/model_client.py#L94-L95)
- [backend/model_client.py](file://backend/model_client.py#L193-L194)