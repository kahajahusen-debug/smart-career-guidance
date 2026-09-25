"""
Initial Seed Data for Smart Career Guidance System
Contains:
- 10 Career Profiles (5 IT, 5 Non-IT)
- 50 Assessment Questions (Difficulty Levels 1-5)
- Skills Matrix
- Portfolio Projects
- Sample Jobs with LinkedIn / Naukri links
"""

CAREERS_SEED = [
    # --- IT CAREERS ---
    {
        "id": "car_it_01",
        "title": "Full Stack Software Engineer",
        "category": "IT",
        "description": "Designs, develops, and maintains both frontend client interfaces and backend server architectures for modern scalable applications.",
        "average_salary": "$90,000 - $140,000 / yr",
        "growth_rate": "25% (Much faster than average)",
        "required_skills": [
            {"skill_name": "JavaScript", "weight": 1.0, "target_score": 85},
            {"skill_name": "React", "weight": 0.9, "target_score": 80},
            {"skill_name": "Python", "weight": 0.8, "target_score": 75},
            {"skill_name": "SQL", "weight": 0.8, "target_score": 75},
            {"skill_name": "Git", "weight": 0.7, "target_score": 70}
        ],
        "common_roles": ["Frontend Engineer", "Backend Developer", "Node.js Developer", "Web Architect"],
        "entry_requirements": "Bachelor's degree in CS or equivalent portfolio of full-stack projects."
    },
    {
        "id": "car_it_02",
        "title": "Data Scientist & ML Engineer",
        "category": "IT",
        "description": "Extracts actionable insights from large datasets and builds predictive statistical models using Machine Learning algorithms.",
        "average_salary": "$105,000 - $155,000 / yr",
        "growth_rate": "35% (Extremely High)",
        "required_skills": [
            {"skill_name": "Python", "weight": 1.0, "target_score": 90},
            {"skill_name": "SQL", "weight": 0.9, "target_score": 80},
            {"skill_name": "Machine Learning", "weight": 1.0, "target_score": 85},
            {"skill_name": "Statistics", "weight": 0.8, "target_score": 75},
            {"skill_name": "Data Visualization", "weight": 0.7, "target_score": 70}
        ],
        "common_roles": ["Data Analyst", "Machine Learning Engineer", "AI Researcher", "BI Architect"],
        "entry_requirements": "Strong foundation in mathematics, statistics, and programming."
    },
    {
        "id": "car_it_03",
        "title": "DevOps & Cloud Engineer",
        "category": "IT",
        "description": "Automates deployment pipelines, manages cloud infrastructure (AWS/Azure), and ensures high availability and security.",
        "average_salary": "$100,000 - $150,000 / yr",
        "growth_rate": "28% (Very High)",
        "required_skills": [
            {"skill_name": "Docker & Kubernetes", "weight": 1.0, "target_score": 85},
            {"skill_name": "Linux", "weight": 0.9, "target_score": 80},
            {"skill_name": "CI/CD", "weight": 0.9, "target_score": 80},
            {"skill_name": "Python", "weight": 0.7, "target_score": 70},
            {"skill_name": "Cloud Architecture", "weight": 0.8, "target_score": 75}
        ],
        "common_roles": ["Site Reliability Engineer (SRE)", "Cloud Solutions Architect", "Systems Administrator"],
        "entry_requirements": "Experience with Linux administration, containerization, and cloud providers."
    },
    {
        "id": "car_it_04",
        "title": "UI/UX Product Designer",
        "category": "IT",
        "description": "Creates intuitive user-centric interfaces, interactive wireframes, and design systems to deliver seamless visual experiences.",
        "average_salary": "$85,000 - $125,000 / yr",
        "growth_rate": "16% (Faster than average)",
        "required_skills": [
            {"skill_name": "UI/UX Design", "weight": 1.0, "target_score": 90},
            {"skill_name": "Figma & Wireframing", "weight": 1.0, "target_score": 85},
            {"skill_name": "User Research", "weight": 0.8, "target_score": 75},
            {"skill_name": "Design Systems", "weight": 0.8, "target_score": 75},
            {"skill_name": "Prototyping", "weight": 0.7, "target_score": 70}
        ],
        "common_roles": ["Product Designer", "UX Researcher", "Interaction Designer", "Visual Designer"],
        "entry_requirements": "Design portfolio showcasing wireframes, user testing, and visual prototypes."
    },
    {
        "id": "car_it_05",
        "title": "Cybersecurity Analyst",
        "category": "IT",
        "description": "Monitors network traffic, conducts vulnerability testing, and defends organization systems against cyber threats.",
        "average_salary": "$95,000 - $145,000 / yr",
        "growth_rate": "32% (Much faster than average)",
        "required_skills": [
            {"skill_name": "Network Security", "weight": 1.0, "target_score": 85},
            {"skill_name": "Ethical Hacking", "weight": 0.9, "target_score": 80},
            {"skill_name": "Linux", "weight": 0.8, "target_score": 75},
            {"skill_name": "Incident Response", "weight": 0.8, "target_score": 75},
            {"skill_name": "Cryptography", "weight": 0.7, "target_score": 70}
        ],
        "common_roles": ["SOC Analyst", "Penetration Tester", "Security Engineer", "Information Security Officer"],
        "entry_requirements": "Knowledge of networking protocols, OS security, and CompTIA Security+/CEH."
    },

    # --- NON-IT CAREERS ---
    {
        "id": "car_nonit_01",
        "title": "Digital Marketing Strategist",
        "category": "Non-IT",
        "description": "Plans and executes multi-channel online campaigns, SEO optimization, social media strategies, and ROI performance tracking.",
        "average_salary": "$65,000 - $105,000 / yr",
        "growth_rate": "19% (High Growth)",
        "required_skills": [
            {"skill_name": "SEO & SEM", "weight": 1.0, "target_score": 85},
            {"skill_name": "Content Strategy", "weight": 0.9, "target_score": 80},
            {"skill_name": "Marketing Analytics", "weight": 0.9, "target_score": 80},
            {"skill_name": "Social Media Marketing", "weight": 0.8, "target_score": 75},
            {"skill_name": "Copywriting", "weight": 0.7, "target_score": 70}
        ],
        "common_roles": ["Growth Marketer", "SEO Specialist", "Content Marketing Manager", "PPC Specialist"],
        "entry_requirements": "Degree in Marketing, Communications, or demonstrated campaign case studies."
    },
    {
        "id": "car_nonit_02",
        "title": "Product Manager",
        "category": "Non-IT",
        "description": "Defines product vision, prioritizes feature roadmaps, aligns engineering and design teams, and manages user feedback loops.",
        "average_salary": "$110,000 - $165,000 / yr",
        "growth_rate": "24% (Very High)",
        "required_skills": [
            {"skill_name": "Product Strategy", "weight": 1.0, "target_score": 90},
            {"skill_name": "Agile & Scrum", "weight": 0.9, "target_score": 80},
            {"skill_name": "User Research", "weight": 0.8, "target_score": 75},
            {"skill_name": "Data Analytics", "weight": 0.8, "target_score": 75},
            {"skill_name": "Stakeholder Management", "weight": 0.9, "target_score": 85}
        ],
        "common_roles": ["Associate PM", "Senior Product Manager", "Product Owner", "Group Product Manager"],
        "entry_requirements": "Cross-functional background with proven experience delivering products from zero to one."
    },
    {
        "id": "car_nonit_03",
        "title": "Financial Analyst & Risk Specialist",
        "category": "Non-IT",
        "description": "Evaluates financial statements, builds forecasting models, conducts risk assessments, and advises corporate investment strategies.",
        "average_salary": "$80,000 - $125,000 / yr",
        "growth_rate": "15% (Steady Growth)",
        "required_skills": [
            {"skill_name": "Financial Modeling", "weight": 1.0, "target_score": 90},
            {"skill_name": "Accounting Principles", "weight": 0.9, "target_score": 85},
            {"skill_name": "Excel & Valuation", "weight": 0.9, "target_score": 85},
            {"skill_name": "Risk Analysis", "weight": 0.8, "target_score": 75},
            {"skill_name": "Statistics", "weight": 0.7, "target_score": 70}
        ],
        "common_roles": ["Corporate Financial Analyst", "Investment Analyst", "Risk Management Specialist", "Treasury Analyst"],
        "entry_requirements": "Degree in Finance, Accounting, Economics, or progress toward CFA."
    },
    {
        "id": "car_nonit_04",
        "title": "Human Resources & Talent Manager",
        "category": "Non-IT",
        "description": "Oversees talent acquisition, employee engagement, compensation structures, performance evaluations, and HR compliance.",
        "average_salary": "$70,000 - $110,000 / yr",
        "growth_rate": "14% (Average Growth)",
        "required_skills": [
            {"skill_name": "Talent Acquisition", "weight": 1.0, "target_score": 85},
            {"skill_name": "Employee Relations", "weight": 0.9, "target_score": 80},
            {"skill_name": "HR Compliance", "weight": 0.8, "target_score": 75},
            {"skill_name": "Performance Management", "weight": 0.8, "target_score": 75},
            {"skill_name": "Communication", "weight": 0.9, "target_score": 85}
        ],
        "common_roles": ["HR Business Partner", "Talent Acquisition Specialist", "HR Generalist", "People Ops Manager"],
        "entry_requirements": "Degree in Human Resources, Business Administration, or SHRM certification."
    },
    {
        "id": "car_nonit_05",
        "title": "Healthcare Operations Administrator",
        "category": "Non-IT",
        "description": "Manages medical facility operations, clinical workflows, patient care compliance, and healthcare facility budgets.",
        "average_salary": "$85,000 - $130,000 / yr",
        "growth_rate": "28% (Much faster than average)",
        "required_skills": [
            {"skill_name": "Healthcare Management", "weight": 1.0, "target_score": 85},
            {"skill_name": "Regulatory Compliance", "weight": 0.9, "target_score": 80},
            {"skill_name": "Facility Budgeting", "weight": 0.8, "target_score": 75},
            {"skill_name": "Patient Quality Care", "weight": 0.8, "target_score": 75},
            {"skill_name": "Operations Logistics", "weight": 0.8, "target_score": 75}
        ],
        "common_roles": ["Clinic Administrator", "Health Services Manager", "Hospital Operations Supervisor"],
        "entry_requirements": "Degree in Health Administration (MHA/BSHA) or Healthcare Operations."
    }
]

