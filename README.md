# WiqayaX - Private SAST Tool by Scalovate Systems Solutions

**100% Private Static Application Security Testing (SAST) Tool**

WiqayaX is an advanced AI-powered code security auditing tool that analyzes your codebase for vulnerabilities, security issues, and code quality problems using your own AI API keys or local LLM instances.

## 🛡️ About WiqayaX

WiqayaX is a **100% private SAST tool** developed by **Scalovate Systems Solutions**. This software is provided free of charge as part of Scalovate's Corporate Social Responsibility (CSR) initiative to contribute to the open source community.

**Important Disclaimer:** This software is provided "as is" without any warranties. Scalovate Systems Solutions is not responsible for any modifications made by users or any issues arising from such modifications. All code and logic remain the property of Scalovate Systems Solutions.

## ✨ Features

- 🔒 **Comprehensive Security Scanning** - CVE, CWE, OWASP Top 10, MITRE ATT&CK
- 🤖 **Multiple AI Providers** - OpenAI, Google Gemini, Groq, DeepSeek, Ollama, vLLM
- 📊 **Detailed PDF Reports** - Professional vulnerability analysis reports
- 🔐 **100% Private** - Your code never leaves your device when using local LLMs
- 🎨 **Modern UI** - Beautiful, responsive interface built with React and Tailwind CSS
- 📁 **File & Folder Upload** - Upload individual files or entire project folders
- 🔍 **Real-time Analysis** - Instant vulnerability detection and fix suggestions

## 🚀 Quick Start Guide

### Step 1: Download from GitHub

1. Clone or download this repository:
```bash
git clone https://github.com/scalovate/WiqayaX-Public.git
cd WiqayaX-Public
```

Or replace `scalovate` with your GitHub username/organization.

Or download as ZIP and extract to your desired location.

### Step 2: Install Dependencies

Make sure you have **Node.js 18+** installed on your system.

```bash
npm install
```

### Step 3: Configure Your AI Provider

You have three options:

#### Option A: Use Your Own API Keys (Cloud-based)

1. Launch the app:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Click "Launch App" to access the editor
4. Click the Settings icon (⚙️) in the activity bar
5. Select your AI provider (OpenAI, Gemini, Groq, or DeepSeek)
6. Enter your API key
7. Select a model from the dropdown
8. Click "Save Settings"

