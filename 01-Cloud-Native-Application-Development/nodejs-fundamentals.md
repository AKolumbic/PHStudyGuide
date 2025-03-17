# Node.js Fundamentals

## Event-Driven, Non-Blocking I/O Model

Node.js is built on Chrome's V8 JavaScript engine and employs an event-driven, non-blocking I/O model that sets it apart from traditional server-side languages.

### Key Concepts

- **Single-Threaded Event Loop**: Node.js operates on a single thread but can handle concurrent operations through its event loop
- **Non-Blocking I/O**: Operations like file access, network requests, etc. don't block the main thread
- **Asynchronous Programming**: Functions return immediately, with results delivered later via callbacks or promises

### How the Event Loop Works

1. **Event Queue**: Incoming requests are added to an event queue
2. **Event Loop Processing**: The event loop processes events one by one
3. **Thread Pool**: I/O operations are offloaded to a thread pool (libuv)
4. **Callback Execution**: Upon completion, callbacks are pushed to the callback queue
5. **Event Loop Phases**:
   - Timers: Executes callbacks scheduled by `setTimeout()` and `setInterval()`
   - Pending callbacks: Executes I/O callbacks deferred to the next loop iteration
   - Idle, prepare: Used internally
   - Poll: Retrieves new I/O events and executes their callbacks
   - Check: Executes callbacks scheduled by `setImmediate()`
   - Close callbacks: Executes close event callbacks

### Advantages

- Highly scalable for I/O-bound applications
- Efficient resource utilization
- Great for real-time applications and APIs
- Lower memory footprint compared to thread-per-request models

### Limitations

- Not ideal for CPU-intensive tasks
- Long-running operations can block the event loop
- Complex error handling in asynchronous code

## Node.js Module System and Package Management

Node.js uses a modular architecture to organize code and manage dependencies.

### CommonJS Module System

- **require()**: Function used to import modules
- **module.exports**: Object used to expose functionality
- **module caching**: Modules are cached after the first load
- **module resolution algorithm**: How Node.js finds modules on the filesystem

### ES Modules in Node.js

- Introduced in Node.js 12+ with `.mjs` extension or with `"type": "module"` in package.json
- Uses `import` and `export` syntax
- Top-level `await` support
- Static analysis capabilities

### npm (Node Package Manager)

- **package.json**: Central configuration file for Node.js projects

  - Scripts: Custom commands for development, testing, building
  - Dependencies: Production dependencies
  - DevDependencies: Development-only dependencies
  - Peer dependencies: Compatible requirements

- **Semantic Versioning (SemVer)**:

  - Major.Minor.Patch (e.g., 2.1.3)
  - Caret (^) vs Tilde (~) version constraints

- **npm Commands**:

  - `npm init`: Initialize a new project
  - `npm install`: Install dependencies
  - `npm run`: Execute scripts
  - `npm publish`: Publish packages to registry
  - `npm audit`: Security vulnerability checks

- **package-lock.json**: Ensures dependency consistency across installations

### Alternative Package Managers

- **Yarn**: Facebook's alternative with deterministic installs and workspaces
- **pnpm**: Efficient disk space usage via symlinks to a global store

## Building RESTful APIs with Express.js

Express.js is the most popular web framework for Node.js, ideal for building RESTful APIs.

### Express.js Core Concepts

- **Middleware**: Functions that have access to the request, response, and next middleware function
- **Routing**: Defining endpoints and HTTP methods
- **Request and Response Objects**: Extended HTTP objects with additional functionality
- **Template Engines**: For server-side rendering (Pug, EJS, Handlebars)

### Setting Up an Express Application

```javascript
const express = require("express");
const app = express();
const port = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### RESTful API Design Principles

- **Resources**: Represented as nouns in URL paths
- **HTTP Methods**: GET, POST, PUT, DELETE for CRUD operations
- **Status Codes**: Appropriate use of HTTP status codes (200, 201, 400, 404, 500, etc.)
- **JSON**: Standard format for request/response bodies
- **Statelessness**: No client state stored on the server

### Express Middleware Ecosystem

- **Built-in**: express.json(), express.urlencoded(), express.static()
- **Error-handling middleware**: Four parameters (err, req, res, next)
- **Third-party**: cors, helmet, morgan, compression

### API Security Best Practices

- Authentication with JWT or OAuth
- Rate limiting with express-rate-limit
- Input validation with express-validator or Joi
- Security headers with helmet
- CORS configuration

## Handling Asynchronous Operations

Node.js provides multiple approaches to handle asynchronous code.

### Callbacks

The original asynchronous pattern in Node.js:

```javascript
fs.readFile("file.txt", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  console.log(data.toString());
});
```

**Callback Hell**: Nested callbacks leading to poor readability and maintainability.

### Promises

A cleaner alternative to callbacks:

```javascript
// Creating a promise
const readFilePromise = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

// Using a promise
readFilePromise("file.txt")
  .then((data) => console.log(data.toString()))
  .catch((err) => console.error("Error reading file:", err));
```

**Promise Methods**:

- `Promise.all()`: Execute multiple promises in parallel
- `Promise.race()`: Return the first settled promise
- `Promise.allSettled()`: Wait for all promises to settle
- `Promise.any()`: Return the first fulfilled promise

### Async/Await

Syntactic sugar over promises for cleaner asynchronous code:

```javascript
const fs = require("fs").promises;

