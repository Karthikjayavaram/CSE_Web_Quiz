# Comprehensive Project Prompt: Individual Quiz Platform with Anti-Cheating System

## Project Overview
Build a secure, production-ready quiz platform using the MERN stack (MongoDB, Express, React, Node.js) for individual students to take technical quizzes with strict anti-cheating measures and comprehensive admin monitoring.

---

## Core Requirements

### 1. Technology Stack
**Backend:**
- Node.js 18+ with Express.js
- TypeScript for type safety
- MongoDB Atlas for cloud database
- Socket.io for real-time communication
- JWT for authentication
- Multer for file uploads (Excel)
- XLSX library for parsing Excel files
- Bcryptjs is NOT needed (no password storage)

**Frontend:**
- React 18+ with Vite
- TypeScript
- React Router DOM v6 for routing
- Axios for HTTP requests
- Socket.io Client for real-time updates
- Lucide React for icons
- Framer Motion for animations (optional)

**Deployment:**
- Backend: Render.com (Web Service)
- Frontend: Vercel
- Database: MongoDB Atlas

---

## 2. Authentication System (CRITICAL - Single Student)

### Student Login Flow:
**Authentication Method:** TechZite ID + Phone Number (NO PASSWORD)

**Login Requirements:**
- Single student enters their TechZite ID (uppercase, e.g., TZ2024001)
- Single student enters their 10-digit phone number
- Backend validates both fields match a student record
- On success: Issue JWT token and store student info in localStorage
- Redirect to mandatory Rules page

**Database Schema for Students:**
```typescript
{
  techziteId: String (required, unique, uppercase),
  name: String (required),
  email: String (required),
  phoneNumber: String (required, 10 digits)
}
```

**Excel Upload Format for Admin:**
Admins can upload student data via Excel with these columns:
- techziteId | name | email | phoneNumber
- Example: TZ2024001 | John Doe | john@college.edu | 9876543210

**IMPORTANT:** Uploading new Excel MUST delete all existing students and replace with new data.

---

## 3. Quiz Flow (Mandatory Sequence)

