# OAuth Authentication: A Comprehensive Study Guide

## 1. OAuth 2.0 Flow Types

OAuth 2.0 is an authorization framework that enables third-party applications to obtain limited access to a user's account on an HTTP service. Different flow types address various client requirements and security contexts.

### Authorization Code Flow

This is the most common and secure flow for server-side applications.

1. **Process Flow**:

   - User initiates login via client application
   - Client redirects to authorization server with client ID, redirect URI, scope, and state parameter
   - User authenticates and consents to requested permissions
   - Authorization server redirects back with authorization code
   - Client exchanges code for access token (and refresh token) using client secret
   - Client uses access token to access protected resources

2. **Recommended For**: Web applications with server-side components that can securely store client secrets

3. **Security Benefits**:
   - Access token never exposed to the browser/user
   - Client authentication when exchanging code for tokens
   - Limited lifetime of authorization code

### Authorization Code Flow with PKCE (Proof Key for Code Exchange)

An extension of the authorization code flow, designed to secure public clients.

1. **Process Flow**:

   - Client generates a code verifier (random string) and code challenge (hashed verifier)
   - Standard authorization code flow, but with code challenge included in authorization request
   - When exchanging code for tokens, client includes original code verifier
   - Authorization server validates the verifier against the challenge

2. **Recommended For**: Mobile applications, single-page applications (SPAs), and other public clients

3. **Security Benefits**:
   - Protects against authorization code interception attacks
   - Secures the flow for clients that cannot maintain client secrets

### Implicit Flow (Deprecated)

A simplified flow that returns tokens directly in the redirect URI.

1. **Process Flow**:

   - Client redirects to authorization server
   - User authenticates and consents
   - Authorization server returns access token directly in the redirect URI fragment

2. **Recommended For**: Legacy applications only (no longer recommended)

3. **Security Concerns**:
   - Access token exposed in browser history and logs
   - No client authentication
   - Vulnerable to token interception

### Client Credentials Flow

Used for server-to-server authentication where no user context is needed.

1. **Process Flow**:

   - Client authenticates to authorization server using client ID and secret
   - Authorization server returns access token
   - Client uses access token to access protected resources

2. **Recommended For**: Microservices, APIs, backend services

3. **Key Characteristics**:
   - No user involvement
   - Client acts on its own behalf
   - Typically uses stronger scopes control

### Resource Owner Password Credentials Flow (Not Recommended)

Allows clients to collect username and password directly.

1. **Process Flow**:

   - Client collects username and password from user
   - Client sends credentials to authorization server
   - Authorization server returns access token (and refresh token)

2. **Recommended For**: Legacy applications only, when other flows are not possible

3. **Security Concerns**:
   - Client has direct access to user credentials
   - Breaks the core OAuth principle of not sharing credentials

### Device Authorization Flow

Designed for devices with limited input capabilities (e.g., smart TVs).

1. **Process Flow**:

   - Device contacts authorization server for a device code and user code
   - Device displays user code and URL to the user
   - User visits URL on a separate device and enters code
   - Device polls authorization server until user completes authentication
   - Device receives access token after user approval

2. **Recommended For**: IoT devices, smart TVs, CLI applications

## 2. OpenID Connect for Authentication

OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0, providing authentication alongside authorization.

### Core Concepts

1. **ID Token**:

   - JWT containing user identity information
   - Signed by identity provider
   - Contains claims about authentication event and user

2. **UserInfo Endpoint**:

   - OAuth-protected resource that returns claims about authenticated user
   - Accessed using access token

3. **Standard Claims**:
   - `sub`: Subject identifier (unique user ID)
   - `name`, `given_name`, `family_name`: User's name information
   - `email`, `email_verified`: Email and verification status
   - `picture`: URL to user's profile picture
   - `locale`, `zoneinfo`: User's locale and timezone

### OIDC Flows

1. **Authorization Code Flow**:

   - Similar to OAuth 2.0 but returns ID token alongside access token
   - Most secure option for web applications

2. **Implicit Flow**:

   - Returns ID token directly in redirect URI
   - Legacy approach, not recommended for new applications

