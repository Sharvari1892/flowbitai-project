# FlowbitAI - Invoice Analytics & AI Data Assistant

> An intelligent invoice processing and data analytics platform powered by AI, built with Next.js, FastAPI, and Vanna.AI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Quick Start](#quick-start)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Chat with Data Workflow](#chat-with-data-workflow)
- [Environment Variables](#environment-variables)
- [Usage Examples](#usage-examples)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

FlowbitAI is an enterprise-grade invoice processing and analytics platform that combines OCR document processing with AI-powered natural language querying. Users can upload invoices, view comprehensive analytics dashboards, and interact with their data using natural language questions.

### Key Capabilities

- 📄 **Invoice Processing**: Automated extraction of invoice data (vendors, line items, payments, etc.)
- 📊 **Analytics Dashboard**: Real-time visualizations of spending trends, vendor analysis, and cash flow forecasts
- 🤖 **AI Data Assistant**: Ask questions about your data in plain English and get SQL-powered answers
- 📈 **Interactive Charts**: Multiple chart types (bar, line, pie) for data visualization
- 💾 **Export & Reporting**: CSV export functionality for all query results

---

## ✨ Features

### 1. Analytics Dashboard
- **KPI Cards**: Total spend YTD, invoice count, documents uploaded, average invoice value
- **Invoice Trends**: Monthly invoice volume and spending patterns
- **Top Vendors**: Ranked list of vendors by total spend
- **Category Analysis**: Spending breakdown by invoice line item categories
- **Cash Flow Forecast**: Projected vs. actual cash outflow visualization
- **Invoice Management**: Searchable, sortable, filterable invoice table

### 2. Chat with Data (AI Assistant)
- Natural language to SQL query generation using Vanna.AI + Groq LLM
- Real-time query execution with formatted results
- Multiple visualization options (table, bar chart, line chart, pie chart)
- Chat history with session management
- Follow-up question suggestions
- Draft auto-save functionality
- CSV export for query results

### 3. Data Management
- PostgreSQL database with Prisma ORM
- Document-centric data model
- Relational integrity with cascading deletes
- Connection pooling for production environments

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │ Chat with    │  │   Invoice Table      │  │
│  │   Charts     │  │    Data      │  │   & Filters          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   API Routes      │
                    │  /api/dashboard   │
                    │  /api/chat        │
                    └──────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  Backend API (FastAPI)   │    │   PostgreSQL Database    │
│  ┌────────────────────┐  │    │  ┌────────────────────┐  │
│  │  Vanna AI Service  │  │◄──►│  │   Prisma Schema    │  │
│  │  + Groq LLM        │  │    │  │   8 Tables         │  │
│  └────────────────────┘  │    │  └────────────────────┘  │
│  ┌────────────────────┐  │    └──────────────────────────┘
│  │  SQL Query Engine  │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### Data Flow

1. **User Interaction** → Frontend Next.js components
2. **API Request** → Next.js API routes or FastAPI endpoints
3. **AI Processing** → Vanna.AI converts natural language to SQL (via Groq LLM)
4. **Query Execution** → SQL executed against PostgreSQL
5. **Response** → Results formatted and returned to frontend
6. **Visualization** → Data rendered in tables/charts

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│   DOCUMENTS     │◄───────────────────┐
│─────────────────│                    │
│ id (PK)         │                    │
│ name            │                    │
│ filePath        │                    │
│ fileSize        │                    │
│ fileType        │                    │
│ status          │                    │
│ createdAt       │                    │
│ updatedAt       │                    │
└─────────────────┘                    │
         │                             │
         │ 1:1 relationships           │
         ├──────────┬──────────┬──────┼──────┬──────────┐
         ▼          ▼          ▼      ▼      ▼          ▼
    ┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐
    │INVOICES│ │VENDORS │ │CUSTOMERS│ │PAYMENTS│ │SUMMARIES │
    └────────┘ └────────┘ └─────────┘ └────────┘ └──────────┘
                                                            
         │ 1:N relationship
         ▼
    ┌──────────────┐
    │  LINE_ITEMS  │
    └──────────────┘
```

### Table Details

#### **documents**
Core table storing document metadata
- `id`: UUID primary key
- `name`: Document filename
- `filePath`: Storage location
- `fileSize`: File size in bytes
- `fileType`: MIME type
- `status`: Processing status
- `organizationId`: Organization reference
- `departmentId`: Department reference
- `createdAt`, `updatedAt`: Timestamps
- `processedAt`: Processing completion time

#### **invoices**
Invoice-specific information
- `id`: UUID primary key
- `documentId`: Foreign key to documents (unique)
- `invoiceId`: Invoice number from document
- `invoiceDate`: Invoice date
- `deliveryDate`: Delivery date
- `confidence`: OCR confidence score

#### **vendors**
Vendor information extracted from invoices
- `id`: UUID primary key
- `documentId`: Foreign key to documents (unique)
- `vendorName`: Vendor name
- `vendorAddress`: Vendor address
- `vendorTaxId`: Tax ID number
- `confidence`: OCR confidence score

#### **customers**
Customer information
- `id`: UUID primary key
- `documentId`: Foreign key to documents (unique)
- `customerName`: Customer name
- `customerAddress`: Customer address
- `customerTaxId`: Tax ID number
- `confidence`: OCR confidence score

#### **payments**
Payment terms and banking details
- `id`: UUID primary key
- `documentId`: Foreign key to documents (unique)
- `dueDate`: Payment due date
- `paymentTerms`: Terms description
- `bankAccountNumber`: Bank account
- `netDays`: Net payment days
- `discountPercentage`: Early payment discount
- `confidence`: OCR confidence score

#### **summaries**
Financial summary data
- `id`: UUID primary key
- `documentId`: Foreign key to documents (unique)
- `subTotal`: Subtotal amount
- `totalTax`: Total tax amount
- `invoiceTotal`: Grand total
- `documentType`: Document type
- `currencySymbol`: Currency code
- `confidence`: OCR confidence score

#### **line_items**
Individual invoice line items
- `id`: UUID primary key
- `documentId`: Foreign key to documents
- `srNo`: Line item number
- `description`: Item description
- `quantity`: Quantity
- `unitPrice`: Price per unit
- `amount`: Line total
- `vatRate`: VAT/tax rate
- `vatAmount`: VAT/tax amount
- `confidence`: OCR confidence score

---

## ⚡ Quick Start

Get FlowbitAI running locally in 5 minutes!

### Prerequisites

- Node.js 18+, Python 3.9+, PostgreSQL 15+ (or Supabase account)
- Groq API key from [console.groq.com](https://console.groq.com)

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/Sharvari1892/flowbitai-project.git
cd flowbitai-project

# Install frontend
cd frontend
npm install

# Install backend
cd ../vanna-ai
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

**Frontend** (`frontend/.env`):
```env
DATABASE_URL="postgresql://USER:PASS@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASS@HOST:5432/postgres"
NEXT_PUBLIC_VANNA_API_URL="http://localhost:8000"
```

**Backend** (`vanna-ai/.env`):
```env
DATABASE_URL="postgresql://USER:PASS@HOST:5432/postgres"
GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Setup Database

```bash
cd frontend
npx prisma generate
npx prisma db push
```

### 4. Start Servers

```bash
# Terminal 1 - Backend
cd vanna-ai/src
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.9 or higher
- **PostgreSQL**: 15.x or higher
- **npm/yarn**: Latest version
- **Git**: Latest version

### Step 1: Clone Repository

```bash
git clone https://github.com/Sharvari1892/flowbitai-project.git
cd flowbitai-project
```

### Step 2: Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd vanna-ai

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (create .env file)
# See Environment Variables section below

# Run the backend server
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Step 3: Frontend Setup (Next.js)

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Set up environment variables (create .env file)
# See Environment Variables section below

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database with test data
npm run seed

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Step 4: Verify Installation

1. Open `http://localhost:3000` in your browser
2. Navigate to Dashboard - you should see analytics
3. Navigate to Chat with Data - AI assistant should be online (green indicator)
4. Try asking a question: "How many invoices are in the database?"

---

## 📚 API Documentation

### Base URLs

- **Backend API**: `http://localhost:8000/api/v1`
- **Frontend API**: `http://localhost:3000/api`

---

### Backend Endpoints (FastAPI)

#### 🟢 GET `/api/v1/health`

Check API health status

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "vanna": "initialized"
}
```

---

#### 🟡 POST `/api/v1/train`

Train Vanna AI on database schema (required before first use)

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully on database schema",
  "tables_trained": 7
}
```

---

#### 🔵 POST `/api/v1/ask`

Ask a natural language question

**Request:**
```json
{
  "question": "What are the top 5 vendors by total spend?",
  "execute": true
}
```

**Response:**
```json
{
  "success": true,
  "question": "What are the top 5 vendors by total spend?",
  "sql": "SELECT v.vendorName, SUM(s.invoiceTotal) as total_spend FROM vendors v...",
  "results": [
    {
      "vendorName": "Acme Corp",
      "total_spend": 125000.50
    }
  ],
  "explanation": "The query returns the top 5 vendors ranked by total spending...",
  "row_count": 5
}
```

---

#### 🔵 POST `/api/v1/generate-sql`

Generate SQL without executing

**Request:**
```json
{
  "question": "Show me all overdue invoices"
}
```

**Response:**
```json
{
  "success": true,
  "question": "Show me all overdue invoices",
  "sql": "SELECT * FROM invoices i JOIN payments p ON i.documentId = p.documentId WHERE p.dueDate < CURRENT_DATE"
}
```

---

#### 🟢 GET `/api/v1/dashboard/overview`

Get dashboard KPI statistics

**Response:**
```json
{
  "totalSpendYTD": 1234567.89,
  "totalInvoices": 156,
  "documentsUploaded": 200,
  "avgInvoiceValue": 7914.53
}
```

---

#### 🟢 GET `/api/v1/dashboard/trend`

Get invoice trend data

**Query Parameters:**
- `months` (optional): Number of months to retrieve (default: 12)

**Response:**
```json
[
  {
    "month": "Jan 2025",
    "count": 15,
    "value": 125000.00
  },
  {
    "month": "Feb 2025",
    "count": 18,
    "value": 145000.00
  }
]
```

---

#### 🟢 GET `/api/v1/dashboard/vendors/top`

Get top vendors by spend

**Query Parameters:**
- `limit` (optional): Number of vendors (default: 10)

**Response:**
```json
[
  {
    "vendorName": "Tech Solutions Inc",
    "totalSpend": 250000.00
  }
]
```

---

#### 🟢 GET `/api/v1/dashboard/categories`

Get spending by category

**Response:**
```json
[
  {
    "category": "IT Services",
    "totalSpend": 350000.00,
    "percentage": 35.5
  }
]
```

---

#### 🟢 GET `/api/v1/dashboard/cashflow`

Get cash flow forecast

**Query Parameters:**
- `months` (optional): Forecast period (default: 6)

**Response:**
```json
[
  {
    "month": "Jan 2025",
    "projected": 100000.00,
    "actual": 95000.00
  }
]
```

---

#### 🟢 GET `/api/v1/invoices`

Get invoices with filtering

**Query Parameters:**
- `search` (optional): Search term
- `status` (optional): Filter by status (all, paid, pending, overdue, draft)
- `sort_by` (optional): Sort field (default: invoiceDate)
- `sort_order` (optional): asc or desc (default: desc)
- `limit` (optional): Max results (default: 100)

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "invoiceNumber": "INV-2025-001",
    "vendor": "Acme Corp",
    "invoiceDate": "2025-01-15T00:00:00Z",
    "amount": 5000.00,
    "status": "paid"
  }
]
```

---

### Frontend API Routes

#### 🟢 GET `/api/stats`

Get dashboard statistics (proxies to backend)

#### 🟢 GET `/api/invoice-trends`

Get invoice trends (proxies to backend)

#### 🟢 GET `/api/vendors/top10`

Get top 10 vendors (proxies to backend)

#### 🟢 GET `/api/category-spend`

Get category spending (proxies to backend)

#### 🟢 GET `/api/cash-outflow`

Get cash flow data (proxies to backend)

#### 🔵 POST `/api/chat-with-data`

Chat with data endpoint

**Request:**
```json
{
  "question": "How many invoices were processed last month?",
  "execute": true
}
```

---

## 🤖 Chat with Data Workflow

The **Chat with Data** feature allows users to query their database using natural language. Here's how it works:

### Workflow Diagram

```
┌──────────────┐
│   User       │
│   Types      │  "Show me all invoices 
│   Question   │   from January 2025"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js)                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  VannaQuery Component                              │  │
│  │  - Captures user input                             │  │
│  │  - Manages chat sessions                           │  │
│  │  - Displays results in multiple formats           │  │
│  └────────────┬───────────────────────────────────────┘  │
└───────────────┼──────────────────────────────────────────┘
                │ HTTP POST
                ▼
