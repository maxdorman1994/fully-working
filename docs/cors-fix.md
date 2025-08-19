# CORS Fix for Hasura GraphQL Integration

## Problem

The production application at `https://dormanjournal.co.uk` was experiencing CORS errors when trying to access the Hasura GraphQL endpoint at `https://781701a48336.ngrok-free.app/v1/graphql`.

### Error Details

```
Access to fetch at 'https://781701a48336.ngrok-free.app/v1/graphql' from origin 'https://dormanjournal.co.uk' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The Hasura GraphQL endpoint (hosted via ngrok) did not have CORS headers configured to allow requests from the production domain `https://dormanjournal.co.uk`.

## Solution Implemented

Created a GraphQL proxy endpoint within the Express server to forward GraphQL requests to Hasura, bypassing the CORS restriction entirely.

### Changes Made

#### 1. GraphQL Proxy Route (`server/routes/graphql-proxy.ts`)

- Created a new Express route handler that proxies GraphQL requests to Hasura
- Added proper CORS headers to allow requests from any origin
- Handles both POST requests and OPTIONS preflight requests
- Forwards GraphQL queries, variables, and operation names to Hasura
- Includes error handling and logging

#### 2. Updated Server Configuration (`server/index.ts`)

- Imported the new GraphQL proxy handler
- Registered the proxy route at `/api/graphql`
- Added support for both POST and OPTIONS methods

#### 3. Updated Client Configuration (`client/lib/hasura.ts`)

- Modified the Hasura client to detect production vs development environments
- In production: uses the proxy endpoint `/api/graphql`
- In development: continues to use the direct Hasura URL
- Updated configuration checks to account for proxy setup

#### 4. Environment Variables

Set the following environment variables for the server:

- `HASURA_GRAPHQL_URL`: Points to the ngrok Hasura endpoint
- `HASURA_ADMIN_SECRET`: Authentication secret for Hasura

## How It Works

### Development Environment

- Client connects directly to Hasura via `VITE_HASURA_GRAPHQL_URL`
- No CORS issues since both client and Hasura are on localhost or development domains

### Production Environment

- Client makes requests to `/api/graphql` (same origin, no CORS issues)
- Express server proxy forwards requests to the actual Hasura endpoint
- Server-side requests to Hasura don't have CORS restrictions
- Response is forwarded back to the client

## Benefits

1. **Eliminates CORS Issues**: Client and API are on the same domain
2. **Security**: Hasura credentials are handled server-side only
3. **Flexibility**: Can add additional processing, caching, or authentication in the proxy
4. **Backward Compatibility**: Development setup remains unchanged

## Testing

After deployment, the GraphQL requests should work without CORS errors. The proxy will log requests for debugging:

```
🔄 Proxying GraphQL request: {
  operationName: "GetFamilyMembers",
  hasVariables: false,
  queryLength: 245
}
```

## Future Considerations

- Consider implementing request/response caching in the proxy for better performance
- Add rate limiting if needed
- Monitor proxy performance and add metrics
- Consider migrating to a dedicated GraphQL proxy service for high-traffic scenarios
