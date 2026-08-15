from fastapi import FastAPI

app = FastAPI()

@app.get("/delete")
def index():
    return {"name": "Hello World"}