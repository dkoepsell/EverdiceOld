import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Check content type to handle different response formats
    const contentType = res.headers.get("content-type");
    const text = (await res.text()) || res.statusText;
    
    // Log the response for debugging
    console.log("Response status:", res.status);
    console.log("Response content-type:", contentType);
    console.log("Response text (truncated):", text.substring(0, 200));
    
    // Try to parse as JSON if appropriate
    if (contentType && contentType.includes("application/json")) {
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || `${res.status}: ${text}`);
      } catch (e) {
        // If parsing fails, use the raw text
        if (e instanceof SyntaxError) {
          console.error("Failed to parse error response as JSON:", text.substring(0, 100));
        }
        throw new Error(`${res.status}: ${text.substring(0, 100)}`);
      }
    } else {
      console.error("Non-JSON error response type:", contentType);
      // Check if it's HTML (common for server errors)
      if (contentType && contentType.includes("text/html")) {
        throw new Error(`${res.status}: Server error - received HTML response`);
      } else {
        throw new Error(`${res.status}: API returned non-JSON response`);
      }
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
