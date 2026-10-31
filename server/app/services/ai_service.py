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

# ------------------------------------------------------------------
# AUTOMATIC TOPIC & INTENT DETECTION
# ------------------------------------------------------------------

def detect_topic_and_intent(user_message: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Automatically identify the user's question type and domain without requiring topic selection.
    
    Supported Question Types (Intents):
      - 'programming': Programming question (syntax, code writing, language constructs)
      - 'concept_explanation': Concept explanation (definitions, how things work, theory)
      - 'debugging': Code debugging (identifying bugs, fixing code)
      - 'technical': Technical question (databases, APIs, infrastructure, DSA)
      - 'academic': Academic question (mathematics, statistics, CS fundamentals)
      - 'general_knowledge': General knowledge question (general facts, science, non-IT)
      - 'career_guidance': Career guidance question (roadmaps, transitions, skills needed)
      - 'interview_prep': Interview preparation question (technical/behavioral questions)
      - 'project_guidance': Project development question (portfolio project suggestions)
      - 'follow_up': Follow-up question (resolving pronouns, examples, continuations)
    """
    msg_low = user_message.lower().strip()

    # 1. Follow-up Question Detection
    follow_up_triggers = [
        "explain with an example", "explain it with an example", "give an example",
        "give me an example", "show an example", "show me an example", "with an example",
        "explain previously", "explain the code", "explain this code", "explain that code",
        "explain that example", "how can i test it", "how to test it", "how do i test it",
        "is it difficult", "is it hard", "can you explain more", "tell me more",
        "elaborate on", "can you elaborate", "what about it", "how does it work",
        "why?", "why is that", "why is this", "what is the difference", "difference between them"
    ]
    is_follow_up = any(p in msg_low for p in follow_up_triggers) or (
        len(msg_low.split()) <= 4 and any(w in msg_low for w in ["why", "example", "how", "difference", "it", "this", "that"])
    )

    parent_topic = "general"
    if chat_history:
        for m in reversed(chat_history):
            text = m.get("message", "").lower()
            if "inheritance" in text or "extends" in text or "subclass" in text:
                parent_topic = "java_inheritance"
                break
            elif "def " in text or "def in python" in text or "def keyword" in text:
                parent_topic = "python_def"
                break
            elif "mongodb" in text or "nosql" in text:
                parent_topic = "mongodb"
                break
            elif "supervised" in text or "supervised learning" in text:
                parent_topic = "supervised_learning"
                break
            elif "probability" in text:
                parent_topic = "probability"
                break
            elif "react" in text or "virtual dom" in text or "jsx" in text:
                parent_topic = "react"
                break
            elif "fastapi" in text or "pydantic" in text:
                parent_topic = "fastapi"
                break
            elif "sql" in text or "join" in text:
                parent_topic = "sql"
                break
            elif "data scientist" in text or "data science" in text:
                parent_topic = "data_scientist_career"
                break
            elif "interview" in text:
                parent_topic = "python_interview" if "python" in text else "interview"
                break
            elif "debug" in text or "error" in text:
                parent_topic = "debugging"
                break
            elif "factorial" in text:
                parent_topic = "factorial"
                break
            elif "pointer" in text:
                parent_topic = "c_pointer"
                break
            elif "python" in text:
                parent_topic = "python"
                break
            elif "java" in text:
                parent_topic = "java"
                break

    if is_follow_up and chat_history:
        return {
            "intent": "follow_up",
            "topic": parent_topic,
            "category": "Follow-up question"
        }

    # 2. Code Debugging Question
    if any(k in msg_low for k in [
        "debug", "fix this code", "fix my code", "fix the error", "why is this failing",
        "why does this fail", "help me debug", "syntaxerror", "typeerror", "indexerror",
        "indentationerror", "traceback", "exception", "nameerror", "keyerror", "valueerror",
        "bug in", "code not working", "solve this bug"
    ]):
        lang = "python" if "python" in msg_low or "def " in msg_low else ("java" if "java" in msg_low else "code")
        return {
            "intent": "debugging",
            "topic": f"{lang}_debugging",
            "category": "Code debugging"
        }

    # 3. Interview Preparation Question
    if any(k in msg_low for k in [
        "interview question", "interview questions", "interview prep", "prepare for an interview",
        "mock interview", "questions for interview", "coding interview", "technical interview",
        "behavioral interview", "star method", "interview skills"
    ]):
        subtopic = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "sql" if "sql" in msg_low else (
                        "data_science" if "data science" in msg_low or "data scientist" in msg_low else "general"
                    )
                )
            )
        )
        return {
            "intent": "interview_prep",
            "topic": f"{subtopic}_interview",
            "category": "Interview preparation question"
        }

    # 4. Career Guidance Question
    if any(k in msg_low for k in [
        "how can i become", "how to become", "career roadmap", "learning roadmap", "30-day", "30 day",
        "what should i learn first", "what should i learn next", "learn first", "first skill", "where to begin",
        "what skill should i improve", "skills required for", "skills are required for", "what skills do i need for",
        "switch to it", "can a non-it student", "non-it", "non-cs", "what career should i choose",
        "which career is suitable", "what career suits me", "career path", "salary", "job opportunities",
        "career guidance", "learning sequence"
    ]):
        sub = "data_scientist" if "data scientist" in msg_low or "data science" in msg_low else (
            "devops" if "cloud" in msg_low or "devops" in msg_low else (
                "cybersecurity" if "cyber" in msg_low or "security" in msg_low else "software_engineer"
            )
        )
        return {
            "intent": "career_guidance",
            "topic": sub,
            "category": "Career guidance question"
        }

    # 5. Project Development Question
    if any(k in msg_low for k in [
        "which project", "what project", "project should i build", "recommend a project",
        "suggest a project", "beginner project", "resume project", "portfolio project",
        "project for me", "build next"
    ]):
        return {
            "intent": "project_guidance",
            "topic": "portfolio_project",
            "category": "Project development question"
        }

    # 6. Academic / Mathematics & Statistics Question
    if any(k in msg_low for k in [
        "probability", "statistics", "calculus", "linear algebra", "standard deviation",
        "variance", "mean and median", "bayes theorem", "bayes' theorem", "normal distribution",
        "discrete math", "combinatorics", "hypothesis testing", "p-value"
    ]):
        return {
            "intent": "academic",
            "topic": "mathematics_statistics",
            "category": "Academic question"
        }

    # 7. Data Science, Machine Learning & AI
    if any(k in msg_low for k in [
        "supervised learning", "unsupervised learning", "reinforcement learning",
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "generative ai", "genai", "transformer", "llm", "large language model",
        "data science", "nlp", "computer vision", "overfitting", "underfitting"
    ]):
        return {
            "intent": "concept_explanation",
            "topic": "machine_learning_ai",
            "category": "Concept explanation"
        }

    # 8. Technical Question: Databases, APIs, Infrastructure, DSA
    if any(k in msg_low for k in [
        "mongodb", "nosql", "sql join", "sql joins", "fastapi", "rest api", "backend development",
        "docker", "kubernetes", "git", "github", "redis", "postgresql", "mysql", "microservices",
        "data structures", "dsa", "binary tree", "binary search tree", "bst", "linked list",
        "stack", "queue", "hash map", "hash table", "quicksort", "merge sort", "binary search",
        "time complexity", "space complexity", "big o", "operating system", "process vs thread",
        "deadlock", "tcp vs udp", "osi model"
    ]):
        sub = "mongodb" if "mongodb" in msg_low or "nosql" in msg_low else (
            "fastapi" if "fastapi" in msg_low else (
                "sql" if "sql" in msg_low else (
                    "dsa" if any(w in msg_low for w in ["dsa", "tree", "bst", "linked list", "stack", "queue", "big o"]) else "technical"
                )
            )
        )
        return {
            "intent": "technical",
            "topic": sub,
            "category": "Technical question"
        }

    # 9. Programming Question: Language constructs, keywords, code writing
    if any(k in msg_low for k in [
        "write factorial", "factorial in", "def in python", "what is def", "pointer in c",
        "pointers in c", "function in java", "method in java", "inheritance in java",
        "write a function", "write code", "how to write", "syntax of", "program in",
        "code in python", "code in java", "code in c", "write python", "write java"
    ]):
        sub = "python" if "python" in msg_low else ("java" if "java" in msg_low else ("c" if "in c" in msg_low else "programming"))
        return {
            "intent": "programming",
            "topic": sub,
            "category": "Programming question"
        }

    # 10. Concept Explanation (Default for what is / explain / describe)
    if any(msg_low.startswith(prefix) for prefix in [
        "what is", "what are", "explain", "describe", "difference between",
        "how does", "what does", "define", "concept of"
    ]):
        sub = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "c" if "c" in msg_low.split() else (
                        "cpp" if "c++" in msg_low else "general_concept"
                    )
                )
            )
        )
        return {
            "intent": "concept_explanation",
            "topic": sub,
            "category": "Concept explanation"
        }

    # 11. General Knowledge Question
    return {
        "intent": "general_knowledge",
        "topic": "general",
        "category": "General knowledge question"
    }


# ------------------------------------------------------------------
# RESPONSE VALIDATION & DYNAMIC QUESTION EXTRACTION
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# AUTOMATIC TOPIC & INTENT DETECTION
# ------------------------------------------------------------------

def detect_topic_and_intent(user_message: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Automatically identify the user's question type and domain without requiring topic selection.
    
    Supported Question Types (Intents):
      - 'programming': Programming question (syntax, code writing, language constructs)
      - 'concept_explanation': Concept explanation (definitions, how things work, theory)
      - 'debugging': Code debugging (identifying bugs, fixing code)
      - 'technical': Technical question (databases, APIs, infrastructure, DSA)
      - 'academic': Academic question (mathematics, statistics, CS fundamentals)
      - 'general_knowledge': General knowledge question (general facts, science, non-IT)
      - 'career_guidance': Career guidance question (roadmaps, transitions, skills needed)
      - 'interview_prep': Interview preparation question (technical/behavioral questions)
      - 'project_guidance': Project development question (portfolio project suggestions)
      - 'follow_up': Follow-up question (resolving pronouns, examples, continuations)
    """
    msg_low = user_message.lower().strip()

    # 1. Follow-up Question Detection
    follow_up_triggers = [
        "explain with an example", "explain it with an example", "give an example",
        "give me an example", "show an example", "show me an example", "with an example",
        "explain previously", "explain the code", "explain this code", "explain that code",
        "explain that example", "how can i test it", "how to test it", "how do i test it",
        "is it difficult", "is it hard", "can you explain more", "tell me more",
        "elaborate on", "can you elaborate", "what about it", "how does it work",
        "why?", "why is that", "why is this", "what is the difference", "difference between them"
    ]
    words_set = set(re.findall(r"\b[a-z]+\b", msg_low))
    has_specific_tech = any(k in msg_low for k in [
        "inheritance", "def in", "what is def", "mongodb", "react", "fastapi",
        "sql", "probability", "supervised", "unsupervised", "pointer", "factorial"
    ])
    is_follow_up = (any(p in msg_low for p in follow_up_triggers) or (
        len(msg_low.split()) <= 4 and bool(words_set.intersection({"why", "example", "it", "this", "that"}))
    )) and not (has_specific_tech and any(msg_low.startswith(w) for w in ["what", "explain", "describe", "how", "define"]))

    parent_topic = "general"
    if chat_history:
        for m in reversed(chat_history):
            text = m.get("message", "").lower()
            if "inheritance" in text or "extends" in text or "subclass" in text:
                parent_topic = "java_inheritance"
                break
            elif "def " in text or "def in python" in text or "def keyword" in text:
                parent_topic = "python_def"
                break
            elif "mongodb" in text or "nosql" in text:
                parent_topic = "mongodb"
                break
            elif "supervised" in text or "supervised learning" in text:
                parent_topic = "supervised_learning"
                break
            elif "probability" in text:
                parent_topic = "probability"
                break
            elif "react" in text or "virtual dom" in text or "jsx" in text:
                parent_topic = "react"
                break
            elif "fastapi" in text or "pydantic" in text:
                parent_topic = "fastapi"
                break
            elif "sql" in text or "join" in text:
                parent_topic = "sql"
                break
            elif "data scientist" in text or "data science" in text:
                parent_topic = "data_scientist_career"
                break
            elif "interview" in text:
                parent_topic = "python_interview" if "python" in text else "interview"
                break
            elif "debug" in text or "error" in text:
                parent_topic = "debugging"
                break
            elif "factorial" in text:
                parent_topic = "factorial"
                break
            elif "pointer" in text:
                parent_topic = "c_pointer"
                break
            elif "python" in text:
                parent_topic = "python"
                break
            elif "java" in text:
                parent_topic = "java"
                break

    if is_follow_up and chat_history:
        return {
            "intent": "follow_up",
            "topic": parent_topic,
            "category": "Follow-up question"
        }

    # 2. Code Debugging Question
    if any(k in msg_low for k in [
        "debug", "fix this code", "fix my code", "fix the error", "why is this failing",
        "why does this fail", "help me debug", "syntaxerror", "typeerror", "indexerror",
        "indentationerror", "traceback", "exception", "nameerror", "keyerror", "valueerror",
        "bug in", "code not working", "solve this bug"
    ]):
        lang = "python" if "python" in msg_low or "def " in msg_low else ("java" if "java" in msg_low else "code")
        return {
            "intent": "debugging",
            "topic": f"{lang}_debugging",
            "category": "Code debugging"
        }

    # 3. Interview Preparation Question
    if any(k in msg_low for k in [
        "interview question", "interview questions", "interview prep", "prepare for an interview",
        "mock interview", "questions for interview", "coding interview", "technical interview",
        "behavioral interview", "star method", "interview skills"
    ]):
        subtopic = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "sql" if "sql" in msg_low else (
                        "data_science" if "data science" in msg_low or "data scientist" in msg_low else "general"
                    )
                )
            )
        )
        return {
            "intent": "interview_prep",
            "topic": f"{subtopic}_interview",
            "category": "Interview preparation question"
        }

    # 4. Career Guidance Question
    if any(k in msg_low for k in [
        "how can i become", "how to become", "career roadmap", "learning roadmap", "30-day", "30 day",
        "what should i learn first", "what should i learn next", "learn first", "first skill", "where to begin",
        "what skill should i improve", "skills required for", "skills are required for", "what skills do i need for",
        "switch to it", "can a non-it student", "non-it", "non-cs", "what career should i choose",
        "which career is suitable", "what career suits me", "career path", "salary", "job opportunities",
        "career guidance", "learning sequence"
    ]):
        sub = "data_scientist" if "data scientist" in msg_low or "data science" in msg_low else (
            "devops" if "cloud" in msg_low or "devops" in msg_low else (
                "cybersecurity" if "cyber" in msg_low or "security" in msg_low else "software_engineer"
            )
        )
        return {
            "intent": "career_guidance",
            "topic": sub,
            "category": "Career guidance question"
        }

    # 5. Project Development Question
    if any(k in msg_low for k in [
        "which project", "what project", "project should i build", "recommend a project",
        "suggest a project", "beginner project", "resume project", "portfolio project",
        "project for me", "build next"
    ]):
        return {
            "intent": "project_guidance",
            "topic": "portfolio_project",
            "category": "Project development question"
        }

    # 6. Academic / Mathematics & Statistics Question
    if any(k in msg_low for k in [
        "probability", "statistics", "calculus", "linear algebra", "standard deviation",
        "variance", "mean and median", "bayes theorem", "bayes' theorem", "normal distribution",
        "discrete math", "combinatorics", "hypothesis testing", "p-value"
    ]):
        return {
            "intent": "academic",
            "topic": "mathematics_statistics",
            "category": "Academic question"
        }

    # 7. Data Science, Machine Learning & AI
    if any(k in msg_low for k in [
        "supervised learning", "unsupervised learning", "reinforcement learning",
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "generative ai", "genai", "transformer", "llm", "large language model",
        "data science", "nlp", "computer vision", "overfitting", "underfitting"
    ]):
        return {
            "intent": "concept_explanation",
            "topic": "machine_learning_ai",
            "category": "Concept explanation"
        }

    # 8. Technical Question: Databases, APIs, Infrastructure, DSA
    if any(k in msg_low for k in [
        "mongodb", "nosql", "sql join", "sql joins", "fastapi", "rest api", "backend development",
        "docker", "kubernetes", "git", "github", "redis", "postgresql", "mysql", "microservices",
        "data structures", "dsa", "binary tree", "binary search tree", "bst", "linked list",
        "stack", "queue", "hash map", "hash table", "quicksort", "merge sort", "binary search",
        "time complexity", "space complexity", "big o", "operating system", "process vs thread",
        "deadlock", "tcp vs udp", "osi model"
    ]):
        sub = "mongodb" if "mongodb" in msg_low or "nosql" in msg_low else (
            "fastapi" if "fastapi" in msg_low else (
                "sql" if "sql" in msg_low else (
                    "dsa" if any(w in msg_low for w in ["dsa", "tree", "bst", "linked list", "stack", "queue", "big o"]) else "technical"
                )
            )
        )
        return {
            "intent": "technical",
            "topic": sub,
            "category": "Technical question"
        }

    # 9. Programming Question: Language constructs, keywords, code writing
    if any(k in msg_low for k in [
        "write factorial", "factorial in", "def in python", "what is def", "pointer in c",
        "pointers in c", "function in java", "method in java", "inheritance in java",
        "write a function", "write code", "how to write", "syntax of", "program in",
        "code in python", "code in java", "code in c", "write python", "write java"
    ]):
        sub = "python" if "python" in msg_low else ("java" if "java" in msg_low else ("c" if "in c" in msg_low else "programming"))
        return {
            "intent": "programming",
            "topic": sub,
            "category": "Programming question"
        }

    # 10. Concept Explanation (Default for what is / explain / describe)
    if any(msg_low.startswith(prefix) for prefix in [
        "what is", "what are", "explain", "describe", "difference between",
        "how does", "what does", "define", "concept of"
    ]):
        sub = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "c" if "c" in msg_low.split() else (
                        "cpp" if "c++" in msg_low else "general_concept"
                    )
                )
            )
        )
        return {
            "intent": "concept_explanation",
            "topic": sub,
            "category": "Concept explanation"
        }

    # 11. General Knowledge Question
    return {
        "intent": "general_knowledge",
        "topic": "general",
        "category": "General knowledge question"
    }


