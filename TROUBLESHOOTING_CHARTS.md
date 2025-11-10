# Test Invoice Trends Endpoint

## Quick Troubleshooting Steps

### 1. Check if Vanna AI server is running
Open browser and visit: http://localhost:8000/api/v1/health

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "vanna": "initialized"
}
```

### 2. Test the invoice trends endpoint directly
Visit: http://localhost:8000/api/v1/dashboard/trend?months=12

Expected response format:
```json
[
  {
    "month": "Jan 2025",
    "count": 10,
    "value": 5000.00
  },
  ...
]
```

### 3. Test through Next.js API
Visit: http://localhost:3000/api/invoice-trends?months=12

Should return the same data as above.

### 4. Check browser console
Open Developer Tools (F12) and check Console tab for errors.

### Common Issues:

#### Issue 1: Vanna server not running
**Solution:**
```powershell
cd vanna-ai
python -m uvicorn src.main:app --reload --port 8000
```

#### Issue 2: No data in database
**Solution:** Check if invoices table has data
```sql
SELECT COUNT(*) FROM invoices;
```

#### Issue 3: Date format issues
**Solution:** Check if invoiceDate column exists and has valid dates

#### Issue 4: Frontend not reloaded after changes
**Solution:**
```powershell
# Stop the frontend server (Ctrl+C)
cd frontend
npm run dev
```

### Debug Commands:

Test the endpoint with curl (in PowerShell):
```powershell
# Test Vanna backend directly
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/dashboard/trend?months=12" | ConvertTo-Json

# Test Next.js API
Invoke-RestMethod -Uri "http://localhost:3000/api/invoice-trends?months=12" | ConvertTo-Json
```

### If chart still doesn't show:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages starting with "Loading invoice trend data..." or "Failed to load trend data:"
4. Check Network tab for failed API requests
5. Share the error message for further help
