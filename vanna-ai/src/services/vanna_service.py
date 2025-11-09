from vanna.remote import VannaDefault
from groq import Groq
from src.core.config import settings
from src.core.database import engine, get_table_schema
import logging
import pandas as pd

logger = logging.getLogger(__name__)

class VannaAI:
    def __init__(self):
        """Initialize Vanna AI with Groq"""
        try:
            logger.info("Initializing Vanna AI...")
            
            # Initialize Groq client
            self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq client initialized")
            
            # Initialize Vanna (for database connection only)
            self.vn = VannaDefault(
                model=settings.VANNA_MODEL,
                api_key=settings.VANNA_API_KEY if settings.VANNA_API_KEY else None
            )
            logger.info("Vanna instance created")
            
            # Connect to database
            self.vn.connect_to_postgres(
                host=self._parse_host(),
                dbname=self._parse_dbname(),
                user=self._parse_user(),
                password=self._parse_password(),
                port=self._parse_port()
            )
            
            logger.info("Database connection established")
            logger.info("Vanna AI initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Vanna AI: {e}", exc_info=True)
            raise
    
    def _parse_host(self):
        """Parse host from DATABASE_URL"""
        url = settings.DATABASE_URL
        try:
            if '@' in url:
                host = url.split('@')[1].split(':')[0]
                return host
        except:
            pass
        return "localhost"
    
    def _parse_port(self):
        """Parse port from DATABASE_URL"""
        url = settings.DATABASE_URL
        try:
            if ':' in url and '@' in url:
                port = url.split('@')[1].split(':')[1].split('/')[0].split('?')[0]
                return int(port)
        except:
            pass
        return 5432
    
    def _parse_dbname(self):
        """Parse database name from DATABASE_URL"""
        url = settings.DATABASE_URL
        try:
            if '/' in url:
                dbname = url.split('/')[-1].split('?')[0]
                return dbname
        except:
            pass
        return "postgres"
    
    def _parse_user(self):
        """Parse username from DATABASE_URL"""
        url = settings.DATABASE_URL
        try:
            if '://' in url and '@' in url:
                user = url.split('://')[1].split(':')[0]
                return user
        except:
            pass
        return "postgres"
    
    def _parse_password(self):
        """Parse password from DATABASE_URL"""
        url = settings.DATABASE_URL
        try:
            if '://' in url and '@' in url and ':' in url.split('://')[1]:
                password = url.split('://')[1].split('@')[0].split(':')[1]
                return password
        except:
            pass
        return ""
    
    def train_on_schema(self):
        """Train Vanna on database schema (cache schema for Groq prompts)"""
        try:
            schema = get_table_schema()
            
            if not schema:
                logger.warning("No schema found to train on")
                return False
            
            # Since we're using Groq for SQL generation, we don't need to train Vanna
            # We just cache the schema info which will be used in prompts
            logger.info(f"Schema loaded: {len(schema)} tables found")
            
            for table_name, columns in schema.items():
                logger.info(f"  - {table_name}: {len(columns)} columns")
            
            logger.info("Training completed - schema cached for Groq SQL generation")
            return True
            
        except Exception as e:
            logger.error(f"Training failed: {e}", exc_info=True)
            return False
    
    def _generate_sql_with_groq(self, question: str):
        """Generate SQL using Groq"""
        try:
            logger.info(f"Generating SQL for question: {question}")
            
            # Get schema info
            schema = get_table_schema()
            
            if not schema:
                logger.error("No schema available for SQL generation")
                return None
            
            schema_parts = []
            for table, cols in schema.items():
                col_str = ', '.join([f"{col['name']} ({col['type']})" for col in cols])
                schema_parts.append(f"Table: {table}\nColumns: {col_str}")
            schema_str = "\n\n".join(schema_parts)
            
            logger.debug(f"Using schema: {schema_str[:200]}...")
            
            # Create prompt
            prompt = f"""You are a PostgreSQL expert. Given the following database schema:

{schema_str}

Generate a valid PostgreSQL query to answer this question: {question}

CRITICAL Rules:
- Return ONLY the SQL query, no explanations
- Use proper PostgreSQL syntax
- ALWAYS wrap column names in double quotes (e.g., "vendorName", "documentId")
- ALWAYS wrap table names in double quotes (e.g., "vendors", "documents")
- This is REQUIRED because column names use camelCase
- Don't use markdown code blocks
- End with semicolon

ADVANCED SQL PATTERNS:
- For moving averages/window functions: Use CTEs (WITH clause) to first aggregate, then apply window functions
- Window function syntax: FUNCTION() OVER (PARTITION BY col ORDER BY col ROWS BETWEEN...)
- For growth rates: MUST use CTE pattern:
  * Step 1: CTE aggregates data (WITH monthly_data AS (SELECT month, SUM(amount) FROM ... GROUP BY month))
  * Step 2: Apply LAG() on the aggregated results (SELECT *, LAG(amount) OVER (ORDER BY month) FROM monthly_data)
  * Step 3: Calculate percentage: (current - previous) / previous * 100
  * CRITICAL: Never use LAG(SUM(...)) - aggregate first in CTE, then LAG on aggregated column
- Example CTE: WITH monthly_data AS (SELECT ...) SELECT ... FROM monthly_data
- Always order window functions properly with ORDER BY inside OVER clause

IMPORTANT DATA NOTES:
- For invoice totals/amounts: Use "summaries"."invoiceTotal" (this has the data)
- For line item amounts: Use "line_items"."amount" (this column exists and has data)
- For subtotals: Use "summaries"."subTotal"
- For tax totals: Use "summaries"."totalTax"
- The "payments" table has payment TERMS/conditions, NOT payment amounts
- "payments" has: "paymentTerms" (text), "dueDate", "netDays", "discountPercentage"
- To group by payment terms: JOIN "payments" with "summaries" on "documentId"

CUSTOMER/VENDOR AMOUNT QUERIES:
- For customer totals by invoice amount: 
  JOIN "customers" → "summaries" on "documentId", then SUM("summaries"."invoiceTotal")
- For vendor totals by invoice amount:
  JOIN "vendors" → "summaries" on "documentId", then SUM("summaries"."invoiceTotal")
- Example: SELECT c."customerName", SUM(s."invoiceTotal") AS total_amount
           FROM "customers" c
           JOIN "summaries" s ON c."documentId" = s."documentId"
           GROUP BY c."customerName"
           ORDER BY total_amount DESC
           LIMIT 5;

DATE COLUMNS:
- "invoices"."invoiceDate" - invoice date (nullable)
- "invoices"."deliveryDate" - delivery date (nullable)
- "payments"."dueDate" - payment due date (nullable)
- "documents"."createdAt", "updatedAt", "processedAt" - document timestamps
- Use CURRENT_DATE for today's date (not NOW() for date comparisons)
- Use INTERVAL '30 days' (plural), '1 month', '1 year' for date arithmetic
- Format: WHERE "invoiceDate" >= CURRENT_DATE - INTERVAL '30 days'
- IMPORTANT: Always add "IS NOT NULL" check for nullable date columns
- Example: WHERE "invoiceDate" IS NOT NULL AND EXTRACT(YEAR FROM "invoiceDate") = EXTRACT(YEAR FROM CURRENT_DATE)

Example: SELECT "vendorName", "id" FROM "vendors";

VENDOR RISK ANALYSIS PATTERN:
For complex vendor risk queries with multiple conditions (declining volumes, increasing amounts, irregular patterns):
- Use multiple CTEs to break down the logic step by step:
  * Step 1: WITH monthly_vendor_stats AS (
      SELECT "vendors"."vendorName",
             EXTRACT(YEAR FROM "invoices"."invoiceDate") AS year,
             EXTRACT(MONTH FROM "invoices"."invoiceDate") AS month,
             COUNT(*) AS invoice_count,
             SUM("summaries"."invoiceTotal") AS total_amount,
             AVG("summaries"."invoiceTotal") AS avg_amount
      FROM "vendors"
      JOIN "documents" ON "vendors"."documentId" = "documents"."id"
      JOIN "invoices" ON "documents"."id" = "invoices"."documentId"
      JOIN "summaries" ON "documents"."id" = "summaries"."documentId"
      WHERE "invoices"."invoiceDate" IS NOT NULL
      GROUP BY "vendors"."vendorName", EXTRACT(YEAR FROM "invoices"."invoiceDate"), EXTRACT(MONTH FROM "invoices"."invoiceDate")
    )
  * Step 2: WITH vendor_changes AS (
      SELECT *,
             LAG(invoice_count) OVER (PARTITION BY "vendorName" ORDER BY year, month) AS prev_count,
             LAG(avg_amount) OVER (PARTITION BY "vendorName" ORDER BY year, month) AS prev_avg
      FROM monthly_vendor_stats
    )
  * Step 3: WITH risk_flags AS (
      SELECT *,
             CASE WHEN invoice_count < prev_count THEN true ELSE false END AS declining_volume,
             CASE WHEN avg_amount > prev_avg * 1.2 THEN true ELSE false END AS increasing_amounts
      FROM vendor_changes
      WHERE prev_count IS NOT NULL
    )
  * Step 4: SELECT * FROM risk_flags WHERE declining_volume = true OR increasing_amounts = true
- For irregular patterns: use STDDEV_POP() or variance functions
- Order by risk severity and limit results to top vendors
"""

            logger.info(f"Calling Groq API with model: {settings.GROQ_MODEL}")
            
            # Call Groq
            response = self.groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a SQL expert. Generate only valid PostgreSQL queries without any explanations or markdown. ALWAYS use double quotes around ALL column and table names because they use camelCase naming."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1500  # Increased for complex queries with multiple CTEs
            )
            
            sql = response.choices[0].message.content.strip()
            
            # Clean up SQL (remove markdown, extra spaces)
            sql = sql.replace('```sql', '').replace('```', '').strip()
            
            logger.info(f"✅ Generated SQL: {sql}")
            return sql
            
        except Exception as e:
            logger.error(f"❌ SQL generation with Groq failed: {e}", exc_info=True)
            return None
    
    def ask_question(self, question: str):
        """
        Ask a natural language question
        Returns: dict with sql, results, and explanation
        """
        try:
            logger.info(f"Processing question: {question}")
            
            # Generate SQL using Groq
            sql = self._generate_sql_with_groq(question)
            
            if not sql:
                logger.error("SQL generation failed")
                return {
                    "success": False,
                    "question": question,
                    "error": "Could not generate SQL from question"
                }
            
            logger.info(f"Generated SQL: {sql}")
            
            # Execute SQL using Vanna's run_sql
            try:
                logger.info("Executing SQL query...")
                df = self.vn.run_sql(sql)
                logger.info(f"SQL execution completed. DataFrame shape: {df.shape if df is not None else 'None'}")
            except Exception as exec_error:
                logger.error(f"SQL execution failed: {exec_error}", exc_info=True)
                return {
                    "success": False,
                    "question": question,
                    "sql": sql,
                    "error": f"SQL execution failed: {str(exec_error)}"
                }
            
            # Convert DataFrame to dict
            if df is not None and not df.empty:
                results = df.to_dict('records')
                logger.info(f"Converted DataFrame to {len(results)} records")
            else:
                results = []
                logger.warning("DataFrame is None or empty")
            
            logger.info(f"Query returned {len(results)} rows")
            
            # Generate simple explanation
            explanation = f"The query returned {len(results)} row(s)."
            if len(results) > 0:
                explanation += f" Sample result: {results[0]}"
            
            return {
                "success": True,
                "question": question,
                "sql": sql,
                "results": results,
                "explanation": explanation,
                "row_count": len(results)
            }
            
        except Exception as e:
            logger.error(f"Question failed: {e}", exc_info=True)
            return {
                "success": False,
                "question": question,
                "error": str(e)
            }
    
    def generate_sql_only(self, question: str):
        """Generate SQL without executing"""
        try:
            sql = self._generate_sql_with_groq(question)
            return {
                "success": True if sql else False,
                "sql": sql,
                "question": question,
                "error": None if sql else "Failed to generate SQL"
            }
        except Exception as e:
            logger.error(f"SQL generation failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

# Global instance
vanna_ai = None

def get_vanna_ai():
    """Get or create Vanna AI instance"""
    global vanna_ai
    if vanna_ai is None:
        vanna_ai = VannaAI()
    return vanna_ai