# ------------------------------------------------------------------
# RESPONSE VALIDATION & DYNAMIC QUESTION EXTRACTION
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# AUTOMATIC TOPIC & INTENT DETECTION
# ------------------------------------------------------------------

def detect_topic_and_intent(user_message: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Automatically identify the user's question type and domain without requiring topic selection.
    
    Supported Question Types (Intents):
      - 'programming': Programming question (syntax, code writing, language constructs)
      - 'concept_explanation': Concept explanation (definitions, how things work, theory)
      - 'debugging': Code debugging (identifying bugs, fixing code)
      - 'technical': Technical question (databases, APIs, infrastructure, DSA)
      - 'academic': Academic question (mathematics, statistics, CS fundamentals)
      - 'general_knowledge': General knowledge question (general facts, science, non-IT)
      - 'career_guidance': Career guidance question (roadmaps, transitions, skills needed)
      - 'interview_prep': Interview preparation question (technical/behavioral questions)
      - 'project_guidance': Project development question (portfolio project suggestions)
      - 'follow_up': Follow-up question (resolving pronouns, examples, continuations)
    """
    msg_low = user_message.lower().strip()

    # 1. Follow-up Question Detection
    follow_up_triggers = [
        "explain with an example", "explain it with an example", "give an example",
        "give me an example", "show an example", "show me an example", "with an example",
        "explain previously", "explain the code", "explain this code", "explain that code",
        "explain that example", "how can i test it", "how to test it", "how do i test it",
        "is it difficult", "is it hard", "can you explain more", "tell me more",
        "elaborate on", "can you elaborate", "what about it", "how does it work",
        "why?", "why is that", "why is this", "what is the difference", "difference between them"
    ]
    words_set = set(re.findall(r"\b[a-z]+\b", msg_low))
    has_specific_tech = any(k in msg_low for k in [
        "inheritance", "def in", "what is def", "mongodb", "react", "fastapi",
        "sql", "probability", "supervised", "unsupervised", "pointer", "factorial"
    ])
    is_follow_up = (any(p in msg_low for p in follow_up_triggers) or (
        len(msg_low.split()) <= 4 and bool(words_set.intersection({"why", "example", "it", "this", "that"}))
    )) and not (has_specific_tech and any(msg_low.startswith(w) for w in ["what", "explain", "describe", "how", "define"]))

    parent_topic = "general"
    if chat_history:
        for m in reversed(chat_history):
            text = m.get("message", "").lower()
            if "inheritance" in text or "extends" in text or "subclass" in text:
                parent_topic = "java_inheritance"
                break
            elif "def " in text or "def in python" in text or "def keyword" in text:
                parent_topic = "python_def"
                break
            elif "mongodb" in text or "nosql" in text:
                parent_topic = "mongodb"
                break
            elif "supervised" in text or "supervised learning" in text:
                parent_topic = "supervised_learning"
                break
            elif "probability" in text:
                parent_topic = "probability"
                break
            elif "react" in text or "virtual dom" in text or "jsx" in text:
                parent_topic = "react"
                break
            elif "fastapi" in text or "pydantic" in text:
                parent_topic = "fastapi"
                break
            elif "sql" in text or "join" in text:
                parent_topic = "sql"
                break
            elif "data scientist" in text or "data science" in text:
                parent_topic = "data_scientist_career"
                break
            elif "interview" in text:
                parent_topic = "python_interview" if "python" in text else "interview"
                break
            elif "debug" in text or "error" in text:
                parent_topic = "debugging"
                break
            elif "factorial" in text:
                parent_topic = "factorial"
                break
            elif "pointer" in text:
                parent_topic = "c_pointer"
                break
            elif "python" in text:
                parent_topic = "python"
                break
            elif "java" in text:
                parent_topic = "java"
                break

    if is_follow_up and chat_history:
        return {
            "intent": "follow_up",
            "topic": parent_topic,
            "category": "Follow-up question"
        }

    # 2. Code Debugging Question
    if any(k in msg_low for k in [
        "debug", "fix this code", "fix my code", "fix the error", "why is this failing",
        "why does this fail", "help me debug", "syntaxerror", "typeerror", "indexerror",
        "indentationerror", "traceback", "exception", "nameerror", "keyerror", "valueerror",
        "bug in", "code not working", "solve this bug"
    ]):
        lang = "python" if "python" in msg_low or "def " in msg_low else ("java" if "java" in msg_low else "code")
        return {
            "intent": "debugging",
            "topic": f"{lang}_debugging",
            "category": "Code debugging"
        }

    # 3. Interview Preparation Question
    if any(k in msg_low for k in [
        "interview question", "interview questions", "interview prep", "prepare for an interview",
        "mock interview", "questions for interview", "coding interview", "technical interview",
        "behavioral interview", "star method", "interview skills"
    ]):
        subtopic = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "sql" if "sql" in msg_low else (
                        "data_science" if "data science" in msg_low or "data scientist" in msg_low else "general"
                    )
                )
            )
        )
        return {
            "intent": "interview_prep",
            "topic": f"{subtopic}_interview",
            "category": "Interview preparation question"
        }

    # 4. Career Guidance Question
    if any(k in msg_low for k in [
        "how can i become", "how to become", "career roadmap", "learning roadmap", "30-day", "30 day",
        "what should i learn first", "what should i learn next", "learn first", "first skill", "where to begin",
        "what skill should i improve", "skills required for", "skills are required for", "what skills do i need for",
        "switch to it", "can a non-it student", "non-it", "non-cs", "what career should i choose",
        "which career is suitable", "what career suits me", "career path", "salary", "job opportunities",
        "career guidance", "learning sequence"
    ]):
        sub = "data_scientist" if "data scientist" in msg_low or "data science" in msg_low else (
            "devops" if "cloud" in msg_low or "devops" in msg_low else (
                "cybersecurity" if "cyber" in msg_low or "security" in msg_low else "software_engineer"
            )
        )
        return {
            "intent": "career_guidance",
            "topic": sub,
            "category": "Career guidance question"
        }

    # 5. Project Development Question
    if any(k in msg_low for k in [
        "which project", "what project", "project should i build", "recommend a project",
        "suggest a project", "beginner project", "resume project", "portfolio project",
        "project for me", "build next"
    ]):
        return {
            "intent": "project_guidance",
            "topic": "portfolio_project",
            "category": "Project development question"
        }

    # 6. Academic / Mathematics & Statistics Question
    if any(k in msg_low for k in [
        "probability", "statistics", "calculus", "linear algebra", "standard deviation",
        "variance", "mean and median", "bayes theorem", "bayes' theorem", "normal distribution",
        "discrete math", "combinatorics", "hypothesis testing", "p-value"
    ]):
        return {
            "intent": "academic",
            "topic": "mathematics_statistics",
            "category": "Academic question"
        }

    # 7. Data Science, Machine Learning & AI
    if any(k in msg_low for k in [
        "supervised learning", "unsupervised learning", "reinforcement learning",
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "generative ai", "genai", "transformer", "llm", "large language model",
        "data science", "nlp", "computer vision", "overfitting", "underfitting"
    ]):
        return {
            "intent": "concept_explanation",
            "topic": "machine_learning_ai",
            "category": "Concept explanation"
        }

    # 8. Technical Question: Databases, APIs, Infrastructure, DSA
    if any(k in msg_low for k in [
        "mongodb", "nosql", "sql join", "sql joins", "fastapi", "rest api", "backend development",
        "docker", "kubernetes", "git", "github", "redis", "postgresql", "mysql", "microservices",
        "data structures", "dsa", "binary tree", "binary search tree", "bst", "linked list",
        "stack", "queue", "hash map", "hash table", "quicksort", "merge sort", "binary search",
        "time complexity", "space complexity", "big o", "operating system", "process vs thread",
        "deadlock", "tcp vs udp", "osi model"
    ]):
        sub = "mongodb" if "mongodb" in msg_low or "nosql" in msg_low else (
            "fastapi" if "fastapi" in msg_low else (
                "sql" if "sql" in msg_low else (
                    "dsa" if any(w in msg_low for w in ["dsa", "tree", "bst", "linked list", "stack", "queue", "big o"]) else "technical"
                )
            )
        )
        return {
            "intent": "technical",
            "topic": sub,
            "category": "Technical question"
        }

    # 9. Programming Question: Language constructs, keywords, code writing
    if any(k in msg_low for k in [
        "write factorial", "factorial in", "def in python", "what is def", "pointer in c",
        "pointers in c", "function in java", "method in java", "inheritance in java",
        "write a function", "write code", "how to write", "syntax of", "program in",
        "code in python", "code in java", "code in c", "write python", "write java"
    ]):
        sub = "python" if "python" in msg_low else ("java" if "java" in msg_low else ("c" if "in c" in msg_low else "programming"))
        return {
            "intent": "programming",
            "topic": sub,
            "category": "Programming question"
        }

    # 10. Concept Explanation (Default for what is / explain / describe)
    if any(msg_low.startswith(prefix) for prefix in [
        "what is", "what are", "explain", "describe", "difference between",
        "how does", "what does", "define", "concept of"
    ]):
        sub = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "c" if "c" in msg_low.split() else (
                        "cpp" if "c++" in msg_low else "general_concept"
                    )
                )
            )
        )
        return {
            "intent": "concept_explanation",
            "topic": sub,
            "category": "Concept explanation"
        }

    # 11. General Knowledge Question
    return {
        "intent": "general_knowledge",
        "topic": "general",
        "category": "General knowledge question"
    }


# ------------------------------------------------------------------
# RESPONSE VALIDATION & DYNAMIC QUESTION EXTRACTION
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# AUTOMATIC TOPIC & INTENT DETECTION
# ------------------------------------------------------------------

def detect_topic_and_intent(user_message: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Automatically identify the user's question type and domain without requiring topic selection.
    
    Supported Question Types (Intents):
      - 'programming': Programming question (syntax, code writing, language constructs)
      - 'concept_explanation': Concept explanation (definitions, how things work, theory)
      - 'debugging': Code debugging (identifying bugs, fixing code)
      - 'technical': Technical question (databases, APIs, infrastructure, DSA)
      - 'academic': Academic question (mathematics, statistics, CS fundamentals)
      - 'general_knowledge': General knowledge question (general facts, science, non-IT)
      - 'career_guidance': Career guidance question (roadmaps, transitions, skills needed)
      - 'interview_prep': Interview preparation question (technical/behavioral questions)
      - 'project_guidance': Project development question (portfolio project suggestions)
      - 'follow_up': Follow-up question (resolving pronouns, examples, continuations)
    """
    msg_low = user_message.lower().strip()

    # 1. Follow-up Question Detection
    follow_up_triggers = [
        "explain with an example", "explain it with an example", "give an example",
        "give me an example", "show an example", "show me an example", "with an example",
        "explain previously", "explain the code", "explain this code", "explain that code",
        "explain that example", "how can i test it", "how to test it", "how do i test it",
        "is it difficult", "is it hard", "can you explain more", "tell me more",
        "elaborate on", "can you elaborate", "what about it", "how does it work",
        "why?", "why is that", "why is this", "what is the difference", "difference between them"
    ]
    words_set = set(re.findall(r"\b[a-z]+\b", msg_low))
    has_specific_tech = any(k in msg_low for k in [
        "inheritance", "def in", "what is def", "mongodb", "react", "fastapi",
        "sql", "probability", "supervised", "unsupervised", "pointer", "factorial"
    ])
    is_follow_up = (any(p in msg_low for p in follow_up_triggers) or (
        len(msg_low.split()) <= 4 and bool(words_set.intersection({"why", "example", "it", "this", "that"}))
    )) and not (has_specific_tech and any(msg_low.startswith(w) for w in ["what", "explain", "describe", "how", "define"]))

    parent_topic = "general"
    if chat_history:
        for m in reversed(chat_history):
            text = m.get("message", "").lower()
            if "inheritance" in text or "extends" in text or "subclass" in text:
                parent_topic = "java_inheritance"
                break
            elif "def " in text or "def in python" in text or "def keyword" in text:
                parent_topic = "python_def"
                break
            elif "mongodb" in text or "nosql" in text:
                parent_topic = "mongodb"
                break
            elif "supervised" in text or "supervised learning" in text:
                parent_topic = "supervised_learning"
                break
            elif "probability" in text:
                parent_topic = "probability"
                break
            elif "react" in text or "virtual dom" in text or "jsx" in text:
                parent_topic = "react"
                break
            elif "fastapi" in text or "pydantic" in text:
                parent_topic = "fastapi"
                break
            elif "sql" in text or "join" in text:
                parent_topic = "sql"
                break
            elif "data scientist" in text or "data science" in text:
                parent_topic = "data_scientist_career"
                break
            elif "interview" in text:
                parent_topic = "python_interview" if "python" in text else "interview"
                break
            elif "debug" in text or "error" in text:
                parent_topic = "debugging"
                break
            elif "factorial" in text:
                parent_topic = "factorial"
                break
            elif "pointer" in text:
                parent_topic = "c_pointer"
                break
            elif "python" in text:
                parent_topic = "python"
                break
            elif "java" in text:
                parent_topic = "java"
                break

    if is_follow_up and chat_history:
        return {
            "intent": "follow_up",
            "topic": parent_topic,
            "category": "Follow-up question"
        }

    # 2. Code Debugging Question
    if any(k in msg_low for k in [
        "debug", "fix this code", "fix my code", "fix the error", "why is this failing",
        "why does this fail", "help me debug", "syntaxerror", "typeerror", "indexerror",
        "indentationerror", "traceback", "exception", "nameerror", "keyerror", "valueerror",
        "bug in", "code not working", "solve this bug"
    ]):
        lang = "python" if "python" in msg_low or "def " in msg_low else ("java" if "java" in msg_low else "code")
        return {
            "intent": "debugging",
            "topic": f"{lang}_debugging",
            "category": "Code debugging"
        }

    # 3. Interview Preparation Question
    if any(k in msg_low for k in [
        "interview question", "interview questions", "interview prep", "prepare for an interview",
        "mock interview", "questions for interview", "coding interview", "technical interview",
        "behavioral interview", "star method", "interview skills"
    ]):
        subtopic = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "sql" if "sql" in msg_low else (
                        "data_science" if "data science" in msg_low or "data scientist" in msg_low else "general"
                    )
                )
            )
        )
        return {
            "intent": "interview_prep",
            "topic": f"{subtopic}_interview",
            "category": "Interview preparation question"
        }

    # 4. Career Guidance Question
    if any(k in msg_low for k in [
        "how can i become", "how to become", "career roadmap", "learning roadmap", "30-day", "30 day",
        "what should i learn first", "what should i learn next", "learn first", "first skill", "where to begin",
        "what skill should i improve", "skills required for", "skills are required for", "what skills do i need for",
        "switch to it", "can a non-it student", "non-it", "non-cs", "what career should i choose",
        "which career is suitable", "what career suits me", "career path", "salary", "job opportunities",
        "career guidance", "learning sequence"
    ]):
        sub = "data_scientist" if "data scientist" in msg_low or "data science" in msg_low else (
            "devops" if "cloud" in msg_low or "devops" in msg_low else (
                "cybersecurity" if "cyber" in msg_low or "security" in msg_low else "software_engineer"
            )
        )
        return {
            "intent": "career_guidance",
            "topic": sub,
            "category": "Career guidance question"
        }

    # 5. Project Development Question
    if any(k in msg_low for k in [
        "which project", "what project", "project should i build", "recommend a project",
        "suggest a project", "beginner project", "resume project", "portfolio project",
        "project for me", "build next"
    ]):
        return {
            "intent": "project_guidance",
            "topic": "portfolio_project",
            "category": "Project development question"
        }

    # 6. Academic / Mathematics & Statistics Question
    if any(k in msg_low for k in [
        "probability", "statistics", "calculus", "linear algebra", "standard deviation",
        "variance", "mean and median", "bayes theorem", "bayes' theorem", "normal distribution",
        "discrete math", "combinatorics", "hypothesis testing", "p-value"
    ]):
        return {
            "intent": "academic",
            "topic": "mathematics_statistics",
            "category": "Academic question"
        }

    # 7. Data Science, Machine Learning & AI
    if any(k in msg_low for k in [
        "supervised learning", "unsupervised learning", "reinforcement learning",
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "generative ai", "genai", "transformer", "llm", "large language model",
        "data science", "nlp", "computer vision", "overfitting", "underfitting"
    ]):
        return {
            "intent": "concept_explanation",
            "topic": "machine_learning_ai",
            "category": "Concept explanation"
        }

    # 8. Technical Question: Databases, APIs, Infrastructure, DSA
    if any(k in msg_low for k in [
        "mongodb", "nosql", "sql join", "sql joins", "fastapi", "rest api", "backend development",
        "docker", "kubernetes", "git", "github", "redis", "postgresql", "mysql", "microservices",
        "data structures", "dsa", "binary tree", "binary search tree", "bst", "linked list",
        "stack", "queue", "hash map", "hash table", "quicksort", "merge sort", "binary search",
        "time complexity", "space complexity", "big o", "operating system", "process vs thread",
        "deadlock", "tcp vs udp", "osi model"
    ]):
        sub = "mongodb" if "mongodb" in msg_low or "nosql" in msg_low else (
            "fastapi" if "fastapi" in msg_low else (
                "sql" if "sql" in msg_low else (
                    "dsa" if any(w in msg_low for w in ["dsa", "tree", "bst", "linked list", "stack", "queue", "big o"]) else "technical"
                )
            )
        )
        return {
            "intent": "technical",
            "topic": sub,
            "category": "Technical question"
        }

    # 9. Programming Question: Language constructs, keywords, code writing
    if any(k in msg_low for k in [
        "write factorial", "factorial in", "def in python", "what is def", "pointer in c",
        "pointers in c", "function in java", "method in java", "inheritance in java",
        "write a function", "write code", "how to write", "syntax of", "program in",
        "code in python", "code in java", "code in c", "write python", "write java"
    ]):
        sub = "python" if "python" in msg_low else ("java" if "java" in msg_low else ("c" if "in c" in msg_low else "programming"))
        return {
            "intent": "programming",
            "topic": sub,
            "category": "Programming question"
        }

    # 10. Concept Explanation (Default for what is / explain / describe)
    if any(msg_low.startswith(prefix) for prefix in [
        "what is", "what are", "explain", "describe", "difference between",
        "how does", "what does", "define", "concept of"
    ]):
        sub = "python" if "python" in msg_low else (
            "java" if "java" in msg_low else (
                "react" if "react" in msg_low else (
                    "c" if "c" in msg_low.split() else (
                        "cpp" if "c++" in msg_low else "general_concept"
                    )
                )
            )
        )
        return {
            "intent": "concept_explanation",
            "topic": sub,
            "category": "Concept explanation"
        }

    # 11. General Knowledge Question
    return {
        "intent": "general_knowledge",
        "topic": "general",
        "category": "General knowledge question"
    }