### Step 1: Login Page
- Clean, modern UI with glassmorphism effects
- Dark theme (#0f172a background)
- Single form with 2 fields: TechZite ID, Phone Number
- Phone number validation: exactly 10 digits, numbers only
- On successful login → Navigate to /rules

### Step 2: Rules Page (Mandatory)
**Must display these rules:**
1. Quiz must be taken in full-screen mode
2. Switching tabs, minimizing window, or exiting full-screen will LOCK the quiz immediately
3. Copy-paste and right-click are disabled
4. Each question has a 45-second timer
5. Unanswered questions auto-submit after timer expires
6. Quiz is auto-submitted after the last question
7. Violations are monitored in real-time by admin
8. Admin approval required to resume after violation

**Requirements:**
- Checkbox: "I agree to the above rules"
- "Start Quiz" button disabled until checkbox is checked
- On click → Navigate to /quiz

### Step 3: Quiz Page
**Full-Screen Enforcement:**
- Request full-screen immediately on page load
- Show prompt: "Full Screen Required - Please enter full screen to continue"
- Block quiz access until full-screen is activated

**Question Display:**
- Show one question at a time
- Display: "Question X of 20" progress indicator
- Timer: 45 seconds countdown per question (visible)
- Timer bar: Visual progress bar that depletes
- Multiple choice: 4 options (A, B, C, D)
- Click on option → Auto-submit and move to next question
- Timer reaches 0 → Auto-submit with no answer (-1) and move to next

**Anti-Cheating Detection (IMMEDIATE LOCK - NO WARNINGS):**
Monitor these events:
1. Tab Switch (`visibilitychange` event when `document.hidden === true`)
2. Window Blur (`blur` event on window)
3. Exit Full-Screen (`fullscreenchange` event when `!document.fullscreenElement`)
4. Copy/Paste/Right-Click (all disabled via `preventDefault`)

**On ANY Violation:**
- Lock quiz IMMEDIATELY (no 2-violation tolerance)
- Display: "Quiz Locked - Violation detected. Contact administrator to resume."
- Emit violation event to server via Socket.io with:
  ```javascript
  {
    type: string, // "Tab Switch", "Window Blur", "Exited Fullscreen"
    studentId: string,
    studentName: string,
    timestamp: Date
  }
  ```
- Student cannot continue until admin unlocks

**Debouncing:**
Add 500ms debounce to violation detection to prevent duplicate events from rapid-fire triggers.

**Quiz Submission:**
- After last question → Auto-submit all answers to backend
- Backend calculates score but DOES NOT send it back to student
- Show success message: "Quiz Submitted Successfully! Results will be announced by administrator."
- Provide "Return to Login" button
- Disconnect anti-cheat listeners after submission

---

## 4. Admin Dashboard

### Features Required:

#### Tab 1: Live Monitoring
**Real-time Violation Feed:**
- Display violations as they happen via Socket.io
- Show socket connection status: 🟢 Connected / 🔴 Disconnected
- For each violation show:
  - Violation type
  - Student name
  - Timestamp
  - "Unlock & Resume" button (no alert popup on click)

**Unlock Functionality:**
- On unlock: Send unlock event via Socket.io to student
- Student can resume quiz immediately without page refresh
- Remove violation from monitoring list

#### Tab 2: Heavy Violators (>2 Violations)
- Display students who have triggered >2 violations
- Show: Student name, Total violation count
- Sorted by violation count (highest first)
- Empty state: "No students have exceeded 2 violations"

#### Tab 3: Student Management
**Excel Upload:**
- File input accepting .xlsx, .xls
- Upload button
- Display status message (uploading, success, error)
- Instructions: "Format: techziteId | name | email | phoneNumber"
- Warning: "⚠️ Uploading will replace ALL existing students"

**Backend Processing:**
1. Parse Excel using XLSX library
2. Delete all existing students: `await Student.deleteMany({})`
3. Insert new students with duplicate handling
4. Return count of successfully inserted students

#### Tab 4: Quiz Results
**Display:**
- Ranked leaderboard (highest score first)
- Columns: Rank | Student Name | Score | Percentage
- Score format: "15/20" with percentage
- Export to CSV button
- Empty state: "No results yet. Students will appear here after completing the quiz."

**CSV Export:**
- Headers: Rank, Student, Score, Percentage
- Filename: `quiz-results-YYYY-MM-DD.csv`

---

## 5. Backend Implementation Details

### Database Models:

**Student Model:**
```typescript
{
  techziteId: String (unique, required, uppercase),
  name: String (required),
  email: String (required),
  phoneNumber: String (required)
}
```

**Quiz Model:**
```typescript
{
  title: String,
  isActive: Boolean (default: true),
  questions: [{
    text: String,
    options: [String] (array of 4),
    correctAnswer: Number (0-3 index),
    points: Number (default: 1)
  }],
  settings: {
    timerPerQuestion: Number (default: 45),
    totalQuestions: Number (default: 20)
  }
}
```

**StudentQuizAttempt Model:**
```typescript
{
  studentId: ObjectId (ref: Student),
  quizId: ObjectId (ref: Quiz),
  answers: [Number], // array of selected option indices
  score: Number,
  isLocked: Boolean (default: false),
  isFinished: Boolean (default: false),
  violationLogs: [{
    type: String,
    timestamp: Date
  }],
  violationCount: Number (default: 0),
  violatedMultipleTimes: Boolean (default: false) // true if count > 2
}
```

### API Endpoints:

**Authentication:**
- `POST /api/auth/login`
  - Body: `{ techziteId: string, phoneNumber: string }`
  - Response: `{ token: string, student: { id, techziteId, name } }`

**Quiz:**
- `GET /api/quiz/active`
  - Returns quiz WITHOUT correct answers (prevent client-side cheating)
  - Response: `{ id, title, questions: [{ id, text, options }], settings }`

- `POST /api/quiz/submit`
  - Body: `{ studentId: string, answers: number[] }`
  - Calculate score server-side
  - Save to StudentQuizAttempt
  - Response: `{ message: "Quiz submitted successfully", submitted: true }`
  - DO NOT return score to student

- `GET /api/quiz/results`
  - Return all finished attempts sorted by score
  - Response: `[{ studentId, studentName, score, totalQuestions, percentage }]`

**Admin:**
- `POST /api/admin/upload-students`
  - Multipart/form-data with Excel file
  - Process: Delete all → Parse Excel → Insert students
  - Response: `{ message: string, count: number }`

- `POST /api/admin/unlock-student`
  - Body: `{ studentId: string }`
  - Set `isLocked: false` in StudentQuizAttempt
  - Emit Socket.io event: `quiz-unlocked` with studentId
  - Response: `{ message: "Student unlocked successfully" }`

- `GET /api/admin/heavy-violators`  
  - Find all attempts with `violatedMultipleTimes: true`
  - Response: `[{ studentId, studentName, violationCount }]`

**Health Check:**
- `GET /health`
  - Response: "API is healthy"

### Socket.io Events:

**Client → Server:**
- `violation`: Emitted when student triggers anti-cheat
  - Payload: `{ type, studentId, studentName, timestamp }`
  - Server: Increment violation count, add to logs, check if > 2, emit to admin

**Server → Client (Admin):**
- `admin-violation-alert`: Broadcast to all admin dashboards
  - Payload: Same as received violation data

**Server → Client (Student):**
- `quiz-unlocked`: Sent when admin unlocks
  - Student listens and sets `isLocked: false` locally

---

## 6. Frontend Implementation Details

### Environment Variables:
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### Vite Configuration (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

### Routing (`App.tsx`):
```typescript
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/rules" element={<Rules />} />
    <Route path="/quiz" element={<Quiz />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
  </Routes>
</BrowserRouter>
```

### Socket.io Configuration (`socket.ts`):
```typescript
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5
});
```

### Axios Configuration:
Set baseURL at app entry point:
```typescript
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
```

---

## 7. Design Requirements

### UI/UX Guidelines:
- **Dark Theme:** Background `#0f172a`, text white
- **Glassmorphism:** Use `background: rgba(255, 255, 255, 0.05)`, `backdrop-filter: blur(10px)`
- **Color Palette:**
  - Primary: `#38bdf8` (cyan-blue)
  - Success: `#10b981` (green)
  - Error: `#ef4444` (red)
  - Warning: `#f59e0b` (amber)
  - Violation/Alert: `#f87171` (light red)
  
- **Typography:** Use Google Fonts - Inter or Outfit
- **Animations:** Smooth transitions (0.2s ease)
- **Responsive:** Desktop-first approach

### Components Styling:
- Rounded corners: `border-radius: 12px` to `24px`
- Shadows: `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)`
- Input fields: Glassmorphism with focus states
- Buttons: Solid colors with hover effects (slight scale or brightness change)

---

## 8. Deployment Configuration

### Backend (Render):
**Settings:**
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start` (NOT `node start` or `node server.js`)
- Node Version: 18+

**Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/QuizDB
JWT_SECRET=your_secure_random_string
PORT=10000
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "postinstall": "npm run build",
    "seed": "ts-node src/seed.ts",
    "init-quiz": "ts-node src/scripts/initQuiz.ts"
  }
}
```

### Frontend (Vercel):
**Settings:**
- Framework Preset: Vite
- Root Directory: `client`
- Build Command: `npm run build` (NOT `tsc && vite build`)
- Output Directory: `dist`

**Environment Variables:**
```
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

**Critical Files:**

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 9. Seed Data & Scripts

### Dummy Test Students (12 students):
Create a seed script that generates:
```
TZ2024001 | Alice Smith | alice@techzite.com | 9876543210
TZ2024002 | Bob Johnson | bob@techzite.com | 9876543211
TZ2024003 | Charlie Brown | charlie@techzite.com | 9876543212
...
TZ2024012 | Laura Davis | laura@techzite.com | 9876543221
```

### Quiz Initialization Script:
Create 20 technical multiple-choice questions on programming topics (JavaScript, React, Node.js, databases, etc.).

Sample question format:
```typescript
{
  text: "What is the output of: console.log(typeof null)?",
  options: ["null", "undefined", "object", "number"],
  correctAnswer: 2, // "object"
  points: 1
}
```

### Management Scripts:
```bash
npm run seed          # Seed 12 test students
npm run init-quiz     # Initialize quiz with 20 questions
npm run clear-attempts # Clear all quiz attempts (for testing)
```

---

## 10. Common Pitfalls & Solutions

### Issue 1: MongoDB Connection Timeout
**Solution:** Use `127.0.0.1` instead of `localhost` on Windows
```javascript
mongoose.connect('mongodb://127.0.0.1:27017/QuizDB')
```

### Issue 2: Render "Cannot find module" Error
**Problem:** Render running wrong start command
**Solution:** Ensure Start Command is `npm start` not `node start`

### Issue 3: Vercel 404 on Routes
**Problem:** SPA routing not configured
**Solution:** Add `vercel.json` with rewrites and `tsconfig.json`

### Issue 4: Socket.io Not Connecting in Production
**Problem:** CORS or wrong URL
**Solution:** 
- Backend: Enable CORS with `origin: '*'` for testing
- Frontend: Use environment variables for Socket URL
- Check transports: `['websocket', 'polling']`

### Issue 5: Multiple Violation Events
**Problem:** Event listeners not debounced
**Solution:** Add 500ms debounce with `setTimeout`

### Issue 6: TypeScript Errors (import.meta.env)
**Problem:** Missing type definitions
**Solution:** Create `vite-env.d.ts` with ImportMeta interface

### Issue 7: JSX Syntax Error (> character)
**Problem:** Unescaped HTML entities in JSX
**Solution:** Use `&gt;` instead of `>` in JSX text

### Issue 8: Results Not Saving to Database
**Problem:** Missing student ID or group reference
**Solution:** Ensure studentId/quizId are passed correctly, use `.populate()` for references

---

## 11. Testing Checklist

After deployment, verify:

**Authentication:**
- [ ] Login with valid TechZite ID + Phone works
- [ ] Login with invalid credentials shows error
- [ ] JWT token is stored in localStorage

**Rules Page:**
- [ ] Checkbox must be checked to enable button
- [ ] Clicking "Start Quiz" navigates to /quiz

**Quiz Flow:**
- [ ] Full-screen prompt appears
- [ ] Cannot access quiz without full-screen
- [ ] Questions load (20 total)
- [ ] Timer counts down from 45 seconds
- [ ] Timer auto-submits at 0
- [ ] Click on option moves to next question
- [ ] Copy/paste/right-click are disabled

**Anti-Cheating:**
- [ ] Tab switch triggers immediate lock
- [ ] Window blur triggers immediate lock
- [ ] Exit full-screen triggers immediate lock
- [ ] Admin sees violation in Live Monitoring
- [ ] Admin can unlock student
- [ ] Student can resume without refresh

**Admin Panel:**
- [ ] Socket connects (shows 🟢)
- [ ] Violations appear in real-time
- [ ] Unlock button works (no alert)
- [ ] Heavy Violators shows students with >2 violations
- [ ] Excel upload replaces all students
- [ ] Results display correctly with scores
- [ ] CSV export works

**Deployment:**
- [ ] Backend health check: `/health` returns "API is healthy"
- [ ] Frontend loads on production URL
- [ ] All routes work (no 404)
- [ ] Socket.io connects to backend
- [ ] API calls succeed

---

## 12. File Structure

```
project-root/
├── client/
│   ├── public/
│   │   └── _redirects
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Login.css
│   │   │   ├── Rules.tsx
│   │   │   ├── Rules.css
│   │   │   ├── Quiz.tsx
│   │   │   ├── Quiz.css
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── AdminDashboard.css
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── socket.ts
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── vercel.json
│   └── .env.example
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── quizController.ts
│   │   │   └── unlockController.ts
│   │   ├── models/
│   │   │   ├── Student.ts
│   │   │   ├── Quiz.ts
│   │   │   └── StudentQuizAttempt.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── adminRoutes.ts
│   │   │   └── quizRoutes.ts
│   │   ├── scripts/
│   │   │   ├── initQuiz.ts
│   │   │   └── clearAttempts.ts
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── .gitignore
├── README.md
└── DEPLOYMENT.md
```

---

## 13. Success Criteria

The project is complete when:
1. ✅ Student can login with TechZite ID + Phone Number
2. ✅ Rules page enforces agreement before proceeding
3. ✅ Quiz enforces full-screen mode
4. ✅ Anti-cheating locks quiz on ANY violation
5. ✅ Violations appear in admin dashboard in real-time
6. ✅ Admin can unlock students without alerts
7. ✅ Heavy violators (>2) are tracked and displayed
8. ✅ Excel upload replaces all student data
9. ✅ Quiz results display correctly, sorted by score
10. ✅ CSV export works
11. ✅ Backend deployed to Render successfully
12. ✅ Frontend deployed to Vercel successfully
13. ✅ All routes work without 404 errors
14. ✅ Socket.io real-time features work in production

---

## Additional Notes

- Use `console.log` liberally during development for debugging
- Test locally before pushing to GitHub
- Use Git commits with meaningful messages
- Keep `.env` files in `.gitignore`
- Monitor Render and Vercel logs for errors
- Use MongoDB Atlas for cloud database (create free tier)
- Generate secure JWT_SECRET (use random string generator)
- Handle errors gracefully with try-catch blocks
- Validate all inputs on backend
- Use TypeScript strict mode for type safety

---

## Timeline Estimate
- Backend setup: 3-4 hours
- Frontend pages: 4-5 hours
- Anti-cheating implementation: 2-3 hours
- Admin dashboard: 2-3 hours
- Socket.io integration: 1-2 hours
- Testing & bug fixes: 2-3 hours
- Deployment: 1-2 hours
**Total: 15-22 hours**

---

This prompt provides a complete blueprint for building the quiz platform. Follow step-by-step, test thoroughly at each stage, and refer back to specific sections as needed during development.