┌──────────────────────────────────────────────────────────┐
│          NEXT.JS API ROUTE                               │
│          /api/chat-with-data/route.ts                    │
│  - Receives question from frontend                       │
│  - Forwards to backend API                               │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTP POST
                 ▼
┌──────────────────────────────────────────────────────────┐
│          BACKEND API (FastAPI)                           │
│          POST /api/v1/ask                                │
│  ┌──────────────────────────────────────────────────┐    │
│  │  routes.py                                       │    │
│  │  - Validates request                             │    │
│  │  - Calls Vanna service                           │    │
│  └──────────────┬───────────────────────────────────┘    │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│          VANNA AI SERVICE                                │
│          vanna_service.py                                │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Step 1: Initialize Vanna with Groq LLM         │    │
│  │  - Uses groq-llama3-70b-8192 model              │    │
│  │                                                  │    │
│  │  Step 2: Convert Natural Language to SQL        │    │
│  │  Input:  "Show invoices from January 2025"      │    │
│  │  Output: SELECT * FROM invoices                 │    │
│  │          WHERE invoiceDate >= '2025-01-01'      │    │
│  │          AND invoiceDate < '2025-02-01'         │    │
│  └──────────────┬───────────────────────────────────┘    │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│          DATABASE (PostgreSQL)                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Step 3: Execute SQL Query                       │    │
│  │  - Query runs against actual database            │    │
│  │  - Returns raw result set                        │    │
│  └──────────────┬───────────────────────────────────┘    │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│          RESULT PROCESSING                               │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Step 4: Format Results                          │    │
│  │  - Convert to JSON                               │    │
│  │  - Add metadata (row count, etc.)                │    │
│  │  - Generate explanation                          │    │
│  └──────────────┬───────────────────────────────────┘    │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼ Return JSON Response
┌──────────────────────────────────────────────────────────┐
│          FRONTEND RENDERING                              │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Step 5: Display Results                         │    │
│  │  ✓ SQL Query (collapsible)                       │    │
│  │  ✓ Results Table                                 │    │
│  │  ✓ Bar Chart                                     │    │
│  │  ✓ Line Chart                                    │    │
│  │  ✓ Pie Chart                                     │    │
│  │  ✓ Export to CSV                                 │    │
│  │  ✓ Follow-up Questions                           │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Detailed Step-by-Step Process