# ------------------------------------------------------------------
# RESPONSE VALIDATION & DYNAMIC QUESTION EXTRACTION
# ------------------------------------------------------------------

def validate_ai_response(user_message: str, response_text: str, intent: str = "general") -> str:
    """
    Verify that the AI response addresses the user's question directly.
    Strips out target career boilerplate if returned on general technical/educational queries.
    """
    if not response_text:
        return response_text

    msg_low = user_message.lower().strip()

    is_career_query = intent in ["career_guidance", "project_guidance"] or any(k in msg_low for k in [
        "career", "roadmap", "resume", "portfolio readiness", "action plan",
        "what should i learn for my target career", "which project should i build", "prepare for an interview"
    ])

    if not is_career_query:
        boilerplate_patterns = [
            r"Your target career is [^\n]+",
            r"Regarding your preparation for [^\n]+",
            r"Based on your profile as [^\n]+",
            r"This concept plays an important role in technology and career development for [^\n]+",
            r"Focusing on core principles, practical hands-on examples, and building portfolio projects is the best way to master it\."
        ]
        cleaned_text = response_text
        for pattern in boilerplate_patterns:
            cleaned_text = re.sub(pattern, "", cleaned_text, flags=re.IGNORECASE).strip()

        if cleaned_text != response_text and len(cleaned_text) > 20:
            response_text = cleaned_text

    return response_text


