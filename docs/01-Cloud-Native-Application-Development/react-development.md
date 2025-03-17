# React Development

React is a popular JavaScript library for building user interfaces, particularly single-page applications. Developed and maintained by Facebook (now Meta), React allows developers to create reusable UI components that efficiently update when data changes.

## Component Architecture

React is built around the concept of components, which are reusable, self-contained pieces of code that return HTML via a render function. There are two main types of components in React:

### Class Components

Class components are ES6 classes that extend from React.Component:

```jsx
import React, { Component } from "react";

class Welcome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState((prevState) => ({
      count: prevState.count + 1,
    }));
  }

  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}</h1>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleClick}>Increment</button>
      </div>
    );
  }
}
```

**Key characteristics of class components:**

- Use ES6 class syntax
- Can hold and manage local state
- Have lifecycle methods (componentDidMount, componentDidUpdate, etc.)
- Need to bind event handlers in constructor or use arrow functions
- Use `this` keyword to access props, state, and methods

### Functional Components

Functional components are simpler JavaScript functions that accept props and return JSX:

```jsx
import React from "react";

function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// Arrow function syntax
const Welcome = (props) => <h1>Hello, {props.name}</h1>;
```

**Key characteristics of functional components:**

- Simpler and more concise syntax
- Prior to React 16.8, could not hold state (were "stateless")
- With hooks (React 16.8+), can now use state and other React features
- No lifecycle methods (use effect hooks instead)
- No `this` keyword necessary
- Generally preferred in modern React development

### Component Composition

React encourages building complex UIs by composing smaller components:

```jsx
function App() {
  return (
    <div>
      <Header />
      <MainContent>
        <Sidebar />
        <ArticleList />
      </MainContent>
      <Footer />
    </div>
  );
}
```

### Component Props

Props (short for properties) are inputs to React components. They are passed down from parent to child:

```jsx
// Parent component
function App() {
  return <UserProfile name="John" age={25} isActive={true} />;
}

// Child component
function UserProfile(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>Age: {props.age}</p>
      <p>Status: {props.isActive ? "Active" : "Inactive"}</p>
    </div>
  );
}
```

### Component Children

The special `children` prop allows components to accept and render nested content:

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage
function App() {
  return (
    <Card title="Welcome">
      <p>This is some content inside the card.</p>
      <button>Click me</button>
    </Card>
  );
}
```

## State Management with Hooks

Hooks are functions that let you "hook into" React state and lifecycle features from functional components. They were introduced in React 16.8.

### useState

The `useState` hook allows functional components to manage state:

```jsx
import React, { useState } from "react";

function Counter() {
  // Declare a state variable "count" with initial value 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```

**Key characteristics of useState:**

- Returns a stateful value and a function to update it
- Takes the initial state as an argument
- Can be called multiple times for multiple state variables
- Does not merge update objects (unlike this.setState in class components)
- Can use functional updates for state that depends on previous state

### useEffect

The `useEffect` hook lets you perform side effects in functional components:

```jsx
import React, { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This runs after every render when userId changes
    setLoading(true);

    fetch(`https://api.example.com/users/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });

    // Cleanup function (runs before next effect or unmount)
    return () => {
      // Cancel any pending requests or clear timers
    };
  }, [userId]); // Only re-run if userId changes

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

**Key characteristics of useEffect:**

- Runs after every render by default
- Second argument (dependency array) controls when it runs
- Empty dependency array (`[]`) means run once after initial render
- Can return a cleanup function for side effect cleanup
- Replaces multiple lifecycle methods (componentDidMount, componentDidUpdate, componentWillUnmount)

### useContext

The `useContext` hook provides a way to pass data through the component tree without manually passing props:

```jsx
import React, { createContext, useContext, useState } from "react";

// Create a context with a default value
const ThemeContext = createContext("light");

function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <div>
        <Header />
        <MainContent />
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Toggle Theme
        </button>
      </div>
    </ThemeContext.Provider>
  );
}

function MainContent() {
  return (
    <div>
      <Paragraph />
    </div>
  );
}

function Paragraph() {
  // Use the context value
  const theme = useContext(ThemeContext);

  return (
    <p className={`theme-${theme}`}>
      This paragraph is using the {theme} theme.
    </p>
  );
}
```

**Key characteristics of useContext:**

- Accepts a context object created by `createContext`
- Returns the current context value
- Component will re-render when context value changes
- Avoids "prop drilling" through intermediate components

### useReducer

The `useReducer` hook is an alternative to useState for complex state logic:

```jsx
import React, { useReducer } from "react";

// Reducer function
function countReducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

function Counter() {
  // Initialize state with useReducer
  const [state, dispatch] = useReducer(countReducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>Increment</button>
      <button onClick={() => dispatch({ type: "decrement" })}>Decrement</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}
```

**Key characteristics of useReducer:**

- Takes a reducer function and initial state
- Returns current state and dispatch function
- Good for complex state logic with multiple sub-values
- Preferred when state transitions depend on previous state
- Enables more predictable state changes with reducer pattern

### Custom Hooks

You can create your own hooks to reuse stateful logic between components:

```jsx
// Custom hook for form handling
function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const resetForm = () => {
    setValues(initialValues);
  };

  return {
    values,
    handleChange,
    resetForm,
  };
}

// Using the custom hook
function SignupForm() {
  const { values, handleChange, resetForm } = useForm({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", values);
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={values.username}
        onChange={handleChange}
        placeholder="Username"
      />
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <input
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        placeholder="Password"
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Context API for State Sharing

The Context API provides a way to share values like themes, user data, or any global state between components without explicitly passing props.

### Creating Context

```jsx
import React, { createContext, useState } from "react";

// Create context with default value
export const UserContext = createContext({
  user: null,
  setUser: () => {},
});

// Context Provider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Value to be provided to consuming components
  const value = {
    user,
    setUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
```

### Consuming Context with Class Components

```jsx
import React, { Component } from "react";
import { UserContext } from "./UserContext";

class ProfilePage extends Component {
  static contextType = UserContext;

  render() {
    const { user, setUser } = this.context;

    return (
      <div>
        {user ? (
          <div>
            <h2>Welcome, {user.name}!</h2>
            <button onClick={() => setUser(null)}>Log out</button>
          </div>
        ) : (
          <button onClick={() => setUser({ id: 1, name: "John" })}>
            Log in
          </button>
        )}
      </div>
    );
  }
}

// Alternative way to consume context
class AnotherComponent extends Component {
  render() {
    return (
      <UserContext.Consumer>
        {({ user }) => (
          <div>{user ? `Logged in as ${user.name}` : "Not logged in"}</div>
        )}
      </UserContext.Consumer>
    );
  }
}
```

### Consuming Context with Hooks

```jsx
import React, { useContext } from "react";
import { UserContext } from "./UserContext";

function ProfilePage() {
  const { user, setUser } = useContext(UserContext);

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome, {user.name}!</h2>
          <button onClick={() => setUser(null)}>Log out</button>
        </div>
      ) : (
        <button onClick={() => setUser({ id: 1, name: "John" })}>Log in</button>
      )}
    </div>
  );
}
```

### Context Composition

For complex applications, multiple contexts can be composed:

```jsx
function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
```

### Context Performance Considerations

- Context changes trigger re-renders for all consuming components
- Split contexts by purpose to avoid unnecessary re-renders
- Consider using `React.memo` or `useMemo` to optimize rendering

## Performance Optimization Techniques

React applications can suffer from performance issues as they grow. Here are key optimization techniques:

### Memoization with React.memo

`React.memo` is a higher-order component that memoizes component rendering:

```jsx
import React, { useState } from "react";

