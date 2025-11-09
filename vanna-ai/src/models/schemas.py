from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class QuestionRequest(BaseModel):
    """Request model for asking questions"""
    question: str = Field(
        ..., 
        description="Natural language question about the data",
        example="How many documents are in the database?"
    )
    execute: bool = Field(
        True, 
        description="Whether to execute the generated SQL"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "Show me all invoices from last month",
                "execute": True
            }
        }

class SQLGenerationResponse(BaseModel):
    """Response model for SQL generation"""
    success: bool
    question: Optional[str] = None
    sql: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "question": "How many documents are there?",
                "sql": "SELECT COUNT(*) FROM documents;"
            }
        }

class QueryResponse(BaseModel):
    """Response model for query execution"""
    success: bool
    question: str
    sql: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    explanation: Optional[str] = None
    row_count: Optional[int] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "question": "How many documents are there?",
                "sql": "SELECT COUNT(*) FROM documents;",
                "results": [{"count": 50}],
                "explanation": "This query counts all documents in the database.",
                "row_count": 1
            }
        }

class TrainingResponse(BaseModel):
    """Response model for training"""
    success: bool
    message: str
    tables_trained: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Model trained successfully on database schema",
                "tables_trained": 7
            }
        }

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    database: str
    vanna: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "database": "connected",
                "vanna": "initialized"
            }
        }

class ErrorResponse(BaseModel):
    """Response model for errors"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Failed to generate SQL",
                "detail": "Question is too ambiguous"
            }
        }