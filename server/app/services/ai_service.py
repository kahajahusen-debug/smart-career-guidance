import os
import json
import logging
import re
import urllib.request
import urllib.error
from typing import Dict, List, Any, Optional

from app.core.config import settings

logger = logging.getLogger("uvicorn")

# ------------------------------------------------------------------
# LLM PROVIDER INTEGRATIONS (Gemini & OpenAI)
# ------------------------------------------------------------------

def _call_gemini_api(prompt: str, api_key: str) -> tuple[Optional[str], Optional[str]]:
    """Call Google Gemini API via REST endpoint."""
    if not api_key:
        return None, "AI provider is not configured. Set GEMINI_API_KEY or AI_API_KEY in server/.env."

    models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.0-pro"]
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    last_error = None
    for model in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        if text:
                            return text, None
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='ignore')
            logger.error(
                f"[AI SERVICE ERROR]\n"
                f"Provider: gemini\n"
                f"Model: {model}\n"
                f"Error Type: HTTPError\n"
                f"Status Code: {e.code}\n"
                f"Reason: {e.reason}\n"
                f"Message: {error_body}"
            )
            if e.code in (401, 403):
                return None, f"Invalid or unauthorized Gemini API key (HTTP {e.code}). Please verify GEMINI_API_KEY in server/.env."
            if e.code == 429:
                return None, "Gemini API quota or rate limit exceeded. Please check your API quota or try again later."
            last_error = f"Gemini API returned HTTP {e.code}: {e.reason}"
            continue
        except urllib.error.URLError as e:
            logger.error(
                f"[AI SERVICE ERROR]\n"
                f"Provider: gemini\n"
                f"Model: {model}\n"
                f"Error Type: URLError\n"
                f"Message: {e.reason}"
            )
            last_error = f"Network connection error when contacting Gemini API: {e.reason}"
            continue
        except Exception as e:
            logger.error(
                f"[AI SERVICE ERROR]\n"
                f"Provider: gemini\n"
                f"Model: {model}\n"
                f"Error Type: {type(e).__name__}\n"
                f"Message: {str(e)}"
            )
            last_error = f"Unexpected Gemini error: {type(e).__name__} - {str(e)}"
            continue

    return None, last_error or "Gemini API failed to return a response."


def _call_openai_api(prompt: str, api_key: str) -> tuple[Optional[str], Optional[str]]:
    """Call OpenAI API via REST endpoint."""
    if not api_key:
        return None, "AI provider is not configured. Set OPENAI_API_KEY or AI_API_KEY in server/.env."

    models = ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"]
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    last_error = None
    for model in models:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful, accurate, general-purpose AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                choices = res_data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "").strip()
                    if content:
                        return content, None
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='ignore')
            logger.error(
                f"[AI SERVICE ERROR]\n"
                f"Provider: openai\n"
                f"Model: {model}\n"
                f"Error Type: HTTPError\n"
                f"Status Code: {e.code}\n"
                f"Reason: {e.reason}\n"
                f"Message: {error_body}"
            )
            if e.code in (401, 403):
                return None, f"Invalid or unauthorized OpenAI API key (HTTP {e.code}). Please verify OPENAI_API_KEY in server/.env."
            if e.code == 429:
                return None, "OpenAI API quota or rate limit exceeded. Please check your API billing/quota."
            last_error = f"OpenAI API returned HTTP {e.code}: {e.reason}"
            continue
        except urllib.error.URLError as e:
            logger.error(
                f"[AI SERVICE ERROR]\n"
                f"Provider: openai\n"
                f"Model: {model}\n"
                f"Error Type: URLError\n"
                f"Message: {e.reason}"
            )
            last_error = f"Network connection error when contacting OpenAI API: {e.reason}"
            continue
        except Exception as e:
            logger.error(
                f"[AI SERVICE ERROR]\n"
                f"Provider: openai\n"
                f"Model: {model}\n"
                f"Error Type: {type(e).__name__}\n"
                f"Message: {str(e)}"
            )
            last_error = f"Unexpected OpenAI error: {type(e).__name__} - {str(e)}"
            continue

    return None, last_error or "OpenAI API failed to return a response."


def generate_llm_response(prompt: str) -> tuple[Optional[str], str, Optional[str]]:
    """
    Determine configured AI provider and call completion API.
    Returns: (response_text, provider_name, error_message)
    """
    provider = (
        os.getenv("AI_PROVIDER") or 
        getattr(settings, "AI_PROVIDER", "gemini")
    ).lower().strip()

    api_key = (
        getattr(settings, "AI_API_KEY", "") or 
        getattr(settings, "GEMINI_API_KEY", "") or 
        getattr(settings, "OPENAI_API_KEY", "") or 
        os.getenv("AI_API_KEY", "") or 
        os.getenv("GEMINI_API_KEY", "") or 
        os.getenv("OPENAI_API_KEY", "")
    ).strip()

    if not api_key:
        error_msg = "AI provider is not configured. Set the required API key (GEMINI_API_KEY, OPENAI_API_KEY, or AI_API_KEY) in server/.env."
        logger.warning(f"[AI SERVICE CONFIGURATION WARNING] Provider: {provider} | {error_msg}")
        return None, provider, error_msg

    if provider == "openai" or api_key.startswith("sk-"):
        res, err = _call_openai_api(prompt, api_key)
        if res:
            return res, "openai", None
        res_g, err_g = _call_gemini_api(prompt, api_key)
        if res_g:
            return res_g, "gemini", None
        return None, "openai", err or err_g
    else:
        res, err = _call_gemini_api(prompt, api_key)
        if res:
            return res, "gemini", None
        res_o, err_o = _call_openai_api(prompt, api_key)
        if res_o:
            return res_o, "openai", None
        return None, "gemini", err or err_o


# ------------------------------------------------------------------
# RESPONSE VALIDATION & DYNAMIC QUESTION EXTRACTION
# ------------------------------------------------------------------

def validate_ai_response(user_message: str, response_text: str) -> str:
    """
    Verify that the AI response addresses the user's question directly.
    Strips out target career boilerplate if returned on general technical queries.
    """
    if not response_text:
        return response_text

    msg_low = user_message.lower().strip()

    is_career_query = any(k in msg_low for k in [
        "career", "skill", "learn first", "project", "roadmap", "interview", "resume",
        "portfolio", "readiness", "action plan", "what should i learn", "which project", "prepare for"
    ])

    if not is_career_query:
        boilerplate_patterns = [
            r"Your target career is [^\n]+",
            r"Regarding your preparation for [^\n]+",
            r"Based on your profile as [^\n]+"
        ]
        cleaned_text = response_text
        for pattern in boilerplate_patterns:
            cleaned_text = re.sub(pattern, "", cleaned_text, flags=re.IGNORECASE).strip()

        if cleaned_text != response_text and len(cleaned_text) > 20:
            response_text = cleaned_text

    return response_text


