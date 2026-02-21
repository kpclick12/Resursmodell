const BASE_URL = "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(res.status, data.detail || "Request failed");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export async function login(password: string) {
  return request<{ access_token: string; token_type: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ password }),
    }
  );
}

export async function uploadCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{
    session_id: string;
    count: number;
    schools: import("@/types").SchoolInput[];
  }>("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function calculate(body: {
  schools: import("@/types").SchoolInput[];
  parameters: import("@/types").CalculationParameters;
}) {
  return request<import("@/types").CalculateResponse>("/calculate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function savePlan(sessionId: string, name: string) {
  return request<import("@/types").PlanSummary>("/plans", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, name }),
  });
}

export async function listPlans() {
  return request<import("@/types").PlanSummary[]>("/plans", {});
}

export async function getPlan(sessionId: string) {
  return request<import("@/types").PlanDetail>(`/plans/${sessionId}`, {});
}

export async function renamePlan(sessionId: string, name: string) {
  return request<import("@/types").PlanSummary>(`/plans/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deletePlan(sessionId: string) {
  return request<void>(`/plans/${sessionId}`, {
    method: "DELETE",
  });
}

export { ApiError };