#### Step 1: User Input (Frontend)
```typescript
// User types in chat interface
const question = "What are the top 5 vendors by spend?";
```

#### Step 2: API Call (Frontend → Backend)
```typescript
// frontend/lib/api/vanna.ts
const response = await fetch(`${API_URL}/api/v1/ask`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question, execute: true })
});
```

#### Step 3: Vanna AI Processing (Backend)
```python
# vanna-ai/src/services/vanna_service.py
# 3a. Initialize Vanna with database schema
vanna = VannaDefault(model='groq-llama3-70b-8192', api_key=groq_key)
vanna.connect_to_postgres(connection_string)

# 3b. Generate SQL from natural language
sql = vanna.generate_sql(question)
# Output: SELECT v.vendorName, SUM(s.invoiceTotal) as total_spend 
#         FROM vendors v JOIN summaries s ON v.documentId = s.documentId 
#         GROUP BY v.vendorName ORDER BY total_spend DESC LIMIT 5

# 3c. Execute SQL
results = vanna.run_sql(sql)
```

#### Step 4: Return Results (Backend → Frontend)
```json
{
  "success": true,
  "question": "What are the top 5 vendors by spend?",
  "sql": "SELECT v.vendorName, ...",
  "results": [
    {"vendorName": "Tech Corp", "total_spend": 150000},
    {"vendorName": "Supply Co", "total_spend": 120000}
  ],
  "row_count": 5
}
```