def extract_suggested_questions(response_text: str, user_message: str) -> tuple[str, List[str]]:
    """Extract suggested questions from LLM output block if present, or generate dynamic follow-up questions."""
    suggested_qs = []
    cleaned_text = response_text

    match = re.search(r"```suggested_questions\s*([\s\S]*?)\s*```", response_text, re.IGNORECASE)
    if not match:
        match = re.search(r"SUGGESTED_QUESTIONS:\s*(\[[\s\S]*?\])", response_text, re.IGNORECASE)

    if match:
        try:
            parsed = json.loads(match.group(1).strip())
            if isinstance(parsed, list) and len(parsed) > 0:
                suggested_qs = [str(q).strip() for q in parsed[:3]]
                cleaned_text = response_text[:match.start()].strip() + "\n" + response_text[match.end():].strip()
                cleaned_text = cleaned_text.strip()
        except Exception as e:
            logger.debug(f"Could not parse suggested questions JSON: {e}")

    if not suggested_qs:
        msg_low = user_message.lower()
        if "python" in msg_low or "def" in msg_low:
            suggested_qs = ["What are variables in Python?", "How do loops work in Python?", "Give me a simple Python program"]
        elif "html" in msg_low or "div" in msg_low:
            suggested_qs = ["What is the difference between div and span?", "How do I style a div with CSS?", "Give me an HTML example"]
        elif "react" in msg_low:
            suggested_qs = ["What is useState in React?", "Explain React components", "How do props work in React?"]
        elif "java" in msg_low:
            suggested_qs = ["What is OOP in Java?", "Explain Java inheritance", "Give me a simple Java example"]
        elif "sql" in msg_low or "join" in msg_low:
            suggested_qs = ["What is INNER JOIN vs LEFT JOIN?", "Explain SQL indexing", "Write a sample SQL query"]
        elif "digital marketing" in msg_low or "accounting" in msg_low or "finance" in msg_low:
            suggested_qs = ["What are key concepts to learn in this field?", "What tools are used?", "How can I start learning this?"]
        else:
            suggested_qs = ["Can you give me a simple example?", "Explain this concept in detail", "What should I learn next?"]

    return cleaned_text, suggested_qs


# ------------------------------------------------------------------
# PERSONALIZED SKILL SEQUENCING UTILITY
# ------------------------------------------------------------------

def calculate_personalized_skill_sequence(target_career: str, current_skills: List[str], skill_gaps: List[str]) -> List[str]:
    """Order skill gaps logically based on prerequisites, dependencies, and target career."""
    if not skill_gaps:
        return ["JavaScript", "React", "Python", "FastAPI", "SQL"]

    current_lower = [s.lower() for s in current_skills]
    unmastered = [sg for sg in skill_gaps if sg.lower() not in current_lower]
    if not unmastered:
        unmastered = list(skill_gaps)

    career_lower = target_career.lower()

    if any(k in career_lower for k in ["software", "full stack", "web", "frontend", "backend", "developer"]):
        priority_tiers = [
            ["html", "css", "javascript", "js", "programming"],
            ["git", "github"],
            ["react", "vue", "angular"],
            ["python", "fastapi", "node", "express", "django"],
            ["rest api", "rest apis", "api integration", "authentication", "jwt"],
            ["sql", "mongodb", "postgresql", "database design"],
            ["docker", "ci/cd", "aws", "system design"]
        ]
    elif any(k in career_lower for k in ["data", "machine learning", "ml", "ai", "analyst"]):
        priority_tiers = [
            ["python", "r", "statistics"],
            ["sql", "pandas", "numpy", "data visualization"],
            ["machine learning", "scikit-learn", "deep learning"],
            ["mlops", "data pipelines", "model deployment"]
        ]
    else:
        priority_tiers = [
            ["seo", "marketing fundamentals", "copywriting"],
            ["google analytics", "content strategy"],
            ["social media marketing", "paid ads"],
            ["campaign automation", "conversion optimization"]
        ]

    ordered = []
    remaining = list(unmastered)

    for tier in priority_tiers:
        for skill in list(remaining):
            s_lower = skill.lower()
            if any(t in s_lower or s_lower in t for t in tier):
                ordered.append(skill)
                remaining.remove(skill)

    ordered.extend(remaining)
    return ordered


# ------------------------------------------------------------------
# PHASE 9.5 GENERAL-PURPOSE LLM AI CAREER ASSISTANT PIPELINE
# ------------------------------------------------------------------

