# Dockerfile for Magentic-UI (see README.md for details)
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

ENV MAGENTIC_UI_PLAYWRIGHT_PORT=37367
ENV MAGENTIC_UI_NOVNC_PORT=6080
ENV MAGENTIC_UI_PLAYWRIGHT_HOST=localhost
ENV MAGENTIC_UI_NOVNC_HOST=localhost

ENV AZURE_OPENAI_API_KEY=""
ENV AZURE_OPENAI_ENDPOINT=https://us-cld-sahirrao-6472-resource.cognitiveservices.azure.com
ENV AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
# Copy source code and relevant files
COPY src ./src
COPY pyproject.toml uv.lock README.md ./
# COPY client_key.yml /app/client_key.yml



# Install Python dependencies (editable mode, no venv)
RUN pip install --upgrade pip && pip install -e . && pip install .[eval,azure,ollama]

# Clean up build dependencies
RUN apt-get purge -y build-essential && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Expose the application port
EXPOSE 8081

# Default command
CMD ["magentic-ui", "--port", "8081", "--host", "0.0.0.0"]