# --- 50 ASSESSMENT QUESTIONS (Difficulty 1-5 across IT and Non-IT) ---
QUESTIONS_SEED = [
    # 1. Python Questions (Difficulty 1 to 5)
    {
        "id": "q_py_01",
        "skill_id": "sk_py",
        "skill_name": "Python",
        "skill_category": "Programming",
        "difficulty": 1,
        "category": "IT",
        "question_text": "What keyword is used to define a function in Python?",
        "options": ["func", "def", "function", "define"],
        "correct_option_index": 1,
        "explanation": "'def' keyword starts the declaration of a function in Python."
    },
    {
        "id": "q_py_02",
        "skill_id": "sk_py",
        "skill_name": "Python",
        "skill_category": "Programming",
        "difficulty": 2,
        "category": "IT",
        "question_text": "Which built-in Python data structure is ordered and immutable?",
        "options": ["List", "Dictionary", "Tuple", "Set"],
        "correct_option_index": 2,
        "explanation": "Tuples preserve element order and cannot be mutated after creation."
    },
    {
        "id": "q_py_03",
        "skill_id": "sk_py",
        "skill_name": "Python",
        "skill_category": "Programming",
        "difficulty": 3,
        "category": "IT",
        "question_text": "What does a Python list comprehension `[x**2 for x in range(5) if x % 2 == 0]` evaluate to?",
        "options": ["[0, 1, 4, 9, 16]", "[0, 4, 16]", "[1, 9]", "[0, 2, 4]"],
        "correct_option_index": 1,
        "explanation": "Even numbers in range(5) are 0, 2, and 4. Squaring them produces [0, 4, 16]."
    },
    {
        "id": "q_py_04",
        "skill_id": "sk_py",
        "skill_name": "Python",
        "skill_category": "Programming",
        "difficulty": 4,
        "category": "IT",
        "question_text": "What is the primary purpose of a decorator in Python?",
        "options": [
            "To define HTML styles inside code",
            "To modify or extend the behavior of a function without altering its code",
            "To encrypt Python source files",
            "To convert lists into generators"
        ],
        "correct_option_index": 1,
        "explanation": "Decorators wrap functions to execute code before and after the wrapped call."
    },
    {
        "id": "q_py_05",
        "skill_id": "sk_py",
        "skill_name": "Python",
        "skill_category": "Programming",
        "difficulty": 5,
        "category": "IT",
        "question_text": "How does Python's Global Interpreter Lock (GIL) affect multi-threading?",
        "options": [
            "It speeds up execution across all CPU cores",
            "It prevents two threads from executing Python bytecode simultaneously in a single process",
            "It disables garbage collection",
            "It converts synchronous functions into async coroutines automatically"
        ],
        "correct_option_index": 1,
        "explanation": "The GIL ensures memory safety by allowing only one native thread to execute Python bytecode at a time."
    },

    # 2. JavaScript & React Questions (Difficulty 1 to 5)
    {
        "id": "q_js_01",
        "skill_id": "sk_js",
        "skill_name": "JavaScript",
        "difficulty": 1,
        "category": "IT",
        "question_text": "Which operator performs strict equality comparison in JavaScript without type coercion?",
        "options": ["==", "=", "===", "equals()"],
        "correct_option_index": 2,
        "explanation": "=== compares both value and datatype without coercing types."
    },
    {
        "id": "q_js_02",
        "skill_id": "sk_js",
        "skill_name": "JavaScript",
        "difficulty": 2,
        "category": "IT",
        "question_text": "In React, which hook is used to handle side effects such as data fetching or subscriptions?",
        "options": ["useState", "useContext", "useEffect", "useReducer"],
        "correct_option_index": 2,
        "explanation": "useEffect lets you synchronize a component with external systems and lifecycle events."
    },
    {
        "id": "q_js_03",
        "skill_id": "sk_js",
        "skill_name": "JavaScript",
        "difficulty": 3,
        "category": "IT",
        "question_text": "What will `console.log(typeof NaN)` output in JavaScript?",
        "options": ["'undefined'", "'number'", "'NaN'", "'null'"],
        "correct_option_index": 1,
        "explanation": "In JavaScript specification, NaN (Not-a-Number) is of primitive type 'number'."
    },
    {
        "id": "q_js_04",
        "skill_id": "sk_js",
        "skill_name": "JavaScript",
        "difficulty": 4,
        "category": "IT",
        "question_text": "What is lexical scoping and closure in JavaScript?",
        "options": [
            "Functions executed inside web workers",
            "A function's ability to retain access to variables in its outer lexical environment even after outer function returns",
            "Storing variables in localStorage automatically",
            "Compiling JavaScript into WebAssembly"
        ],
        "correct_option_index": 1,
        "explanation": "A closure is created when an inner function accesses variables defined in its outer enclosing scope."
    },
    {
        "id": "q_js_05",
        "skill_id": "sk_js",
        "skill_name": "JavaScript",
        "difficulty": 5,
        "category": "IT",
        "question_text": "What happens during the Event Loop microtask queue processing phase?",
        "options": [
            "setTimeout callbacks execute first",
            "DOM event listeners run after render repaints",
            "Promise callbacks (.then/catch/await) in microtask queue execute before the next macrotask (timer)",
            "Network requests are cancelled if pending"
        ],
        "correct_option_index": 2,
        "explanation": "Microtasks (Promises, process.nextTick) drain completely before moving to the next macrotask."
    },

    # 3. SQL & Database Questions (Difficulty 1 to 5)
    {
        "id": "q_sql_01",
        "skill_id": "sk_sql",
        "skill_name": "SQL",
        "difficulty": 1,
        "category": "IT",
        "question_text": "Which SQL clause is used to filter records from a SELECT query?",
        "options": ["ORDER BY", "GROUP BY", "WHERE", "SELECT"],
        "correct_option_index": 2,
        "explanation": "WHERE filters row records based on specified condition criteria."
    },
    {
        "id": "q_sql_02",
        "skill_id": "sk_sql",
        "skill_name": "SQL",
        "difficulty": 2,
        "category": "IT",
        "question_text": "What type of JOIN returns all rows from the left table and matched rows from the right table?",
        "options": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"],
        "correct_option_index": 1,
        "explanation": "LEFT JOIN (or LEFT OUTER JOIN) preserves all rows from the left table regardless of right table matches."
    },
    {
        "id": "q_sql_03",
        "skill_id": "sk_sql",
        "skill_name": "SQL",
        "difficulty": 3,
        "category": "IT",
        "question_text": "What is the difference between WHERE and HAVING in SQL?",
        "options": [
            "HAVING is used for string comparisons, WHERE for numbers",
            "WHERE filters rows before aggregation, while HAVING filters aggregated groups",
            "They are identical keywords",
            "WHERE requires subqueries"
        ],
        "correct_option_index": 1,
        "explanation": "WHERE filters rows before GROUP BY aggregation; HAVING filters aggregated group results."
    },
    {
        "id": "q_sql_04",
        "skill_id": "sk_sql",
        "skill_name": "SQL",
        "difficulty": 4,
        "category": "IT",
        "question_text": "Which indexing structure is commonly used by B-Tree relational database indexes for fast logarithmic search?",
        "options": ["Linked List", "Balanced Self-Balancing B+ Tree", "Hash Map", "Stack"],
        "correct_option_index": 1,
        "explanation": "B+ Trees maintain sorted data allowing O(log N) search, insertion, and sequential range scans."
    },
    {
        "id": "q_sql_05",
        "skill_id": "sk_sql",
        "skill_name": "SQL",
        "difficulty": 5,
        "category": "IT",
        "question_text": "What does the ACID 'Isolation' property guarantee in database transactions?",
        "options": [
            "Data is duplicated across three physical disks",
            "Concurrent execution of transactions leaves the database in the same state as if executed serially",
            "Transactions complete in under 1 second",
            "Failed transactions are written to crash logs"
        ],
        "correct_option_index": 1,
        "explanation": "Isolation prevents uncommitted transaction side-effects (dirty reads, phantom reads) from interfering with concurrent operations."
    },

    # 4. Machine Learning & Data Science (Difficulty 1 to 5)
    {
        "id": "q_ml_01",
        "skill_id": "sk_ml",
        "skill_name": "Machine Learning",
        "difficulty": 1,
        "category": "IT",
        "question_text": "Which type of learning algorithms use labeled training dataset pairs (input features and known target output)?",
        "options": ["Unsupervised Learning", "Supervised Learning", "Reinforcement Learning", "Self-Organizing Map"],
        "correct_option_index": 1,
        "explanation": "Supervised learning models map inputs to known target output labels."
    },
    {
        "id": "q_ml_02",
        "skill_id": "sk_ml",
        "skill_name": "Machine Learning",
        "difficulty": 2,
        "category": "IT",
        "question_text": "What metric measures the proportion of true positive predictions among all positive instances in binary classification?",
        "options": ["Accuracy", "Recall / Sensitivity", "Precision", "F1 Score"],
        "correct_option_index": 1,
        "explanation": "Recall = True Positives / (True Positives + False Negatives)."
    },
    {
        "id": "q_ml_03",
        "skill_id": "sk_ml",
        "skill_name": "Machine Learning",
        "difficulty": 3,
        "category": "IT",
        "question_text": "What occurs when a Machine Learning model learns noise and training data details so closely that it performs poorly on unseen test data?",
        "options": ["Underfitting", "Overfitting", "Convergence", "Regularization"],
        "correct_option_index": 1,
        "explanation": "Overfitting happens when model complexity is high, failing to generalize to validation/test sets."
    },
    {
        "id": "q_ml_04",
        "skill_id": "sk_ml",
        "skill_name": "Machine Learning",
        "difficulty": 4,
        "category": "IT",
        "question_text": "How does L2 Regularization (Ridge Regression) prevent overfitting?",
        "options": [
            "By setting coefficients to exactly zero",
            "By adding a penalty proportional to the sum of squared weights (λ * ||w||²)",
            "By increasing training dataset size artificially",
            "By removing outlier rows"
        ],
        "correct_option_index": 1,
        "explanation": "L2 regularization penalizes large magnitude weights, smoothing model prediction bounds."
    },
    {
        "id": "q_ml_05",
        "skill_id": "sk_ml",
        "skill_name": "Machine Learning",
        "difficulty": 5,
        "category": "IT",
        "question_text": "What key architectural component enables Transformer models to process all tokens in parallel rather than sequentially?",
        "options": ["Recurrent LSTM gates", "Multi-Head Self-Attention Mechanism", "Convolutional pooling", "K-Means clustering"],
        "correct_option_index": 1,
        "explanation": "Self-attention computes pairwise relationship matrix weights between all input tokens simultaneously."
    },

    # 5. DevOps & Cloud Questions (Difficulty 1 to 5)
    {
        "id": "q_devops_01",
        "skill_id": "sk_devops",
        "skill_name": "Docker & Kubernetes",
        "difficulty": 1,
        "category": "IT",
        "question_text": "Which technology packages an application and all its dependencies into an isolated container image?",
        "options": ["VirtualBox", "Docker", "Apache HTTP Server", "Nginx"],
        "correct_option_index": 1,
        "explanation": "Docker containerization encapsulates code runtime, libraries, and binaries."
    },
    {
        "id": "q_devops_02",
        "skill_id": "sk_devops",
        "skill_name": "Docker & Kubernetes",
        "difficulty": 2,
        "category": "IT",
        "question_text": "In Kubernetes, what is the smallest deployable object that encloses one or more containers?",
        "options": ["Node", "Cluster", "Pod", "Service"],
        "correct_option_index": 2,
        "explanation": "A Pod represents a single instance of a running process in Kubernetes."
    },
    {
        "id": "q_devops_03",
        "skill_id": "sk_devops",
        "skill_name": "Docker & Kubernetes",
        "difficulty": 3,
        "category": "IT",
        "question_text": "What is the primary role of a CI/CD pipeline?",
        "options": [
            "To design graphic logos",
            "To automate code testing, integration, and continuous deployment into production environments",
            "To compress database backups",
            "To protect against physical hardware theft"
        ],
        "correct_option_index": 1,
        "explanation": "CI/CD automates software build, testing, and delivery workflows."
    },
    {
        "id": "q_devops_04",
        "skill_id": "sk_devops",
        "skill_name": "Docker & Kubernetes",
        "difficulty": 4,
        "category": "IT",
        "question_text": "What distinguishes Infrastructure as Code (IaC) tools like Terraform?",
        "options": [
            "Configuring infrastructure declaratively using code files checked into version control",
            "Manual clicking in cloud web dashboards",
            "Editing CSS styles on cloud servers",
            "Running virus scans on host servers"
        ],
        "correct_option_index": 0,
        "explanation": "IaC specifies cloud resources declaratively, enabling repeatable infrastructure deployment."
    },
    {
        "id": "q_devops_05",
        "skill_id": "sk_devops",
        "skill_name": "Docker & Kubernetes",
        "difficulty": 5,
        "category": "IT",
        "question_text": "In Kubernetes, how does an Ingress Controller manage external HTTP/HTTPS traffic routing to internal services?",
        "options": [
            "By replacing all pods with virtual machines",
            "By acting as a reverse proxy that evaluates routing rules, SSL termination, and host header paths",
            "By disabling firewalls",
            "By caching database queries"
        ],
        "correct_option_index": 1,
        "explanation": "Ingress controllers implement reverse proxy rules (Nginx/Envoy) to route external traffic to cluster services."
    },

    # 6. UI/UX Design Questions (Difficulty 1 to 5)
    {
        "id": "q_ux_01",
        "skill_id": "sk_ux",
        "skill_name": "UI/UX Design",
        "difficulty": 1,
        "category": "IT",
        "question_text": "What does 'UX' stand for in product design?",
        "options": ["User Extension", "User Experience", "Universal Execution", "Unit Visual"],
        "correct_option_index": 1,
        "explanation": "UX stands for User Experience, focusing on user interaction and product usability."
    },
    {
        "id": "q_ux_02",
        "skill_id": "sk_ux",
        "skill_name": "UI/UX Design",
        "difficulty": 2,
        "category": "IT",
        "question_text": "What is a wireframe in UI design?",
        "options": [
            "A high-fidelity final 3D animation",
            "A basic structural layout schematic showing visual hierarchy and content placement",
            "A CSS style sheet file",
            "A backend database table design"
        ],
        "correct_option_index": 1,
        "explanation": "Wireframes represent low-to-medium fidelity structural blueprints of interfaces."
    },
    {
        "id": "q_ux_03",
        "skill_id": "sk_ux",
        "skill_name": "UI/UX Design",
        "difficulty": 3,
        "category": "IT",
        "question_text": "According to Fitts's Law in user interface design:",
        "options": [
            "Red buttons convert 50% better than blue buttons",
            "The time required to hit a target depends on the target size and distance to the target",
            "Users read text in a Z-pattern only",
            "Interfaces should contain no more than 3 colors"
        ],
        "correct_option_index": 1,
        "explanation": "Fitts's Law states larger and closer interactive targets are faster and easier for users to click."
    },
    {
        "id": "q_ux_04",
        "skill_id": "sk_ux",
        "skill_name": "UI/UX Design",
        "difficulty": 4,
        "category": "IT",
        "question_text": "What is the primary benefit of maintaining an atomic Design System in Figma?",
        "options": [
            "Reducing file sizes on hard drives",
            "Ensuring visual consistency across products through reusable tokens, components, and templates",
            "Writing code automatically",
            "Bypassing usability testing"
        ],
        "correct_option_index": 1,
        "explanation": "Design systems establish shared components, colors, and typography rules across design teams."
    },
    {
        "id": "q_ux_05",
        "skill_id": "sk_ux",
        "skill_name": "UI/UX Design",
        "difficulty": 5,
        "category": "IT",
        "question_text": "What is WCAG 2.1 AA accessibility contrast ratio requirement for normal body text?",
        "options": ["2.0:1", "3.0:1", "4.5:1", "7.0:1"],
        "correct_option_index": 2,
        "explanation": "WCAG 2.1 Level AA requires a minimum visual contrast ratio of 4.5:1 for regular size text."
    },

    # 7. Digital Marketing & SEO Questions (Difficulty 1 to 5)
    {
        "id": "q_mkt_01",
        "skill_id": "sk_mkt",
        "skill_name": "SEO & SEM",
        "difficulty": 1,
        "category": "Non-IT",
        "question_text": "What does 'SEO' stand for in digital marketing?",
        "options": ["Search Engine Optimization", "Social Engagement Operations", "Sales Execution Strategy", "System Executive Officer"],
        "correct_option_index": 0,
        "explanation": "SEO stands for Search Engine Optimization."
    },
    {
        "id": "q_mkt_02",
        "skill_id": "sk_mkt",
        "skill_name": "SEO & SEM",
        "difficulty": 2,
        "category": "Non-IT",
        "question_text": "Which metric measures the percentage of website visitors who leave after viewing only one single page?",
        "options": ["Click-Through Rate (CTR)", "Conversion Rate", "Bounce Rate", "Customer Lifetime Value"],
        "correct_option_index": 2,
        "explanation": "Bounce rate measures single-page sessions without engagement actions."
    },
    {
        "id": "q_mkt_03",
        "skill_id": "sk_mkt",
        "skill_name": "SEO & SEM",
        "difficulty": 3,
        "category": "Non-IT",
        "question_text": "How is Customer Acquisition Cost (CAC) calculated?",
        "options": [
            "Total revenue divided by number of products",
            "Total marketing & sales spend divided by number of new customers acquired in that period",
            "Total website visits divided by ad budget",
            "Monthly recurring revenue multiplied by 12"
        ],
        "correct_option_index": 1,
        "explanation": "CAC = Total Acquisition Expenses / Total New Customers Acquired."
    },
    {
        "id": "q_mkt_04",
        "skill_id": "sk_mkt",
        "skill_name": "SEO & SEM",
        "difficulty": 4,
        "category": "Non-IT",
        "question_text": "What is Canonical URL tag (`rel='canonical'`) used for in technical SEO?",
        "options": [
            "To redirect users to competitors",
            "To indicate the master authoritative version of a page to search engines and prevent duplicate content issues",
            "To hide pages from Google",
            "To speed up page loading"
        ],
        "correct_option_index": 1,
        "explanation": "Canonical tags resolve duplicate content penalties by pointing search bots to the primary URL."
    },
    {
        "id": "q_mkt_05",
        "skill_id": "sk_mkt",
        "skill_name": "SEO & SEM",
        "difficulty": 5,
        "category": "Non-IT",
        "question_text": "How does Google's Search E-E-A-T guideline evaluate content quality?",
        "options": [
            "Errors, Exaggeration, Advertising, Tactics",
            "Experience, Expertise, Authoritativeness, and Trustworthiness",
            "Efficiency, Engagement, Aesthetics, Technology",
            "Encryption, Enterprise, Analytics, Telemetry"
        ],
        "correct_option_index": 1,
        "explanation": "E-E-A-T assesses first-hand Experience, demonstrative Expertise, Authoritativeness, and core Trust."
    },

    # 8. Product Management Questions (Difficulty 1 to 5)
    {
        "id": "q_pm_01",
        "skill_id": "sk_pm",
        "skill_name": "Product Strategy",
        "difficulty": 1,
        "category": "Non-IT",
        "question_text": "What does MVP stand for in product development?",
        "options": ["Most Valuable Player", "Minimum Viable Product", "Maximum Visibility Plan", "Main Version Process"],
        "correct_option_index": 1,
        "explanation": "MVP stands for Minimum Viable Product - the simplest version that delivers user value."
    },
    {
        "id": "q_pm_02",
        "skill_id": "sk_pm",
        "skill_name": "Product Strategy",
        "difficulty": 2,
        "category": "Non-IT",
        "question_text": "In Agile software development, what is a Product Backlog?",
        "options": [
            "A list of software bugs found in production",
            "An prioritized list of features, user stories, and requirements for the product",
            "An invoice of software hardware costs",
            "A log of employee attendance"
        ],
        "correct_option_index": 1,
        "explanation": "The product backlog contains prioritized user stories and items to be built by sprint teams."
    },
    {
        "id": "q_pm_03",
        "skill_id": "sk_pm",
        "skill_name": "Product Strategy",
        "difficulty": 3,
        "category": "Non-IT",
        "question_text": "Which prioritization framework scores initiatives by Reach, Impact, Confidence, and Effort?",
        "options": ["SWOT Analysis", "RICE Framework", "Kano Model", "MoSCoW Method"],
        "correct_option_index": 1,
        "explanation": "RICE = (Reach × Impact × Confidence) / Effort."
    },
    {
        "id": "q_pm_04",
        "skill_id": "sk_pm",
        "skill_name": "Product Strategy",
        "difficulty": 4,
        "category": "Non-IT",
        "question_text": "What defines Product-Market Fit (PMF)?",
        "options": [
            "When a company hires 100 employees",
            "When a product satisfies strong market demand and achieves sustainable organic retention and usage",
            "When a product receives a patent",
            "When ad spend exceeds $10,000"
        ],
        "correct_option_index": 1,
        "explanation": "PMF occurs when target customers buy, use, and tell others about a product fast enough to sustain growth."
    },
    {
        "id": "q_pm_05",
        "skill_id": "sk_pm",
        "skill_name": "Product Strategy",
        "difficulty": 5,
        "category": "Non-IT",
        "question_text": "How does Cohort Analysis help detect product retention health?",
        "options": [
            "By comparing total daily server traffic",
            "By tracking the usage behavior of specific user sign-up groups over time to see retention decay curves",
            "By calculating profit margins per country",
            "By conducting employee reviews"
        ],
        "correct_option_index": 1,
        "explanation": "Cohort analysis groups users by sign-up date, revealing whether retention curves flatten (healthy product)."
    },

    # 9. Financial Analysis Questions (Difficulty 1 to 5)
    {
        "id": "q_fin_01",
        "skill_id": "sk_fin",
        "skill_name": "Financial Modeling",
        "difficulty": 1,
        "category": "Non-IT",
        "question_text": "Which fundamental financial statement summarizes a company's Revenues, Expenses, and Net Income over a period?",
        "options": ["Balance Sheet", "Income Statement (P&L)", "Cash Flow Statement", "Statement of Equity"],
        "correct_option_index": 1,
        "explanation": "Income Statement (Profit & Loss) details earnings and operating costs over time."
    },
    {
        "id": "q_fin_02",
        "skill_id": "sk_fin",
        "skill_name": "Financial Modeling",
        "difficulty": 2,
        "category": "Non-IT",
        "question_text": "What is the accounting equation represented on a Balance Sheet?",
        "options": [
            "Assets = Revenue - Expenses",
            "Assets = Liabilities + Equity",
            "Liabilities = Assets + Cash",
            "Net Income = Equity + Liabilities"
        ],
        "correct_option_index": 1,
        "explanation": "Assets must always equal Liabilities plus Shareholders' Equity."
    },
    {
        "id": "q_fin_03",
        "skill_id": "sk_fin",
        "skill_name": "Financial Modeling",
        "difficulty": 3,
        "category": "Non-IT",
        "question_text": "What does NPV (Net Present Value) measure in capital budgeting?",
        "options": [
            "The historical cost of machinery",
            "The sum of present values of incoming and outgoing cash flows discounted at a target interest rate",
            "Annual tax liabilities",
            "Total stock shares outstanding"
        ],
        "correct_option_index": 1,
        "explanation": "NPV discounts future expected cash flows to present dollar values to evaluate profitability."
    },
    {
        "id": "q_fin_04",
        "skill_id": "sk_fin",
        "skill_name": "Financial Modeling",
        "difficulty": 4,
        "category": "Non-IT",
        "question_text": "What metric represents earnings before interest, taxes, depreciation, and amortization?",
        "options": ["EBITDA", "CAGR", "ROIC", "EPS"],
        "correct_option_index": 0,
        "explanation": "EBITDA measures core operating profitability before non-operating accounting expenses."
    },
    {
        "id": "q_fin_05",
        "skill_id": "sk_fin",
        "skill_name": "Financial Modeling",
        "difficulty": 5,
        "category": "Non-IT",
        "question_text": "In Discounted Cash Flow (DCF) valuation, how is WACC (Weighted Average Cost of Capital) utilized?",
        "options": [
            "As the inflation rate multiplier",
            "As the discount rate to calculate the present value of expected future Free Cash Flows",
            "As the tax rate percentage",
            "As the debt ratio cap"
        ],
        "correct_option_index": 1,
        "explanation": "WACC represents a firm's blended cost of capital, used to discount projected FCF to present enterprise value."
    },

    # 10. HR & Talent Management Questions (Difficulty 1 to 5)
    {
        "id": "q_hr_01",
        "skill_id": "sk_hr",
        "skill_name": "Talent Acquisition",
        "difficulty": 1,
        "category": "Non-IT",
        "question_text": "What is the primary role of Talent Acquisition in HR?",
        "options": [
            "Processing monthly payroll taxes",
            "Identifying, sourcing, interviewing, and hiring qualified candidates for open positions",
            "Managing building security",
            "Ordering office supplies"
        ],
        "correct_option_index": 1,
        "explanation": "Talent Acquisition focuses on strategic candidate recruitment and hiring."
    },
    {
        "id": "q_hr_02",
        "skill_id": "sk_hr",
        "skill_name": "Talent Acquisition",
        "difficulty": 2,
        "category": "Non-IT",
        "question_text": "What does an ATS (Applicant Tracking System) do?",
        "options": [
            "Tracks employee GPS locations",
            "Collects, parses, and organizes job applications and resumes submitted by candidates",
            "Monitors internet speed",
            "Generates financial invoices"
        ],
        "correct_option_index": 1,
        "explanation": "ATS software automates resume parsing, candidate screening pipelines, and interview scheduling."
    },
    {
        "id": "q_hr_03",
        "skill_id": "sk_hr",
        "skill_name": "Talent Acquisition",
        "difficulty": 3,
        "category": "Non-IT",
        "question_text": "What is an indicator of high Employee Attrition Rate?",
        "options": [
            "High percentage of employees leaving the organization over a given timeframe",
            "High rate of internal promotions",
            "Increased training course completion",
            "Higher customer satisfaction scores"
        ],
        "correct_option_index": 0,
        "explanation": "Attrition rate measures workforce turnover as employees resign or retire."
    },
    {
        "id": "q_hr_04",
        "skill_id": "sk_hr",
        "skill_name": "Talent Acquisition",
        "difficulty": 4,
        "category": "Non-IT",
        "question_text": "What is the STAR method used for during behavioral job interviews?",
        "options": [
            "System, Timing, Action, Reward",
            "Situation, Task, Action, Result",
            "Strategy, Talent, Assessment, Retention",
            "Source, Target, Analysis, Report"
        ],
        "correct_option_index": 1,
        "explanation": "STAR framework structures responses: Situation context, Task required, Action taken, Result achieved."
    },
    {
        "id": "q_hr_05",
        "skill_id": "sk_hr",
        "skill_name": "Talent Acquisition",
        "difficulty": 5,
        "category": "Non-IT",
        "question_text": "How does 360-degree performance feedback differ from traditional top-down appraisals?",
        "options": [
            "It is conducted every 360 days",
            "It gathers performance input from peers, direct reports, supervisors, and self-evaluation",
            "It only evaluates sales figures",
            "It is anonymous to management only"
        ],
        "correct_option_index": 1,
        "explanation": "360 feedback synthesizes multi-perspective reviews across colleagues, managers, and direct reports."
    }
]

