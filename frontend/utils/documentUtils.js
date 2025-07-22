export const deleteDocument = async (doc) => {
  try {
    let response;
    
    if (doc.type === 'interview_document') {
      // Interview document
      const documentId = doc.id.replace('interview_', '');
      response = await fetch(`http://localhost:8000/interviews/${doc.interview_id}/documents/${documentId}`, {
        method: 'DELETE'
      });
    } else {
      // Original corpus document
      response = await fetch(`http://localhost:8000/corpus/${doc.id}`, {
        method: 'DELETE'
      });
    }
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to delete document' };
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
};

// Keep these for backward compatibility
export const deleteInterviewDocument = async (interviewId, documentId) => {
  const mockDoc = { 
    type: 'interview_document', 
    id: `interview_${documentId}`, 
    interview_id: interviewId 
  };
  return deleteDocument(mockDoc);
};

export const deleteCorpusDocument = async (documentId) => {
  const mockDoc = { 
    type: 'original_corpus', 
    id: documentId 
  };
  return deleteDocument(mockDoc);
};