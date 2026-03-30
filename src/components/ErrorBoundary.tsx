import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/solid';
import { hardResetDatabase } from '../services/db';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = async () => {
      if (confirm("ATENȚIE: Această opțiune va șterge TOATE datele aplicației (extracții, setări, inventar) și o va readuce la starea inițială (Zero).\n\nFolosiți aceasta doar dacă aplicația este complet blocată.\n\nContinuați?")) {
          await hardResetDatabase();
          window.location.reload();
      }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center animate-fade-in z-[9999]">
          <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 max-w-sm w-full flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-2">
                <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Eroare Critică</h2>
            
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              A apărut o problemă neprevăzută care a blocat aplicația.
            </p>

            {this.state.error && (
                <div className="w-full bg-black/30 p-3 rounded-xl border border-white/5 text-left overflow-auto max-h-32">
                    <p className="text-[10px] font-mono text-red-300 break-all">
                        {this.state.error.toString()}
                    </p>
                </div>
            )}

            <div className="w-full flex flex-col gap-3 mt-2">
                <button 
                  onClick={this.handleReload}
                  className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-5 h-5" /> REÎNCARCĂ APLICAȚIA
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-2 text-[10px] text-gray-500 uppercase font-bold">Dacă nu funcționează</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                  onClick={this.handleHardReset}
                  className="w-full py-3 bg-transparent border border-red-500/50 text-red-400 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" /> RESETARE TOTALĂ (AVARIE)
                </button>
            </div>
          </div>
          <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest">Pharmabarista Stability Module v7.0.1</p>
        </div>
      );
    }

    return this.props.children;
  }
}
