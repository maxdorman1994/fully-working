import { RequestHandler } from "express";
import { GraphQLClient } from "graphql-request";

// Hasura configuration - use server-side environment variables
const hasuraUrl =
  process.env.HASURA_GRAPHQL_URL || process.env.VITE_HASURA_GRAPHQL_URL || "";
const hasuraAdminSecret =
  process.env.HASURA_ADMIN_SECRET || process.env.VITE_HASURA_ADMIN_SECRET || "";

// Create Hasura GraphQL client for server-side requests
const hasuraClient = new GraphQLClient(hasuraUrl, {
  headers: hasuraAdminSecret
    ? {
        "x-hasura-admin-secret": hasuraAdminSecret,
      }
    : {},
});

console.log("🔧 GraphQL Proxy Configuration:", {
  hasuraUrl: hasuraUrl || "NOT CONFIGURED",
  hasSecret: !!hasuraAdminSecret,
  isConfigured: !!hasuraUrl,
});

/**
 * GraphQL proxy endpoint - forwards requests to Hasura with proper CORS headers
 */
export const handleGraphQLProxy: RequestHandler = async (req, res) => {
  // Set CORS headers for GraphQL requests
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-hasura-admin-secret",
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  // Only allow POST requests for GraphQL
  if (req.method !== "POST") {
    res
      .status(405)
      .json({ error: "Method not allowed. Use POST for GraphQL requests." });
    return;
  }

  // Check if Hasura is configured
  if (!hasuraUrl) {
    res.status(500).json({
      error: "Hasura not configured",
      message:
        "Please set HASURA_GRAPHQL_URL or VITE_HASURA_GRAPHQL_URL environment variable",
    });
    return;
  }

  try {
    const { query, variables, operationName } = req.body;

    if (!query) {
      res.status(400).json({ error: "GraphQL query is required" });
      return;
    }

    console.log("🔄 Proxying GraphQL request:", {
      operationName: operationName || "unnamed",
      hasVariables: !!variables,
      queryLength: query.length,
    });

    // Forward the request to Hasura
    const result = await hasuraClient.request(query, variables);

    res.json(result);
  } catch (error) {
    console.error("❌ GraphQL proxy error:", error);

    if (error instanceof Error) {
      res.status(500).json({
        error: "GraphQL request failed",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res.status(500).json({
        error: "Unknown GraphQL error",
        message: "An unexpected error occurred",
      });
    }
  }
};
