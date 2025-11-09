'use client';

import { useState, useEffect, useRef } from 'react';
import { vannaAPI, QueryResult } from '@/lib/api/vanna';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Code2, AlertCircle, Database, ChevronDown, MessageSquare, Plus, Trash2, Send, Bot, User, BarChart3, LineChart, PieChart, Download, Save, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChatMessage {
  id: string;
  question: string;
  result: QueryResult | null;
  timestamp: number;
  loading?: boolean;
  followUpQuestions?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  draft?: string;
}

export default function VannaQuery() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draftSaved, setDraftSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('vannaChatSessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
        // Restore draft for the current session
        if (parsed[0].draft) {
          setQuestion(parsed[0].draft);
        }
      }
    } else {
      // Create initial session if none exists
      const initialSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('vannaChatSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId]);

  // Auto-save draft with debouncing
  useEffect(() => {
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }

    if (question.trim() && currentSessionId) {
      setDraftSaved(false);
      draftTimeoutRef.current = setTimeout(() => {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, draft: question }
            : s
        ));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000); // Hide "Draft saved" after 2s
      }, 1000); // Save after 1 second of no typing
    } else if (!question.trim() && currentSessionId) {
      // Clear draft if question is empty
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, draft: undefined }
          : s
      ));
    }

    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [question, currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setQuestion('');
    setDraftSaved(false);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (sessionId === currentSessionId) {
        if (filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
        } else {
          setCurrentSessionId(null);
          setTimeout(() => createNewSession(), 0);
          return filtered;
        }
      }
      return filtered;
    });
  };

  const updateSessionTitle = (sessionId: string, firstQuestion: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, title: firstQuestion.slice(0, 50) + (firstQuestion.length > 50 ? '...' : ''), updatedAt: Date.now() }
        : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !currentSessionId) return;

    const messageId = Date.now().toString();
    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, { id: messageId, question: userQuestion, result: null, timestamp: Date.now(), loading: true }],
            updatedAt: Date.now()
          }
        : s
    ));

    if (currentSession?.messages.length === 0) {
      updateSessionTitle(currentSessionId, userQuestion);
    }

    try {
      const response = await vannaAPI.ask(userQuestion, true);
      const followUpQuestions = generateFollowUpQuestions(userQuestion, response);
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === messageId 
                  ? { ...m, result: response, loading: false, followUpQuestions }
                  : m
              ),
              draft: undefined // Clear draft after successful submission
            }
          : s
      ));
      setDraftSaved(false);
    } catch (error) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === messageId 
                  ? { 
                      ...m, 
                      result: {
                        success: false,
                        question: userQuestion,
                        error: error instanceof Error ? error.message : 'Unknown error',
                      },
                      loading: false
                    }
                  : m
              )
            }
          : s
      ));
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f97316', '#06b6d4'];

  const canGenerateChart = (results: any[]) => {
    if (!results || results.length === 0) return false;
    const keys = Object.keys(results[0]);
    return keys.length >= 2 && keys.length <= 10; // At least 2 columns, max 10 for readability
  };

  const detectChartType = (results: any[]) => {
    const keys = Object.keys(results[0]);
    const numericColumns = keys.filter(key => 
      results.every(row => typeof row[key] === 'number' || !isNaN(Number(row[key])))
    );
    
    if (numericColumns.length === 0) return null;
    if (results.length <= 10 && keys.length === 2) return 'pie'; // Good for small datasets with 2 columns
    if (results.length > 20) return 'line'; // Line chart for larger datasets
    return 'bar'; // Default to bar chart
  };

  const generateFollowUpQuestions = (question: string, result: QueryResult): string[] => {
    // Generate contextual follow-up questions based on the query
    const followUps: string[] = [];
    
    if (result.success && result.results && result.results.length > 0) {
      const columns = Object.keys(result.results[0]);
      
      // Analysis-based follow-ups
      followUps.push(`Show me trends for ${columns[0]} over time`);
      
      if (columns.length > 1) {
        followUps.push(`Compare ${columns[0]} and ${columns[1]}`);
      }
      
      // Aggregation follow-ups
      if (result.results.length > 5) {
        followUps.push(`What are the top 5 results?`);
      }
      
      // Detail follow-ups
      if (columns.some(col => col.toLowerCase().includes('total') || col.toLowerCase().includes('amount'))) {
        followUps.push(`Show me the detailed breakdown of these amounts`);
      }
    }
    
    return followUps.slice(0, 3); // Return max 3 follow-up questions
  };

  const exportToCSV = (results: any[], filename: string = 'query-results.csv') => {
    if (!results || results.length === 0) return;

    // Get headers
    const headers = Object.keys(results[0]);
    
    // Convert data to CSV format
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...results.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas, quotes, or newlines
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div 
        className={cn(
          "border-r bg-muted/10 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-80" : "w-0"
        )}
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <Button onClick={createNewSession} className="w-full" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No chat history yet
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 p-3 rounded-lg transition-colors",
                        currentSessionId === session.id && "bg-muted"
                      )}
                    >
                      <div 
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          // Restore draft when switching sessions
                          if (session.draft) {
                            setQuestion(session.draft);
                          } else {
                            setQuestion('');
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(session.updatedAt)}
                            {session.draft && <span className="ml-2">• Draft</span>}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="text-xs">Delete</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Database className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">AI Data Assistant</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentSession && currentSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ask Your Data</h2>
              <p className="text-muted-foreground max-w-md">
                Ask questions about your data in natural language and get instant answers with SQL queries and results
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 p-6">
              {currentSession?.messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium">{message.question}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-3">
                      {message.loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating response...</span>
                        </div>
                      ) : message.result ? (
                        <>
                          {!message.result.success && message.result.error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{message.result.error}</AlertDescription>
                            </Alert>
                          )}

                          {message.result.sql && (
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border hover:bg-muted transition-colors">
                                <ChevronDown className="h-4 w-4" />
                                <Code2 className="h-4 w-4" />
                                <span className="font-medium">SQL Query</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2">
                                <Card>
                                  <CardContent className="p-4">
                                    <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                                      <code className="text-sm font-mono">{message.result.sql}</code>
                                    </pre>
                                  </CardContent>
                                </Card>
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {message.result.success && message.result.results && message.result.results.length > 0 && (
                            <Collapsible defaultOpen>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border hover:bg-muted transition-colors">
                                <ChevronDown className="h-4 w-4" />
                                <Database className="h-4 w-4" />
                                <span className="font-medium">
                                  Results ({message.result.row_count || message.result.results.length} rows)
                                </span>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2">
                                <Card>
                                  <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex-1">
                                      {message.result.explanation && (
                                        <p className="text-sm text-muted-foreground">{message.result.explanation}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => message.result?.results && exportToCSV(message.result.results, `query-result-${Date.now()}.csv`)}
                                      className="gap-2"
                                    >
                                      <Download className="h-4 w-4" />
                                      Export CSV
                                    </Button>
                                  </CardHeader>
                                  <CardContent>
                                    {canGenerateChart(message.result.results) ? (
                                      <Tabs defaultValue="table" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4">
                                          <TabsTrigger value="table">
                                            <Database className="h-4 w-4 mr-2" />
                                            Table
                                          </TabsTrigger>
                                          <TabsTrigger value="bar">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Bar Chart
                                          </TabsTrigger>
                                          <TabsTrigger value="line">
                                            <LineChart className="h-4 w-4 mr-2" />
                                            Line Chart
                                          </TabsTrigger>
                                          <TabsTrigger value="pie">
                                            <PieChart className="h-4 w-4 mr-2" />
                                            Pie Chart
                                          </TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="table" className="mt-4">
                                          <div className="rounded-lg border overflow-hidden">
                                            <div className="overflow-x-auto">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-muted/50">
                                                    {Object.keys(message.result.results[0]).map((key) => (
                                                      <TableHead key={key} className="font-semibold">{key}</TableHead>
                                                    ))}
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {message.result.results.map((row, idx) => (
                                                    <TableRow key={idx}>
                                                      {Object.values(row).map((value, cellIdx) => (
                                                        <TableCell key={cellIdx} className="font-mono text-sm">
                                                          {value !== null && value !== undefined ? String(value) : (
                                                            <span className="text-muted-foreground italic">NULL</span>
                                                          )}
                                                        </TableCell>
                                                      ))}
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="bar" className="mt-4">
                                          <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={message.result.results}>
                                              <CartesianGrid strokeDasharray="3 3" />
                                              <XAxis dataKey={Object.keys(message.result.results[0])[0]} />
                                              <YAxis />
                                              <Tooltip />
                                              <Legend />
                                              {Object.keys(message.result.results[0]).slice(1).map((key, idx) => (
                                                <Bar key={key} dataKey={key} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                              ))}
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </TabsContent>

                                        <TabsContent value="line" className="mt-4">
                                          <ResponsiveContainer width="100%" height={400}>
                                            <RechartsLineChart data={message.result.results}>
                                              <CartesianGrid strokeDasharray="3 3" />
                                              <XAxis dataKey={Object.keys(message.result.results[0])[0]} />
                                              <YAxis />
                                              <Tooltip />
                                              <Legend />
                                              {Object.keys(message.result.results[0]).slice(1).map((key, idx) => (
                                                <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[idx % CHART_COLORS.length]} />
                                              ))}
                                            </RechartsLineChart>
                                          </ResponsiveContainer>
                                        </TabsContent>

                                        <TabsContent value="pie" className="mt-4">
                                          <ResponsiveContainer width="100%" height={400}>
                                            <RechartsPieChart>
                                              <Pie
                                                data={message.result.results.slice(0, 8)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey={Object.keys(message.result.results[0])[1]}
                                                nameKey={Object.keys(message.result.results[0])[0]}
                                              >
                                                {message.result.results.slice(0, 8).map((entry, index) => (
                                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                              </Pie>
                                              <Tooltip />
                                              <Legend />
                                            </RechartsPieChart>
                                          </ResponsiveContainer>
                                        </TabsContent>
                                      </Tabs>
                                    ) : (
                                      <div className="rounded-lg border overflow-hidden">
                                        <div className="overflow-x-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-muted/50">
                                                {Object.keys(message.result.results[0]).map((key) => (
                                                  <TableHead key={key} className="font-semibold">{key}</TableHead>
                                                ))}
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {message.result.results.map((row, idx) => (
                                                <TableRow key={idx}>
                                                  {Object.values(row).map((value, cellIdx) => (
                                                    <TableCell key={cellIdx} className="font-mono text-sm">
                                                      {value !== null && value !== undefined ? String(value) : (
                                                        <span className="text-muted-foreground italic">NULL</span>
                                                      )}
                                                    </TableCell>
                                                  ))}
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {message.result.success && message.result.results && message.result.results.length === 0 && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>No Results</AlertTitle>
                              <AlertDescription>
                                Query executed successfully but returned no results.
                              </AlertDescription>
                            </Alert>
                          )}

                          {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Suggested follow-up questions:</span>
                              </div>
                              <div className="space-y-2">
                                {message.followUpQuestions.map((followUp, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setQuestion(followUp)}
                                    className="w-full text-left p-3 rounded-lg border bg-background hover:bg-muted transition-colors flex items-center gap-2 group"
                                  >
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-sm">{followUp}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your data..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !question.trim()} size="icon">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {draftSaved && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
                  <Save className="h-3 w-3" />
                  <span>Draft saved</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
