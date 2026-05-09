import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical UI Crash:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white text-right font-sans">
          <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            
            <h1 className="text-2xl font-black mb-4">عذراً، حدث خلل بسيط</h1>
            <p className="text-white/60 font-bold mb-8 leading-relaxed">
              يبدو أن الواجهة واجهت مشكلة تقنية غير متوقعة. جاري العمل على حلها من قبل الفريق التقني.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={this.handleReload}
                className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-black flex items-center justify-center gap-3"
              >
                <RefreshCw size={20} />
                تحديث الصفحة الآن
              </Button>
              
              <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.2em]">
                Error code: 0xDEAD_UI_CRASH
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
