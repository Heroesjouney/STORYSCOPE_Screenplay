# Screenplay Editor

## Project Setup

### Prerequisites
- Node.js (v14 or later)
- A modern web browser

### Local Development

1. Install a local development server:
   ```bash
   npm install -g http-server
   ```

2. Navigate to the project directory:
   ```bash
   cd path/to/screenplay-editor
   ```

3. Start the local server:
   ```bash
   http-server
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Features
- Screenplay writing editor
- Export to PDF, TXT, and FDX formats
- Dark mode
- Distraction-free mode
- Character and scene tracking

### Troubleshooting
- Ensure you're running the project through a local server to avoid CORS issues
- Check browser console for any error messages
- Verify all dependencies are loaded correctly

### Project Structure
- `index.html`: Main application entry point
- `script.js`: Core application logic
- `utils.js`: Utility functions and error logging
- `config.js`: Configuration management
- `export-service.js`: Export functionality
- `style.css`: Application styling

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Deployment on Render.com

#### Deployment Configuration
- **Platform**: Render.com Static Site
- **Build Command**: `npm install`
- **Publish Directory**: `.`
- **Node Version**: 14.0.0+

#### Deployment Steps
1. Connect your GitHub repository to Render
2. Select the repository
3. Configure the following settings:
   - Name: STORYSCOPE_Screenplay
   - Branch: main
   - Build Command: `npm install`
   - Publish Directory: `.`
4. Deploy the site

#### Environment Considerations
- The project uses a custom Node.js server (server.js)
- Requires no additional environment variables for basic deployment
- Serves static files directly from the root directory

### Troubleshooting Render Deployment
- Ensure your GitHub repository is public or Render has access
- Verify Node.js version compatibility
- Check Render build logs for any deployment issues

### License
Distributed under the MIT License. See `LICENSE` for more information.

### Contact
Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/screenplay-editor](https://github.com/yourusername/screenplay-editor)
