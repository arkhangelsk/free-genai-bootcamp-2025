import chromadb
import os
import json
import glob
from sentence_transformers import SentenceTransformer
import uuid

class QuizVectorSearch:
    def __init__(self, questions_dir="questions", db_dir="chroma_db"):
        """Initialize the vector search with directories for questions and the database."""
        self.questions_dir = questions_dir
        self.db_dir = db_dir
        
        # Create directories if they don't exist
        os.makedirs(self.questions_dir, exist_ok=True)
        os.makedirs(self.db_dir, exist_ok=True)
        
        # Initialize the embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(path=self.db_dir)
        
        # Create or get the collection
        try:
            self.collection = self.client.get_collection("arabic_quiz_questions")
            print(f"Loaded existing collection with {self.collection.count()} questions")
        except:
            self.collection = self.client.create_collection(
                name="arabic_quiz_questions",
                metadata={"hnsw:space": "cosine"}
            )
            print("Created new collection for Arabic quiz questions")
    
    def load_all_questions(self):
        """Load all questions from JSON files in the questions directory."""
        all_questions = []
        
        # Get all JSON files in the questions directory
        json_files = glob.glob(os.path.join(self.questions_dir, "*.json"))
        
        for file_path in json_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    questions = json.load(f)
                
                # Extract the category from the filename
                category = os.path.basename(file_path).replace('.json', '').replace('_', ' ').replace('&', ' & ').title()
                
                # Add each question with its category
                for question in questions:
                    question['category'] = category
                    question['file_path'] = file_path
                    all_questions.append(question)
                    
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
        
        return all_questions
    
    def index_questions(self, force_reindex=False):
        """Index all questions in the vector database."""
        # Check if we need to reindex
        if force_reindex:
            try:
                self.collection.delete(where={})
                print("Deleted existing index")
            except:
                pass
        elif self.collection.count() > 0:
            print(f"Collection already has {self.collection.count()} questions indexed")
            return
        
        # Load all questions
        all_questions = self.load_all_questions()
        
        if not all_questions:
            print("No questions found to index")
            return
        
        # Prepare data for indexing
        ids = []
        documents = []
        metadatas = []
        
        for question in all_questions:
            # Create a unique ID for each question
            question_id = str(uuid.uuid4())
            
            # Create the document text based on question type
            document_text = f"Arabic: {question['arabic_text']} "
            
            if question['type'] == 'multiple_choice':
                document_text += f"Question: {question['question']} "
                document_text += f"Options: {', '.join(question['options'])} "
            elif question['type'] == 'true_false':
                document_text += f"Statement: {question['statement']} "
            elif question['type'] == 'fill_blank':
                document_text += f"Question: {question['question']} "
                document_text += f"Answer: {question['answer']} "
            
            document_text += f"Category: {question['category']}"
            
            # Create metadata
            metadata = {
                'type': question['type'],
                'category': question['category'],
                'file_path': question['file_path'],
                'arabic_text': question['arabic_text']
            }
            
            # Add to batch
            ids.append(question_id)
            documents.append(document_text)
            metadatas.append(metadata)
        
        # Add to collection in batches
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            batch_end = min(i + batch_size, len(ids))
            self.collection.add(
                ids=ids[i:batch_end],
                documents=documents[i:batch_end],
                metadatas=metadatas[i:batch_end]
            )
        
        print(f"Indexed {len(ids)} questions")
    
    def search_questions(self, query, n_results=5, category=None):
        """Search for questions similar to the query."""
        # Build where clause if category is specified
        where_clause = None
        if category:
            print(f"Searching in category: '{category}'")
            where_clause = {"category": category}
        
        # Perform the search
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause
            )
            print(f"Search results: {len(results.get('ids', [[]])[0])} matches found")
        except Exception as e:
            print(f"Error during search: {e}")
            # Try without category filter if there was an error
            if where_clause:
                print("Retrying search without category filter")
                results = self.collection.query(
                    query_texts=[query],
                    n_results=n_results
                )
            else:
                raise
        
        # Process results
        questions = []
        if results and 'metadatas' in results and results['metadatas']:
            for i, metadata in enumerate(results['metadatas'][0]):
                # Load the original question from the file
                try:
                    with open(metadata['file_path'], 'r', encoding='utf-8') as f:
                        file_questions = json.load(f)
                        
                    # Find the matching question by arabic_text
                    for question in file_questions:
                        if question['arabic_text'] == metadata['arabic_text']:
                            # Add additional info
                            question['category'] = metadata['category']
                            question['similarity_score'] = results['distances'][0][i] if 'distances' in results else None
                            questions.append(question)
                            break
                except Exception as e:
                    print(f"Error loading question details: {e}")
        
        return questions
    
    def create_quiz_from_search(self, query, n_questions=5, category=None):
        """Create a quiz from search results."""
        questions = self.search_questions(query, n_results=n_questions, category=category)
        
        # Return the questions in a format suitable for a quiz
        return questions

# Example usage
if __name__ == "__main__":
    # Initialize the vector search
    vector_search = QuizVectorSearch()
    
    # Index all questions
    vector_search.index_questions(force_reindex=True)
    
    # Example search
    results = vector_search.search_questions("food")
    print(f"Found {len(results)} questions about food")
    for i, result in enumerate(results):
        print(f"{i+1}. {result['arabic_text']} - {result.get('question', result.get('statement', ''))}")
