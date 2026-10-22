/**
 * questions.js - Banco de Preguntas Pedagógico para English Up (SENA ADSO)
 * Estructurado con las 4 mecánicas:
 * 1. multiple_choice (Kahoot)
 * 2. word_bank (Duolingo)
 * 3. text_input (Spelling/Writing)
 * 4. VOICE (Speaking)
 */

const QUESTION_BANK = [
    {
        id: 1,
        type: 'multiple_choice',
        category: 'Version Control (Git)',
        timeLimit: 15,
        title: 'Git Branches and Commits',
        prompt: 'Which Git command creates a new branch and immediately switches to it?',
        options: [
            { id: 'A', text: 'git branch -d new-feature', isCorrect: false, symbol: '▲', color: 'red' },
            { id: 'B', text: 'git checkout -b new-feature', isCorrect: true, symbol: '◆', color: 'blue' },
            { id: 'C', text: 'git merge origin main', isCorrect: false, symbol: '●', color: 'yellow' },
            { id: 'D', text: 'git status --all', isCorrect: false, symbol: '■', color: 'green' }
        ],
        explanation: 'The "-b" flag in "git checkout -b <name>" (or "git switch -c") creates a new branch and moves HEAD to it in one step.'
    },
    {
        id: 2,
        type: 'word_bank',
        category: 'Web Architectures & APIs',
        timeLimit: 25,
        title: 'Construct the Technical Sentence',
        prompt: 'Arrange the word blocks to form the correct technical statement:',
        correctSentence: 'The REST API returns structured JSON data',
        words: ['structured', 'returns', 'The', 'REST', 'data', 'API', 'JSON'],
        distractors: ['SQL', 'compiles'],
        explanation: 'A REST API typically delivers lightweight data structured in JSON format to modern web clients.'
    },
    {
        id: 3,
        type: 'text_input',
        category: 'HTTP & Web Protocols',
        timeLimit: 20,
        title: 'Technical Spelling & Acronyms',
        prompt: 'Which HTTP status code represents "Created" after a successful POST request? (Type the 3-digit number)',
        placeholder: 'e.g., 200',
        correctAnswers: ['201', 'HTTP 201', '201 Created'],
        explanation: 'HTTP 201 Created indicates that the request has succeeded and has led to the creation of a new resource on the server.'
    },
    {
        id: 4,
        type: 'VOICE',
        category: 'Object-Oriented Programming (OOP)',
        timeLimit: 30,
        title: 'English Pronunciation Challenge',
        prompt: 'Press the microphone and clearly pronounce this core OOP concept in English:',
        explanation: 'Polymorphism allows objects to take multiple forms, while inheritance enables code reuse from parent classes.'
    },
    {
        id: 5,
        type: 'multiple_choice',
        category: 'Backend & Spring Boot',
        timeLimit: 15,
        title: 'Spring Framework Architecture',
        prompt: 'In Spring Boot, which annotation marks a class as a RESTful web controller?',
        options: [
            { id: 'A', text: '@Repository', isCorrect: false, symbol: '▲', color: 'red' },
            { id: 'B', text: '@Service', isCorrect: false, symbol: '●', color: 'yellow' },
            { id: 'C', text: '@RestController', isCorrect: true, symbol: '◆', color: 'blue' },
            { id: 'D', text: '@Configuration', isCorrect: false, symbol: '■', color: 'green' }
        ],
        explanation: '@RestController combines @Controller and @ResponseBody, serializing return values directly to JSON.'
    },
    {
        id: 6,
        type: 'word_bank',
        category: 'Software Engineering & Git',
        timeLimit: 25,
        title: 'Word Order Syntax Challenge',
        prompt: 'Order the blocks to define what a Git commit does:',
        correctSentence: 'Git commits record permanent snapshots of the repository',
        words: ['permanent', 'Git', 'the', 'snapshots', 'record', 'commits', 'of', 'repository'],
        distractors: ['delete', 'temporary'],
        explanation: 'A commit in Git saves a snapshot of the staged files at a specific point in time.'
    },
    {
        id: 7,
        type: 'text_input',
        category: 'Modern JavaScript (ES6+)',
        timeLimit: 20,
        title: 'Technical Syntax & Keywords',
        prompt: 'Which JavaScript keyword declares a block-scoped variable that cannot be reassigned?',
        placeholder: 'e.g., let',
        correctAnswers: ['const', 'const keyword'],
        explanation: '"const" creates an immutable variable identifier, preventing variable reassignment.'
    },
    {
        id: 8,
        type: 'VOICE',
        category: 'DevOps & CI/CD',
        timeLimit: 30,
        title: 'Technical Speaking in English',
        prompt: 'Activate the mic and pronounce this modern DevOps workflow:',
        explanation: 'Asynchronous programming and WebSockets enable responsive, non-blocking real-time web applications.'
    }
];

window.QUESTION_BANK = QUESTION_BANK;
