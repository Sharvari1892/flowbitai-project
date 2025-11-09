'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, FileText, Upload, TrendingUp, Search, ArrowUpDown } from 'lucide-react';
import { dashboardAPI, type OverviewStats, type Invoice } from '@/lib/api/dashboard';
import { InvoiceTrendChart } from '@/components/dashboard/invoice-trend-chart';
import { TopVendorsChart } from '@/components/dashboard/top-vendors-chart';
import { CategorySpendChart } from '@/components/dashboard/category-spend-chart';
import { CashFlowChart } from '@/components/dashboard/cashflow-chart';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Page() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const loadDashboardData = async () => {
    try {
      const overviewData = await dashboardAPI.getOverviewStats();
      setStats(overviewData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await dashboardAPI.getInvoices({
        search: searchTerm || undefined,
        status: statusFilter,
        sortBy,
        sortOrder,
        limit: 100,
      });
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      // Set empty array on error so UI doesn't break
      setInvoices([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants: Record<Invoice['status'], { variant: any; label: string; className?: string }> = {
      paid: { variant: 'default', label: 'Paid' },
      pending: { variant: 'secondary', label: 'Pending' },
      overdue: { variant: 'destructive', label: 'Overdue', className: '' },
      draft: { variant: 'outline', label: 'Draft' },
    };
    const config = variants[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="container mx-auto p-6 space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                  Overview of your invoice and document analytics
                </p>
              </div>

              {/* Overview Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spend (YTD)</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.totalSpendYTD || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Year to date spending
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invoices Processed</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total invoices processed
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.documentsUploaded || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Documents in system
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Invoice Value</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.avgInvoiceValue || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mean invoice amount
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InvoiceTrendChart />
                <TopVendorsChart />
                <CategorySpendChart />
                <CashFlowChart />
              </div>

              {/* Invoices Table */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">Recent Invoices</CardTitle>
                  <CardDescription>
                    View and manage all processed invoices
                  </CardDescription>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by vendor, invoice number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border-2 overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/50">
                          <TableRow>
                            <TableHead>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSort('vendorName')}
                                className="hover:bg-transparent"
                              >
                                Vendor
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSort('invoiceDate')}
                                className="hover:bg-transparent"
                              >
                                Date
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSort('invoiceNumber')}
                                className="hover:bg-transparent"
                              >
                                Invoice #
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSort('amount')}
                                className="hover:bg-transparent"
                              >
                                Amount
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No invoices found
                              </TableCell>
                            </TableRow>
                          ) : (
                            invoices.map((invoice) => (
                              <TableRow key={invoice.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{invoice.vendor}</TableCell>
                                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                                <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                                <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
