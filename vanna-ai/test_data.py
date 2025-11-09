from sqlalchemy import create_engine, text
from src.core.config import settings

engine = create_engine(settings.DATABASE_URL)
conn = engine.connect()

# Check summaries data
print("=== SUMMARIES TABLE ===")
result = conn.execute(text('SELECT "subTotal", "totalTax", "invoiceTotal" FROM "summaries" LIMIT 5'))
rows = result.fetchall()
print(f"Total rows: {len(rows)}")
for i, row in enumerate(rows, 1):
    print(f"  Row {i}: subTotal={row[0]}, totalTax={row[1]}, invoiceTotal={row[2]}")

# Check if there are any non-null values
result = conn.execute(text('SELECT COUNT(*), COUNT("subTotal"), COUNT("totalTax"), COUNT("invoiceTotal") FROM "summaries"'))
counts = result.fetchone()
print(f"\nTotal rows: {counts[0]}")
print(f"Non-null subTotal: {counts[1]}")
print(f"Non-null totalTax: {counts[2]}")
print(f"Non-null invoiceTotal: {counts[3]}")

# Check line_items data
print("\n=== LINE_ITEMS TABLE ===")
result = conn.execute(text('SELECT "quantity", "unitPrice", "amount" FROM "line_items" LIMIT 5'))
rows = result.fetchall()
print(f"Total rows: {len(rows)}")
for i, row in enumerate(rows, 1):
    print(f"  Row {i}: quantity={row[0]}, unitPrice={row[1]}, amount={row[2]}")

result = conn.execute(text('SELECT COUNT(*), COUNT("quantity"), COUNT("unitPrice"), COUNT("amount") FROM "line_items"'))
counts = result.fetchone()
print(f"\nTotal rows: {counts[0]}")
print(f"Non-null quantity: {counts[1]}")
print(f"Non-null unitPrice: {counts[2]}")
print(f"Non-null amount: {counts[3]}")

conn.close()
