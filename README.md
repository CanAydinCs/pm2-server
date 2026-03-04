# PM2 Server Dashboard

A modern web-based dashboard for managing PM2 processes, GitHub repositories, and deployments with SSH key integration.

![Dashboard](docs/images/dashboard.png)

## Table of Contents

 - [ API Documentation](docs/API.md)
- [ UI Documentation](docs/UI.md)
- [Quick Start](#quick-start)
- [Features](#features)
- [Authentication & Password](#authentication--password)
- [Detailed Documentation](#detailed-documentation)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PM2 installed globally: `npm install -g pm2`
- Git

### Installation

**Linux (Ubuntu):**
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/CanAydinCs/pm2-server
cd pm2-server
npm install
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Windows:**
```powershell
# Clone and setup
git clone https://github.com/CanAydinCs/pm2-server
cd pm2-server
npm install
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2-startup install
```

## Features

- **Process Management**: Start, stop, restart, reload, and delete PM2 processes
- **GitHub Integration**: Clone and deploy repositories via SSH
- **Real-time Monitoring**: View CPU, memory, uptime, and restart count for each process
- **SSH Key Management**: Generate and manage SSH keys for GitHub authentication
- **Self-Update**: One-click update from Git with automatic build and restart
- **Multi-language Support**: English and Turkish (Türkçe) language options
- **Dark/Light Theme**: Customizable theme for comfortable viewing
- **Responsive Design**: Works on desktop and mobile devices
- **Cross-platform**: Works on Windows, Linux (tested on Ubuntu)

## Authentication & Password

### Password Behavior

**Important**: The login screen is always visible, but its behavior changes based on password configuration:

- **No Password Set**: The login screen appears, but you can enter **any** password to log in
- **Password Set**: You must enter the exact password to log in
- **Password Removal**: You can remove the password from the Settings page at any time

**To Set/Change Password:**
1. Log in to the dashboard
2. Go to **Settings** → **Password**
3. Enter current password (if set) and new password
4. Click **Change Password**

**To Remove Password:**
1. Go to **Settings** → **Password**
2. Enter current password
3. Click **Remove Password**

After removing the password, the login screen will still appear, but any password will work.

## Detailed Documentation

For comprehensive information about the dashboard, please refer to:

- **[ API Documentation](docs/API.md)** - Complete API reference with all endpoints, request/response examples, and authentication details
- **[ UI Documentation](docs/UI.md)** - Detailed UI guide with screenshots and explanations of every page and feature

### Quick Links

- [Dashboard Overview](docs/UI.md#dashboard)
- [Process Management](docs/UI.md#process-management)
- [Project Deployment](docs/UI.md#projects)
- [SSH Key Setup](docs/UI.md#ssh-key-management)
- [Settings & Configuration](docs/UI.md#settings)
- [Viewing Logs](docs/UI.md#logs)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions:

- GitHub Issues: [Create an issue on GitHub](https://github.com/CanAydinCs/pm2-server/issues)
- [API Documentation](docs/API.md)
- [UI Documentation](docs/UI.md)

---

**Made with ❤️ for PM2 users**