# --- PORTFOLIO PROJECTS SEED ---
PROJECTS_SEED = [
    {
        "id": "proj_01",
        "title": "Full-Stack SaaS Job Board with Search & Alerts",
        "category": "IT",
        "difficulty": "Intermediate",
        "description": "Build a responsive web app with job filtering, application submission, and email notification webhooks.",
        "skills_covered": ["React", "Python", "SQL", "REST APIs"],
        "deliverables": ["GitHub repository link", "Live deployed demo URL", "Architecture documentation"]
    },
    {
        "id": "proj_02",
        "title": "Customer Churn Prediction Engine",
        "category": "IT",
        "difficulty": "Advanced",
        "description": "Train a Random Forest / XGBoost model on Telecom customer data to identify churn risk factors and deploy via FastAPI.",
        "skills_covered": ["Python", "Machine Learning", "Scikit-Learn", "FastAPI"],
        "deliverables": ["Jupyter notebook with EDA", "Trained ML model pipeline", "API integration"]
    },
    {
        "id": "proj_03",
        "title": "Data-Driven SEO & Content Campaign Audit",
        "category": "Non-IT",
        "difficulty": "Beginner",
        "description": "Perform comprehensive keyword research, content gap analysis, and organic traffic growth audit for an e-commerce store.",
        "skills_covered": ["SEO & SEM", "Marketing Analytics", "Content Strategy"],
        "deliverables": ["Keyword opportunity sheet", "Technical audit deck", "90-day execution roadmap"]
    },
    {
        "id": "proj_04",
        "title": "Product Strategy Teardown & Feature Specs",
        "category": "Non-IT",
        "difficulty": "Intermediate",
        "description": "Write a PRD (Product Requirement Document) and wireframe specs for a new onboarding feature in a popular SaaS application.",
        "skills_covered": ["Product Strategy", "User Research", "Agile & Scrum"],
        "deliverables": ["Product Requirement Document (PRD)", "Interactive Figma prototype", "RICE priority matrix"]
    }
]

