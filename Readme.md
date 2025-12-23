# Task Management System - Backend

## API Routes (v1)

Base URL: `/TMSWebservices/v1`

### Authentication

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| POST   | `/register`     | Register a new user        |
| POST   | `/login`        | User login                 |
| GET    | `/fetchProfile` | Get current user's profile |

### Roles

| Method | Endpoint | Description       |
| ------ | -------- | ----------------- |
| POST   | `/role`  | Create a new role |

### Tasks

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/createTask`           | Create a new task         |
| GET    | `/getTasks`             | Get all tasks             |
| GET    | `/getTask/:id`          | Get task by ID            |
| PUT    | `/updateTask/:id`       | Update task details       |
| PUT    | `/updateTaskStatus/:id` | Update task status        |
| DELETE | `/deleteTask/:id`       | Delete task (soft delete) |
