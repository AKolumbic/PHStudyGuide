# TypeScript Essentials

TypeScript is a strongly typed superset of JavaScript that adds static typing and other features to enhance developer productivity and code quality. It compiles down to regular JavaScript but provides powerful tools for catching errors early in the development process.

## Type Annotations and Interfaces

### Basic Type Annotations

TypeScript allows you to specify types for variables, parameters, and return values:

```typescript
// Variable type annotations
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;
let nullableValue: string | null = null;

// Function parameter and return type annotations
function greet(person: string): string {
  return `Hello, ${person}!`;
}

// Array type annotations
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"];

// Tuple type (fixed-length array where elements have specific types)
let tuple: [string, number] = ["coordinates", 42];
```

### Interfaces for Object Shapes

Interfaces define the structure that objects must conform to:

```typescript
// Basic interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Using the interface
const user: User = {
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
};

// Interface with optional properties
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string; // Optional property
}

// Interface with readonly properties
interface Config {
  readonly apiKey: string;
  readonly endpoint: string;
}
```

### Interface Extensions and Implementations

Interfaces can extend other interfaces and be implemented by classes:

```typescript
// Extending interfaces
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  employeeId: string;
  department: string;
}

// Implementing interfaces with classes
class Manager implements Employee {
  name: string;
  age: number;
  employeeId: string;
  department: string;

  constructor(name: string, age: number, id: string, dept: string) {
    this.name = name;
    this.age = age;
    this.employeeId = id;
    this.department = dept;
  }
}
```

### Index Signatures

For objects with dynamic property names:

```typescript
interface Dictionary {
  [key: string]: string;
}

const colors: Dictionary = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
};
```

## Generics for Creating Reusable Components

Generics allow you to create flexible, reusable components that work with multiple types while maintaining type safety.

### Basic Generic Functions

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Usage
const num = identity<number>(42); // Type: number
const str = identity("hello"); // Type inference: string
```

### Generic Interfaces and Classes

```typescript
// Generic interface
interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 42 };
const stringBox: Box<string> = { value: "hello" };

// Generic class
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }
}

const numberQueue = new Queue<number>();
numberQueue.enqueue(1);
numberQueue.enqueue(2);
```

### Generic Constraints

Constraining the types that can be used with a generic:

```typescript
// Generic constraint using extends
interface HasLength {
  length: number;
}

function getLength<T extends HasLength>(arg: T): number {
  return arg.length;
}

// Valid - strings have a length property
getLength("hello");

// Valid - arrays have a length property
getLength([1, 2, 3]);

// Invalid - number doesn't have a length property
// getLength(42); // Error
```

### Generic Type Aliases

```typescript
// Generic type alias
type Result<T> = {
  data: T;
  error: string | null;
};

function fetchData<T>(url: string): Promise<Result<T>> {
  // Implementation...
  return Promise.resolve({ data: {} as T, error: null });
}
```

### Utility Type Generics

TypeScript provides built-in utility types that are generic:

```typescript
// Partial - makes all properties optional
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

function updateTodo(todo: Todo, fieldsToUpdate: Partial<Todo>): Todo {
  return { ...todo, ...fieldsToUpdate };
}

// ReadOnly - makes all properties readonly
const readonlyTodo: Readonly<Todo> = {
  title: "Learn TypeScript",
  description: "Study generics and advanced types",
  completed: false,
};
```

## Advanced Types

TypeScript provides powerful advanced type features for complex type relationships.

### Union Types

Union types allow a value to be one of several types:

```typescript
// Basic union type
type ID = string | number;

function printID(id: ID) {
  console.log(`ID: ${id}`);
}

printID(101); // Valid
printID("abc123"); // Valid
```

### Intersection Types

Intersection types combine multiple types into one:

```typescript
type Employee = {
  employeeId: string;
  department: string;
};

type Person = {
  name: string;
  age: number;
};

// Intersection type
type EmployeePerson = Employee & Person;

const worker: EmployeePerson = {
  employeeId: "E123",
  department: "Engineering",
  name: "John Doe",
  age: 32,
};
```

### Type Guards

Type guards help narrow down types within conditional blocks:

```typescript
// Type guard using typeof
function printValue(value: string | number) {
  if (typeof value === "string") {
    // TypeScript knows value is a string here
    console.log(value.toUpperCase());
  } else {
    // TypeScript knows value is a number here
    console.log(value.toFixed(2));
  }
}

// Type guard using instanceof
class Cat {
  meow() {
    return "Meow!";
  }
}