// Regular component
function ExpensiveComponent({ name, data }) {
  console.log("Rendering ExpensiveComponent");

  // Expensive calculation
  const processedData = data.map((item) => item * 2);

  return (
    <div>
      <h2>Hello, {name}</h2>
      <ul>
        {processedData.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Memoized version
const MemoizedExpensiveComponent = React.memo(ExpensiveComponent);

// Parent component
function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("John");
  const data = [1, 2, 3, 4, 5];

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Increment count: {count}
      </button>
      <button onClick={() => setName(name === "John" ? "Jane" : "John")}>
        Toggle name
      </button>

      {/* Will only re-render when name or data changes */}
      <MemoizedExpensiveComponent name={name} data={data} />
    </div>
  );
}
```

### useMemo Hook

`useMemo` memoizes expensive calculations:

```jsx
import React, { useState, useMemo } from "react";

function ExpensiveCalculation({ numbers }) {
  // Memoized value - only recalculates when numbers changes
  const sum = useMemo(() => {
    console.log("Calculating sum...");
    return numbers.reduce((acc, curr) => acc + curr, 0);
  }, [numbers]);

  return <div>Sum: {sum}</div>;
}
```

### useCallback Hook

`useCallback` memoizes callback functions:

```jsx
import React, { useState, useCallback } from "react";

function ParentComponent() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([]);

  // This function is memoized and only changes if todos changes
  const addTodo = useCallback(() => {
    setTodos((prev) => [...prev, "New Todo"]);
  }, [todos]);

  return (
    <div>
      <ChildComponent addTodo={addTodo} />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
}

// Child component that accepts a callback
const ChildComponent = React.memo(({ addTodo }) => {
  console.log("Child rendered");
  return <button onClick={addTodo}>Add Todo</button>;
});
```

### Virtualization

Virtualization renders only visible items in large lists:

```jsx
import React from "react";
import { FixedSizeList } from "react-window";

function VirtualizedList({ items }) {
  // Render row component for each item
  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      Item {items[index]}
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}

// Usage
function App() {
  // List with 10,000 items
  const items = Array.from({ length: 10000 }, (_, i) => i);

  return (
    <div>
      <h1>Virtualized List Example</h1>
      <VirtualizedList items={items} />
    </div>
  );
}
```

Popular virtualization libraries:

- `react-window` (lightweight)
- `react-virtualized` (feature-rich)
- `react-virtuoso` (modern API)

### Code Splitting

Code splitting allows you to load parts of your application on demand:

```jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

// Lazy-loaded components
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/dashboard" component={Dashboard} />
        </Switch>
      </Suspense>
    </Router>
  );
}
```

### Additional Performance Tips

- Use production builds for deployment
- Implement shouldComponentUpdate in class components
- Use the Chrome DevTools Performance tab to profile React apps
- Consider using Web Workers for CPU-intensive tasks
- Optimize images and other assets

## React Router for Navigation

React Router is the standard routing library for React applications, enabling navigation between views.

### Basic Routing

```jsx
import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

// Page components
function Home() {
  return <h2>Home Page</h2>;
}

function About() {
  return <h2>About Page</h2>;
}

function Users() {
  return <h2>Users Page</h2>;
}

// Main App with routing
function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/users">Users</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/users">
            <Users />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
```

### URL Parameters

```jsx
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from "react-router-dom";

function UserProfile() {
  // Access URL parameters with useParams hook
  const { userId } = useParams();

  return <h2>User Profile: {userId}</h2>;
}

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/users/1">User 1</Link>
            </li>
            <li>
              <Link to="/users/2">User 2</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route path="/users/:userId">
            <UserProfile />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
```

### Nested Routes

```jsx
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams,
} from "react-router-dom";

