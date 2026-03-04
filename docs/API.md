# API Documentation

Complete API reference for PM2 Server Dashboard.

## Table of Contents

- [Authentication](#authentication)
- [Settings](#settings)
- [SSH Keys](#ssh-keys)
- [Processes](#processes)
- [Repositories](#repositories)
- [Logs](#logs)
- [WebSocket Events](#websocket-events)
- [Error Codes](#error-codes)

---

## Authentication

All API endpoints require session authentication using cookies. The session is created upon login and maintained automatically by the browser.

### Login

Authenticate with the dashboard.

**Endpoint**: `POST /pm2/master/auth/login`

**Request Body**:
```json
{
  "password": "your_password"
}
```

**Response** (Success):
```json
{
  "success": true
}
```

**Response** (No Password Set):
- If no password is configured, any password will work for login

**Error Response** (400):
```json
{
  "error": "Invalid password"
}
```

### Logout

End the current session.

**Endpoint**: `POST /pm2/master/auth/logout`

**Request**: None (uses session cookie)

**Response**:
```json
{
  "success": true
}
```

### Change Password

Set or change the password.

**Endpoint**: `POST /pm2/master/auth/password`

**Request Body**:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

- If `currentPassword` is not provided, it will set the initial password

**Response** (Success):
```json
{
  "success": true
}
```

**Error Response** (400):
```json
{
  "error": "Invalid current password"
}
```

### Remove Password

Remove password protection.

**Endpoint**: `DELETE /pm2/master/auth/password`

**Request Body**:
```json
{
  "currentPassword": "current_password"
}
```

**Response** (Success):
```json
{
  "success": true
}
```

**Error Response** (400):
```json
{
  "error": "Invalid password"
}
```

---

## Settings

Manage dashboard configuration.

### Get Settings

Retrieve current configuration settings.

**Endpoint**: `GET /pm2/master/api/settings`

**Response**:
```json
{
  "repoDir": "/path/to/repos",
  "theme": "dark",
  "language": "en",
  "sshStatus": {
    "connected": true,
    "username": "GitHubUsername",
    "lastChecked": "2024-03-04T10:30:00.000Z"
  },
  "meta": {
    "footerText": "Custom footer",
    "githubUrl": "https://github.com/user/repo"
  }
}
```

### Update Settings

Update configuration settings.

**Endpoint**: `PATCH /pm2/master/api/settings`

**Request Body**:
```json
{
  "repoDir": "/new/path/to/repos",
  "theme": "light",
  "language": "tr"
}
```

**Response**:
```json
{
  "repoDir": "/new/path/to/repos",
  "theme": "light",
  "language": "tr"
}
```

### Get Available Locales

List available language files.

**Endpoint**: `GET /pm2/master/api/settings/locales`

**Response**:
```json
["en", "tr"]
```

### Update Meta Information

Update meta information displayed in the dashboard.

**Endpoint**: `PATCH /pm2/master/api/settings/meta`

**Request Body**:
```json
{
  "footerText": "My Company",
  "githubUrl": "https://github.com/mycompany/repo"
}
```

**Response**:
```json
{
  "footerText": "My Company",
  "githubUrl": "https://github.com/mycompany/repo"
}
```

### Self-Update

Update the server from Git and restart.

**Endpoint**: `POST /pm2/master/api/settings/self-update`

**Request**: None

**Process**:
1. Runs `git pull` to fetch latest changes
2. Runs `npm install` in frontend directory
3. Runs `npm run build` in frontend directory
4. Restarts PM2 process

**Response** (Success):
```json
{
  "success": true,
  "message": "Update complete. Server restarting..."
}
```

**WebSocket Events**: Updates are streamed via WebSocket with type `self-update`

**Error Response** (500):
```json
{
  "error": "Git pull failed: <error message>"
}
```

---

## SSH Keys

Manage SSH keys for GitHub authentication.

### Generate SSH Key

Generate a new SSH key pair (ed25519).

**Endpoint**: `POST /pm2/master/api/settings/ssh/generate-key`

**Request**: None

**Response** (Success):
```json
{
  "publicKey": "ssh-ed25519 AAAA..."
}
```

**Error Response** (400):
```json
{
  "error": "SSH key already exists"
}
```

### Check SSH Key Exists

Check if SSH key exists on the system.

**Endpoint**: `GET /pm2/master/api/settings/ssh/key-exists`

**Response**:
```json
{
  "exists": true
}
```

### Get Public Key

Retrieve the public SSH key.

**Endpoint**: `GET /pm2/master/api/settings/ssh/public-key`

**Response** (Success):
```json
{
  "publicKey": "ssh-ed25519 AAAA..."
}
```

**Error Response** (404):
```json
{
  "error": "No SSH key found"
}
```

### Recheck SSH Connection

Test SSH connection to GitHub.

**Endpoint**: `POST /pm2/master/api/settings/ssh/recheck`

**Response** (Success):
```json
{
  "connected": true,
  "username": "GitHubUsername",
  "lastChecked": "2024-03-04T10:30:00.000Z"
}
```

**Error Response** (400):
```json
{
  "connected": false,
  "error": "Connection failed: Permission denied"
}
```

### Delete SSH Key

Remove SSH key from system and/or config.

**Endpoint**: `DELETE /pm2/master/api/settings/ssh/delete-key`

**Request Body**:
```json
{
  "deleteFromSystem": false
}
```

- `deleteFromSystem`: If `true`, deletes from system (`~/.ssh/id_ed25519`). If `false`, only removes from config.

**Response** (Success):
```json
{
  "success": true,
  "message": "SSH key removed from config"
}
```

**Response** (Delete from System):
```json
{
  "success": true,
  "message": "SSH key deleted from system"
}
```

---

## Processes

Manage PM2 processes.

### List Processes

Get list of all PM2 processes.

**Endpoint**: `GET /pm2/master/api/processes`

**Response**:
```json
[
  {
    "name": "my-app",
    "pid": 12345,
    "status": "online",
    "cpu": 2.5,
    "memory": 256.5,
    "uptime": 86400000,
    "restart_time": 0,
    "pm_id": 0
  }
]
```

### Start Process

Start a stopped PM2 process.

**Endpoint**: `POST /pm2/master/api/processes/:name/start`

**Parameters**:
- `:name`: Process name

**Response**:
```json
{
  "success": true
}
```

### Stop Process

Stop a running PM2 process.

**Endpoint**: `POST /pm2/master/api/processes/:name/stop`

**Parameters**:
- `:name`: Process name

**Response**:
```json
{
  "success": true
}
```

### Restart Process

Restart a PM2 process.

**Endpoint**: `POST /pm2/master/api/processes/:name/restart`

**Parameters**:
- `:name`: Process name

**Response**:
```json
{
  "success": true
}
```

### Reload Process

Gracefully reload a PM2 process (zero-downtime restart).

**Endpoint**: `POST /pm2/master/api/processes/:name/reload`

**Parameters**:
- `:name`: Process name

**Response**:
```json
{
  "success": true
}
```

### Delete Process

Remove a process from PM2.

**Endpoint**: `DELETE /pm2/master/api/processes/:name`

**Parameters**:
- `:name`: Process name

**Response**:
```json
{
  "success": true
}
```

### Describe Process

Get detailed information about a process.

**Endpoint**: `GET /pm2/master/api/processes/:name`

**Parameters**:
- `:name`: Process name

**Response**:
```json
[
  {
    "name": "my-app",
    "pid": 12345,
    "status": "online",
    "cpu": 2.5,
    "memory": 256.5,
    "uptime": 86400000,
    "restart_time": 0,
    "pm_id": 0,
    "pm2_env": {
      "env": "production"
    }
  }
]
```

---

## Repositories

Manage Git repositories and deployments.

### List Repositories

Get list of cloned repositories.

**Endpoint**: `GET /pm2/master/api/repos`

**Response**:
```json
[
  {
    "name": "my-project",
    "path": "/path/to/repos/my-project",
    "hasEcosystem": true,
    "ecosystemPath": "/path/to/repos/my-project/ecosystem.config.js"
  }
]
```

### Clone Repository

Clone a GitHub repository.

**Endpoint**: `POST /pm2/master/api/repos/clone`

**Request Body**:
```json
{
  "repoUrl": "git@github.com:username/repo.git",
  "folderName": "my-project"
}
```

- `repoUrl`: SSH format GitHub URL
- `folderName`: Optional folder name (defaults to repo name)

**Response** (Success):
```json
{
  "success": true,
  "path": "/path/to/repos/my-project"
}
```

**Error Response** (400):
```json
{
  "error": "Repository already exists"
}
```

**WebSocket Events**: Clone progress is streamed with type `clone`

### Deploy/Update Repository

Pull latest changes from a repository.

**Endpoint**: `POST /pm2/master/api/repos/:name/deploy`

**Parameters**:
- `:name`: Repository name

**Response** (Success):
```json
{
  "success": true,
  "message": "Repository updated successfully"
}
```

**WebSocket Events**: Deploy progress is streamed with type `deploy`

### Delete Repository

Delete a cloned repository.

**Endpoint**: `DELETE /pm2/master/api/repos/:name`

**Parameters**:
- `:name`: Repository name

**Response**:
```json
{
  "success": true
}
```

---

## Logs

View process logs.

### Get Logs

Get logs for a specific process.

**Endpoint**: `GET /pm2/master/api/logs/:name`

**Parameters**:
- `:name`: Process name

**Query Parameters**:
- `lines`: Number of log lines to retrieve (default: 100)
- `type`: Log type - `out`, `err`, or `all` (default: `all`)

**Response**:
```json
{
  "logs": [
    {
      "type": "out",
      "timestamp": "2024-03-04T10:30:00.000Z",
      "message": "Server started on port 3000"
    },
    {
      "type": "err",
      "timestamp": "2024-03-04T10:31:00.000Z",
      "message": "Error: Connection failed"
    }
  ]
}
```

---

## WebSocket Events

Real-time updates are sent via WebSocket at `/pm2/master/ws`.

### Connection

Connect to WebSocket:

```javascript
const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${location.host}/pm2/master/ws`);

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  // Handle message
};
```

### Event Types

#### `process-update`
Emitted when a process status changes.

```json
{
  "type": "process-update",
  "data": {
    "name": "my-app",
    "status": "online",
    "cpu": 2.5,
    "memory": 256.5
  }
}
```

#### `clone`
Emitted during repository cloning.

```json
{
  "type": "clone",
  "data": {
    "message": "Cloning repository...",
    "progress": 50
  }
}
```

#### `deploy`
Emitted during repository deployment.

```json
{
  "type": "deploy",
  "data": {
    "message": "Pulling latest changes..."
  }
}
```

#### `self-update`
Emitted during server self-update.

```json
{
  "type": "self-update",
  "data": {
    "message": "Running git pull..."
  }
}
```

---

## Error Codes

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters or data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Common Error Messages

| Error | Description |
|--------|-------------|
| `Invalid password` | Wrong password provided |
| `No password set` | Attempting to authenticate without password configured |
| `SSH key already exists` | Cannot generate new SSH key, one already exists |
| `Repository already exists` | Cannot clone, repository folder already exists |
| `Not a git repository` | Operation requires a git repository |
| `Process not found` | Specified PM2 process does not exist |
| `Not a git repository` | Attempted git operation on non-git directory |

### Error Response Format

```json
{
  "error": "Error message description"
}
```

---

## Authentication Flow

### Login Process

1. User enters password on login page
2. Frontend sends `POST /pm2/master/auth/login`
3. Backend validates password (or allows any if no password set)
4. Backend creates session cookie
5. Frontend redirects to dashboard

### Subsequent Requests

1. Frontend includes session cookie automatically
2. Backend validates session on each request
3. If invalid, returns `401 Unauthorized`

### Logout

1. Frontend sends `POST /pm2/master/auth/logout`
2. Backend destroys session
3. Frontend redirects to login page

---

## Rate Limiting

Currently, there is no rate limiting implemented on API endpoints.

---

## CORS

API endpoints are configured to accept requests from the same origin. Cross-origin requests are not supported.

---

## WebSocket Authentication

WebSocket connections inherit session authentication from the HTTP connection. No additional authentication is required.

---

## Notes

- All datetime fields use ISO 8601 format
- Memory values are in MB
- CPU values are percentages
- Uptime values are in milliseconds
- PM2 process IDs (`pm_id`) are unique integers assigned by PM2

---

[← Back to Main README](../README.md)