async def generate_career_assistant_response(
    user_message: str,
    user_context: Dict[str, Any],
    chat_history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    True General-Purpose Conversational AI Assistant.
    Pipeline:
      1. Format Candidate Profile Context & Conversation History
      2. Call Configured LLM Engine (Gemini / OpenAI)
      3. Validate & Sanitize Response
      4. Extract Dynamic Suggested Questions
      5. Return Structured Response
    """
    target_career = user_context.get("target_career", "Full Stack Software Engineer")
    education = user_context.get("education", "")
    current_skills = user_context.get("current_skills", [])
    skill_gaps = user_context.get("skill_gaps", [])
    readiness_score = user_context.get("portfolio_readiness", 0.0)
    recommended_projects = user_context.get("recommended_projects", [])

    ordered_skills = calculate_personalized_skill_sequence(target_career, current_skills, skill_gaps)

    top_project = recommended_projects[0] if recommended_projects else {
        "title": "Full-Stack SaaS Job Board with Search & Alerts",
        "description": "Comprehensive SaaS application featuring user authentication, job search filters, applicant tracking, and REST APIs.",
        "skills_covered": ["React", "Python", "FastAPI", "SQL"],
        "match_score": 98.0,
        "priority": "High Priority"
    }
    top_project_title = top_project.get("title") or top_project.get("name") or "Full-Stack SaaS Application"

    formatted_history = ""
    if chat_history:
        recent_msg = chat_history[-10:]
        history_lines = []
        for m in recent_msg:
            role = m.get("role", "user").capitalize()
            msg_text = m.get("message", "")
            history_lines.append(f"{role}: {msg_text}")
        formatted_history = "RECENT CONVERSATION HISTORY:\n" + "\n".join(history_lines) + "\n\n"

    prompt = f"""You are Antigravity, a world-class general-purpose Conversational AI Assistant and Technical/Career Coach.

BACKGROUND CANDIDATE PROFILE (Use ONLY when the user explicitly asks for career advice, personal learning roadmaps, portfolio project recommendations, or interview prep):
- Target Career: {target_career}
- Education: {education if education else 'Not specified'}
- Current Skills: {', '.join(current_skills) if current_skills else 'None'}
- Skill Gaps: {', '.join(skill_gaps) if skill_gaps else 'None'}
- Portfolio Readiness: {readiness_score:.1f}%
- Recommended Project: {top_project_title}

{formatted_history}USER QUESTION: {user_message}

CORE DIRECTIVES:
1. PRIMARY OBJECTIVE: Answer the user's EXACT question directly, accurately, and naturally. You understand ALL programming languages (Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, Dart, R, MATLAB, SQL, HTML, CSS, JavaScript, TypeScript, React, Angular, Vue, Node.js, FastAPI, Django, Flask, Spring Boot, .NET, etc.), Computer Science (DSA, DBMS, OS, Networks, Software Engineering, OOP, Cloud, AI, ML, Deep Learning, GenAI, Cybersecurity, Data Science), Non-IT (Digital Marketing, Finance, Accounting, HR, Business, Management, Healthcare), General Education (Math, Physics, Chemistry, English, Reasoning), and Career topics.
2. ANSWER THE CURRENT QUESTION FIRST: Do NOT inject candidate profile stats or skill gap summaries unless the user specifically requested personal career guidance or project/interview prep.
3. MULTILINGUAL RESPONSE: Respond fluently in the exact language/script used by the user (English, Telugu script, Hindi script, Teluglish, Hinglish, etc.).
4. CONVERSATION CONTEXT: Resolve references like "this", "that", "it", "explain the code", "give an example", "write the same code in Java" using the recent conversation history provided above.
5. FORMATTING: Use clean Markdown headers, bold highlights, lists, and language-specific code blocks (`python, `java, `html, `jsx, `sql, etc.).
6. DYNAMIC SUGGESTED QUESTIONS: At the very end of your response, output exactly 3 relevant follow-up questions in a JSON array formatted like:
```suggested_questions
["Question 1?", "Question 2?", "Question 3?"]
```
"""

    ai_text, provider_name, error_detail = generate_llm_response(prompt)

    if ai_text:
        validated_text = validate_ai_response(user_message, ai_text)
        cleaned_text, suggested_qs = extract_suggested_questions(validated_text, user_message)

        msg_low = user_message.lower()
        next_card = None
        if any(k in msg_low for k in ["start first", "first skill", "which skill", "learning sequence"]):
            first_skill = ordered_skills[0] if ordered_skills else "JavaScript"
            second_skill = ordered_skills[1] if len(ordered_skills) > 1 else "React"
            next_card = {
                "skill": first_skill,
                "focus": "Variables, data types, functions, async/await",
                "practice": f"Build a practical project using {first_skill}",
                "after": f"Advance to {second_skill}"
            }

        return {
            "message": cleaned_text,
            "source": provider_name,
            "intent": "general_llm_chat",
            "next_action_card": next_card,
            "recommended_skills": ordered_skills,
            "related_projects": [top_project],
            "suggested_questions": suggested_qs,
            "dynamic_suggested_questions": suggested_qs
        }

    # Internal Career Assistant Engine (Seamless, context-aware fallback without external API key dependency)
    return _generate_internal_career_assistant_response(
        user_message=user_message,
        user_context=user_context,
        chat_history=chat_history,
        ordered_skills=ordered_skills,
        top_project=top_project
    )


def _generate_internal_career_assistant_response(
    user_message: str,
    user_context: Dict[str, Any],
    chat_history: List[Dict[str, Any]],
    ordered_skills: List[str],
    top_project: Dict[str, Any]
) -> Dict[str, Any]:
    msg_low = user_message.lower().strip()
    target_career = user_context.get("target_career") or "Full Stack Software Engineer"
    education = user_context.get("education") or ""
    branch = user_context.get("branch") or ""
    current_skills = user_context.get("current_skills") or []
    skill_gaps = user_context.get("skill_gaps") or []
    readiness_score = user_context.get("portfolio_readiness", 0.0)
    top_project_title = top_project.get("title") or top_project.get("name") or "Full-Stack Project"

    # Multi-turn conversation context inspection
    last_user_msg = ""
    last_assistant_msg = ""
    if chat_history:
        for m in reversed(chat_history):
            role = m.get("role", "").lower()
            text = m.get("message", "")
            if role == "user" and not last_user_msg:
                last_user_msg = text.lower()
            elif role == "assistant" and not last_assistant_msg:
                last_assistant_msg = text.lower()

    # Multilingual script & language detection
    is_telugu_script = any('\u0C00' <= c <= '\u0C7F' for c in user_message)
    is_hindi_script = any('\u0900' <= c <= '\u097F' for c in user_message)
    is_teluglish = "lo " in msg_low or "enduku" in msg_low or "chestaru" in msg_low or "ante" in msg_low or "ivvandi" in msg_low
    is_hinglish = "kya" in msg_low and ("hai" in msg_low or "mein" in msg_low or "batao" in msg_low)

    next_card = None
    intent = "career_assistant"

    # ------------------------------------------------------------------
    # 1. MULTILINGUAL RESPONSES
    # ------------------------------------------------------------------
    if is_telugu_script:
        reply = (
            "### తెలుగులో కెరీర్ మార్గదర్శకత్వం\n\n"
            f"మీ ప్రశ్న: **{user_message}**\n\n"
            f"మీ లక్ష్యం **{target_career}** గా ఉంది.\n"
            "ఫంక్షన్ (Function) అనేది ఒక నిర్దిష్ట పనిని చేయడానికి ఉపయోగపడే పునర్వినియోగ (reusable) కోడ్ బ్లాక్.\n\n"
            "```python\n"
            "def greet(name):\n"
            "    return f\"నమస్కారం, {name}!\"\n"
            "```\n\n"
            "మరిన్ని వివరాల కోసం క్రింది సూచనలను పరిశీలించండి."
        )
        suggested_qs = ["Python lo def keyword enduku use chestaru?", "కెరీర్ రోడ్‌మ్యాప్ ఇవ్వండి", "What should I learn first?"]

    elif is_hindi_script or is_hinglish:
        reply = (
            "### हिंदी / हिंग्लिश में उत्तर\n\n"
            f"आपका सवाल: **{user_message}**\n\n"
            f"आपके लक्षित करियर **{target_career}** के लिए:\n"
            "फ़ंक्शन (Function) कोड का एक ब्लॉक होता है जिसे बार-बार इस्तेमाल किया जा सकता है।\n\n"
            "```python\n"
            "def greet(name):\n"
            "    return f\"नमस्ते, {name}!\"\n"
            "```"
        )
        suggested_qs = ["Python mein def kya hai?", "Career roadmap दीजिये", "What should I learn first?"]

    elif is_teluglish:
        reply = (
            "### Teluglish Explanation\n\n"
            f"Mee question: **{user_message}**\n\n"
            f"Mee target career **{target_career}** ki Python lo `def` keyword ni **functions create చేయడానికి** ఉపయోగిస్తారు.\n\n"
            "```python\n"
            "def add_numbers(a, b):\n"
            "    return a + b\n"
            "```"
        )
        suggested_qs = ["What is def in Python?", "What should I learn first?", "Which project should I build?"]

    # ------------------------------------------------------------------
    # 2. GREETINGS & COURTESY
    # ------------------------------------------------------------------
    elif msg_low in ["hi", "hello", "hey", "good morning", "good evening", "hi!", "hello!", "hey!"] or msg_low.startswith(("hi ", "hello ", "hey ")):
        reply = (
            f"Hello! 👋 I am your Smart Career Guidance AI Assistant.\n\n"
            f"I can help you with personalized learning roadmaps, skill priority, portfolio project ideas, technical concept explanations, and interview preparation tailored to your target career: **{target_career}**.\n\n"
            "What would you like to explore today?"
        )
        suggested_qs = ["What should I learn first?", "Which project should I build?", "Give me a roadmap"]

    elif any(w in msg_low for w in ["thank you", "thanks", "thank u", "ty"]):
        reply = (
            "You're very welcome! Keep building your skills and progressing through your action plan. "
            "Feel free to ask whenever you need more career guidance, project suggestions, or interview prep!"
        )
        suggested_qs = ["What should I learn next?", "Which project should I build?", "How should I prepare for an interview?"]

    # ------------------------------------------------------------------
    # 3. SPECIFIC TECHNICAL DEFINITIONS & EXPLANATIONS (LANGUAGE FIDELITY)
    # ------------------------------------------------------------------
    elif "div tag" in msg_low or msg_low == "what is div" or msg_low == "what is a div tag?" or msg_low == "what is div tag":
        reply = (
            "### What is a `<div>` tag in HTML?\n\n"
            "The **`<div>`** tag (short for division) is a generic block-level container element in HTML. It is used to group related HTML elements together for styling (using CSS) or structural layout placement.\n\n"
            "```html\n"
            "<div class=\"card-container\">\n"
            "  <h2>Project Title</h2>\n"
            "  <p>This paragraph is grouped inside the container div.</p>\n"
            "</div>\n"
            "```"
        )
        suggested_qs = ["What is HTML?", "What is CSS?", "Give me a simple example."]

    elif "def in python" in msg_low or (msg_low.startswith("what is def") and "python" in msg_low) or msg_low == "what is def":
        reply = (
            "### What is `def` in Python?\n\n"
            "In Python, **`def`** is the keyword used to **define a function**. A function is a block of reusable code that runs when called.\n\n"
            "```python\n"
            "def calculate_sum(a, b):\n"
            "    return a + b\n\n"
            "# Calling the function\n"
            "result = calculate_sum(10, 20)\n"
            "print(result)  # Output: 30\n"
            "```"
        )
        suggested_qs = ["Write factorial in Python.", "What are variables?", "What is Python?"]

    elif "function in java" in msg_low or ("function" in msg_low and "java" in msg_low):
        reply = (
            "### What is a Function (Method) in Java?\n\n"
            "In Java, functions are defined as **methods** inside classes. Java methods specify access modifiers (`public`/`private`), return types, and parameters.\n\n"
            "```java\n"
            "public class Calculator {\n"
            "    public static int add(int a, int b) {\n"
            "        return a + b;\n"
            "    }\n\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(add(5, 10)); // Output: 15\n"
            "    }\n"
            "}\n"
            "```"
        )
        suggested_qs = ["Write factorial in Java.", "What is Java?", "What is OOP in Java?"]

    elif "pointer in c" in msg_low or ("pointer" in msg_low and "c" in msg_low):
        reply = (
            "### What is a Pointer in C?\n\n"
            "A **pointer** in C is a variable that stores the **memory address** of another variable. Pointers enable direct memory manipulation and dynamic allocation.\n\n"
            "```c\n"
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    int num = 42;\n"
            "    int *ptr = &num;\n"
            "    printf(\"Value: %d, Address: %p\\n\", *ptr, (void*)ptr);\n"
            "    return 0;\n"
            "}\n"
            "```"
        )
        suggested_qs = ["What is C?", "What is C++?", "Give me a simple example."]

    elif "factorial in python" in msg_low or ("factorial" in msg_low and "python" in msg_low):
        reply = (
            "### Python Factorial Program\n\n"
            "Here is a Python function calculating factorial using recursion:\n\n"
            "```python\n"
            "def factorial(n):\n"
            "    if n <= 1:\n"
            "        return 1\n"
            "    return n * factorial(n - 1)\n\n"
            "print(factorial(5))  # Output: 120\n"
            "```"
        )
        suggested_qs = ["Explain the code.", "Write factorial in Java.", "What is def in Python?"]

    elif "factorial in java" in msg_low or ("factorial" in msg_low and "java" in msg_low):
        reply = (
            "### Java Factorial Program\n\n"
            "Here is a complete Java class calculating factorial:\n\n"
            "```java\n"
            "public class Factorial {\n"
            "    public static int factorial(int n) {\n"
            "        if (n <= 1) return 1;\n"
            "        return n * factorial(n - 1);\n"
            "    }\n\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(factorial(5));\n"
            "    }\n"
            "}\n"
            "```"
        )
        suggested_qs = ["Explain previously generated code.", "What is a function in Java?", "Write factorial in Python."]

    elif "sql join" in msg_low or "explain sql join" in msg_low or ("join" in msg_low and "sql" in msg_low):
        reply = (
            "### What are SQL Joins?\n\n"
            "An **SQL Join** is used to combine rows from two or more tables based on a related column between them.\n\n"
            "• **INNER JOIN**: Returns records with matching values in both tables.\n"
            "• **LEFT JOIN**: Returns all records from the left table and matched records from the right table.\n\n"
            "```sql\n"
            "SELECT users.name, orders.amount\n"
            "FROM users\n"
            "INNER JOIN orders ON users.user_id = orders.user_id;\n"
            "```"
        )
        suggested_qs = ["What is SQL?", "What is DBMS?", "Give me a simple example."]

    elif msg_low in ["what is python?", "what is python", "python"]:
        reply = (
            "### What is Python?\n\n"
            "**Python** is a high-level, interpreted, general-purpose programming language known for clean, English-like syntax. "
            "It is widely used in Web Development (FastAPI, Django), Data Science, Machine Learning, Automation, and Scripting."
        )
        suggested_qs = ["What is def in Python?", "Write factorial in Python.", "Can a non-IT student learn Python?"]

    elif msg_low in ["what is java?", "what is java", "java"]:
        reply = (
            "### What is Java?\n\n"
            "**Java** is a high-level, class-based, object-oriented programming language designed for platform independence ('Write Once, Run Anywhere' via the JVM). "
            "It is heavily used in Enterprise Backend Applications, Android Development, and Large-Scale Systems."
        )
        suggested_qs = ["What is a function in Java?", "Write factorial in Java.", "What is C++?"]

    elif msg_low in ["what is javascript?", "what is javascript", "javascript"]:
        reply = (
            "### What is JavaScript?\n\n"
            "**JavaScript** (JS) is a high-level dynamic programming language that powers interactive user interfaces on web browsers "
            "and server-side applications via Node.js."
        )
        suggested_qs = ["Why should I learn React?", "What is HTML?", "What is CSS?"]

    elif msg_low in ["what is react?", "what is react", "react"] or "why should i learn react" in msg_low:
        reply = (
            "### What is React & Why Learn It?\n\n"
            "**React** is an open-source JavaScript UI library created by Meta. It uses a **component-based architecture** and a **Virtual DOM** to build fast, interactive single-page web applications.\n\n"
            "**Why Learn React?**\n"
            "1. **High Job Demand**: Essential skill for Modern Frontend & Full Stack Developers.\n"
            "2. **Reusability**: Build UI components once and reuse them across your app.\n"
            "3. **Ecosystem**: Huge community support, rich libraries, and easy integration with REST APIs."
        )
        suggested_qs = ["What is JavaScript?", "Which project should I build?", "What should I learn first?"]

    elif msg_low in ["what is html?", "what is html", "html"]:
        reply = (
            "### What is HTML?\n\n"
            "**HTML** (HyperText Markup Language) is the standard markup language used to structure web pages on the Internet using elements like headings, paragraphs, divs, links, and forms."
        )
        suggested_qs = ["What is a div tag?", "What is CSS?", "What is JavaScript?"]

    elif msg_low in ["what is css?", "what is css", "css"]:
        reply = (
            "### What is CSS?\n\n"
            "**CSS** (Cascading Style Sheets) is the stylesheet language used to specify presentation, styling, colors, typography, flexbox/grid layouts, and responsive design for HTML elements."
        )
        suggested_qs = ["What is HTML?", "What is a div tag?", "What is React?"]

    elif msg_low in ["what is git?", "what is git", "git"]:
        reply = (
            "### What is Git?\n\n"
            "**Git** is a distributed version control system used to track changes in source code during software development, enable collaboration, manage branches, and push code repositories to GitHub."
        )
        suggested_qs = ["What should I learn first?", "Which project should I build?", "How should I prepare for an interview?"]

    elif msg_low in ["what is sql?", "what is sql", "sql"]:
        reply = (
            "### What is SQL?\n\n"
            "**SQL** (Structured Query Language) is the standard language for querying, managing, and manipulating data stored in relational databases (PostgreSQL, MySQL, SQLite)."
        )
        suggested_qs = ["Explain SQL joins.", "What is Python?", "Which skill should I learn first?"]

    elif msg_low in ["what is c?", "what is c", "c"]:
        reply = (
            "### What is C?\n\n"
            "**C** is a foundational procedural programming language developed in 1972. It offers low-level memory control and is used for OS kernels, embedded systems, and compilers."
        )
        suggested_qs = ["What is a pointer in C?", "What is C++?", "What is Java?"]

    elif msg_low in ["what is c++?", "what is c++", "c++"]:
        reply = (
            "### What is C++?\n\n"
            "**C++** is a high-performance extension of C that adds Object-Oriented Programming (OOP), templates (STL), and modern memory management."
        )
        suggested_qs = ["What is a pointer in C?", "What is Java?", "What is Python?"]

    # ------------------------------------------------------------------
    # 4. MULTI-TURN CONTEXT RESOLUTION & PRONOUN RESOLUTION
    # ------------------------------------------------------------------
    elif any(phrase in msg_low for phrase in ["explain previously", "explain the code", "explain this code", "explain that example", "explain the second line", "explain that code"]):
        if "factorial" in last_assistant_msg or "return n *" in last_assistant_msg or "class factorial" in last_assistant_msg:
            reply = (
                "### Detailed Breakdown of the Factorial Code\n\n"
                "1. **Function Signature**: Takes an integer parameter `n`.\n"
                "2. **Base Case (`if n <= 1`)**: Stops recursion when `n` reaches 1 or 0, returning `1` to prevent infinite loops.\n"
                "3. **Recursive Execution (`n * factorial(n - 1)`)**: Multiplies current number `n` by the factorial of `n - 1`.\n"
                "4. **Output Result**: Computes `5 * 4 * 3 * 2 * 1 = 120`."
            )
        else:
            reply = (
                "### Code Explanation Breakdown\n\n"
                "1. **Declaration & Input**: Defines variables, parameters, or HTML container elements.\n"
                "2. **Execution Logic**: Performs the operation, condition check, or layout grouping.\n"
                "3. **Return Output**: Passes the computed result or rendered UI back to the application."
            )
        suggested_qs = ["Give another example.", "What should I learn first?", "Which project should I build?"]

    elif msg_low in ["is it difficult?", "is it hard?", "is python difficult?", "is programming hard?"] or (msg_low.startswith("is it") and len(msg_low.split()) <= 4):
        topic = "Python" if "python" in last_assistant_msg or "python" in last_user_msg else ("JavaScript" if "javascript" in last_assistant_msg else "Programming")
        reply = (
            f"### Is {topic} Difficult to Learn?\n\n"
            f"**No!** {topic} is considered very approachable, especially for beginners. "
            f"It uses clean syntax that mirrors natural English logic. With regular hands-on coding practice for 30–45 minutes a day, most students master core concepts within a few weeks."
        )
        suggested_qs = ["Give me a simple example.", "What should I learn first?", "Give me a 30-day roadmap."]

    elif msg_low in ["give me a simple example", "give me a simple example.", "give an example", "give me an example."]:
        if "python" in last_assistant_msg or "def" in last_user_msg:
            reply = (
                "### Simple Python Code Example\n\n"
                "```python\n"
                "# Function to greet a student\n"
                "def welcome_student(name, career_target):\n"
                "    return f\"Hello {name}, welcome to your {career_target} learning path!\"\n\n"
                "message = welcome_student(\"Alex\", \"Full Stack Developer\")\n"
                "print(message)\n"
                "```"
            )
        elif "java" in last_assistant_msg:
            reply = (
                "### Simple Java Code Example\n\n"
                "```java\n"
                "public class Welcome {\n"
                "    public static void main(String[] args) {\n"
                "        String name = \"Alex\";\n"
                "        System.out.println(\"Hello \" + name + \", welcome to Java programming!\");\n"
                "    }\n"
                "}\n"
                "```"
            )
        elif "html" in last_assistant_msg or "div" in last_assistant_msg:
            reply = (
                "### Simple HTML Code Example\n\n"
                "```html\n"
                "<div class=\"user-profile\">\n"
                "  <h2>Welcome Student</h2>\n"
                "  <p>Track your target career progress here.</p>\n"
                "</div>\n"
                "```"
            )
        else:
            reply = (
                "### Simple Code Example\n\n"
                "```javascript\n"
                "const student = { name: 'Alex', targetCareer: 'Full Stack Software Engineer' };\n"
                "console.log(`Welcome ${student.name}! Target: ${student.targetCareer}`);\n"
                "```"
            )
        suggested_qs = ["Explain that example.", "What should I learn after it?", "Which project should I build?"]

    elif any(phrase in msg_low for phrase in ["what should i learn after it", "what to learn after", "what after javascript", "what after python"]):
        first_sk = ordered_skills[0] if ordered_skills else "JavaScript"
        second_sk = ordered_skills[1] if len(ordered_skills) > 1 else "React"
        third_sk = ordered_skills[2] if len(ordered_skills) > 2 else "FastAPI"
        reply = (
            f"### Next Skill Recommendation\n\n"
            f"After building confidence in **{first_sk}**, your next priority skill for **{target_career}** is **{second_sk}**, followed by **{third_sk}**.\n\n"
            f"**Why {second_sk}?**\n"
            f"It builds directly on top of {first_sk} to enable real-world application development and web component building."
        )
        suggested_qs = ["Which project should I build?", "Give me a 30-day roadmap", "How should I prepare for an interview?"]

    elif any(k in msg_low for k in ["how can i test it", "test it", "how to test"]):
        reply = (
            "### How to Test the Code\n\n"
            "1. Save your code into a local file with the proper extension (`.py`, `.java`, `.html`, `.js`, etc.).\n"
            "2. Execute the file using your terminal interpreter or browser console.\n"
            "3. Verify output messages or console logs to confirm expected logic."
        )
        suggested_qs = ["Give another example.", "What should I learn first?", "Which project should I build?"]

    # ------------------------------------------------------------------
    # 5. SKILL PRIORITY & LEARNING SEQUENCE
    # ------------------------------------------------------------------
    elif any(k in msg_low for k in ["start first", "learn first", "first skill", "where to begin", "what should i learn", "what skill should i improve", "what to learn", "learn next"]):
        first_skill = ordered_skills[0] if ordered_skills else "JavaScript"
        second_skill = ordered_skills[1] if len(ordered_skills) > 1 else "React"
        seq_md = "\n".join([f"{i+1}. **{sk}**" for i, sk in enumerate(ordered_skills)])

        reply = (
            f"### Recommended Skill Priority for **{target_career}**\n\n"
            f"Based on your profile, current skills, and target career, here is your prioritized skill sequence:\n\n"
            f"{seq_md}\n\n"
            f"--- \n\n"
            f"### START WITH: **{first_skill}**\n\n"
            f"• **Why it matters**: {first_skill} is a core foundation required for your target role as {target_career}.\n"
            f"• **Core Topics to Master**:\n"
            f"  1. Syntax & Data Types\n"
            f"  2. Functions & Scope\n"
            f"  3. Control Flow & Loops\n"
            f"  4. Data Structures (Arrays & Objects)\n"
            f"  5. Asynchronous Logic / API Integration\n\n"
            f"• **Practical Task**: Build a small project using **{first_skill}** before moving to **{second_skill}**."
        )
        next_card = {
            "skill": first_skill,
            "focus": "Variables, functions, data structures, async logic",
            "practice": f"Build a practical project using {first_skill}",
            "after": f"Advance to {second_skill}"
        }
        suggested_qs = ["Which project should I build?", "Give me a 30-day roadmap", "How should I prepare for an interview?"]

    # ------------------------------------------------------------------
    # 6. SKILL REQUIREMENTS BY CAREER ROLE
    # ------------------------------------------------------------------
    elif any(k in msg_low for k in ["skills are required for", "skills required for", "what skills do i need for"]):
        if "data scientist" in msg_low or "data science" in msg_low:
            role = "Data Scientist"
            req_skills = ["Python", "Statistics", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Data Visualization", "Machine Learning"]
        elif "cloud" in msg_low or "devops" in msg_low:
            role = "Cloud / DevOps Engineer"
            req_skills = ["Linux", "Git", "Networking Fundamentals", "Docker", "Kubernetes", "AWS / Azure", "CI/CD Pipelines", "Terraform"]
        elif "cybersecurity" in msg_low or "security" in msg_low:
            role = "Cybersecurity Analyst"
            req_skills = ["Computer Networks", "Linux Security", "Ethical Hacking", "Cryptography", "SIEM Tools", "Web Security", "Python Scripting"]
        else:
            role = "Full Stack Developer"
            req_skills = ["HTML/CSS", "JavaScript / TypeScript", "React", "FastAPI / Node.js", "SQL Databases", "REST APIs", "Git Version Control"]

        skills_md = "\n".join([f"• **{sk}**" for sk in req_skills])
        reply = (
            f"### Core Required Skills for **{role}**\n\n"
            f"To become a job-ready **{role}**, master these essential technical skills:\n\n"
            f"{skills_md}\n\n"
            f"Would you like to focus on any of these skills in your personal action plan?"
        )
        suggested_qs = ["What should I learn first?", "Which project should I build?", "Give me a roadmap."]

    # ------------------------------------------------------------------
    # 7. ROADMAP GENERATION
    # ------------------------------------------------------------------
    elif any(k in msg_low for k in ["roadmap", "30-day", "30 day", "learning plan", "what should i learn this week"]):
        first_skill = ordered_skills[0] if ordered_skills else "JavaScript"
        second_skill = ordered_skills[1] if len(ordered_skills) > 1 else "React"
        third_skill = ordered_skills[2] if len(ordered_skills) > 2 else "FastAPI"

        reply = (
            f"# Structured 30-Day Roadmap for **{target_career}**\n\n"
            f"### Stage 1 — Fundamentals (Week 1)\n"
            f"• Master core language syntax: **{first_skill}**.\n"
            f"• Practice variables, data structures, functions, and control flow.\n\n"
            f"### Stage 2 — Frontend & Frameworks (Week 2)\n"
            f"• Build responsive component UIs with **{second_skill}**.\n"
            f"• Connect state management with REST API endpoints.\n\n"
            f"### Stage 3 — Backend & Database (Week 3)\n"
            f"• Build robust APIs using **{third_skill}** and SQL databases.\n"
            f"• Implement JWT user authentication and secure endpoints.\n\n"
            f"### Stage 4 — Portfolio Project & Interview Preparation (Week 4)\n"
            f"• Complete **{top_project_title}** and publish code on GitHub.\n"
            f"• Practice mock interview sessions and STAR methodology response prep."
        )
        next_card = {
            "skill": first_skill,
            "focus": f"Week 1 — {first_skill} Foundations",
            "practice": "Build a mini practice application",
            "after": f"Week 2 — {second_skill}"
        }
        suggested_qs = ["What should I learn first?", "Which project should I build?", "How should I prepare for an interview?"]

    # ------------------------------------------------------------------
    # 8. PORTFOLIO PROJECT RECOMMENDATIONS
    # ------------------------------------------------------------------
    elif any(k in msg_low for k in ["which project", "what project", "build next", "recommend a project", "suggest a project", "beginner project", "resume project", "project for me", "project should i build"]):
        p_match = top_project.get("match_score", 98.0)
        p_skills = ", ".join(top_project.get("skills_covered", [ordered_skills[0] if ordered_skills else "React"]))
        p_desc = top_project.get("description", "Build a high-impact application with user authentication and database persistence.")

        reply = (
            f"### Recommended Portfolio Project for **{target_career}**\n\n"
            f"We recommend building **{top_project_title}**.\n\n"
            f"• **Priority**: {top_project.get('priority', 'High Priority')}\n"
            f"• **Target Match Score**: **{p_match:.1f}%**\n"
            f"• **Skills Covered**: **{p_skills}**\n"
            f"• **Overview**: {p_desc}\n\n"
            f"**Resume Impact**: Demonstrates full-stack feature delivery, API integration, and clean code architecture to hiring managers."
        )
        next_card = {
            "skill": "Portfolio Project",
            "focus": f"Build {top_project_title}",
            "practice": "Implement authentication, REST APIs, and responsive design",
            "after": "Publish repository to GitHub"
        }
        suggested_qs = ["What should I learn first?", "How should I prepare for an interview?", "Give me a 30-day roadmap."]

    # ------------------------------------------------------------------
    # 9. INTERVIEW PREPARATION GUIDANCE
    # ------------------------------------------------------------------
    elif any(k in msg_low for k in ["interview", "prepare for an interview", "mock interview", "questions for", "interview skills"]):
        reply = (
            f"### Interview Preparation Strategy for **{target_career}**\n\n"
            f"1. **Core Technical Mastery**: Review fundamental concepts in **{ordered_skills[0] if ordered_skills else 'JavaScript'}** and **{ordered_skills[1] if len(ordered_skills) > 1 else 'React'}**.\n"
            f"2. **Portfolio Walkthrough**: Be ready to present **{top_project_title}** using the **STAR framework** (Situation, Task, Action, Result).\n"
            f"3. **Mock Interview Module**: Use our platform's automated Interview Preparation tool to answer practice questions and get AI score feedback."
        )
        suggested_qs = ["What should I learn first?", "Which project should I build?", "Give me a 30-day roadmap."]

    # ------------------------------------------------------------------
    # 10. NON-IT & CAREER TRANSITION GUIDANCE
    # ------------------------------------------------------------------
    elif "non-it" in msg_low or "non-cs" in msg_low or "non cs" in msg_low or "switch to it" in msg_low or "can a non-it student learn" in msg_low:
        reply = (
            "### Transitioning from Non-IT to Programming & Technology\n\n"
            "**Yes, absolutely!** Students and professionals from commerce, arts, mechanical engineering, finance, and marketing transition into tech roles every day.\n\n"
            "**Why it is achievable:**\n"
            "1. **Beginner-Friendly Languages**: Languages like Python and JavaScript use plain English logic.\n"
            "2. **Domain Advantage**: Your background (such as business, finance, or domain expertise) makes you valuable for tech roles in those industries.\n"
            "3. **Practical Portfolio**: Hiring managers focus on project code and problem solving rather than degree title."
        )
        suggested_qs = ["What should I learn first?", "What is Python?", "Which project should I build?"]

    elif "digital marketing" in msg_low:
        reply = (
            "### Digital Marketing Career Overview\n\n"
            "**Digital Marketing** leverages online channels (SEO, Content Strategy, Social Media Ads, Google Analytics, Email Automation) to market products and drive business growth."
        )
        suggested_qs = ["Can a non-IT student learn Python?", "What is accounting?", "What should I learn first?"]

    elif "accounting" in msg_low or "financial analysis" in msg_low:
        reply = (
            "### Accounting & Financial Analysis Overview\n\n"
            "**Accounting & Financial Analysis** involves auditing financial statements, budgeting, financial modeling, and analyzing business performance using tools like Excel, SQL, and Tally."
        )
        suggested_qs = ["What is digital marketing?", "Can a non-IT student learn Python?", "What should I learn first?"]

    elif any(k in msg_low for k in ["what career should i choose", "which career is suitable", "what career suits me"]):
        reply = (
            f"### Personal Career Assessment for Your Profile\n\n"
            f"Based on your education (**{education if education else 'Degree'}**), branch (**{branch if branch else 'General'}**), and interests, "
            f"your top recommended career path is **{target_career}**.\n\n"
            f"Your current portfolio readiness is **{readiness_score:.1f}%**. "
            f"By mastering **{ordered_skills[0] if ordered_skills else 'core skills'}** and completing **{top_project_title}**, you will significantly boost your job readiness."
        )
        suggested_qs = ["What should I learn first?", "Which project should I build?", "Give me a 30-day roadmap."]

    # ------------------------------------------------------------------
    # 11. GENERAL FALLBACK
    # ------------------------------------------------------------------
    else:
        topic_clean = user_message.strip().rstrip('?')
        reply = (
            f"### Career & Technical Insight for: **{topic_clean.capitalize()}**\n\n"
            f"Regarding **{user_message}**:\n\n"
            f"This concept plays an important role in technology and career development for **{target_career}**. "
            f"Focusing on core principles, practical hands-on examples, and building portfolio projects is the best way to master it.\n\n"
            f"Feel free to ask for specific code examples, roadmap steps, or interview prep advice!"
        )
        suggested_qs = ["Can you give me a simple example?", "What should I learn first?", "Which project should I build?"]

    return {
        "message": reply,
        "source": "internal_career_assistant",
        "intent": intent,
        "next_action_card": next_card,
        "recommended_skills": ordered_skills,
        "related_projects": [top_project],
        "suggested_questions": suggested_qs,
        "dynamic_suggested_questions": suggested_qs
    }


# ------------------------------------------------------------------
# DYNAMIC INTERVIEW QUESTION GENERATION (PRESERVED)
# ------------------------------------------------------------------
async def generate_interview_questions(
    target_career: str,
    interview_type: str,
    difficulty: str,
    count: int,
    user_context: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generate dynamic interview questions customized to target career, type, difficulty, and skill gaps."""
    skill_gaps = user_context.get("skill_gaps", [])
    current_skills = user_context.get("current_skills", [])

    prompt = f"""Generate {count} interview questions for a candidate preparing for:
Target Career: {target_career}
Interview Type: {interview_type} (Technical, HR, Behavioral, or Mixed)
Difficulty Level: {difficulty} (Beginner, Intermediate, or Advanced)
Candidate Skill Gaps: {', '.join(skill_gaps)}

Return ONLY a JSON array of objects with keys: "question", "type" (technical, hr, behavioral).
"""
    ai_text, _, _ = generate_llm_response(prompt)
    if ai_text:
        try:
            start_idx = ai_text.find("[")
            end_idx = ai_text.rfind("]")
            if start_idx != -1 and end_idx != -1:
                parsed = json.loads(ai_text[start_idx:end_idx+1])
                if isinstance(parsed, list) and len(parsed) > 0:
                    questions = []
                    for i, q in enumerate(parsed[:count]):
                        questions.append({
                            "question_id": f"q_{i+1}",
                            "question": q.get("question", f"Sample question {i+1}"),
                            "type": q.get("type", interview_type.lower()),
                            "answer": None,
                            "score": None,
                            "feedback": None,
                            "strengths": [],
                            "improvements": [],
                            "model_answer": None
                        })
                    return questions
        except Exception as e:
            logger.warning(f"Failed to parse LLM interview question JSON: {e}")

    questions: List[Dict[str, Any]] = []

    tech_bank = [
        ("Explain the core architectural components of a scalable modern application in the context of {career}.", "technical"),
        ("How do you manage data persistence and state management in {career} projects?", "technical"),
        ("What are the best practices for writing secure and optimized APIs or services for {career}?", "technical"),
        ("Describe how you debug performance bottlenecks or unexpected exceptions when working with {skill_or_gap}.", "technical"),
        ("How do you approach database schema design and querying efficiency for {career}?", "technical"),
        ("Explain authentication mechanisms (such as JWT or OAuth2) commonly implemented in {career}.", "technical"),
        ("What are the trade-offs between monolithic vs microservices architecture for a {career} solution?", "technical")
    ]

    hr_bank = [
        ("Why are you interested in pursuing a career as a {career}?", "hr"),
        ("Where do you see yourself professionally in 3 to 5 years in the field of {career}?", "hr"),
        ("What are your primary technical strengths, and what area are you actively working to improve?", "hr"),
        ("Why should our organization hire you for this {career} role over other qualified candidates?", "hr"),
        ("How do you stay up to date with rapid technological changes in {career}?", "hr")
    ]

    behavioral_bank = [
        ("Describe a challenging technical problem you encountered in a recent project and how you solved it.", "behavioral"),
        ("Tell me about a time when you had to learn a new tool or technology ({skill_or_gap}) under a tight deadline.", "behavioral"),
        ("Give an example of how you handled disagreement or conflicting requirements during team collaboration.", "behavioral"),
        ("Describe a situation where a project requirement changed late in development. How did you adapt?", "behavioral"),
        ("Walk me through a project from your portfolio: what was your role, and what impact did your work achieve?", "behavioral")
    ]

    pool = []
    itype_lower = interview_type.lower()
    if itype_lower == "technical":
        pool = tech_bank * 3
    elif itype_lower == "hr":
        pool = hr_bank * 3
    elif itype_lower == "behavioral":
        pool = behavioral_bank * 3
    else:
        pool = (tech_bank + hr_bank + behavioral_bank) * 2

    chosen_skill_or_gap = skill_gaps[0] if skill_gaps else (current_skills[0] if current_skills else "core tools")

    for i in range(count):
        raw_template, q_type = pool[i % len(pool)]
        formatted_q = raw_template.format(career=target_career, skill_or_gap=chosen_skill_or_gap)

        if difficulty.lower() == "advanced" and q_type == "technical":
            formatted_q = f"[Advanced System Design] {formatted_q}"
        elif difficulty.lower() == "beginner" and q_type == "technical":
            formatted_q = f"[Fundamentals] {formatted_q}"

        questions.append({
            "question_id": f"q_{i+1}",
            "question": formatted_q,
            "type": q_type,
            "answer": None,
            "score": None,
            "feedback": None,
            "strengths": [],
            "improvements": [],
            "model_answer": None
        })

    return questions


# ------------------------------------------------------------------
# INTERVIEW ANSWER EVALUATION (PRESERVED)
# ------------------------------------------------------------------
async def evaluate_interview_answer(
    question: str,
    user_answer: str,
    target_career: str,
    difficulty: str
) -> Dict[str, Any]:
    """Evaluate candidate interview answer and return score (0-100), feedback, strengths, improvements, and model answer."""
    if not user_answer or not user_answer.strip():
        return {
            "score": 0,
            "feedback": "No answer was submitted.",
            "strengths": [],
            "improvements": ["Provide a detailed response covering key concepts and examples."],
            "model_answer": "A complete answer should address the core question directly using practical examples."
        }

    prompt = f"""Target Role: {target_career} (Difficulty: {difficulty})
Question: {question}
Candidate Answer: {user_answer}

Evaluate the candidate's answer. Return ONLY a JSON object with:
- "score": integer between 0 and 100
- "feedback": constructive summary string
- "strengths": list of string bullets (1-3 items)
- "improvements": list of string bullets (1-3 items)
- "model_answer": comprehensive ideal answer string
"""

    ai_text, _, _ = generate_llm_response(prompt)
    if ai_text:
        try:
            start_idx = ai_text.find("{")
            end_idx = ai_text.rfind("}")
            if start_idx != -1 and end_idx != -1:
                eval_res = json.loads(ai_text[start_idx:end_idx+1])
                score = int(eval_res.get("score", 75))
                score = max(0, min(100, score))
                return {
                    "score": score,
                    "feedback": eval_res.get("feedback", "Good explanation of key concepts."),
                    "strengths": eval_res.get("strengths", ["Clear communication of main ideas."]),
                    "improvements": eval_res.get("improvements", ["Elaborate with specific code or architecture examples."]),
                    "model_answer": eval_res.get("model_answer", "An ideal answer covers definition, practical trade-offs, and real-world application.")
                }
        except Exception as e:
            logger.warning(f"Failed to parse LLM interview evaluation JSON: {e}")

    word_count = len(user_answer.split())
    answer_lower = user_answer.lower()

    base_score = 60
    if word_count > 15:
        base_score += 15
    if word_count > 40:
        base_score += 10
    if word_count > 80:
        base_score += 5

    key_terms = ["because", "example", "result", "system", "data", "process", "use", "implemented", "architecture", "method", "solution", "performance", "team", "project", "approach"]
    matching_terms = [t for t in key_terms if t in answer_lower]
    base_score += min(10, len(matching_terms) * 2)

    score = min(98, max(45, base_score))

    strengths = []
    if word_count >= 20:
        strengths.append("Detailed explanation provided with sufficient context.")
    if len(matching_terms) >= 2:
        strengths.append("Good technical terminology and problem-solving framework.")
    if not strengths:
        strengths.append("Directly addressed the question prompt.")

    improvements = []
    if word_count < 30:
        improvements.append("Elaborate further with specific real-world examples or code snippets.")
    if "example" not in answer_lower and "instance" not in answer_lower:
        improvements.append("Use concrete case studies or STAR methodology (Situation, Task, Action, Result) to strengthen impact.")
    if not improvements:
        improvements.append("Keep practicing concise delivery while preserving technical depth.")

    model_answer = (
        f"A top-tier answer for {target_career} should clearly define core terminology, explain architectural trade-offs, "
        f"and illustrate practical application using a real-world scenario or project experience."
    )

    feedback = f"Solid response scoring {score}/100. You demonstrated good understanding of {target_career} concepts."

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "improvements": improvements,
        "model_answer": model_answer
    }