function Dashboard() {
  // useRouteMatch gives access to the match object
  const { path, url } = useRouteMatch();

  return (
    <div>
      <h2>Dashboard</h2>
      <nav>
        <ul>
          <li>
            <Link to={`${url}/overview`}>Overview</Link>
          </li>
          <li>
            <Link to={`${url}/stats`}>Stats</Link>
          </li>
        </ul>
      </nav>

      <Switch>
        <Route exact path={path}>
          <h3>Please select a section</h3>
        </Route>
        <Route path={`${path}/overview`}>
          <DashboardOverview />
        </Route>
        <Route path={`${path}/stats`}>
          <DashboardStats />
        </Route>
      </Switch>
    </div>
  );
}

function DashboardOverview() {
  return <h3>Dashboard Overview</h3>;
}

function DashboardStats() {
  return <h3>Dashboard Stats</h3>;
}
```

### Programmatic Navigation

```jsx
import React from "react";
import { useHistory } from "react-router-dom";

function LoginForm() {
  const history = useHistory();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Authenticate user
    authenticateUser(username, password).then((success) => {
      if (success) {
        // Redirect to dashboard after successful login
        history.push("/dashboard");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Route Guards

```jsx
import React from "react";
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";

// Protected route component
function PrivateRoute({ children, isAuthenticated, ...rest }) {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

// Usage
function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  return (
    <Router>
      <Switch>
        <Route path="/login">
          <LoginPage setIsAuthenticated={setIsAuthenticated} />
        </Route>
        <PrivateRoute path="/dashboard" isAuthenticated={isAuthenticated}>
          <Dashboard />
        </PrivateRoute>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}
```

### React Router v6 Syntax

React Router v6 introduced some API changes:

```jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  Outlet,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="dashboard" element={<Dashboard />}>
          <Route path="overview" element={<DashboardOverview />} />
          <Route path="stats" element={<DashboardStats />} />
        </Route>
        <Route path="users" element={<Users />}>
          <Route path=":userId" element={<UserProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// For nested routes, use Outlet
function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <nav>
        <Link to="overview">Overview</Link>
        <Link to="stats">Stats</Link>
      </nav>
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

## Testing React Applications

Testing is a crucial part of building reliable React applications.

### Jest

Jest is a JavaScript testing framework created by Facebook, well-suited for React applications:

```javascript
// sum.js
export function sum(a, b) {
  return a + b;
}

// sum.test.js
import { sum } from "./sum";

test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

### React Testing Library

React Testing Library is a set of utilities that encourages testing React components in a way that resembles how users interact with them:

```jsx
// Button.js
import React from "react";

function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

export default Button;

// Button.test.js
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import Button from "./Button";

test("calls onClick when button is clicked", () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);

  // Find the button by its text
  const button = screen.getByText("Click Me");

  // Simulate a click
  fireEvent.click(button);

  // Assert that the onClick function was called
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Component Rendering

```jsx
// UserProfile.js
import React from "react";

function UserProfile({ user }) {
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      {user.isAdmin && <span className="admin-badge">Admin</span>}
    </div>
  );
}

// UserProfile.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import UserProfile from "./UserProfile";

test("shows loading state when user is null", () => {
  render(<UserProfile user={null} />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("displays user information when provided", () => {
  const user = {
    name: "John Doe",
    email: "john@example.com",
    isAdmin: false,
  };

  render(<UserProfile user={user} />);

  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("Email: john@example.com")).toBeInTheDocument();
  expect(screen.queryByText("Admin")).not.toBeInTheDocument();
});

test("shows admin badge for admin users", () => {
  const adminUser = {
    name: "Admin User",
    email: "admin@example.com",
    isAdmin: true,
  };

  render(<UserProfile user={adminUser} />);
  expect(screen.getByText("Admin")).toBeInTheDocument();
});
```

### Testing User Interactions

```jsx
// Counter.js
import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Counter.test.js
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import Counter from "./Counter";

test("counter increments when increment button is clicked", () => {
  render(<Counter />);

  // Check initial state
  expect(screen.getByText("Count: 0")).toBeInTheDocument();

  // Click increment button
  fireEvent.click(screen.getByText("Increment"));

  // Check updated state
  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});

test("counter decrements when decrement button is clicked", () => {
  render(<Counter />);

  // Click decrement button
  fireEvent.click(screen.getByText("Decrement"));

  // Check updated state
  expect(screen.getByText("Count: -1")).toBeInTheDocument();
});

test("counter resets to 0 when reset button is clicked", () => {
  render(<Counter />);

  // Click increment multiple times
  fireEvent.click(screen.getByText("Increment"));
  fireEvent.click(screen.getByText("Increment"));

  // Verify count increased
  expect(screen.getByText("Count: 2")).toBeInTheDocument();

  // Click reset button
  fireEvent.click(screen.getByText("Reset"));

  // Check reset state
  expect(screen.getByText("Count: 0")).toBeInTheDocument();
});
```

### Testing Asynchronous Code

```jsx
// UserList.js
import React, { useState, useEffect } from "react";

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// UserList.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import UserList from "./UserList";

// Mock the fetch API
global.fetch = jest.fn();

test("displays loading state initially", () => {
  render(<UserList />);
  expect(screen.getByText("Loading users...")).toBeInTheDocument();
});

test("displays users when data is fetched successfully", async () => {
  // Mock successful response
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
    ],
  });

  render(<UserList />);

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText("Loading users...")).not.toBeInTheDocument();
  });

  // Check that users are displayed
  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
});

