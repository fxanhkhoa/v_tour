import React, { useState } from 'react';

interface ExportRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportRepoModal: React.FC<ExportRepoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'go' | 'angular'>('go');
  const [copied, setCopied] = useState<boolean>(false);

  const goCodeSnippet = `package main

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Tour Guide Hub Golang + MongoDB Backend
func main() {
	r := gin.Default()
	
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok", 
			"service": "Go + MongoDB Tour Guide Hub Backend",
		})
	})

	r.Run(":8080")
}`;

  const angularCodeSnippet = `import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule],
  template: \`
    <mat-toolbar color="primary">
      <span>Tour Guide Hub (Angular 22)</span>
    </mat-toolbar>
  \`
})
export class AppComponent {}`;

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">folder_zip</span>
            <div>
              <h3 className="font-extrabold text-base text-white">Full Stack Code Repository</h3>
              <p className="text-xs text-slate-400">Golang + MongoDB Backend & Angular 22 Material Frontend</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 bg-slate-950/50 flex space-x-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('go')}
            className={`pb-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'go' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            Go + MongoDB Backend (/backend-go)
          </button>
          <button
            onClick={() => setActiveTab('angular')}
            className={`pb-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'angular' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400'
            }`}
          >
            Angular 22 Frontend (/frontend-angular)
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              {activeTab === 'go' ? '📁 /backend-go/main.go & config/db.go' : '📁 /frontend-angular/src/app/app.component.ts'}
            </span>

            <button
              onClick={() => copySnippet(activeTab === 'go' ? goCodeSnippet : angularCodeSnippet)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            {activeTab === 'go' ? goCodeSnippet : angularCodeSnippet}
          </pre>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300">
            💡 <strong>Export Tip:</strong> All source files for Golang + MongoDB (`/backend-go/`) and Angular 22 (`/frontend-angular/`) are generated right inside this project workspace! You can download the full project archive at any time via the AI Studio Settings menu.
          </div>
        </div>

      </div>
    </div>
  );
};
