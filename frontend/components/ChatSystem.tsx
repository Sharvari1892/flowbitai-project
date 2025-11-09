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
import { Loader2, Sparkles, Code2, AlertCircle, Database, ChevronDown, MessageSquare, Plus, Trash2, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  question: string;
  result: QueryResult | null;
  timestamp: number;
  loading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export default function ChatSystem() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('vannaChatSessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
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
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === messageId 
                  ? { ...m, result: response, loading: false }
                  : m
              )
            }
          : s
      ));
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

  return (
    <div className="flex h-screen overflow-hidden">
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
                        "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted",
                        currentSessionId === session.id && "bg-muted"
                      )}
                      onClick={() => setCurrentSessionId(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(session.updatedAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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

        <ScrollArea className="flex-1 p-6">
          {currentSession && currentSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ask Your Data</h2>
              <p className="text-muted-foreground max-w-md">
                Ask questions about your data in natural language and get instant answers with SQL queries and results
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {currentSession?.messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium">{message.question}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
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
                                  <CardHeader>
                                    {message.result.explanation && (
                                      <p className="text-sm text-muted-foreground">{message.result.explanation}</p>
                                    )}
                                  </CardHeader>
                                  <CardContent>
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
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
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
          </form>
        </div>
      </div>
    </div>
  );
}