# --- SAMPLE JOBS & INTERNSHIPS SEED ---
JOBS_SEED = [
    {
        "id": "job_01",
        "job_id": "job_01",
        "title": "Junior Full Stack Developer",
        "company": "TechScale Innovations",
        "category": "IT",
        "career_id": "car_it_01",
        "location": "Bengaluru, IN",
        "work_mode": "Hybrid",
        "employment_type": "Full-time",
        "experience_level": "Entry Level",
        "salary_range": "₹8,00,000 - ₹14,00,000 / yr",
        "required_skills": ["JavaScript", "React", "Python", "SQL"],
        "preferred_skills": ["Node.js", "Git", "TypeScript"],
        "education": ["Computer Science", "Information Technology", "B.Tech"],
        "description": "Building scalable web interfaces with React and Python REST services.",
        "company_description": "Fast growing tech startup specializing in modern web applications.",
        "external_url": "https://www.linkedin.com/jobs/search/?keywords=Full%20Stack%20Engineer",
        "source": "LinkedIn",
        "is_internship": False,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Full%20Stack%20Engineer",
            "naukri": "https://www.naukri.com/full-stack-engineer-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Full+Stack+Engineer"
        }
    },
    {
        "id": "job_02",
        "job_id": "job_02",
        "title": "Junior Data Scientist",
        "company": "DataInsights Analytics",
        "category": "IT",
        "career_id": "car_it_02",
        "location": "Hyderabad, IN",
        "work_mode": "Remote",
        "employment_type": "Full-time",
        "experience_level": "Entry Level",
        "salary_range": "₹9,50,000 - ₹16,00,000 / yr",
        "required_skills": ["Python", "SQL", "Machine Learning", "Statistics"],
        "preferred_skills": ["Pandas", "Power BI", "Scikit-Learn"],
        "education": ["Computer Science", "Data Science", "Statistics"],
        "description": "Analyzing complex datasets and building predictive machine learning models.",
        "company_description": "Leading enterprise data science and AI solutions consultancy.",
        "external_url": "https://www.linkedin.com/jobs/search/?keywords=Junior%20Data%20Scientist",
        "source": "LinkedIn",
        "is_internship": False,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Junior%20Data%20Scientist",
            "naukri": "https://www.naukri.com/data-scientist-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Data+Scientist"
        }
    },
    {
        "id": "job_03",
        "job_id": "job_03",
        "title": "Digital Marketing Specialist",
        "company": "Apex Global Media",
        "category": "Non-IT",
        "career_id": "car_nonit_01",
        "location": "Mumbai, IN",
        "work_mode": "Remote",
        "employment_type": "Full-time",
        "experience_level": "Junior",
        "salary_range": "₹6,00,000 - ₹10,50,000 / yr",
        "required_skills": ["SEO & SEM", "Content Strategy", "Marketing Analytics"],
        "preferred_skills": ["Social Media Marketing", "Copywriting", "Google Analytics"],
        "education": ["Marketing", "Communications", "Business Administration"],
        "description": "Managing online growth campaigns, SEO strategy, and social media reach.",
        "company_description": "Premier digital marketing agency helping enterprise brands scale online.",
        "external_url": "https://www.naukri.com/digital-marketing-specialist-jobs",
        "source": "Naukri",
        "is_internship": False,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Digital%20Marketing%20Specialist",
            "naukri": "https://www.naukri.com/digital-marketing-specialist-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Digital+Marketing"
        }
    },
    {
        "id": "job_04",
        "job_id": "job_04",
        "title": "Associate Product Manager",
        "company": "NextGen SaaS Labs",
        "category": "Non-IT",
        "career_id": "car_nonit_02",
        "location": "Gurugram, IN",
        "work_mode": "Hybrid",
        "employment_type": "Full-time",
        "experience_level": "Junior",
        "salary_range": "₹12,00,000 - ₹18,00,000 / yr",
        "required_skills": ["Product Strategy", "User Research", "Agile & Scrum"],
        "preferred_skills": ["Wireframing", "Data Analysis", "Roadmapping"],
        "education": ["Business Administration", "Computer Science", "BBA"],
        "description": "Collaborating with engineering and design to build intuitive SaaS product features.",
        "company_description": "B2B SaaS product company innovating enterprise productivity software.",
        "external_url": "https://www.indeed.com/jobs?q=Product+Manager",
        "source": "Indeed",
        "is_internship": False,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Associate%20Product%20Manager",
            "naukri": "https://www.naukri.com/product-manager-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Product+Manager"
        }
    },
    {
        "id": "job_05",
        "job_id": "job_05",
        "title": "AI & Data Science Intern",
        "company": "NeuralTech Labs",
        "category": "IT",
        "career_id": "car_it_02",
        "location": "Remote",
        "work_mode": "Remote",
        "employment_type": "Internship",
        "experience_level": "Entry Level",
        "stipend": "₹25,000 / month",
        "duration": "6 Months",
        "salary_range": "₹25,000 / month stipend",
        "required_skills": ["Python", "Machine Learning", "SQL"],
        "preferred_skills": ["Deep Learning", "TensorFlow", "Pandas"],
        "education": ["Computer Science", "Data Science", "B.Tech"],
        "description": "Hands-on internship building ML prototype models and data pipelines.",
        "company_description": "AI research lab focused on computer vision and generative models.",
        "external_url": "https://www.linkedin.com/jobs/search/?keywords=Data%20Science%20Intern",
        "source": "LinkedIn",
        "is_internship": True,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Data%20Science%20Intern",
            "naukri": "https://www.naukri.com/data-science-intern-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Data+Science+Intern"
        }
    },
    {
        "id": "job_06",
        "job_id": "job_06",
        "title": "Frontend Web Development Intern",
        "company": "PixelCraft Studios",
        "category": "IT",
        "career_id": "car_it_01",
        "location": "Bengaluru, IN",
        "work_mode": "On-site",
        "employment_type": "Internship",
        "experience_level": "Entry Level",
        "stipend": "₹20,000 / month",
        "duration": "3 Months",
        "salary_range": "₹20,000 / month stipend",
        "required_skills": ["JavaScript", "React", "Git"],
        "preferred_skills": ["CSS", "HTML5", "TypeScript"],
        "education": ["Computer Science", "Information Technology", "Web Development"],
        "description": "Assisting in building responsive user interfaces and component libraries.",
        "company_description": "Creative web studio delivering modern digital experience platforms.",
        "external_url": "https://www.naukri.com/frontend-developer-intern-jobs",
        "source": "Naukri",
        "is_internship": True,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Frontend%20Intern",
            "naukri": "https://www.naukri.com/frontend-developer-intern-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Frontend+Intern"
        }
    },
    {
        "id": "job_07",
        "job_id": "job_07",
        "title": "Cloud & DevOps Systems Intern",
        "company": "CloudScale Systems",
        "category": "IT",
        "career_id": "car_it_03",
        "location": "Pune, IN",
        "work_mode": "Hybrid",
        "employment_type": "Internship",
        "experience_level": "Entry Level",
        "stipend": "₹22,000 / month",
        "duration": "6 Months",
        "salary_range": "₹22,000 / month stipend",
        "required_skills": ["Linux", "Docker & Kubernetes", "CI/CD"],
        "preferred_skills": ["Python", "AWS", "Shell Scripting"],
        "education": ["Computer Science", "Information Technology"],
        "description": "Assisting senior cloud engineers in CI/CD pipeline automation and container deployments.",
        "company_description": "Cloud infrastructure management and Kubernetes automation platform.",
        "external_url": "https://www.indeed.com/jobs?q=Cloud+Intern",
        "source": "Indeed",
        "is_internship": True,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Cloud%20Intern",
            "naukri": "https://www.naukri.com/devops-intern-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Cloud+Intern"
        }
    },
    {
        "id": "job_08",
        "job_id": "job_08",
        "title": "Digital Marketing & Growth Intern",
        "company": "BrandPulse Media",
        "category": "Non-IT",
        "career_id": "car_nonit_01",
        "location": "Delhi, IN",
        "work_mode": "Remote",
        "employment_type": "Internship",
        "experience_level": "Entry Level",
        "stipend": "₹18,000 / month",
        "duration": "3 Months",
        "salary_range": "₹18,000 / month stipend",
        "required_skills": ["SEO & SEM", "Content Strategy", "Social Media Marketing"],
        "preferred_skills": ["Copywriting", "Canva", "Google Ads"],
        "education": ["Marketing", "Communications", "Business Administration"],
        "description": "Supporting content strategy creation and social media outreach analytics.",
        "company_description": "Growth agency helping consumer brands build viral online engagement.",
        "external_url": "https://www.linkedin.com/jobs/search/?keywords=Digital%20Marketing%20Intern",
        "source": "LinkedIn",
        "is_internship": True,
        "search_queries": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Digital%20Marketing%20Intern",
            "naukri": "https://www.naukri.com/digital-marketing-intern-jobs",
            "indeed": "https://www.indeed.com/jobs?q=Digital+Marketing+Intern"
        }
    }
]