test("displays error when fetch fails", async () => {
  // Mock failed response
  global.fetch.mockResolvedValueOnce({
    ok: false,
  });

  render(<UserList />);

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText("Loading users...")).not.toBeInTheDocument();
  });

  // Check that error message is displayed
  expect(screen.getByText(/Error:/)).toBeInTheDocument();
});
```

### Testing with Context

```jsx
// ThemeContext.js
import React, { createContext, useState } from "react";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ThemedButton.js
import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className={`btn-${theme}`}
      data-testid="theme-button"
    >
      Current theme: {theme}
    </button>
  );
}

// ThemedButton.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemedButton from "./ThemedButton";
import { ThemeProvider } from "./ThemeContext";

test("button displays current theme and changes when clicked", () => {
  render(
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );

  // Check initial theme
  const button = screen.getByTestId("theme-button");
  expect(button).toHaveTextContent("Current theme: light");
  expect(button).toHaveClass("btn-light");

  // Click to change theme
  fireEvent.click(button);

  // Check updated theme
  expect(button).toHaveTextContent("Current theme: dark");
  expect(button).toHaveClass("btn-dark");
});
```

### End-to-End Testing

Beyond unit and integration tests, end-to-end testing can be done with tools like Cypress or Playwright:

```javascript
// Cypress example
describe("Todo App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000");
  });

  it("should add a new todo item", () => {
    cy.get("input.todo-input").type("Learn Cypress");
    cy.get("button.add-todo").click();
    cy.get("ul.todo-list").should("contain", "Learn Cypress");
  });

  it("should mark a todo as completed", () => {
    // Add a todo first
    cy.get("input.todo-input").type("Learn React Testing");
    cy.get("button.add-todo").click();

    // Toggle completion status
    cy.get("ul.todo-list li").first().find('input[type="checkbox"]').click();
    cy.get("ul.todo-list li").first().should("have.class", "completed");
  });
});
```

### Testing Best Practices

1. **Focus on behavior, not implementation**

   - Test what the component does, not how it's built
   - Test from the user's perspective

2. **Favor integration over unit tests**

   - Components often depend on each other
   - Integration tests give more confidence in the entire system

3. **Use data-testid for test selection**

   - Avoid selecting by CSS classes that might change
   - Add data-testid attributes for stable test selectors

4. **Test accessibility**

   - Use jest-axe to test for accessibility violations
   - Ensure keyboard navigation works properly

5. **Mock external dependencies**
   - API calls, localStorage, etc.
   - Keep tests deterministic and fast