class Dog {
  bark() {
    return "Woof!";
  }
}

type Animal = Cat | Dog;

function makeSound(animal: Animal) {
  if (animal instanceof Cat) {
    // TypeScript knows animal is a Cat here
    return animal.meow();
  } else {
    // TypeScript knows animal is a Dog here
    return animal.bark();
  }
}

// User-defined type guard
function isCat(animal: Animal): animal is Cat {
  return (animal as Cat).meow !== undefined;
}

function makeSound2(animal: Animal) {
  if (isCat(animal)) {
    // TypeScript knows animal is a Cat here
    return animal.meow();
  } else {
    // TypeScript knows animal is a Dog here
    return animal.bark();
  }
}
```

### Discriminated Unions

Patterns for working with unions of types that have a common discriminant property:

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // TypeScript knows shape is a Circle here
      return Math.PI * shape.radius ** 2;
    case "square":
      // TypeScript knows shape is a Square here
      return shape.sideLength ** 2;
  }
}
```

### Mapped Types

Create new types by transforming properties of existing ones:

```typescript
// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

// Usage of mapped types
type TodoPreview = Pick<Todo, "title" | "completed">;

const todo: TodoPreview = {
  title: "Clean room",
  completed: false,
};
```

### Conditional Types

Types that depend on type relationships:

```typescript
type IsString<T> = T extends string ? true : false;

// Usage
type A = IsString<string>; // true
type B = IsString<number>; // false

// Extracting return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser() {
  return { id: 1, name: "John" };
}

type User = ReturnType<typeof createUser>; // { id: number, name: string }
```

## TypeScript Configuration and Compilation Options

TypeScript provides various configuration options through the tsconfig.json file.

