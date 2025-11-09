from fastapi import APIRouter, HTTPException, Depends
from src.models.schemas import (
    QuestionRequest,
    QueryResponse,
    SQLGenerationResponse,
    TrainingResponse,
    HealthResponse
)
from src.services.vanna_service import get_vanna_ai, VannaAI
from src.core.database import test_connection
import logging

logger = logging.getLogger(__name__)

# Create API Router
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check API health status
    
    Returns:
        - status: Overall API status
        - database: Database connection status
        - vanna: Vanna AI initialization status
    """
    db_status = "connected" if test_connection() else "disconnected"
    
    try:
        vanna = get_vanna_ai()
        vanna_status = "initialized"
    except:
        vanna_status = "not initialized"
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "vanna": vanna_status
    }

@router.post("/train", response_model=TrainingResponse)
async def train_model(vanna: VannaAI = Depends(get_vanna_ai)):
    """
    Train Vanna AI on your database schema
    
    This endpoint:
    - Reads your database structure
    - Trains Vanna to understand your tables and columns
    - Enables Vanna to generate accurate SQL queries
    
    Returns:
        - success: Whether training was successful
        - message: Status message
        - tables_trained: Number of tables trained on
    """
    try:
        logger.info("Starting model training...")
        success = vanna.train_on_schema()
        
        if success:
            from src.core.database import get_table_schema
            schema = get_table_schema()
            tables_count = len(schema)
            
            logger.info(f"Training completed on {tables_count} tables")
            return {
                "success": True,
                "message": "Model trained successfully on database schema",
                "tables_trained": tables_count
            }
        else:
            logger.error("Training failed")
            raise HTTPException(
                status_code=500, 
                detail="Training failed - no schema found or error occurred"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask", response_model=QueryResponse)
async def ask_question(
    request: QuestionRequest,
    vanna: VannaAI = Depends(get_vanna_ai)
):
    """
    Ask a natural language question about your data
    
    This endpoint:
    - Takes your question in plain English
    - Generates SQL query using Vanna AI + Groq
    - Executes the query (if execute=True)
    - Returns results with explanation
    
    Args:
        question: Natural language question (e.g., "How many invoices are there?")
        execute: Whether to execute the SQL (default: True)
    
    Returns:
        - success: Whether operation was successful
        - question: Your original question
        - sql: Generated SQL query
        - results: Query results (if executed)
        - explanation: Plain English explanation of results
        - row_count: Number of rows returned
        - error: Error message (if failed)
    
    Examples:
        - "How many documents are in the database?"
        - "Show me all invoices from last month"
        - "What is the total invoice amount by vendor?"
        - "List all customers with their total purchases"
    """
    try:
        logger.info(f"Processing question: {request.question}")
        
        if request.execute:
            # Generate SQL and execute
            result = vanna.ask_question(request.question)
        else:
            # Only generate SQL, don't execute
            result = vanna.generate_sql_only(request.question)
        
        if not result["success"]:
            logger.warning(f"Query failed: {result.get('error')}")
            raise HTTPException(
                status_code=400, 
                detail=result.get("error", "Query failed")
            )
        
        logger.info(f"Query successful - returned {result.get('row_count', 0)} rows")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-sql", response_model=SQLGenerationResponse)
async def generate_sql(
    request: QuestionRequest,
    vanna: VannaAI = Depends(get_vanna_ai)
):
    """
    Generate SQL query without executing it
    
    This endpoint:
    - Takes your question
    - Generates SQL query
    - Returns SQL without running it
    
    Useful for:
    - Reviewing SQL before execution
    - Learning SQL from natural language
    - Building custom query interfaces
    
    Args:
        question: Natural language question
    
    Returns:
        - success: Whether SQL generation was successful
        - question: Your original question
        - sql: Generated SQL query
        - error: Error message (if failed)
    """
    try:
        logger.info(f"Generating SQL for: {request.question}")
        result = vanna.generate_sql_only(request.question)
        
        if not result["success"]:
            logger.warning(f"SQL generation failed: {result.get('error')}")
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "SQL generation failed")
            )
        
        logger.info("SQL generated successfully")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SQL generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/overview")
async def get_dashboard_overview():
    """
    Get overview statistics for dashboard
    
    Returns:
        - totalSpendYTD: Total spend year-to-date
        - totalInvoices: Total number of invoices processed
        - documentsUploaded: Total documents uploaded
        - avgInvoiceValue: Average invoice value
    """
    try:
        from src.core.database import engine
        import pandas as pd
        
        logger.info("Fetching dashboard overview statistics...")
        
        # Total spend YTD (from summaries table)
        sql_ytd = """
            SELECT COALESCE(SUM(s."invoiceTotal"), 0) as total_spend_ytd
            FROM summaries s
            JOIN invoices i ON s."documentId" = i."documentId"
            WHERE EXTRACT(YEAR FROM i."invoiceDate") = EXTRACT(YEAR FROM CURRENT_DATE)
        """
        df_ytd = pd.read_sql(sql_ytd, engine)
        total_spend_ytd = float(df_ytd['total_spend_ytd'].iloc[0] or 0)
        
        # Total invoices
        sql_invoices = "SELECT COUNT(*) as total_invoices FROM invoices"
        df_invoices = pd.read_sql(sql_invoices, engine)
        total_invoices = int(df_invoices['total_invoices'].iloc[0])
        
        # Documents uploaded
        sql_documents = "SELECT COUNT(*) as total_documents FROM documents"
        df_documents = pd.read_sql(sql_documents, engine)
        documents_uploaded = int(df_documents['total_documents'].iloc[0])
        
        # Average invoice value
        sql_avg = """SELECT COALESCE(AVG("invoiceTotal"), 0) as avg_invoice FROM summaries"""
        df_avg = pd.read_sql(sql_avg, engine)
        avg_invoice_value = float(df_avg['avg_invoice'].iloc[0] or 0)
        
        logger.info(f"Overview stats: YTD=${total_spend_ytd}, Invoices={total_invoices}, Docs={documents_uploaded}, Avg=${avg_invoice_value}")
        
        return {
            "totalSpendYTD": total_spend_ytd,
            "totalInvoices": total_invoices,
            "documentsUploaded": documents_uploaded,
            "avgInvoiceValue": avg_invoice_value
        }
        
    except Exception as e:
        logger.error(f"Dashboard overview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/trend")
async def get_invoice_trend(months: int = 12):
    """
    Get invoice volume and value trend over time
    
    Args:
        months: Number of months to retrieve (default: 12)
    
    Returns:
        List of data points with month, invoice count, and total value
    """
    try:
        from src.core.database import engine
        import pandas as pd
        
        logger.info(f"Fetching invoice trend for last {months} months...")
        
        sql = f"""
            SELECT 
                TO_CHAR(i."invoiceDate", 'Mon YYYY') as month,
                COUNT(*) as count,
                COALESCE(SUM(s."invoiceTotal"), 0) as total_value
            FROM invoices i
            LEFT JOIN summaries s ON i."documentId" = s."documentId"
            WHERE i."invoiceDate" >= CURRENT_DATE - INTERVAL '{months} months'
            GROUP BY TO_CHAR(i."invoiceDate", 'Mon YYYY'), DATE_TRUNC('month', i."invoiceDate")
            ORDER BY DATE_TRUNC('month', i."invoiceDate")
        """
        
        df = pd.read_sql(sql, engine)
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "month": row['month'],
                "count": int(row['count']),
                "value": float(row['total_value'])
            })
        
        logger.info(f"Retrieved {len(result)} months of trend data")
        return result
        
    except Exception as e:
        logger.error(f"Invoice trend error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/vendors/top")
async def get_top_vendors(limit: int = 10):
    """
    Get top vendors by total spend
    
    Args:
        limit: Number of top vendors to retrieve (default: 10)
    
    Returns:
        List of vendors with their total spend
    """
    try:
        from src.core.database import engine
        import pandas as pd
        
        logger.info(f"Fetching top {limit} vendors...")
        
        sql = f"""
            SELECT 
                v."vendorName" as vendor_name,
                COALESCE(SUM(s."invoiceTotal"), 0) as total_spend
            FROM vendors v
            LEFT JOIN summaries s ON v."documentId" = s."documentId"
            GROUP BY v."vendorName"
            ORDER BY total_spend DESC
            LIMIT {limit}
        """
        
        df = pd.read_sql(sql, engine)
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "vendorName": row['vendor_name'],
                "totalSpend": float(row['total_spend'])
            })
        
        logger.info(f"Retrieved {len(result)} top vendors")
        return result
        
    except Exception as e:
        logger.error(f"Top vendors error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/categories")
async def get_spend_by_category():
    """
    Get spend distribution by category
    
    Returns:
        List of categories with their total spend and percentage
    """
    try:
        from src.core.database import engine
        import pandas as pd
        
        logger.info("Fetching spend by category...")
        
        sql = """
            SELECT 
                COALESCE(li.description, 'Uncategorized') as category,
                COALESCE(SUM(li.amount), 0) as total_spend
            FROM line_items li
            GROUP BY COALESCE(li.description, 'Uncategorized')
            ORDER BY total_spend DESC
            LIMIT 10
        """
        
        df = pd.read_sql(sql, engine)
        
        # Calculate total for percentages
        total_spend = df['total_spend'].sum()
        
        result = []
        for _, row in df.iterrows():
            spend = float(row['total_spend'])
            percentage = (spend / total_spend * 100) if total_spend > 0 else 0
            result.append({
                "category": row['category'],
                "totalSpend": spend,
                "percentage": round(percentage, 2)
            })
        
        logger.info(f"Retrieved {len(result)} categories")
        return result
        
    except Exception as e:
        logger.error(f"Spend by category error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/cashflow")
async def get_cash_flow_forecast(months: int = 6):
    """
    Get cash flow forecast (projected vs actual)
    
    Args:
        months: Number of months to forecast (default: 6)
    
    Returns:
        List of months with projected and actual cash outflow
    """
    try:
        from src.core.database import engine
        import pandas as pd
        
        logger.info(f"Fetching cash flow forecast for {months} months...")
        
        sql = f"""
            SELECT 
                TO_CHAR(DATE_TRUNC('month', i."invoiceDate"), 'Mon YYYY') as month,
                COALESCE(SUM(CASE WHEN p."dueDate" < CURRENT_DATE THEN s."invoiceTotal" ELSE 0 END), 0) as actual,
                COALESCE(SUM(s."invoiceTotal"), 0) as projected
            FROM invoices i
            LEFT JOIN summaries s ON i."documentId" = s."documentId"
            LEFT JOIN payments p ON i."documentId" = p."documentId"
            WHERE i."invoiceDate" >= CURRENT_DATE - INTERVAL '{months} months'
            GROUP BY DATE_TRUNC('month', i."invoiceDate")
            ORDER BY DATE_TRUNC('month', i."invoiceDate")
        """
        
        df = pd.read_sql(sql, engine)
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "month": row['month'],
                "projected": float(row['projected']),
                "actual": float(row['actual'])
            })
        
        logger.info(f"Retrieved {len(result)} months of cash flow data")
        return result
        
    except Exception as e:
        logger.error(f"Cash flow forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/invoices")
async def get_invoices(
    search: str = "",
    status: str = "all",
    sort_by: str = "invoiceDate",
    sort_order: str = "desc",
    limit: int = 100
):
    """
    Get invoices with filtering and sorting
    
    Args:
        search: Search term for vendor name or invoice number
        status: Filter by status (all, paid, pending, overdue, draft)
        sort_by: Field to sort by
        sort_order: Sort order (asc or desc)
        limit: Maximum number of results
    
    Returns:
        List of invoices with vendor information
    """
    try:
        from src.core.database import engine
        import pandas as pd
        from datetime import datetime
        from sqlalchemy import text
        
        logger.info(f"Fetching invoices: search='{search}', status='{status}', sort={sort_by} {sort_order}")
        
        # Map frontend field names to database columns
        field_map = {
            "vendor": "v.\"vendorName\"",
            "vendorName": "v.\"vendorName\"",
            "invoiceDate": "i.\"invoiceDate\"",
            "invoiceNumber": "i.\"invoiceId\"",
            "amount": "s.\"invoiceTotal\""
        }
        
        sort_field = field_map.get(sort_by, "i.\"invoiceDate\"")
        
        # Build WHERE clause
        where_clause = ""
        params = {}
        
        if search:
            where_clause = "WHERE (v.\"vendorName\" ILIKE :search OR i.\"invoiceId\" ILIKE :search)"
            params['search'] = f"%{search}%"
        
        sql = f"""
            SELECT 
                i.id,
                i."invoiceId" as invoice_number,
                i."invoiceDate" as invoice_date,
                s."invoiceTotal" as total_amount,
                CASE 
                    WHEN p."dueDate" < CURRENT_DATE THEN 'overdue'
                    WHEN p."dueDate" > CURRENT_DATE THEN 'pending'
                    ELSE 'paid'
                END as status,
                v."vendorName" as vendor
            FROM invoices i
            LEFT JOIN vendors v ON i."documentId" = v."documentId"
            LEFT JOIN summaries s ON i."documentId" = s."documentId"
            LEFT JOIN payments p ON i."documentId" = p."documentId"
            {where_clause}
            ORDER BY {sort_field} {sort_order.upper()}
            LIMIT {limit}
        """
        
        if params:
            df = pd.read_sql(text(sql), engine, params=params)
        else:
            df = pd.read_sql(sql, engine)
        
        result = []
        for idx in range(len(df)):
            row_id = df.iloc[idx]['id']
            row_invoice_number = df.iloc[idx]['invoice_number']
            row_vendor = df.iloc[idx]['vendor']
            row_invoice_date = df.iloc[idx]['invoice_date']
            row_total_amount = df.iloc[idx]['total_amount']
            row_status = df.iloc[idx]['status']
            
            # Filter by status if not 'all'
            if status != 'all' and row_status != status:
                continue
            
            result.append({
                "id": str(row_id) if row_id is not None else 'N/A',
                "invoiceNumber": str(row_invoice_number) if row_invoice_number is not None else 'N/A',
                "vendor": str(row_vendor) if row_vendor is not None else 'Unknown',
                "invoiceDate": row_invoice_date.isoformat() if pd.notna(row_invoice_date) else None,
                "amount": float(row_total_amount) if pd.notna(row_total_amount) else 0.0,
                "status": str(row_status) if row_status is not None else 'draft'
            })
        
        logger.info(f"Retrieved {len(result)} invoices after filtering")
        return result
        
    except Exception as e:
        logger.error(f"Get invoices error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "message": "Vanna AI API",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /api/v1/health - Check API health",
            "train": "POST /api/v1/train - Train model on database",
            "ask": "POST /api/v1/ask - Ask a question",
            "generate_sql": "POST /api/v1/generate-sql - Generate SQL only",
            "dashboard_overview": "GET /api/v1/dashboard/overview - Get dashboard overview stats",
            "dashboard_trend": "GET /api/v1/dashboard/trend - Get invoice trend data",
            "dashboard_vendors": "GET /api/v1/dashboard/vendors/top - Get top vendors",
            "dashboard_categories": "GET /api/v1/dashboard/categories - Get spend by category",
            "dashboard_cashflow": "GET /api/v1/dashboard/cashflow - Get cash flow forecast",
            "invoices": "GET /api/v1/invoices - Get invoices with filtering"
        },
        "docs": "/docs"
    }