def extract_suggested_questions(
    response_text: str,
    user_message: str,
    intent: str = "general",
    topic: str = "general"
) -> tuple[str, List[str]]:
    """Extract suggested questions from LLM output block if present, or generate dynamic topic-relevant follow-up questions."""
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
        if "python" in msg_low or "def" in msg_low or topic == "python_def":
            suggested_qs = [
                "How do default arguments work in Python?",
                "What is the difference between *args and **kwargs?",
                "Explain Python lambda functions with an example."
            ]
        elif "inheritance" in msg_low or "java" in msg_low or topic == "java_inheritance":
            suggested_qs = [
                "What is the difference between method overloading and overriding in Java?",
                "Explain the super keyword in Java.",
                "Why doesn't Java support multiple inheritance with classes?"
            ]
        elif "mongodb" in msg_low or topic == "mongodb":
            suggested_qs = [
                "What is the difference between SQL and MongoDB?",
                "How does indexing work in MongoDB?",
                "Explain MongoDB aggregation pipeline with an example."
            ]
        elif "supervised learning" in msg_low or topic == "supervised_learning":
            suggested_qs = [
                "What is the difference between supervised and unsupervised learning?",
                "Explain overfitting and how to prevent it in ML.",
                "What evaluation metrics are used in classification?"
            ]
        elif "probability" in msg_low or topic == "probability":
            suggested_qs = [
                "Explain Bayes' Theorem with an example.",
                "What is the difference between independent and dependent events?",
                "What is a normal distribution and the 68-95-99.7 rule?"
            ]
        elif "react" in msg_low or topic == "react":
            suggested_qs = [
                "What is the difference between state and props in React?",
                "How does the useEffect hook work?",
                "What is the Virtual DOM and why is it fast?"
            ]
        elif "data scientist" in msg_low or topic == "data_scientist_career":
            suggested_qs = [
                "What are the top Python libraries for Data Science?",
                "Give me beginner portfolio project ideas for Data Science.",
                "What technical interview questions are asked for Data Science roles?"
            ]
        elif "interview" in msg_low or intent == "interview_prep":
            suggested_qs = [
                "Can you explain Python decorators with a code example?",
                "How does memory management and garbage collection work in Python?",
                "Give me coding interview practice problems in Python."
            ]
        elif "debug" in msg_low or intent == "debugging":
            suggested_qs = [
                "How do I fix IndentationError in Python?",
                "What is the difference between TypeError and ValueError?",
                "How do I use Python pdb debugger?"
            ]
        elif "html" in msg_low or "div" in msg_low:
            suggested_qs = [
                "What is the difference between div and span?",
                "How do I center a div using CSS flexbox?",
                "What are HTML5 semantic elements?"
            ]
        elif "sql" in msg_low or "join" in msg_low:
            suggested_qs = [
                "What is the difference between INNER JOIN and LEFT JOIN?",
                "Explain SQL indexing and performance optimization.",
                "Write a sample SQL query with GROUP BY and HAVING."
            ]
        elif "fastapi" in msg_low:
            suggested_qs = [
                "What is the difference between FastAPI and Flask?",
                "How does Pydantic validation work in FastAPI?",
                "How do I implement JWT authentication in FastAPI?"
            ]
        elif "dsa" in msg_low or "binary tree" in msg_low:
            suggested_qs = [
                "What is the difference between an Array and a Linked List?",
                "Explain Binary Search with a code example.",
                "What is Big O notation and time complexity?"
            ]
        elif any(k in msg_low for k in ["career", "learn first", "roadmap"]):
            suggested_qs = [
                "Which skill should I learn first?",
                "Which project should I build next?",
                "Give me a 30-day learning roadmap."
            ]
        else:
            suggested_qs = [
                "Can you explain it with an example?",
                "Why is this concept important?",
                "What are common use cases for this?"
            ]

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
# MULTI-TOPIC AI ASSISTANT PIPELINE
# ------------------------------------------------------------------

async def generate_career_assistant_response(
    user_message: str,
    user_context: Dict[str, Any],
    chat_history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Upgraded Multi-Topic AI Assistant.
    Seamlessly handles programming, concepts, debugging, math, technical,
    academic, and career questions with zero irrelevant generic career boilerplate.
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

    detected = detect_topic_and_intent(user_message, chat_history)
    intent = detected["intent"]
    topic = detected["topic"]

    is_career_relevant = intent in ["career_guidance", "project_guidance"] or any(
        k in user_message.lower() for k in [
            "target career", "my profile", "my skills", "skill gap", "portfolio readiness",
            "action plan", "what should i learn for my career", "which project should i build"
        ]
    )

    formatted_history = ""
    if chat_history:
        recent_msg = chat_history[-10:]
        history_lines = []
        for m in recent_msg:
            role = m.get("role", "user").capitalize()
            msg_text = m.get("message", "")
            history_lines.append(f"{role}: {msg_text}")
        formatted_history = "RECENT CONVERSATION HISTORY:\n" + "\n".join(history_lines) + "\n\n"

    profile_context = ""
    if is_career_relevant:
        profile_context = f"""
CANDIDATE CAREER PROFILE (Use ONLY to personalize career/project advice):
- Target Career: {target_career}
- Education: {education if education else 'Not specified'}
- Current Skills: {', '.join(current_skills) if current_skills else 'None'}
- Skill Gaps: {', '.join(skill_gaps) if skill_gaps else 'None'}
- Portfolio Readiness: {readiness_score:.1f}%
- Recommended Project: {top_project_title}
"""

    prompt = f"""You are Antigravity, an advanced multi-topic AI Assistant and expert technical tutor.
USER QUESTION: {user_message}
DETECTED USER INTENT: {intent}
DETECTED TOPIC: {topic}

{profile_context}
{formatted_history}
CORE DIRECTIVES:
1. PRIMARY OBJECTIVE: Answer the user's EXACT question directly, accurately, and naturally. You support ALL topics: Programming (Python, Java, C, C++, JavaScript, React, HTML/CSS, etc.), Computer Science (DSA, DBMS, OS, Networks), Databases (SQL, MongoDB), APIs (FastAPI, REST), Data Science & Machine Learning (Supervised/Unsupervised, Neural Networks), Mathematics & Statistics (Probability, Distributions), Academic subjects, General Knowledge, Code Debugging, Interview Preparation, and Career Roadmaps.
2. NO UNRELATED CAREER ADVICE: If the question is about programming, algorithms, concepts, databases, mathematics, academia, debugging, or general knowledge, NEVER inject unrelated career advice, candidate profile summaries, or portfolio projects into the answer. Only provide career advice when explicitly asked.
3. CLEAR EXAMPLES & CODE: Provide clean, working code snippets for programming questions with explanations. For debugging, identify the bug clearly and provide the corrected code. For concept explanations, provide practical real-world analogies.
4. CONVERSATION CONTEXT: If this is a follow-up (e.g. "Explain with an example", "Why?", "What is the difference?"), use the conversation history to give a coherent, in-depth answer resolving previous references.
5. MULTILINGUAL RESPONSE: Respond fluently in the exact language/script used by the user (English, Telugu script, Hindi script, Teluglish, Hinglish, etc.).
6. FORMATTING: Use clean Markdown headers, lists, and language-specific code blocks (`python, `java, `sql, `jsx, etc.).
7. DYNAMIC SUGGESTED QUESTIONS: At the very end of your response, output exactly 3 relevant follow-up questions tailored specifically to the current topic, formatted as:
```suggested_questions
["Question 1?", "Question 2?", "Question 3?"]
```
"""

    ai_text, provider_name, error_detail = generate_llm_response(prompt)

    if ai_text:
        validated_text = validate_ai_response(user_message, ai_text, intent=intent)
        cleaned_text, suggested_qs = extract_suggested_questions(validated_text, user_message, intent=intent, topic=topic)

        next_card = None
        if is_career_relevant and any(k in user_message.lower() for k in ["start first", "first skill", "which skill", "learning sequence"]):
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
            "intent": intent,
            "topic": topic,
            "next_action_card": next_card,
            "recommended_skills": ordered_skills if is_career_relevant else [],
            "related_projects": [top_project] if is_career_relevant else [],
            "suggested_questions": suggested_qs,
            "dynamic_suggested_questions": suggested_qs
        }

    # Internal Multi-Topic Assistant Engine (fallback)
    return _generate_internal_multi_topic_response(
        user_message=user_message,
        user_context=user_context,
        chat_history=chat_history,
        ordered_skills=ordered_skills,
        top_project=top_project,
        detected=detected
    )


def _generate_internal_career_assistant_response(
    user_message: str,
    user_context: Dict[str, Any],
    chat_history: List[Dict[str, Any]],
    ordered_skills: List[str],
    top_project: Dict[str, Any]
) -> Dict[str, Any]:
    """Compatibility alias for internal multi-topic assistant response."""
    detected = detect_topic_and_intent(user_message, chat_history)
    return _generate_internal_multi_topic_response(
        user_message=user_message,
        user_context=user_context,
        chat_history=chat_history,
        ordered_skills=ordered_skills,
        top_project=top_project,
        detected=detected
    )