### Basic tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es2020", // ECMAScript target version
    "module": "commonjs", // Module system
    "outDir": "./dist", // Output directory
    "rootDir": "./src", // Source directory
    "strict": true, // Enable all strict type-checking options
    "esModuleInterop": true, // Better import compatibility
    "skipLibCheck": true, // Skip type checking of declaration files
    "forceConsistentCasingInFileNames": true // Case-sensitive imports
  },
  "include": ["src/**/*"], // Files to include
  "exclude": ["node_modules", "**/*.test.ts"] // Files to exclude
}
```

### Important Compiler Options

#### Type Checking Options

```json
{
  "compilerOptions": {
    "strict": true, // Enable all strict type checks
    "noImplicitAny": true, // Error on expressions with implied 'any' type
    "strictNullChecks": true, // Make null and undefined have their own types
    "strictFunctionTypes": true, // Enable strict checking of function types
    "strictPropertyInitialization": true, // Ensure class properties are initialized
    "noImplicitThis": true, // Error on 'this' with implied 'any' type
    "alwaysStrict": true // Parse in strict mode and emit "use strict"
  }
}
```

#### Module Options

```json
{
  "compilerOptions": {
    "module": "commonjs", // Module code generation
    "moduleResolution": "node", // Module resolution strategy
    "baseUrl": "./", // Base directory for module resolution
    "paths": {
      // Path mapping for module imports
      "@app/*": ["src/app/*"],
      "@utils/*": ["src/utils/*"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types"], // Type declaration folders
    "esModuleInterop": true, // Better interop between different module formats
    "allowSyntheticDefaultImports": true // Allow default imports from modules with no default export
  }
}
```

#### Output Options

```json
{
  "compilerOptions": {
    "target": "es2020", // ECMAScript target version
    "outDir": "./dist", // Output directory for compiled files
    "rootDir": "./src", // Root directory of input files
    "declaration": true, // Generate .d.ts declaration files
    "sourceMap": true, // Generate source maps
    "removeComments": true, // Remove comments in output files
    "noEmit": false, // Don't generate output files
    "incremental": true // Enable incremental compilation
  }
}
```

### Project References

For building large TypeScript projects split into smaller pieces:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "references": [{ "path": "../common" }, { "path": "../utils" }]
}
```

### TypeScript Build Tools

#### tsc (TypeScript Compiler)

```bash
# Compile with tsconfig.json
tsc

# Compile specific files
tsc src/index.ts

# Watch mode
tsc --watch

# Generate tsconfig.json
tsc --init
```

#### Integration with Build Tools

- **webpack** with `ts-loader` or `babel-loader`
- **Rollup** with `@rollup/plugin-typescript`
- **esbuild** with TypeScript support
- **Vite** with built-in TypeScript support

## Integration with Node.js Projects

TypeScript can be seamlessly integrated with Node.js projects for improved developer experience.

### Setting Up a Node.js Project with TypeScript

```bash
# Initialize a new Node.js project
npm init -y

# Install TypeScript and Node.js types
npm install --save-dev typescript @types/node

# Generate tsconfig.json
npx tsc --init --rootDir src --outDir dist
```

### Example Project Structure

```
my-node-project/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── controllers/
│   ├── models/
│   └── services/
├── dist/            # Compiled JavaScript
└── node_modules/
```

### Running TypeScript in Node.js

```json
// package.json
{
  "name": "my-node-project",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "watch": "nodemon --exec ts-node src/index.js"
  },
  "dependencies": {
    "express": "^4.17.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.13",
    "@types/node": "^16.11.12",
    "nodemon": "^2.0.15",
    "ts-node": "^10.4.0",
    "typescript": "^4.5.4"
  }
}
```

### Type Definitions for Node.js Modules

- **Built-in Type Definitions**: TypeScript includes types for JavaScript's built-in objects
- **DefinitelyTyped**: Community-maintained repository of TypeScript type definitions
- **@types packages**: Install types for libraries (e.g., `npm install --save-dev @types/express`)
- **Module-provided Types**: Some libraries include their own type definitions

### TypeScript with Express Example

```typescript
import express, { Request, Response, NextFunction } from "express";

// Define an interface for the request body
interface LoginRequest {
  username: string;
  password: string;
}

const app = express();
app.use(express.json());

app.post("/login", (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { username, password } = req.body;

  // Type safety ensures username and password exist
  if (username === "admin" && password === "secret") {
    res.json({ success: true, token: "jwt-token-here" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Custom error handler with TypeScript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
```

## Benefits of TypeScript in Large-Scale Applications

TypeScript provides numerous advantages for large-scale application development.

### Better Tooling

- **Intelligent Code Completion**: IDEs provide accurate suggestions based on type information
- **Refactoring Support**: Safely rename symbols across the codebase
- **Navigation Features**: Go to definition, find references, etc.
- **Inline Documentation**: Types serve as documentation visible in editors

### Fewer Runtime Errors

- **Compile-Time Type Checking**: Catch errors before running the code
- **Null/Undefined Checking**: Prevent common null reference errors
- **Exhaustiveness Checking**: Ensure all cases are handled in switch statements
- **Property Access Validation**: Prevent accessing non-existent properties

### Enhanced Code Quality

- **Self-Documenting Code**: Types make code intentions clearer
- **Interface Contracts**: Explicit agreements between components
- **API Consistency**: Ensure consistent usage of functions and methods
- **Refactoring Safety**: Types highlight breaking changes

### Team Collaboration

- **Explicit APIs**: Clear interfaces between different parts of the application
- **Better Onboarding**: Easier for new developers to understand the codebase
- **Confidence in Changes**: Types verify that changes don't break existing code
- **Code Reviews**: Focus on logic rather than type-related bugs

### Scalability Benefits

- **Modular Development**: Better support for breaking code into modules
- **Progressive Adoption**: Can be added gradually to existing JavaScript projects
- **Large Refactoring Support**: Tools to safely make sweeping changes
- **Code Maintainability**: Easier to maintain as codebase grows

### Real-World Success Stories

- **Microsoft**: Used TypeScript for large applications like Visual Studio Code
- **Airbnb**: Improved developer productivity and reduced bugs
- **Slack**: Enhanced code quality and refactoring confidence
- **Google**: Used in Angular and many internal projects

## TypeScript Best Practices

### Type System Usage

- Prefer interfaces over type aliases for object shapes (better error messages and extensibility)
- Use union types instead of enums for simple cases
- Leverage type inference when possible, but add explicit types for function parameters
- Use generics to create reusable, type-safe components

### Project Configuration

- Enable strict mode for maximum type safety
- Use ESLint with TypeScript-specific rules
- Configure module resolution appropriately for your environment
- Set up path aliases for cleaner imports

### Code Organization

- Organize types in separate declaration files when appropriate
- Use namespaces sparingly (prefer ES modules)
- Export interfaces for public APIs
- Keep related types and implementations together

### Migrating from JavaScript

- Start with `allowJs: true` to mix JavaScript and TypeScript
- Add type annotations incrementally
- Use JSDoc comments for JavaScript files
- Use the `@ts-check` comment in JavaScript files for lightweight type checking

### Testing with TypeScript

- Use type-aware testing frameworks (Jest with ts-jest)
- Test type definitions using DTslint or similar tools
- Write test utilities that leverage TypeScript's type system
- Add types to mocks and stubs