#### Step 5: Visualization (Frontend)
```typescript
// Display results in multiple formats
<Tabs>
  <TabsContent value="table">
    <Table data={results} />
  </TabsContent>
  <TabsContent value="bar">
    <BarChart data={results} />
  </TabsContent>
  <TabsContent value="line">
    <LineChart data={results} />
  </TabsContent>
  <TabsContent value="pie">
    <PieChart data={results} />
  </TabsContent>
</Tabs>
```

### Key Features

✅ **Session Management**: Multiple chat sessions with history  
✅ **Auto-save Drafts**: Questions saved automatically  
✅ **Follow-up Questions**: AI-generated suggestions  
✅ **Multi-format Results**: Table, charts, CSV export  
✅ **SQL Transparency**: View generated queries  
✅ **Error Handling**: Graceful failure with user-friendly messages

---

## 🔐 Environment Variables

### Frontend (`.env`)

```bash
# Database Connection (Supabase)
DATABASE_URL="postgresql://USER:PASS@HOST:6543/postgres?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASS@HOST:5432/postgres"

# Backend API URL
NEXT_PUBLIC_VANNA_API_URL="http://localhost:8000"
```

### Backend (`.env`)

```bash
# Database Connection
DATABASE_URL="postgresql://USER:PASS@HOST:5432/postgres"

# Groq API Key (for LLM)
GROQ_API_KEY="your_groq_api_key_here"

# Vanna API Key (optional - for Vanna cloud)
VANNA_API_KEY="your_vanna_api_key_here"
```

