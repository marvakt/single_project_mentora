# 🧠 RAG Implementation Overview - Mental Wellness Chatbot

## **Project Summary**

This project implements a **Retrieval-Augmented Generation (RAG) system** to support a mental wellness chatbot by grounding its responses in **vetted psychoeducational content and coping-exercise explanations**.

The use of RAG is intentionally **limited to knowledge retrieval**, ensuring responses remain accurate, consistent, and within a clearly defined non-clinical scope.

## **Architecture Components**

### **1. Knowledge Base**
- **Location**: `app/knowledge_base/mental_health_knowledge.json`
- **Content**: 10 carefully curated knowledge entries covering:
  - Mental health concepts (anxiety, depression, stress)
  - Therapeutic approaches (CBT, DBT) - educational overview only
  - Coping exercises (grounding, breathing, mindfulness)
  - Self-care practices (sleep hygiene)
  - Crisis resources and support

### **2. RAG Engine**
- **Location**: `app/ai_engine/rag_engine.py`
- **Core Functionality**:
  - Semantic search using sentence transformers
  - Cosine similarity for relevance matching
  - Query appropriateness validation
  - Context formatting for LLM prompts

### **3. API Endpoints**
- **Location**: `app/routes/chat.py`
- **Endpoints**:
  - `POST /api/v1/chat/chat` - Main RAG-powered chat interface
  - `POST /api/v1/chat/search-knowledge` - Direct knowledge search
  - `GET /api/v1/chat/available-topics` - Browse available topics

## **Safety & Scope Controls**

### **RAG Usage Boundaries**
✅ **RAG Supports**:
- General explanations of mental-health concepts
- High-level descriptions of therapeutic approaches for educational understanding
- Step-by-step explanations of evidence-based coping exercises
- Information about mental-health resources and professional support options

❌ **RAG Does NOT**:
- Diagnose conditions
- Assess risk or crisis severity
- Recommend or modify treatment plans
- Analyze personal medical records

### **Crisis Detection**
- **Rule-based logic** separate from RAG pipeline
- Keywords: "suicidal", "crisis", "emergency", etc.
- Immediate escalation to crisis resources
- No AI reasoning for crisis situations

### **Query Validation**
- Pre-checks for inappropriate clinical queries
- Blocks diagnostic/self-diagnostic questions
- Maintains educational focus

## **Technical Implementation**

### **Dependencies**
- `sentence-transformers` - Semantic embeddings
- `scikit-learn` - Cosine similarity calculations
- `numpy` - Numerical computations
- `torch` - PyTorch for transformer models
- `transformers` - Hugging Face models

### **Embedding Model**
- `all-MiniLM-L6-v2` - Lightweight, efficient sentence transformer
- Pre-computed embeddings for all knowledge base entries
- Real-time query embedding for similarity search

### **Search Algorithm**
- Cosine similarity between query and knowledge base embeddings
- Top-k retrieval (default k=3)
- Relevance threshold (0.1) to filter low-quality matches

## **System Workflow**

1. **User Input** - User asks an educational or informational question
2. **Crisis Detection** - Rule-based check for crisis keywords (separate from RAG)
3. **Query Validation** - Check if query is appropriate for RAG
4. **Semantic Search** - Retrieve relevant content from knowledge base
5. **Context Injection** - Format retrieved content for LLM prompt
6. **Response Generation** - Generate educational response (simulated in this implementation)
7. **Safety Check** - Ensure response remains educational and non-clinical
8. **Response Delivery** - Return to user with sources

## **Key Safety Features**

### **Educational-Only Responses**
- Clear disclaimers about educational purpose
- No clinical advice or treatment recommendations
- Professional referral guidance

### **Crisis Handling**
- Rule-based crisis detection outside RAG pipeline
- Immediate escalation to crisis resources
- No AI involvement in crisis decisions

### **Appropriateness Validation**
- Blocks diagnostic queries
- Prevents clinical decision-making
- Maintains scope boundaries

## **API Usage Examples**

### **Chat Endpoint**
```json
{
  "message": "What is anxiety?",
  "user_id": "user_123"
}
```

### **Search Endpoint**
```json
{
  "message": "breathing exercises",
  "user_id": "user_123"
}
```

### **Response Format**
```json
{
  "response": "Educational response based on retrieved knowledge...",
  "sources": [...],
  "timestamp": "...",
  "message_type": "educational"
}
```

## **Knowledge Base Structure**

Each knowledge entry contains:
- `id`: Unique identifier
- `category`: Content classification
- `title`: Descriptive title
- `content`: Detailed educational content
- `tags`: Semantic tags for search enhancement

## **Why This RAG Implementation is Appropriate**

1. **Reduces Hallucinations** - Grounded in vetted content
2. **Ensures Consistency** - Same information for similar queries
3. **Maintains Safety** - Clear boundaries and scope control
4. **Meets Ethical Requirements** - Non-clinical, educational focus
5. **Provides Accurate Information** - Based on evidence-based resources

## **One-Line Summary**

> **This project uses Retrieval-Augmented Generation to ground a mental wellness chatbot in trusted psychoeducational content and coping-exercise explanations while maintaining strict non-clinical safety boundaries.**

## **Files Created/Modified**

- `app/knowledge_base/mental_health_knowledge.json` - Knowledge base
- `app/ai_engine/rag_engine.py` - RAG engine implementation
- `app/routes/chat.py` - Chat API endpoints
- `app/requirements.txt` - Added RAG dependencies
- `test_rag.py` - RAG functionality test
- `test_rag_api.py` - API endpoint test