3. **Hybrid Flow**:
   - Combines aspects of both flows
   - Different tokens returned at different stages

### OIDC vs. OAuth 2.0

| Feature         | OAuth 2.0               | OpenID Connect                                 |
| --------------- | ----------------------- | ---------------------------------------------- |
| Primary Purpose | Authorization           | Authentication                                 |
| Returns         | Access Token            | ID Token + Access Token                        |
| User Info       | Separate implementation | Standardized UserInfo endpoint                 |
| Scope           | Custom scopes           | Standard scopes (`openid`, `profile`, `email`) |
| Discovery       | Not standardized        | Well-defined discovery document                |

### Discovery and Registration

1. **Discovery**:

   - `/.well-known/openid-configuration` endpoint provides service details
   - Contains endpoint URLs, supported features, and cryptographic information

2. **Dynamic Client Registration**:
   - Allows clients to register programmatically
   - Receives client credentials for subsequent authentications

## 3. JWT (JSON Web Tokens) Structure and Validation

JWTs are compact, self-contained tokens used to securely transmit information between parties.

### JWT Structure

A JWT consists of three parts separated by dots: `xxxxx.yyyyy.zzzzz`

1. **Header** (Base64Url encoded):

   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```

   - `alg`: Signing algorithm (e.g., HMAC SHA-256, RSA)
   - `typ`: Token type

2. **Payload** (Base64Url encoded):

   ```json
   {
     "sub": "1234567890",
     "name": "John Doe",
     "iat": 1516239022,
     "exp": 1516242622
   }
   ```

   - Standard claims:
     - `iss` (issuer): Who issued the token
     - `sub` (subject): Who the token refers to
     - `aud` (audience): Who the token is intended for
     - `exp` (expiration time): When the token expires
     - `nbf` (not before): When the token starts being valid
     - `iat` (issued at): When the token was issued
     - `jti` (JWT ID): Unique identifier for the token
   - Custom claims: Application-specific information

3. **Signature**:
   ```
   HMACSHA256(
     base64UrlEncode(header) + "." + base64UrlEncode(payload),
     secret
   )
   ```

### JWT Validation Process

1. **Structural Validation**:

   - Verify the token has three segments
   - Decode and parse header and payload

2. **Signature Verification**:

   - For HMAC: Verify using shared secret
   - For RSA/ECDSA: Verify using public key
   - Check signature algorithm against expected algorithm

3. **Claims Validation**:
   - Verify `exp` is not expired
   - Verify `nbf` is not in the future
   - Verify `iss` matches expected issuer
   - Verify `aud` includes your client ID
   - Validate any application-specific claims

### Security Considerations

1. **Signing Algorithms**:

   - `HS256`, `HS384`, `HS512`: HMAC with SHA-2
   - `RS256`, `RS384`, `RS512`: RSA with SHA-2
   - `ES256`, `ES384`, `ES512`: ECDSA with SHA-2
   - Avoid `none` algorithm

2. **Common Vulnerabilities**:
   - Accepting unsigned tokens (`alg: none`)
   - Accepting unexpected algorithms
   - Key confusion attacks (RS256 to HS256)
   - Insufficient claim validation

## 4. Securing APIs with OAuth Scopes

Scopes define the specific actions that clients can perform on behalf of users.

### Scope Fundamentals

1. **Definition**: Scopes are string identifiers representing permissions

2. **Common Formats**:

   - Resource-based: `users:read`, `calendar:write`
   - Action-based: `read_profile`, `create_document`
   - CRUD-style: `user.read`, `document.create`

3. **Standard Scopes**:
   - OpenID Connect: `openid`, `profile`, `email`, `address`, `phone`
   - OAuth 2.0 for specific services may have standardized scopes

### Scope Implementation

1. **Request Phase**:

   - Client requests specific scopes during authorization
   - `scope` parameter contains space-separated scopes
   - Example: `scope=openid profile email calendar:read`

2. **Consent Phase**:

   - Authorization server presents requested scopes to user
   - User explicitly consents to permissions
   - Server may deny overly permissive requests

3. **Token Phase**:

   - Granted scopes included in token or token response
   - OAuth 2.0: `scope` parameter in token response
   - JWT: `scp` or `scope` claim within the token

4. **Enforcement Phase**:
   - Resource server validates token
   - Checks if token's scopes allow requested operation
   - Returns 403 Forbidden if scope is insufficient

### Scope Design Best Practices

1. **Granularity**:

   - Define specific, limited scopes
   - Balance between too coarse and too fine-grained

2. **Least Privilege**:

   - Request only necessary scopes
   - Use read-only scopes when possible

3. **Hierarchical Design**:

   - Consider scope relationships
   - Example: `calendar:write` might imply `calendar:read`

4. **Documentation**:
   - Clearly document available scopes
   - Explain what actions each scope permits

### Advanced Scope Techniques

1. **Downscoping**:

   - Exchange a broader token for one with reduced privileges
   - Useful for delegating to less-trusted subsystems

2. **Resource Indicators**:

   - Associate scopes with specific resource servers
   - Request includes `resource` parameter (RFC 8707)

3. **Dynamic Scopes**:
   - Parameterized scopes for finer control
   - Example: `document:read:123` for a specific document

## 5. Token Management and Refresh Strategies

Properly managing tokens enhances security and user experience.

### Access Token Lifecycle

1. **Characteristics**:

   - Short lifespan (typically minutes to hours)
   - Used to access protected resources
   - Should be kept confidential

2. **Storage Considerations**:

   - Server-side apps: Server-side session or secure cookie
   - SPAs: Memory (variables) or secure, HTTP-only cookies
   - Mobile apps: Secure storage mechanisms

3. **Transmission**:
   - Authorization header: `Authorization: Bearer {token}`
   - Avoid URL parameters or body transmission when possible

### Refresh Token Lifecycle

1. **Characteristics**:

   - Longer lifespan (days to months)
   - Used only to obtain new access tokens
   - Requires stronger protection than access tokens

2. **Storage Requirements**:

   - Never expose to client-side JavaScript
   - Use secure, encrypted storage
   - Consider refresh token rotation for critical applications

3. **Refresh Process**:

   ```
   POST /token HTTP/1.1
   Content-Type: application/x-www-form-urlencoded

   grant_type=refresh_token
   &refresh_token={refresh_token}
   &client_id={client_id}
   &client_secret={client_secret}  // if applicable
   ```

### Token Refresh Strategies

1. **Proactive Refresh**:

   - Refresh before token expires
   - Typically at 50-75% of token lifespan
   - Prevents disruption to user experience

2. **Reactive Refresh**:

   - Wait for 401 Unauthorized response
   - Then attempt refresh
   - May interrupt user experience

3. **Silent Refresh (SPAs)**:

   - Use hidden iframe for SPAs
   - Leverages session cookies for authentication
   - Avoids page redirects

4. **Refresh Token Rotation**:
   - New refresh token issued with each refresh
   - Old refresh token invalidated
   - Enhances security by limiting refresh token lifetime

### Token Revocation

1. **Server-Side Revocation**:

   - Endpoints: `/revoke` or `/logout`
   - Can revoke specific tokens or all user sessions

2. **Client-Side Cleanup**:

   - Delete tokens from storage
   - Clear relevant state

3. **Single Logout**:
   - OpenID Connect provides logout mechanisms
   - Can synchronize logout across multiple applications

## 6. Common OAuth Security Vulnerabilities and Mitigations

Understanding security risks helps in implementing proper protections.

### CSRF (Cross-Site Request Forgery)

1. **Vulnerability**:

   - Attacker initiates OAuth flow from victim's browser
   - Captures authorization code or token

2. **Mitigation**:
   - Use `state` parameter with unpredictable value
   - Verify state parameter in callback
   - Implement CSRF tokens in forms

### Open Redirector

1. **Vulnerability**:

   - Malicious redirect_uri in authorization request
   - May bypass validation if partial matching is used

2. **Mitigation**:
   - Whitelist valid redirect URIs during client registration
   - Exact string matching, not prefix matching
   - Prohibit wildcard redirects for sensitive applications

### Code Interception

1. **Vulnerability**:

   - Authorization code stolen in transit
   - Attacker exchanges code for tokens

2. **Mitigation**:
   - Implement PKCE (Proof Key for Code Exchange)
   - Short code lifetimes
   - Single-use codes

### Token Leakage

1. **Vulnerability**:

   - Access tokens exposed via browser history, logs, or referrer headers
   - Leads to unauthorized resource access

2. **Mitigation**:
   - Use authorization code flow instead of implicit
   - Store tokens securely
   - Set referrer policies
   - Use HTTPS exclusively

### Insufficient Redirect URI Validation

1. **Vulnerability**:

   - Authorization server accepts manipulated redirect URIs
   - Allows token/code stealing

2. **Mitigation**:
   - Register full redirect URIs with exact matching
   - Validate complete URI, not just domain or prefix
   - Reject requests with unregistered redirect URIs

### Replay Attacks

1. **Vulnerability**:

   - Intercepted tokens reused for unauthorized access
   - Particularly problematic with long-lived tokens

2. **Mitigation**:
   - Short token lifetimes
   - Token binding (where supported)
   - Proper validation of JWT claims (nonce, jti)

### Insecure Storage

1. **Vulnerability**:

   - Tokens stored in insecure locations
   - Local storage accessible to XSS attacks

2. **Mitigation**:
   - Server-side: Secure, encrypted storage
   - Browser: HTTP-only, Secure, SameSite cookies
   - Mobile: Keychain/Keystore mechanisms

### Phishing Attacks

1. **Vulnerability**:

   - Fake authorization server prompts for credentials
   - User unknowingly provides credentials to attacker

2. **Mitigation**:
   - Consistent visual identity for authorization server
   - Education about checking URLs
   - Implement anti-phishing measures (e.g., personalization)

### Client Impersonation

1. **Vulnerability**:

   - Attacker registers client with similar name/logo
   - Users grant permissions to malicious client

2. **Mitigation**:
   - Verified client registration process
   - Clear client identity on consent screens
   - Client authentication for confidential clients

### Advanced Mitigations

1. **Sender-Constrained Tokens**:

   - Tokens bound to specific client instances
   - Implemented via mTLS or DPoP (Demonstrating Proof of Possession)
   - Prevents token theft and replay attacks

2. **Token Binding**:

   - Cryptographically binds tokens to TLS connections
   - Prevents token export and replay across different connections

3. **Certificate-Bound Access Tokens**:
   - Access tokens bound to client's X.509 certificate
   - Requires mutual TLS authentication between client and resource server

### Security Best Practices Summary

1. **For Authorization Servers**:

   - Implement proper redirect URI validation
   - Enforce PKCE for public clients
   - Issue short-lived access tokens
   - Validate all parameters
   - Implement proper client authentication
   - Use secure algorithms for token signing

2. **For Clients**:

   - Use authorization code flow with PKCE
   - Implement state parameter validation
   - Store tokens securely
   - Request minimal scopes
   - Validate tokens and claims
   - Implement proper error handling

3. **For Resource Servers**:
   - Validate token signatures
   - Check token expiration
   - Enforce scope restrictions
   - Implement rate limiting
   - Use HTTPS for all communications

## 7. OAuth 2.1 and Future Developments

OAuth 2.1 consolidates security best practices from OAuth 2.0 extensions.

### Key Changes in OAuth 2.1

1. **Mandatory Security Improvements**:

   - PKCE required for all authorization code flows
   - Redirect URI exact matching required
   - Implicit flow removed
   - Resource Owner Password Credentials flow removed

2. **Simplified Protocol**:
   - Consolidates multiple RFCs into a single specification
   - Removes legacy and deprecated features
   - Clarifies implementation requirements

### Emerging Standards

1. **OAuth 2.0 for Browser-Based Apps**:

   - Best practices for SPAs
   - Focuses on securing public clients

2. **JWT Secured Authorization Response Mode (JARM)**:

   - Secures authorization responses with JWTs
   - Protects against response manipulation

3. **Rich Authorization Requests (RAR)**:

   - Detailed authorization requests
   - Supports fine-grained permissions

4. **Grant Management**:
   - User-centric view of granted permissions
   - APIs for revoking specific permissions
