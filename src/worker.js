const WARMUP_PATH = "/";

function upstreamUrl(requestUrl, originUrl) {
  const incoming = new URL(requestUrl);
  const origin = new URL(originUrl);
  const basePath = origin.pathname.replace(/\/$/, "");

  origin.pathname = `${basePath}${incoming.pathname}`;
  origin.search = incoming.search;
  return origin;
}

async function proxy(request, env) {
  if (!env.ORIGIN_API_URL) {
    return new Response("ORIGIN_API_URL is not configured", { status: 500 });
  }

  const target = upstreamUrl(request.url, env.ORIGIN_API_URL);
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return fetch(new Request(target, init));
}

export default {
  fetch(request, env) {
    return proxy(request, env);
  },

  scheduled(_event, env, ctx) {
    if (!env.ORIGIN_API_URL) return;

    const healthUrl = new URL(WARMUP_PATH, env.ORIGIN_API_URL);
    ctx.waitUntil(fetch(healthUrl));
  },
};