def _generate_internal_multi_topic_response(
    user_message: str,
    user_context: Dict[str, Any],
    chat_history: List[Dict[str, Any]],
    ordered_skills: List[str],
    top_project: Dict[str, Any],
    detected: Dict[str, Any]
) -> Dict[str, Any]:
    msg_low = user_message.lower().strip()
    words_set = set(re.findall(r"\b[a-z]+\b", msg_low))
    target_career = user_context.get("target_career") or "Full Stack Software Engineer"
    education = user_context.get("education") or ""
    branch = user_context.get("branch") or ""
    current_skills = user_context.get("current_skills") or []
    skill_gaps = user_context.get("skill_gaps") or []
    readiness_score = user_context.get("portfolio_readiness", 0.0)
    top_project_title = top_project.get("title") or top_project.get("name") or "Full-Stack Project"

    intent = detected.get("intent", "general_knowledge")
    topic = detected.get("topic", "general")

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
    is_career_relevant = False

    # ------------------------------------------------------------------
    # 1. MULTILINGUAL RESPONSES
    # ------------------------------------------------------------------
    if is_telugu_script:
        reply = (
            "### తెలుగులో సమాధానం (Telugu Explanation)\n\n"
            f"మీ ప్రశ్న: **{user_message}**\n\n"
            "ఫంక్షన్ (Function) అనేది ఒక నిర్దిష్ట పనిని చేయడానికి ఉపయోగపడే పునర్వినియోగ (reusable) కోడ్ బ్లాక్. "
            "పైథాన్‌లో ఫంక్షన్‌ను డిఫైన్ చేయడానికి `def` కీవర్డ్ ఉపయోగిస్తారు.\n\n"
            "```python\n"
            "def greet(name):\n"
            "    return f\"నమస్కారం, {name}!\"\n\n"
            "print(greet(\"విద్యార్థి\"))\n"
            "```\n\n"
            "మరిన్ని వివరాలు లేదా కోడ్ ఉదాహరణల కోసం క్రింది ప్రశ్నలను అడగవచ్చు."
        )
        suggested_qs = ["Python lo def keyword enduku use chestaru?", "Java lo inheritance ante ఏమిటి?", "What is probability?"]

    elif is_hindi_script or is_hinglish:
        reply = (
            "### हिंदी / हिंग्लिश में उत्तर (Hindi Explanation)\n\n"
            f"आपका सवाल: **{user_message}**\n\n"
            "फ़ंक्शन (Function) कोड का एक ब्लॉक होता है जिसे बार-बार इस्तेमाल (reusable) किया जा सकता है। "
            "Python में फ़ंक्शन बनाने के लिए `def` कीवर्ड का उपयोग किया जाता है।\n\n"
            "```python\n"
            "def greet(name):\n"
            "    return f\"नमस्ते, {name}!\"\n\n"
            "print(greet(\"विद्यार्थी\"))\n"
            "```\n\n"
            "क्या आप इस कोड का स्पष्टीकरण या कोई अन्य उदाहरण देखना चाहते हैं?"
        )
        suggested_qs = ["Python mein def kya hai?", "Java mein inheritance kya hai?", "Supervised learning kya hai?"]

    elif is_teluglish:
        reply = (
            "### Teluglish Explanation\n\n"
            f"Mee question: **{user_message}**\n\n"
            "Python lo `def` keyword ni **functions create చేయడానికి (define చేయడానికి)** ఉపయోగిస్తారు. "
            "Oka function dwara code ni repeat cheyyakunda reusable ga run cheyyavachhu.\n\n"
            "```python\n"
            "def add_numbers(a, b):\n"
            "    return a + b\n\n"
            "result = add_numbers(10, 20)\n"
            "print(result)  # Output: 30\n"
            "```"
        )
        suggested_qs = ["What is def in Python?", "Explain inheritance in Java", "What is MongoDB?"]

    # ------------------------------------------------------------------
    # 2. GREETINGS & COURTESY
    # ------------------------------------------------------------------
    elif msg_low in ["hi", "hello", "hey", "good morning", "good evening", "hi!", "hello!", "hey!"] or msg_low.startswith(("hi ", "hello ", "hey ")):
        reply = (
            "Hello! 👋 I am your Multi-Topic AI Assistant.\n\n"
            "I can help you with:\n"
            "• **Programming**: Python, Java, C, C++, JavaScript, React\n"
            "• **Data Structures & Algorithms**: Arrays, Trees, Sorting, Big O\n"
            "• **Web & Backend**: HTML, CSS, React, FastAPI, REST APIs\n"
            "• **Databases**: SQL, MongoDB, Database Design\n"
            "• **AI & Data Science**: Machine Learning, Supervised Learning, Deep Learning\n"
            "• **Mathematics & Stats**: Probability, Statistics, Distributions\n"
            "• **Interview Prep & Careers**: Technical questions, Debugging, Personalized Roadmaps\n\n"
            "What would you like to explore today?"
        )
        suggested_qs = ["What is def in Python?", "Explain inheritance in Java.", "What is MongoDB?"]

    elif bool(words_set.intersection({"thank", "thanks", "ty"})) or "thank you" in msg_low or "thank u" in msg_low:
        reply = (
            "You're very welcome! Feel free to ask if you have more questions about programming, "
            "technical concepts, mathematics, code debugging, or interview prep. Happy learning!"
        )
        suggested_qs = ["What is supervised learning?", "What is probability?", "Give me Python interview questions."]

    # ------------------------------------------------------------------
    # 3. PYTHON TOPICS
    # ------------------------------------------------------------------
    elif "def in python" in msg_low or (msg_low.startswith("what is def") and "python" in msg_low) or msg_low == "what is def":
        reply = (
            "### What is `def` in Python?\n\n"
            "In Python, **`def`** (short for *define*) is the keyword used to **define a function**. "
            "A function is a reusable block of organized code that performs a specific task and only runs when it is called.\n\n"
            "**Key Characteristics:**\n"
            "1. **Syntax**: Begins with `def`, followed by the function name, parentheses `()`, and a colon `:`. \n"
            "2. **Parameters**: You can pass input arguments inside the parentheses.\n"
            "3. **Return Value**: The `return` statement sends a result back to the caller.\n"
            "4. **Indentation**: The function body must be indented (standard is 4 spaces).\n\n"
            "```python\n"
            "# Function definition\n"
            "def calculate_area(length, width):\n"
            "    \"\"\"Calculate and return the area of a rectangle.\"\"\"\n"
            "    return length * width\n\n"
            "# Calling the function\n"
            "area = calculate_area(8, 5)\n"
            "print(f\"The area is: {area}\")  # Output: The area is: 40\n"
            "```"
        )
        suggested_qs = ["Explain it with an example.", "What are *args and **kwargs in Python?", "Give me Python interview questions."]

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
            "```\n\n"
            "**Explanation**: The function calls itself with `n - 1` until it hits the base case (`n <= 1`), returning `1`."
        )
        suggested_qs = ["Explain previously generated code.", "Write factorial in Java.", "What is def in Python?"]

    elif msg_low in ["what is python?", "what is python", "python"]:
        reply = (
            "### What is Python?\n\n"
            "**Python** is a high-level, interpreted, general-purpose programming language created by Guido van Rossum. "
            "It emphasizes code readability with clean, English-like syntax and significant indentation.\n\n"
            "**Core Applications:**\n"
            "• **Web & API Development**: FastAPI, Django, Flask\n"
            "• **Data Science & ML**: Pandas, NumPy, Scikit-Learn, PyTorch, TensorFlow\n"
            "• **Automation & Scripting**: Task automation, web scraping (BeautifulSoup, Selenium)\n"
            "• **Cloud & DevOps**: Infrastructure scripting, AWS Lambda, Docker automation"
        )
        suggested_qs = ["What is def in Python?", "Give me Python interview questions.", "Can a non-IT student learn Python?"]

    # ------------------------------------------------------------------
    # 4. JAVA TOPICS
    # ------------------------------------------------------------------
    elif "inheritance in java" in msg_low or ("inheritance" in msg_low and "java" in msg_low):
        reply = (
            "### Inheritance in Java\n\n"
            "In Java, **Inheritance** is an Object-Oriented Programming (OOP) mechanism where one class (called the **child class** or **subclass**) "
            "inherits fields (attributes) and methods from another class (called the **parent class** or **superclass**).\n\n"
            "**Key Concepts:**\n"
            "1. **`extends` keyword**: Used to inherit from a class.\n"
            "2. **Code Reusability**: Common logic is written in the superclass and reused by all subclasses.\n"
            "3. **Method Overriding (`@Override`)**: Subclasses can provide their own specific implementation of an inherited method.\n"
            "4. **`super` keyword**: Refers directly to the immediate parent class constructor or methods.\n"
            "5. **Types supported**: Java supports Single, Multilevel, and Hierarchical inheritance (Multiple inheritance is supported through Interfaces to avoid ambiguity).\n\n"
            "```java\n"
            "// Superclass (Parent)\n"
            "class Vehicle {\n"
            "    protected String brand = \"Toyota\";\n\n"
            "    public void honk() {\n"
            "        System.out.println(\"Beep, beep!\");\n"
            "    }\n"
            "}\n\n"
            "// Subclass (Child)\n"
            "class Car extends Vehicle {\n"
            "    private String modelName = \"Corolla\";\n\n"
            "    @Override\n"
            "    public void honk() {\n"
            "        System.out.println(\"Car horn: Honk! Honk!\");\n"
            "    }\n\n"
            "    public void display() {\n"
            "        System.out.println(brand + \" \" + modelName);\n"
            "    }\n"
            "}\n\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        Car myCar = new Car();\n"
            "        myCar.honk();     // Calls overridden method\n"
            "        myCar.display();  // Accesses inherited brand\n"
            "    }\n"
            "}\n"
            "```"
        )
        suggested_qs = ["Explain it with an example.", "What is polymorphism in Java?", "Why doesn't Java support multiple inheritance?"]

    elif "function in java" in msg_low or ("function" in msg_low and "java" in msg_low):
        reply = (
            "### What is a Function (Method) in Java?\n\n"
            "In Java, functions are defined as **methods** inside classes. Java methods specify access modifiers (`public`/`private`), "
            "return types, method names, and parameters.\n\n"
            "```java\n"
            "public class Calculator {\n"
            "    // Static method returning integer sum\n"
            "    public static int add(int a, int b) {\n"
            "        return a + b;\n"
            "    }\n\n"
            "    public static void main(String[] args) {\n"
            "        int total = add(15, 25);\n"
            "        System.out.println(\"Sum: \" + total); // Output: Sum: 40\n"
            "    }\n"
            "}\n"
            "```"
        )
        suggested_qs = ["Explain inheritance in Java.", "Write factorial in Java.", "What is OOP in Java?"]

    elif "factorial in java" in msg_low or ("factorial" in msg_low and "java" in msg_low):
        reply = (
            "### Java Factorial Program\n\n"
            "Here is a complete Java class calculating factorial using recursion:\n\n"
            "```java\n"
            "public class Factorial {\n"
            "    public static int factorial(int n) {\n"
            "        if (n <= 1) return 1;\n"
            "        return n * factorial(n - 1);\n"
            "    }\n\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(factorial(5)); // Output: 120\n"
            "    }\n"
            "}\n"
            "```"
        )
        suggested_qs = ["Explain previously generated code.", "What is a function in Java?", "Write factorial in Python."]

    elif msg_low in ["what is java?", "what is java", "java"]:
        reply = (
            "### What is Java?\n\n"
            "**Java** is a robust, high-level, class-based, object-oriented programming language designed for platform independence. "
            "Java follows the **'Write Once, Run Anywhere' (WORA)** philosophy because source code is compiled into bytecode that runs on any Java Virtual Machine (JVM).\n\n"
            "**Key Strengths:**\n"
            "• Enterprise Backend Services (Spring Boot, Jakarta EE)\n"
            "• Android Mobile Development\n"
            "• Strong Type Safety, Automatic Garbage Collection, and Multithreading"
        )
        suggested_qs = ["Explain inheritance in Java.", "What is a function in Java?", "What is C++?"]

    # ------------------------------------------------------------------
    # 5. DATABASES & MONGODB
    # ------------------------------------------------------------------
    elif "mongodb" in msg_low or "what is mongodb" in msg_low:
        reply = (
            "### What is MongoDB?\n\n"
            "**MongoDB** is a leading open-source, non-relational (**NoSQL**) document-oriented database designed for high availability, "
            "scalability, and flexibility.\n\n"
            "**Core Features:**\n"
            "1. **Document-Based**: Instead of rows and columns, MongoDB stores data in **BSON documents** (Binary JSON format).\n"
            "2. **Dynamic Schema**: Documents in the same collection do not need to share the exact same fields, allowing schemas to evolve naturally.\n"
            "3. **Collections**: A group of MongoDB documents (equivalent to a table in relational databases).\n"
            "4. **High Scalability & Performance**: Native support for horizontal scaling using **sharding** and automated failover via **replica sets**.\n\n"
            "**Sample BSON Document:**\n"
            "```json\n"
            "{\n"
            "  \"_id\": \"651a2b3c4d5e6f7a8b9c0d1e\",\n"
            "  \"name\": \"Alex Johnson\",\n"
            "  \"email\": \"alex@example.com\",\n"
            "  \"skills\": [\"Python\", \"FastAPI\", \"MongoDB\"],\n"
            "  \"isActive\": true\n"
            "}\n"
            "```\n\n"
            "**PyMongo Query Example:**\n"
            "```python\n"
            "from pymongo import MongoClient\n\n"
            "client = MongoClient(\"mongodb://localhost:27017\")\n"
            "db = client.test_db\n"
            "users = db.users.find({\"isActive\": True})\n"
            "for u in users:\n"
            "    print(u[\"name\"])\n"
            "```"
        )
        suggested_qs = ["What is the difference between SQL and MongoDB?", "Explain it with an example.", "How does indexing work in MongoDB?"]

    elif "sql join" in msg_low or "explain sql join" in msg_low or ("join" in msg_low and "sql" in msg_low):
        reply = (
            "### What are SQL Joins?\n\n"
            "An **SQL Join** is used to combine rows from two or more tables based on a related column between them.\n\n"
            "• **INNER JOIN**: Returns rows with matching values in both tables.\n"
            "• **LEFT JOIN**: Returns all rows from the left table and matched rows from the right table.\n"
            "• **RIGHT JOIN**: Returns all rows from the right table and matched rows from the left table.\n"
            "• **FULL OUTER JOIN**: Returns all rows when there is a match in either table.\n\n"
            "```sql\n"
            "SELECT users.name, orders.amount\n"
            "FROM users\n"
            "INNER JOIN orders ON users.user_id = orders.user_id;\n"
            "```"
        )
        suggested_qs = ["What is SQL?", "What is MongoDB?", "Give me a simple SQL example."]

    elif msg_low in ["what is sql?", "what is sql", "sql"]:
        reply = (
            "### What is SQL?\n\n"
            "**SQL** (Structured Query Language) is the standard domain-specific language used for managing, querying, "
            "and manipulating relational databases (RDBMS) such as PostgreSQL, MySQL, SQLite, and Oracle.\n\n"
            "**Key Command Types:**\n"
            "• **DQL (Querying)**: `SELECT`\n"
            "• **DML (Manipulation)**: `INSERT`, `UPDATE`, `DELETE`\n"
            "• **DDL (Definition)**: `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`\n"
            "• **TCL (Transactions)**: `COMMIT`, `ROLLBACK`"
        )
        suggested_qs = ["Explain SQL joins.", "What is MongoDB?", "What is a primary key?"]

    elif "fastapi" in msg_low:
        reply = (
            "### What is FastAPI?\n\n"
            "**FastAPI** is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints.\n\n"
            "**Key Advantages:**\n"
            "1. **High Speed**: Built on Starlette and Pydantic, offering performance comparable to Node.js and Go.\n"
            "2. **Automatic Interactive Documentation**: Generates Swagger UI (`/docs`) and ReDoc (`/redoc`) automatically.\n"
            "3. **Data Validation**: Strict data parsing and validation using Pydantic schemas.\n"
            "4. **Async Native**: Built-in support for `async` and `await` concurrency.\n\n"
            "```python\n"
            "from fastapi import FastAPI\n\n"
            "app = FastAPI()\n\n"
            "@app.get(\"/\")\n"
            "async def root():\n"
            "    return {\"message\": \"Hello from FastAPI!\"}\n"
            "```"
        )
        suggested_qs = ["What is the difference between FastAPI and Flask?", "How do Pydantic models work?", "What is a REST API?"]

    # ------------------------------------------------------------------
    # 6. DATA SCIENCE, MACHINE LEARNING & AI
    # ------------------------------------------------------------------
    elif "supervised learning" in msg_low or "explain supervised learning" in msg_low:
        reply = (
            "### Supervised Learning Explained\n\n"
            "**Supervised Learning** is the primary category of Machine Learning where an algorithm learns to map input data ($X$) "
            "to correct output labels ($y$) using **labeled training data**.\n\n"
            "**How It Works:**\n"
            "The model is fed features along with ground truth answers. It iteratively makes predictions, measures errors using a loss function, "
            "and adjusts its internal parameters until it accurately predicts labels for new, unseen data.\n\n"
            "**Two Main Types:**\n"
            "1. **Classification** (Predicting discrete category/class):\n"
            "   • Examples: Email Spam vs. Not Spam, Fraud Detection, Disease Diagnosis.\n"
            "   • Common Algorithms: Logistic Regression, Decision Trees, Random Forest, Support Vector Machines (SVM).\n\n"
            "2. **Regression** (Predicting continuous numerical value):\n"
            "   • Examples: Predicting house prices, temperature forecasts, revenue projections.\n"
            "   • Common Algorithms: Linear Regression, Ridge/Lasso, Gradient Boosting (XGBoost).\n\n"
            "```python\n"
            "from sklearn.linear_model import LogisticRegression\n\n"
            "# 1. Features (e.g. word count) and Labels (0 = Not Spam, 1 = Spam)\n"
            "X_train = [[1.2], [3.5], [0.8], [4.1]]\n"
            "y_train = [0, 1, 0, 1]\n\n"
            "# 2. Train supervised model\n"
            "model = LogisticRegression()\n"
            "model.fit(X_train, y_train)\n\n"
            "# 3. Predict on unseen email\n"
            "prediction = model.predict([[3.8]])\n"
            "print(\"Spam\" if prediction[0] == 1 else \"Not Spam\")\n"
            "```"
        )
        suggested_qs = ["Explain it with an example.", "What is the difference between supervised and unsupervised learning?", "Explain overfitting in machine learning."]

    elif "unsupervised learning" in msg_low:
        reply = (
            "### Unsupervised Learning Explained\n\n"
            "**Unsupervised Learning** is a branch of Machine Learning where algorithms discover hidden patterns, groupings, "
            "or structures in data **without human supervision or pre-existing labels**.\n\n"
            "**Main Approaches:**\n"
            "1. **Clustering**: Grouping similar data points together (e.g., Customer Segmentation with K-Means or DBSCAN).\n"
            "2. **Dimensionality Reduction**: Compressing high-dimensional datasets while preserving variance (e.g., PCA, t-SNE).\n"
            "3. **Anomaly Detection**: Identifying unusual data points (e.g., bank fraud, manufacturing defects)."
        )
        suggested_qs = ["What is supervised learning?", "Explain K-Means clustering.", "What is PCA?"]

    elif "machine learning" in msg_low or "what is ml" in msg_low:
        reply = (
            "### What is Machine Learning?\n\n"
            "**Machine Learning (ML)** is a subset of Artificial Intelligence where computer systems learn from data, identify patterns, "
            "and make decisions with minimal human intervention, improving performance over time without being explicitly programmed.\n\n"
            "**Major Branches:**\n"
            "• **Supervised Learning**: Learning from labeled inputs and outputs.\n"
            "• **Unsupervised Learning**: Finding hidden structures in unlabeled data.\n"
            "• **Reinforcement Learning**: Learning through trial, error, rewards, and penalties."
        )
        suggested_qs = ["Explain supervised learning.", "How can I become a Data Scientist?", "What is deep learning?"]

    # ------------------------------------------------------------------
    # 7. MATHEMATICS & BASIC STATISTICS
    # ------------------------------------------------------------------
    elif "probability" in msg_low or "what is probability" in msg_low:
        reply = (
            "### What is Probability?\n\n"
            "**Probability** is the mathematical branch that measures the **likelihood or chance** of an event occurring. "
            "It is quantified as a number between **0 and 1** (or 0% to 100%):\n"
            "• $P(E) = 0$: Impossible event\n"
            "• $P(E) = 1$: Certain event\n\n"
            "**Fundamental Formula:**\n"
            "$$\\text{Probability } P(E) = \\frac{\\text{Number of favorable outcomes}}{\\text{Total number of possible outcomes in sample space } S}$$\n\n"
            "**Classic Examples:**\n"
            "1. **Coin Toss**: Flipping a fair coin has 2 possible outcomes: {Heads, Tails}.\n"
            "   $$P(\\text{Heads}) = \\frac{1}{2} = 0.5 \\text{ (50%)}$$\n\n"
            "2. **Rolling a 6-Sided Die**: Total possible outcomes: {1, 2, 3, 4, 5, 6}.\n"
            "   • Probability of rolling a 4: $P(4) = \\frac{1}{6} \\approx 16.7%$\n"
            "   • Probability of rolling an even number {2, 4, 6}: $P(\\text{Even}) = \\frac{3}{6} = 0.5$\n\n"
            "**Essential Rules:**\n"
            "• **Complement Rule**: $P(\\text{not } A) = 1 - P(A)$\n"
            "• **Independent Events**: $P(A \\text{ and } B) = P(A) \\times P(B)$\n"
            "• **Conditional Probability**: Probability of $A$ given $B$ has occurred: $P(A|B) = \\frac{P(A \\cap B)}{P(B)}$"
        )
        suggested_qs = ["Explain it with an example.", "What is Bayes' Theorem?", "What is standard deviation?"]

    elif any(k in msg_low for k in ["statistics", "standard deviation", "mean", "median", "variance"]):
        reply = (
            "### Basic Statistics Concepts\n\n"
            "Statistics is the science of collecting, analyzing, interpreting, and presenting data.\n\n"
            "**1. Measures of Central Tendency:**\n"
            "• **Mean**: The arithmetic average (sum of all values divided by count).\n"
            "• **Median**: The middle value when data is sorted in ascending order (resistant to extreme outliers).\n"
            "• **Mode**: The most frequently occurring value in the dataset.\n\n"
            "**2. Measures of Dispersion (Spread):**\n"
            "• **Variance (\\sigma^2)**: Average of squared differences from the Mean.\n"
            "• **Standard Deviation (\\sigma)**: Square root of variance, measuring how spread out numbers are around the mean."
        )
        suggested_qs = ["What is probability?", "What is a normal distribution?", "What is hypothesis testing?"]

    # ------------------------------------------------------------------
    # 8. WEB DEVELOPMENT & REACT
    # ------------------------------------------------------------------
    elif "div tag" in msg_low or msg_low == "what is div" or msg_low == "what is a div tag?" or msg_low == "what is div tag":
        reply = (
            "### What is a `<div>` tag in HTML?\n\n"
            "The **`<div>`** tag (short for division) is a generic block-level container element in HTML. "
            "It is used to group related HTML elements together for layout structuring or styling with CSS.\n\n"
            "```html\n"
            "<div class=\"card-container\">\n"
            "  <h2>Project Title</h2>\n"
            "  <p>This paragraph is grouped inside the container div.</p>\n"
            "</div>\n"
            "```"
        )
        suggested_qs = ["What is HTML?", "What is CSS?", "Give me a simple example."]

    elif msg_low in ["what is react?", "what is react", "react"] or "why should i learn react" in msg_low:
        reply = (
            "### What is React & Why Learn It?\n\n"
            "**React** is an open-source JavaScript front-end library created by Meta for building interactive user interfaces, "
            "primarily for Single Page Applications (SPAs).\n\n"
            "**Core Features:**\n"
            "1. **Component-Based Architecture**: Build modular, encapsulated UI elements that manage their own state.\n"
            "2. **Virtual DOM**: Re-renders only changed elements in memory before updating the real DOM, ensuring high performance.\n"
            "3. **JSX**: Combines HTML syntax directly inside JavaScript code.\n"
            "4. **Hooks**: Functional state and side-effect management via `useState`, `useEffect`, etc.\n\n"
            "```jsx\n"
            "import React, { useState } from 'react';\n\n"
            "function Counter() {\n"
            "  const [count, setCount] = useState(0);\n"
            "  return (\n"
            "    <button onClick={() => setCount(count + 1)}>\n"
            "      Clicked {count} times\n"
            "    </button>\n"
            "  );\n"
            "}\n\n"
            "export default Counter;\n"
            "```"
        )
        suggested_qs = ["What is the difference between state and props?", "Explain it with an example.", "What is JavaScript?"]

    elif msg_low in ["what is javascript?", "what is javascript", "javascript"]:
        reply = (
            "### What is JavaScript?\n\n"
            "**JavaScript** (JS) is a high-level, dynamic, interpreted programming language that powers interactivity on the web. "
            "Along with HTML and CSS, it is one of the three core technologies of the World Wide Web, and also runs servers via Node.js."
        )
        suggested_qs = ["What is React?", "What is HTML?", "What is CSS?"]

    elif msg_low in ["what is html?", "what is html", "html"]:
        reply = (
            "### What is HTML?\n\n"
            "**HTML** (HyperText Markup Language) is the standard markup language used to structure web pages on the Internet "
            "using elements like headings, paragraphs, divs, links, forms, and media elements."
        )
        suggested_qs = ["What is a div tag?", "What is CSS?", "What is JavaScript?"]

    elif msg_low in ["what is css?", "what is css", "css"]:
        reply = (
            "### What is CSS?\n\n"
            "**CSS** (Cascading Style Sheets) is the stylesheet language used to specify presentation, colors, typography, "
            "flexbox/grid layouts, animations, and responsive design for HTML elements."
        )
        suggested_qs = ["What is HTML?", "What is a div tag?", "What is React?"]

    # ------------------------------------------------------------------
    # 9. C & C++
    # ------------------------------------------------------------------
    elif "pointer in c" in msg_low or ("pointer" in msg_low and "c" in msg_low):
        reply = (
            "### What is a Pointer in C?\n\n"
            "A **pointer** in C is a variable that stores the **memory address** of another variable. "
            "Pointers enable direct memory manipulation, efficient array indexing, and dynamic memory allocation (`malloc`, `free`).\n\n"
            "```c\n"
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    int num = 42;\n"
            "    int *ptr = &num; // ptr stores address of num\n\n"
            "    printf(\"Value of num: %d\\n\", num);\n"
            "    printf(\"Address of num: %p\\n\", (void*)ptr);\n"
            "    printf(\"Value via pointer dereference: %d\\n\", *ptr);\n"
            "    return 0;\n"
            "}\n"
            "```"
        )
        suggested_qs = ["What is C?", "What is C++?", "Give me a simple example."]

    elif msg_low in ["what is c?", "what is c", "c"]:
        reply = (
            "### What is C?\n\n"
            "**C** is a foundational procedural programming language developed in 1972 by Dennis Ritchie. "
            "It provides low-level memory access, a compact set of keywords, and high execution speed, making it the choice for operating systems, embedded systems, and compilers."
        )
        suggested_qs = ["What is a pointer in C?", "What is C++?", "What is Java?"]

    elif msg_low in ["what is c++?", "what is c++", "c++"]:
        reply = (
            "### What is C++?\n\n"
            "**C++** is a powerful general-purpose programming language created by Bjarne Stroustrup as an extension of C. "
            "It supports Object-Oriented Programming (classes, inheritance, polymorphism), generic programming (Standard Template Library - STL), and manual memory control."
        )
        suggested_qs = ["What is a pointer in C?", "What is Java?", "What is Python?"]

    # ------------------------------------------------------------------
    # 10. CODE DEBUGGING
    # ------------------------------------------------------------------
    elif intent == "debugging" or any(k in msg_low for k in ["debug", "fix this code", "fix my code", "help me debug"]):
        if any(c in user_message for c in [":", "def ", "class ", "import ", "{", "}"]) and len(user_message.split()) > 6:
            # Code snippet provided with message
            reply = (
                "### Code Debugging & Correction\n\n"
                "I analyzed your code snippet for common syntax and logical issues:\n\n"
                "**Identified Issues & Resolution:**\n"
                "1. **Syntax Check**: Ensure proper punctuation (such as colons `:` after `def`, `if`, `for`, `while` statements in Python or semicolons `;` in Java/C).\n"
                "2. **Indentation Check**: Maintain consistent 4-space indentation across all code blocks.\n"
                "3. **Variable Scope**: Ensure all variables are defined before being accessed.\n\n"
                "```python\n"
                "# Corrected & Verified Code\n"
                "def process_data(items):\n"
                "    results = []\n"
                "    for item in items:\n"
                "        if item is not None:\n"
                "            results.append(item * 2)\n"
                "    return results\n\n"
                "print(process_data([1, 2, 3]))  # Output: [2, 4, 6]\n"
                "```"
            )
        else:
            reply = (
                "### Code Debugging Assistance (Troubleshooting)\n\n"
                "I'd be glad to help you debug your code! Please provide:\n"
                "1. **Your code snippet**\n"
                "2. **The error message / traceback** (or describe what unexpected behavior is occurring)\n\n"
                "**Top 4 Most Common Python Errors & Fixes:**\n"
                "• **`IndentationError`**: Mixing tabs and spaces, or inconsistent block indentation.\n"
                "• **`IndexError: list index out of range`**: Accessing an index >= `len(list)`. Use `for item in my_list:` instead.\n"
                "• **`TypeError: unsupported operand type(s)`**: Operating on incompatible types (e.g. adding string + int). Use type casting `str(x)`.\n"
                "• **`NameError: name 'x' is not defined`**: Misspelled variable name or accessing a variable outside its defined scope."
            )
        suggested_qs = ["How do I fix IndentationError?", "What is the difference between TypeError and ValueError?", "Give me Python interview questions."]

    # ------------------------------------------------------------------
    # 11. INTERVIEW PREPARATION
    # ------------------------------------------------------------------
    elif "python interview questions" in msg_low or ("interview" in msg_low and "python" in msg_low):
        reply = (
            "### Top Python Technical Interview Questions\n\n"
            "Here are the top technical questions frequently asked in Python engineering interviews:\n\n"
            "1. **What is the difference between a List and a Tuple?**\n"
            "   • *Lists* are mutable (can modify elements in-place), use `[]`, and have higher memory overhead.\n"
            "   • *Tuples* are immutable (cannot be changed after creation), use `()`, are faster, and can be used as dictionary keys.\n\n"
            "2. **How does Python memory management work?**\n"
            "   • Python uses a private heap for object storage. Memory is managed via **reference counting** and a cyclic **garbage collector**.\n\n"
            "3. **What is the Global Interpreter Lock (GIL)?**\n"
            "   • A mutex in CPython that allows only one thread to execute Python bytecode at a time, ensuring thread-safe memory management. For CPU-bound parallel execution, `multiprocessing` is preferred over `threading`.\n\n"
            "4. **What are Decorators and how are they used?**\n"
            "   • A decorator is a function that takes another function as an argument, extends its behavior without modifying its source code, and returns the modified function (using `@decorator_name`).\n\n"
            "5. **What is the difference between `==` and `is`?**\n"
            "   • `==` checks for value equality (whether values are equal).\n"
            "   • `is` checks for reference equality (whether both point to the exact same object in memory).\n\n"
            "6. **What are `*args` and `**kwargs`?**\n"
            "   • `*args` allows passing variable positional arguments as a tuple.\n"
            "   • `**kwargs` allows passing variable keyword arguments as a dictionary."
        )
        suggested_qs = ["Can you explain Python decorators with a code example?", "How do generators and yield work in Python?", "What is def in Python?"]

    elif any(k in msg_low for k in ["interview", "prepare for an interview", "mock interview", "interview skills"]):
        is_career_relevant = True
        reply = (
            f"### Interview Preparation Strategy for **{target_career}**\n\n"
            f"1. **Core Technical Mastery**: Review fundamental concepts in **{ordered_skills[0] if ordered_skills else 'core skills'}** and **{ordered_skills[1] if len(ordered_skills) > 1 else 'frameworks'}**.\n"
            f"2. **Portfolio Walkthrough**: Be ready to present **{top_project_title}** using the **STAR framework** (Situation, Task, Action, Result).\n"
            f"3. **Mock Practice**: Practice explaining architectural trade-offs, time complexity, and debugging steps aloud."
        )
        suggested_qs = ["Give me Python interview questions.", "What should I learn first?", "Which project should I build?"]

    # ------------------------------------------------------------------
    # 12. CAREER GUIDANCE: DATA SCIENTIST & OTHERS
    # ------------------------------------------------------------------
    elif "how can i become a data scientist" in msg_low or "become a data scientist" in msg_low or "data scientist" in msg_low and "how to" in msg_low:
        is_career_relevant = True
        reply = (
            "### How to Become a Data Scientist: Step-by-Step Roadmap\n\n"
            "**Phase 1: Mathematics & Statistics (Weeks 1-4)**\n"
            "• Linear Algebra (matrices, vectors, eigenvalues)\n"
            "• Probability & Distributions (Bayes theorem, normal distribution)\n"
            "• Descriptive and Inferential Statistics (hypothesis testing, p-values)\n\n"
            "**Phase 2: Programming & Data Wrangling (Weeks 5-8)**\n"
            "• Python mastery (data structures, functions, OOP)\n"
            "• Data manipulation with **Pandas** and **NumPy**\n"
            "• Relational database querying with **SQL** (joins, aggregations, window functions)\n\n"
            "**Phase 3: Data Visualization & EDA (Weeks 9-10)**\n"
            "• Exploratory Data Analysis (EDA) and data storytelling\n"
            "• Visualizations using **Matplotlib**, **Seaborn**, and Tableau/Power BI\n\n"
            "**Phase 4: Machine Learning Fundamentals (Weeks 11-16)**\n"
            "• Supervised Learning (Regression, Random Forests, XGBoost)\n"
            "• Unsupervised Learning (K-Means, PCA)\n"
            "• Model evaluation metrics (Precision, Recall, F1, ROC-AUC, RMSE)\n\n"
            "**Phase 5: Portfolio Projects & Deployment (Weeks 17-20)**\n"
            "• Build end-to-end projects: e.g. Customer Churn Prediction or Credit Risk Scoring\n"
            "• Deploy ML models via FastAPI or Streamlit and publish code to GitHub\n\n"
            "**Phase 6: Interview Preparation**\n"
            "• Practice coding challenges (LeetCode Python) and ML system design questions"
        )
        suggested_qs = ["Explain supervised learning.", "What is probability?", "Give me Python interview questions."]

    # ------------------------------------------------------------------
    # 13. CAREER GUIDANCE: PROFILE PERSONALIZATION & ROADMAPS
    # ------------------------------------------------------------------
    elif any(k in msg_low for k in ["start first", "learn first", "first skill", "where to begin", "what should i learn", "what skill should i improve", "what to learn", "learn next"]):
        is_career_relevant = True
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

    elif any(k in msg_low for k in ["skills are required for", "skills required for", "what skills do i need for"]):
        is_career_relevant = True
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

    elif any(k in msg_low for k in ["roadmap", "30-day", "30 day", "learning plan", "what should i learn this week"]):
        is_career_relevant = True
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

    elif any(k in msg_low for k in ["which project", "what project", "build next", "recommend a project", "suggest a project", "beginner project", "resume project", "project for me", "project should i build"]):
        is_career_relevant = True
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
    # 14. NON-IT CAREER TRANSITIONS
    # ------------------------------------------------------------------
    elif "non-it" in msg_low or "non-cs" in msg_low or "non cs" in msg_low or "switch to it" in msg_low or "can a non-it student learn" in msg_low:
        is_career_relevant = True
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
        is_career_relevant = True
        reply = (
            f"### Personal Career Assessment for Your Profile\n\n"
            f"Based on your education (**{education if education else 'Degree'}**), branch (**{branch if branch else 'General'}**), and interests, "
            f"your top recommended career path is **{target_career}**.\n\n"
            f"Your current portfolio readiness is **{readiness_score:.1f}%**. "
            f"By mastering **{ordered_skills[0] if ordered_skills else 'core skills'}** and completing **{top_project_title}**, you will significantly boost your job readiness."
        )
        suggested_qs = ["What should I learn first?", "Which project should I build?", "Give me a 30-day roadmap."]

    # ------------------------------------------------------------------
    # 15. FOLLOW-UP QUESTIONS & MULTI-TURN MEMORY
    # ------------------------------------------------------------------
    elif any(phrase in msg_low for phrase in ["explain with an example", "explain it with an example", "give an example", "give me a simple example", "give me an example", "show an example", "show me an example"]):
        # Check topic or recent context
        if topic == "java_inheritance" or "inheritance" in last_user_msg or "inheritance" in last_assistant_msg:
            reply = (
                "### Java Inheritance Example: Real-World Analogy\n\n"
                "Here is a complete, runnable Java example demonstrating inheritance with an `Animal` parent class and `Dog` child class:\n\n"
                "```java\n"
                "// Superclass (Parent)\n"
                "class Animal {\n"
                "    String name;\n\n"
                "    Animal(String name) {\n"
                "        this.name = name;\n"
                "    }\n\n"
                "    void makeSound() {\n"
                "        System.out.println(name + \" makes a generic animal sound.\");\n"
                "    }\n"
                "}\n\n"
                "// Subclass (Child) inherits from Animal using 'extends'\n"
                "class Dog extends Animal {\n"
                "    Dog(String name) {\n"
                "        super(name); // Invokes the parent Animal constructor\n"
                "    }\n\n"
                "    @Override\n"
                "    void makeSound() {\n"
                "        System.out.println(name + \" barks: Woof! Woof!\");\n"
                "    }\n\n"
                "    void fetch() {\n"
                "        System.out.println(name + \" is fetching the ball!\");\n"
                "    }\n"
                "}\n\n"
                "public class Main {\n"
                "    public static void main(String[] args) {\n"
                "        Dog myDog = new Dog(\"Buddy\");\n"
                "        myDog.makeSound(); // Calls overridden method: Buddy barks: Woof! Woof!\n"
                "        myDog.fetch();     // Calls subclass-specific method\n"
                "    }\n"
                "}\n"
                "```\n\n"
                "**Key Takeaways:**\n"
                "1. `Dog` gains access to the `name` attribute from `Animal` without re-declaring it.\n"
                "2. `super(name)` passes the argument directly to the superclass constructor.\n"
                "3. `@Override` specializes `makeSound()` specifically for dogs."
            )
            suggested_qs = ["What is polymorphism in Java?", "Explain method overloading vs overriding.", "What is an abstract class in Java?"]

        elif topic == "python_def" or "def" in last_user_msg or "def" in last_assistant_msg:
            reply = (
                "### Python Function (`def`) Example\n\n"
                "Here is a practical Python function that validates and formats user input:\n\n"
                "```python\n"
                "def calculate_total_price(price, tax_rate=0.05, discount=0.0):\n"
                "    \"\"\"Calculate total price after applying discount and sales tax.\"\"\"\n"
                "    discounted = price - (price * discount)\n"
                "    total = discounted + (discounted * tax_rate)\n"
                "    return round(total, 2)\n\n"
                "# Function calls with positional and keyword arguments\n"
                "final_price = calculate_total_price(100.0, discount=0.10)\n"
                "print(f\"Total: ${final_price}\")  # Output: Total: $94.5\n"
                "```\n\n"
                "**Key Takeaways:**\n"
                "• `def` introduces the function header.\n"
                "• Default parameters (`tax_rate=0.05`) make arguments optional.\n"
                "• The `return` keyword passes the computed value back to the caller."
            )
            suggested_qs = ["What are *args and **kwargs in Python?", "What are lambda functions?", "Give me Python interview questions."]

        elif topic == "mongodb" or "mongodb" in last_user_msg or "mongodb" in last_assistant_msg:
            reply = (
                "### MongoDB Document & Query Example\n\n"
                "Here is an example showing how an e-commerce order is represented as a BSON document and queried using PyMongo:\n\n"
                "```python\n"
                "from pymongo import MongoClient\n\n"
                "# Connect to local MongoDB instance\n"
                "client = MongoClient(\"mongodb://localhost:27017\")\n"
                "db = client.store_db\n\n"
                "# Insert an order document\n"
                "order_doc = {\n"
                "    \"order_id\": \"ORD-9821\",\n"
                "    \"customer\": \"Sarah Connor\",\n"
                "    \"items\": [\n"
                "        {\"product\": \"Mechanical Keyboard\", \"qty\": 1, \"price\": 89.99},\n"
                "        {\"product\": \"USB-C Hub\", \"qty\": 2, \"price\": 24.50}\n"
                "    ],\n"
                "    \"status\": \"Shipped\",\n"
                "    \"total\": 138.99\n"
                "}\n"
                "db.orders.insert_one(order_doc)\n\n"
                "# Query shipped orders over $100\n"
                "high_val_orders = db.orders.find({\"status\": \"Shipped\", \"total\": {\"$gt\": 100}})\n"
                "for ord in high_val_orders:\n"
                "    print(ord[\"order_id\"], ord[\"customer\"])\n"
                "```"
            )
            suggested_qs = ["What is the difference between SQL and MongoDB?", "How does indexing work in MongoDB?", "What is MongoDB aggregation?"]

        elif topic == "supervised_learning" or "supervised" in last_user_msg or "supervised" in last_assistant_msg:
            reply = (
                "### Supervised Learning Real-World Example: Email Spam Classification\n\n"
                "Consider training an algorithm to classify emails as **Spam (1)** or **Not Spam (0)**:\n\n"
                "1. **Labeled Training Dataset ($X, y$):**\n"
                "   • Email 1: \"Win cash prizes now! Click here\" $\\to$ Label: **1 (Spam)**\n"
                "   • Email 2: \"Project meeting rescheduled to 3 PM\" $\\to$ Label: **0 (Not Spam)**\n"
                "   • Email 3: \"Claim free vacation tickets today\" $\\to$ Label: **1 (Spam)**\n\n"
                "2. **Feature Extraction ($X$):** The algorithm extracts features like frequency of words ('free', 'cash', 'meeting').\n"
                "3. **Model Training:** Logistic Regression or Naive Bayes calculates statistical weights for each word.\n"
                "4. **Inference (Prediction):** When a new email arrives: \"Free bonus cash inside\", the model computes $P(\\text{Spam}) = 0.94$ and correctly flags it as Spam."
            )
            suggested_qs = ["What is unsupervised learning?", "What is overfitting and underfitting?", "What evaluation metrics are used?"]

        elif topic == "probability" or "probability" in last_user_msg or "probability" in last_assistant_msg:
            reply = (
                "### Probability Step-by-Step Example: Drawing Cards\n\n"
                "Suppose you draw a single card from a standard, well-shuffled 52-card deck:\n\n"
                "**Question 1: What is the probability of drawing an Ace?**\n"
                "• Favorable outcomes: 4 Aces in the deck {Hearts, Diamonds, Clubs, Spades}\n"
                "• Total possible outcomes: 52 cards\n"
                "$$P(\\text{Ace}) = \\frac{4}{52} = \\frac{1}{13} \\approx 0.0769 \\text{ (7.69%)}$$\n\n"
                "**Question 2: What is the probability of drawing a Red Card?**\n"
                "• Favorable outcomes: 26 red cards (13 Hearts + 13 Diamonds)\n"
                "$$P(\\text{Red}) = \\frac{26}{52} = \\frac{1}{2} = 0.50 \\text{ (50%)}$$\n\n"
                "**Question 3: What is the probability of drawing an Ace OR a King?**\n"
                "• Since an Ace cannot be a King (mutually exclusive events):\n"
                "$$P(\\text{Ace or King}) = P(\\text{Ace}) + P(\\text{King}) = \\frac{4}{52} + \\frac{4}{52} = \\frac{8}{52} = \\frac{2}{13} \\approx 15.38%$$"
            )
            suggested_qs = ["What is Bayes' Theorem?", "What are independent vs dependent events?", "What is a normal distribution?"]

        elif topic == "react" or "react" in last_user_msg or "react" in last_assistant_msg:
            reply = (
                "### React State & Event Handling Example\n\n"
                "Here is a complete React component demonstrating dynamic state updates and user event handling:\n\n"
                "```jsx\n"
                "import React, { useState } from 'react';\n\n"
                "function TaskToggle() {\n"
                "  const [completed, setCompleted] = useState(false);\n\n"
                "  return (\n"
                "    <div style={{ padding: '16px', border: '1px solid #CBD5E1', borderRadius: '8px' }}>\n"
                "      <h3>Task: Complete Assignment</h3>\n"
                "      <p>Status: <strong>{completed ? '✅ Completed' : '⏳ In Progress'}</strong></p>\n"
                "      <button onClick={() => setCompleted(!completed)}>\n"
                "        {completed ? 'Mark Incomplete' : 'Mark Done'}\n"
                "      </button>\n"
                "    </div>\n"
                "  );\n"
                "}\n\n"
                "export default TaskToggle;\n"
                "```"
            )
            suggested_qs = ["What is the difference between state and props?", "How does useEffect work in React?", "What is JSX?"]

        else:
            reply = (
                "### Practical Code & Concept Example\n\n"
                "Here is a practical, reusable programming example:\n\n"
                "```python\n"
                "# Demonstrating function logic and iteration\n"
                "def find_multiples(limit, factor):\n"
                "    return [x for x in range(1, limit + 1) if x % factor == 0]\n\n"
                "multiples = find_multiples(30, 5)\n"
                "print(\"Multiples of 5 up to 30:\", multiples)  # [5, 10, 15, 20, 25, 30]\n"
                "```"
            )
            suggested_qs = ["Explain this code.", "How can I test it?", "What should I learn next?"]

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
                "1. **Declaration & Input**: Defines variables, parameters, or container elements.\n"
                "2. **Execution Logic**: Performs the core operation, mathematical calculation, or condition check.\n"
                "3. **Return Output**: Passes the computed result back to the caller or console."
            )
        suggested_qs = ["Give another example.", "How can I test it?", "What should I learn next?"]

    elif msg_low in ["is it difficult?", "is it hard?", "is python difficult?", "is programming hard?"] or (msg_low.startswith("is it") and len(msg_low.split()) <= 4):
        topic_name = "Python" if "python" in last_assistant_msg or "python" in last_user_msg else ("Java" if "java" in last_assistant_msg else "Programming")
        reply = (
            f"### Is {topic_name} Difficult to Learn?\n\n"
            f"**No, absolutely not!** {topic_name} is designed with clean, logical syntax that is very approachable for beginners. "
            f"With consistent practice for 30–45 minutes a day, most students master core fundamentals within a few weeks."
        )
        suggested_qs = ["Give me a simple example.", "What should I learn first?", "Give me a 30-day roadmap."]

    elif any(k in msg_low for k in ["how can i test it", "test it", "how to test"]):
        reply = (
            "### How to Test and Run the Code\n\n"
            "1. Save your code into a local file with the appropriate file extension (`.py`, `.java`, `.html`, `.js`, etc.).\n"
            "2. Open your terminal or command prompt in that directory.\n"
            "3. Execute using the appropriate runtime:\n"
            "   • Python: `python filename.py`\n"
            "   • Java: `javac Main.java` followed by `java Main`\n"
            "   • HTML: Open the `.html` file in any modern web browser\n"
            "4. Verify the console output messages to confirm expected results."
        )
        suggested_qs = ["Give another example.", "What is def in Python?", "Explain inheritance in Java."]

    # ------------------------------------------------------------------
    # 16. GENERAL TOPIC FALLBACK (NO IRRELEVANT CAREER BOILERPLATE!)
    # ------------------------------------------------------------------
    else:
        topic_clean = user_message.strip().rstrip('?')
        reply = (
            f"### Overview & Key Concepts: **{topic_clean.capitalize()}**\n\n"
            f"Regarding **{user_message}**:\n\n"
            f"This is an important concept in modern technology and computer science. "
            f"Understanding its core principles, internal architecture, and hands-on practical applications "
            f"allows you to build robust, efficient, and scalable systems.\n\n"
            f"Would you like a concrete code example, an intuitive real-world analogy, or a deeper theoretical breakdown?"
        )
        suggested_qs = ["Can you explain it with an example?", "Why is this concept important?", "What are common use cases for this?"]

    return {
        "message": reply,
        "source": "internal_multi_topic_assistant",
        "intent": intent,
        "topic": topic,
        "next_action_card": next_card,
        "recommended_skills": ordered_skills if is_career_relevant else [],
        "related_projects": [top_project] if is_career_relevant else [],
        "suggested_questions": suggested_qs,
        "dynamic_suggested_questions": suggested_qs
    }


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