**Note**: Get your Groq API key from [console.groq.com](https://console.groq.com)

---

## 💡 Usage Examples

### Example 1: Dashboard Analytics

```typescript
// View real-time statistics
const stats = await dashboardAPI.getOverviewStats();
console.log(stats);
// {
//   totalSpendYTD: 1250000.00,
//   totalInvoices: 245,
//   documentsUploaded: 300,
//   avgInvoiceValue: 5102.04
// }
```

### Example 2: Natural Language Queries

```typescript
// Ask questions in plain English
await vannaAPI.ask("Show me all invoices from last month");
await vannaAPI.ask("What is the total spend by department?");
await vannaAPI.ask("List overdue invoices");
await vannaAPI.ask("Which vendor has the highest average invoice value?");
```

### Example 3: Export Data

```typescript
// Export query results to CSV
const results = await vannaAPI.ask("SELECT * FROM invoices WHERE status = 'pending'");
exportToCSV(results.data, 'pending-invoices.csv');
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Charts**: Recharts
- **ORM**: Prisma
- **State Management**: React Hooks

### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: Vanna.AI + Groq LLM (llama3-70b)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

### Database
- **DBMS**: PostgreSQL 15
- **Hosting**: Supabase
- **Features**: Connection pooling, SSL, backups

### DevOps
- **Version Control**: Git, GitHub
- **Package Management**: npm, pip
- **Development**: Hot reload, auto-formatting

---

## 🚀 Deployment

### Backend Deployment (Railway)

1. **Create `Procfile` in `vanna-ai/`:**
```
web: cd src && uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. **Deploy to Railway:**
   - Go to [railway.app/new](https://railway.app/new)
   - Deploy from GitHub repo
   - Root directory: `vanna-ai`
   - Add environment variables:
     ```
     DATABASE_URL=postgresql://...
     GROQ_API_KEY=your_key
     ```

3. **Get Backend URL:** `https://your-app.railway.app`

### Frontend Deployment (Vercel)

1. **Update CORS in Backend** (`vanna-ai/src/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # Add your Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. **Deploy to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import repository
   - Root directory: `frontend`
   - Add environment variables:
     ```
     DATABASE_URL=postgresql://...
     DIRECT_URL=postgresql://...
     NEXT_PUBLIC_VANNA_API_URL=https://your-app.railway.app
     ```

3. **Deploy:** Click deploy, wait 2-3 minutes

### Post-Deployment

1. **Train AI Model:**
```bash
curl -X POST https://your-backend.railway.app/api/v1/train
```

2. **Test Application:**
   - Visit your Vercel URL
   - Check Dashboard loads
   - Try "Chat with Data"
   - Ask: "How many invoices are in the database?"

### Production Checklist

- [ ] Backend deployed and healthy (`/api/v1/health`)
- [ ] Frontend deployed and accessible
- [ ] Database connected and migrated
- [ ] AI model trained
- [ ] CORS configured for production domains
- [ ] Environment variables set correctly
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Custom domain configured (optional)

**Platforms:** Vercel (frontend), Railway (backend), Supabase (database)

---

## 🔧 Troubleshooting

### "ERR_BLOCKED_BY_CLIENT"
- **Cause:** Ad blocker extension
- **Fix:** Disable ad blockers or try incognito mode

### AI Shows Offline
```bash
# Check backend health
curl http://localhost:8000/api/v1/health

# Verify Groq API key is set
echo $GROQ_API_KEY

# Check backend logs for errors
```

### Database Connection Failed
- Use **pooler URL** (port 6543) in frontend
- Use **direct URL** (port 5432) in backend
- Verify connection string in Supabase dashboard

### Port Already in Use
```bash
# Kill process on port
npx kill-port 8000
npx kill-port 3000

# Or use different port
uvicorn main:app --reload --port 8001
```

### Slow Queries
```sql
-- Add indexes for better performance
CREATE INDEX idx_invoices_date ON invoices(invoiceDate);
CREATE INDEX idx_vendors_name ON vendors(vendorName);
CREATE INDEX idx_summaries_total ON summaries(invoiceTotal);
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Vanna.AI](https://vanna.ai/) - Natural language to SQL conversion
- [Groq](https://groq.com/) - Fast LLM inference
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Supabase](https://supabase.com/) - PostgreSQL hosting

---

## 📧 Contact

**Project Owner**: Sharvari  
**Repository**: [github.com/Sharvari1892/flowbitai-project](https://github.com/Sharvari1892/flowbitai-project)

---

**Made with ❤️ using Next.js, FastAPI, and AI**
