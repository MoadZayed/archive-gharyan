import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const TOKEN_KEY = "auth_token";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => {
        const code = (err as any)?.data?.code;
        if (code === "UNAUTHORIZED" || code === "FORBIDDEN") return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function redirectToLoginIfUnauthorized(error: unknown) {
  if (typeof window === "undefined") return;

  const code =
    typeof error === "object" && error !== null
      ? (error as any)?.data?.code
      : undefined;

  if (
    (code === "UNAUTHORIZED" || code === "FORBIDDEN") &&
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/register"
  ) {
    // Token غير صالح/منتهي أو توقيعه غير صحيح → امسحه لتجنب loop
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
  }
}

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: (import.meta.env.VITE_API_URL || "") + "/api/trpc",
      transformer: superjson,
      async headers() {
        const token = localStorage.getItem(TOKEN_KEY);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

import { GoogleOAuthProvider } from "@react-oauth/google";

import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA stability
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <App />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