**Supported Cloud Providers:**
- **Google Gemini** (Recommended) - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenAI** - Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Groq** - Get API key from [Groq Console](https://console.groq.com/)
- **DeepSeek** - Get API key from [DeepSeek Platform](https://platform.deepseek.com/)

#### Option B: Use Ollama (Local - Recommended for Privacy)

1. **Install Ollama:**
   - Visit [https://ollama.ai](https://ollama.ai)
   - Download and install Ollama for your operating system
   - Follow the installation instructions

2. **Start Ollama:**
```bash
ollama serve
```

3. **Pull a model** (choose one):
```bash
# For code analysis, we recommend:
ollama pull llama3.2:3b
# or
ollama pull codellama:7b
# or
ollama pull deepseek-coder:6.7b
```

4. **Enable CORS** (required for browser access):
   - On Windows: Set environment variable `OLLAMA_ORIGINS=*`
   - On Linux/Mac: Run `OLLAMA_ORIGINS=* ollama serve`
   - Or add to your system environment variables

5. **Launch WiqayaX:**
```bash
npm run dev
```

6. **Configure in App:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Click "Launch App"
   - Open Settings (⚙️ icon)
   - Select "Local LLM (Ollama)"
   - Enter endpoint: `http://localhost:11434` (default)
   - Select your model from the dropdown
   - Click "Save Settings"

#### Option C: Use vLLM (Local - Advanced)

1. **Install vLLM:**
```bash
pip install vllm
```

2. **Start vLLM server:**
```bash
# Example: Start with a model
python -m vllm.entrypoints.openai.api_server \
    --model microsoft/Phi-3-mini-4k-instruct \
    --port 8000 \
    --host 0.0.0.0
```

3. **Configure in WiqayaX:**
   - In Settings, select "OpenAI" as provider
   - Set API endpoint to: `http://localhost:8000/v1`
   - Use any API key (vLLM accepts any key for local use)
   - Select your model from the dropdown

### Step 4: Upload and Scan Your Code

1. **Upload Files:**
   - Click "Add File" to upload individual files
   - Click "Add Folder" to upload entire project folders
   - Your code stays in your browser - never uploaded to any server

2. **Run Analysis:**
   - Click "ANALYZE FILE" to scan the currently open file
   - Click the play button (▶️) next to your project name to scan all files
   - View results in the bottom panel

3. **Download Reports:**
   - Click "File Report" for individual file PDF
   - Click "Project Report" for complete project PDF

## 📖 User Guide

### Basic Workflow

1. **Launch the Editor:** Click "Launch App" from the landing page
2. **Configure AI:** Set up your API key or local LLM in Settings
3. **Upload Code:** Add files or folders using the sidebar buttons
4. **Analyze:** Run analysis on individual files or entire projects
5. **Review:** Check vulnerabilities in the bottom panel
6. **Export:** Download PDF reports for documentation

### Understanding Results

- **CRITICAL** (Red): Immediate security risks requiring urgent attention
- **HIGH** (Orange): Significant security vulnerabilities
- **MEDIUM** (Yellow): Moderate security concerns
- **LOW** (Blue): Minor issues or best practice violations
- **INFO** (Gray): Informational findings

Each vulnerability includes:
- **Rule ID:** CVE/CWE identifier
- **Description:** Detailed explanation of the issue
- **Line Number:** Exact location in your code
- **Fix Suggestion:** Recommended code changes

### Troubleshooting

**Common Issues:**

1. **"API Key Error" or "401/403"**
   - Verify your API key is correct
   - Check API key permissions
   - Ensure you have credits/quota remaining

2. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check CORS is enabled: `OLLAMA_ORIGINS=*`
   - Verify endpoint URL: `http://localhost:11434`
   - Check firewall settings

3. **Model Not Found (Ollama)**
   - Pull the model: `ollama pull <model-name>`
   - List available models: `ollama list`
   - Refresh models in Settings

4. **Analysis Takes Too Long**
   - Use smaller files or fewer files at once
   - Try a faster model (smaller parameter count)
   - Check your internet connection (for cloud APIs)

5. **No Vulnerabilities Found**
   - This is good! Your code may be secure
   - Try analyzing different files
   - Ensure your code has actual security patterns to detect

## 🏗️ Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve these files using any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js serve
npx serve dist

# Using Vite preview
npm run preview
```

## 📁 Project Structure

```
WiqayaX-Public/
├── components/          # React components
│   ├── EditorApp.tsx   # Main editor interface
│   ├── LandingPage.tsx # Landing page with guides
│   └── ...
├── services/            # Business logic
│   ├── llmService.ts   # AI provider integration
│   ├── modelService.ts # Model management
│   └── reportService.ts # PDF generation
├── types.ts            # TypeScript type definitions
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

## 🔧 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **AI Integration:** OpenAI, Google Gemini, Groq, DeepSeek, Ollama, vLLM
- **PDF Generation:** jsPDF
- **Build Tool:** Vite

## 📝 License

This software is provided free of charge for personal, educational, and non-commercial use only. See [LICENSE](LICENSE) for full terms.

**Key Points:**
- ✅ Free to use for personal and educational purposes
- ✅ Free to modify and distribute
- ❌ NOT for commercial use or resale
- ⚠️ All code and logic remain property of Scalovate Systems Solutions
- ⚠️ Provided "as is" without warranties

## 🏢 About Scalovate Systems Solutions

WiqayaX is developed and maintained by **Scalovate Systems Solutions**.

- **Website:** [www.scalovate.com](https://www.scalovate.com)
- **Initiative:** Corporate Social Responsibility (CSR) - Open Source Contribution

## ⚠️ Disclaimer

This software is provided free of charge as a contribution to the open source community as part of Scalovate Systems Solutions' Corporate Social Responsibility (CSR) initiative. 

**The software is provided "as is" without any warranties or guarantees.** Scalovate Systems Solutions is not responsible for:
- Any modifications made by users
- Any issues or damages arising from use or modification
- Any commercial use violations

All code, logic, algorithms, and intellectual property contained in this software are the exclusive property of Scalovate Systems Solutions.

## 🤝 Support

For questions, issues, or commercial licensing inquiries:
- Visit: [www.scalovate.com](https://www.scalovate.com)
- Check the troubleshooting section above
- Review the documentation in the app header

## 🎯 Getting Help

1. **In-App Documentation:** Click the "?" icon in the editor header for detailed guides
2. **Troubleshooting:** See the troubleshooting section above
3. **Settings:** Configure your AI provider in Settings (⚙️ icon)

---

**Made with ❤️ by Scalovate Systems Solutions**

*Empowering developers to write secure code, one scan at a time.*
