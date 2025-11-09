from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def get_table_schema():
    """Get database schema information"""
    try:
        with engine.connect() as conn:
            # Get all tables from public schema
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            
            tables_result = conn.execute(tables_query)
            tables = tables_result.fetchall()
            
            logger.info(f"Found {len(tables)} tables")
            
            if not tables:
                logger.warning("No tables found in public schema")
                return {}
            
            schema = {}
            for row in tables:
                table_name = row[0]
                logger.info(f"Processing table: {table_name}")
                
                # Get columns for each table
                columns_query = text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_schema = 'public'
                    AND table_name = :table_name
                    ORDER BY ordinal_position
                """)
                
                columns_result = conn.execute(columns_query, {"table_name": table_name})
                columns = columns_result.fetchall()
                
                schema[table_name] = [
                    {
                        "name": col[0],
                        "type": col[1],
                        "nullable": col[2] == "YES"
                    }
                    for col in columns
                ]
                
                logger.info(f"  - Found {len(columns)} columns in {table_name}")
            
            return schema
            
    except Exception as e:
        logger.error(f"Failed to get schema: {e}", exc_info=True)
        return {}