FROM python:3.12-slim

WORKDIR /service

COPY services/akshare_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/akshare_service/app.py .

EXPOSE 8765

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8765"]
