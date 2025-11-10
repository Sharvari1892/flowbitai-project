// Overview Stats Types
export interface OverviewStats {
  totalSpendYTD: number;
  totalInvoices: number;
  documentsUploaded: number;
  avgInvoiceValue: number;
}

// Invoice Types
export interface Invoice {
  id: string;
  vendor: string;
  invoiceDate: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
}

// Chart Data Types
export interface TrendDataPoint {
  month: string;
  count: number;
  value: number;
}

export interface VendorSpend {
  vendorName: string;
  totalSpend: number;
}

export interface CategorySpend {
  category: string;
  totalSpend: number;
  percentage: number;
}

export interface CashFlowForecast {
  month: string;
  projected: number;
  actual: number;
}

class DashboardAPI {
  /**
   * Get overview statistics
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch overview stats');
    }
    return response.json();
  }

  /**
   * Get invoice volume and value trend
   */
  async getInvoiceTrend(months: number = 12): Promise<TrendDataPoint[]> {
    const response = await fetch(`/api/invoice-trends?months=${months}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice trend');
    }
    return response.json();
  }

  /**
   * Get top vendors by spend
   */
  async getTopVendors(limit: number = 10): Promise<VendorSpend[]> {
    const response = await fetch('/api/vendors/top10');
    if (!response.ok) {
      throw new Error('Failed to fetch top vendors');
    }
    return response.json();
  }

  /**
   * Get spend by category
   */
  async getSpendByCategory(): Promise<CategorySpend[]> {
    const response = await fetch('/api/category-spend');
    if (!response.ok) {
      throw new Error('Failed to fetch category spend');
    }
    return response.json();
  }

  /**
   * Get cash flow forecast
   */
  async getCashFlowForecast(months: number = 6): Promise<CashFlowForecast[]> {
    const response = await fetch(`/api/cash-outflow?months=${months}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cash flow forecast');
    }
    return response.json();
  }

  /**
   * Get all invoices with optional filters
   */
  async getInvoices(params?: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }): Promise<Invoice[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/invoices?${queryParams.toString()}`;
    console.log('Fetching invoices from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch invoices:', response.status, errorText);
      throw new Error(`Failed to fetch invoices: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
}

// Export singleton instance
export const dashboardAPI = new DashboardAPI();
