'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import VannaStatus from './VannaStatus';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sparkles } from 'lucide-react';
import { ModeToggle } from '@/components/theme-button';

export default function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="border-b-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 font-semibold hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold">FlowbitAI</span>
            </Link>
            
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            
            <div className="hidden md:flex gap-1">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'}
                asChild
              >
                <Link href="/">Home</Link>
              </Button>
              <Button 
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button 
                variant={isActive('/query') ? 'default' : 'ghost'}
                asChild
              >
                <Link href="/query">Query AI</Link>
              </Button>
              <Button 
                variant={isActive('/about') ? 'default' : 'ghost'}
                asChild
              >
                <Link href="/about">About</Link>
              </Button>
            </div>
          </div>
          
          {/* Status and Theme Toggle */}
          <div className="flex items-center gap-4">
            <ModeToggle />
            <VannaStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}