async function readFile() {
  try {
    const data = await fs.readFile("file.txt");
    console.log(data.toString());
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

readFile();
```

**Best Practices**:

- Always use try/catch with await
- Avoid mixing promise chaining and async/await
- Consider Promise.all for parallel operations
- Remember that async functions always return promises

### Event Emitters

Core pattern for many Node.js APIs:

```javascript
const EventEmitter = require("events");
class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on("event", (arg) => {
  console.log("Event triggered with arg:", arg);
});

myEmitter.emit("event", "some arg");
```

## Memory Management and Performance Optimization

Understanding memory management is crucial for building performant Node.js applications.

### V8 Memory Structure

- **Heap Memory**: Where objects are allocated
  - Young Generation (new space): Short-lived objects
  - Old Generation (old space): Long-lived objects
- **Stack Memory**: Function calls and primitive values
- **Memory Limits**: Default V8 heap memory limit (~1.7GB)

### Common Memory Issues

- **Memory Leaks**: Resources not properly released
- **Heap Fragmentation**: Free memory broken into small unusable chunks
- **Large Object Allocation**: Can cause performance issues
- **Global Variables**: Persist throughout application lifetime

### Memory Leak Detection

- **Node.js heap snapshots**: Using tools like `heapdump`
- **Chrome DevTools**: For profiling memory usage
- **Monitoring tools**: Such as Clinic.js Memory

### Performance Optimization Techniques

- **Caching results**: For expensive operations
- **Stream processing**: For handling large files
- **Worker threads**: For CPU-intensive tasks
- **Clustering**: To utilize multiple CPU cores
- **Connection pooling**: For database connections
- **Optimized dependencies**: Choose lightweight packages
- **Load balancing**: Distribute traffic across instances

### Monitoring and Profiling

- **Node.js built-in tools**: --inspect flag, performance hooks API
- **Third-party tools**: New Relic, DataDog, PM2
- **Metrics to track**: CPU usage, memory consumption, event loop lag, GC frequency

## Common Design Patterns for Node.js Applications

Implementing proven design patterns can improve code organization and maintainability.

### Creational Patterns

- **Factory Pattern**: Create objects without specifying exact class

  ```javascript
  function createUser(type) {
    if (type === "admin") return new AdminUser();
    if (type === "regular") return new RegularUser();
    return new GuestUser();
  }
  ```

- **Singleton Pattern**: Single instance throughout application

  ```javascript
  class Database {
    constructor() {
      if (Database.instance) return Database.instance;
      Database.instance = this;
      // Initialize connection
    }

    query(sql) {
      // Execute query
    }
  }

  module.exports = new Database();
  ```

### Structural Patterns

- **Decorator Pattern**: Add functionality to objects dynamically

  ```javascript
  function logDecorator(service) {
    return {
      execute(action) {
        console.log(`Executing ${action}`);
        return service.execute(action);
      },
    };
  }
  ```

- **Proxy Pattern**: Control access to another object

  ```javascript
  const userServiceProxy = {
    userService: new UserService(),

    getUser(id) {
      this.logAccess(id);
      return this.userService.getUser(id);
    },

    logAccess(id) {
      console.log(`User ${id} accessed at ${new Date()}`);
    },
  };
  ```

### Behavioral Patterns

- **Observer Pattern**: Objects subscribe to events

  ```javascript
  class EventBus {
    constructor() {
      this.subscribers = {};
    }

    subscribe(event, callback) {
      if (!this.subscribers[event]) this.subscribers[event] = [];
      this.subscribers[event].push(callback);
    }

    publish(event, data) {
      if (!this.subscribers[event]) return;
      this.subscribers[event].forEach((callback) => callback(data));
    }
  }
  ```

- **Middleware Pattern**: Chain of processing units

  ```javascript
  class RequestHandler {
    constructor() {
      this.middlewares = [];
    }

    use(middleware) {
      this.middlewares.push(middleware);
    }

    handleRequest(request) {
      let index = 0;

      const next = () => {
        if (index >= this.middlewares.length) return;
        const middleware = this.middlewares[index++];
        middleware(request, next);
      };

      next();
    }
  }
  ```

### Architectural Patterns

- **MVC (Model-View-Controller)**: Separation of concerns
- **Repository Pattern**: Abstraction layer for data access
- **Dependency Injection**: Provide dependencies rather than creating them
- **Service Layer**: Business logic abstraction
- **Microservices**: Decompose application into small services

## Best Practices in Node.js Development

### Code Structure and Organization

- Modular architecture with clear responsibility boundaries
- Consistent file and folder naming conventions
- Configuration management using environment variables
- Separate business logic from infrastructure concerns

### Error Handling

- Use async/await with try/catch blocks
- Create custom error classes
- Implement global error handlers
- Proper logging of errors with context

### Testing

- Unit tests with frameworks like Jest or Mocha
- Integration tests for API endpoints
- Mocking external dependencies
- Test-driven development approach

### Security

- Keep dependencies updated (npm audit)
- Input validation and sanitization
- Implement proper authentication and authorization
- Follow the principle of least privilege
- Use security headers and HTTPS

### Deployment and DevOps

- Containerization with Docker
- CI/CD pipelines
- Health checks and graceful shutdowns
- Process management with PM2 or Kubernetes
- Monitoring and alerting
