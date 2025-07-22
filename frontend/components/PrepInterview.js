import { useState, useEffect } from 'react';

export default function PrepInterview() {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Form states
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    company: '',
    role: '',
    topics: '',
    description: ''
  });

  const [documentForm, setDocumentForm] = useState({
    title: '',
    content: '',
    source: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      console.log('Fetching interviews...');
      setLoading(true);
      const response = await fetch('http://localhost:8000/interviews');
      console.log('Interviews response status:', response.status);
      const data = await response.json();
      console.log('Interviews data received:', data);
      setInterviews(data.interviews || []);
      console.log('Interviews state updated. Count:', data.interviews?.length || 0);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async () => {
    try {
      console.log('Creating interview with data:', interviewForm);
      const response = await fetch('http://localhost:8000/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewForm)
      });
      
      console.log('Create interview response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Interview created successfully:', data);
        // Ensure the interview has a documents array
        const interviewWithDocs = {
          ...data.interview,
          documents: data.interview.documents || []
        };
        console.log('Setting selected interview:', interviewWithDocs);
        setSelectedInterview(interviewWithDocs);
        setShowCreateForm(false);
        setInterviewForm({ title: '', company: '', role: '', topics: '', description: '' });
        await fetchInterviews();
      } else {
        console.error('Failed to create interview. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error creating interview:', error);
    }
  };

  const addDocument = async () => {
    if (!selectedInterview) {
      console.error('No selected interview for adding document');
      return;
    }
    
    try {
      console.log('Adding document to interview:', selectedInterview.id);
      console.log('Document data:', documentForm);
      
      const response = await fetch(`http://localhost:8000/interviews/${selectedInterview.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentForm)
      });
      
      console.log('Add document response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Document added successfully:', data);
        console.log('Previous interview state:', selectedInterview);
        
        setSelectedInterview(prev => {
          const updated = {
            ...prev,
            documents: [...(prev.documents || []), data.document]
          };
          console.log('Updated interview state:', updated);
          return updated;
        });
        
        setShowAddDocument(false);
        setDocumentForm({ title: '', content: '', source: '' });
      } else {
        console.error('Failed to add document. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  const getSuggestions = async (interviewId) => {
    try {
      console.log('Getting AI suggestions for interview:', interviewId);
      setLoadingSuggestions(true);
      
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}/suggest-papers`, {
        method: 'POST'
      });
      
      console.log('Suggestions response status:', response.status);
      
      const data = await response.json();
      console.log('Suggestions data received:', data);
      
      setSuggestions(data.suggestions || []);
      console.log('Suggestions state updated. Count:', data.suggestions?.length || 0);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addSuggestedPaper = async (suggestion) => {
    console.log('Adding suggested paper:', suggestion);
    setDocumentForm({
      title: suggestion.title,
      content: `AI-suggested paper: ${suggestion.title}\n\nReason for relevance: ${suggestion.reason}\n\n[Add your notes and content about this paper here]`,
      source: 'AI Suggestion'
    });
    setShowAddDocument(true);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontFamily: 'sans-serif'
      }}>
        Loading interviews...
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '600', margin: 0, color: '#333' }}>
            Interview Preparation
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
            Prepare for interviews by curating relevant papers and materials
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>+</span>
          New Interview Prep
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedInterview ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        
        {/* Interviews List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
            Your Interviews ({interviews.length})
          </h2>
          
          {interviews.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No interviews yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Create your first interview prep
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={async () => {
                    try {
                      console.log('Selecting interview:', interview.id);
                      // Fetch full interview details with documents
                      const response = await fetch(`http://localhost:8000/interviews/${interview.id}`);
                      console.log('Interview details response status:', response.status);
                      const data = await response.json();
                      console.log('Interview details data received:', data);
                      setSelectedInterview(data.interview);
                      setSuggestions([]);
                      console.log('Selected interview set successfully');
                    } catch (error) {
                      console.error('Error fetching interview details:', error);
                      console.log('Falling back to basic interview data');
                      setSelectedInterview(interview);
                    }
                  }}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: selectedInterview?.id === interview.id ? '#f0f9ff' : '#ffffff',
                    border: selectedInterview?.id === interview.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                    {interview.title}
                  </h3>
                  
                  {(interview.company || interview.role) && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                      {interview.role} {interview.company && interview.role && 'at'} {interview.company}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {interview.document_count} documents
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(interview.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interview Details */}
        {selectedInterview && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {selectedInterview.title}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => getSuggestions(selectedInterview.id)}
                  disabled={loadingSuggestions}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: loadingSuggestions ? 'not-allowed' : 'pointer',
                    opacity: loadingSuggestions ? 0.6 : 1
                  }}
                >
                  {loadingSuggestions ? 'Getting suggestions...' : 'Get AI Suggestions'}
                </button>
                <button
                  onClick={() => setShowAddDocument(true)}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Add Document
                </button>
              </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                  AI-Suggested Papers & Topics
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#065f46' }}>
                          {suggestion.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#047857', margin: 0, lineHeight: '1.4' }}>
                          {suggestion.reason}
                        </p>
                      </div>
                      <button
                        onClick={() => addSuggestedPaper(suggestion)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          marginLeft: '1rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                Documents ({selectedInterview.documents?.length || 0})
              </h3>
              
              {(!selectedInterview.documents || selectedInterview.documents.length === 0) ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No documents added yet</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Get AI suggestions or add documents manually to build your knowledge base
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {selectedInterview.documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                          {doc.title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                          {doc.word_count} words
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                        Source: {doc.source}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5', margin: 0 }}>
                        {doc.content.slice(0, 200)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Interview Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#333' }}>
              Create Interview Preparation
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Interview Title *
                </label>
                <input
                  type="text"
                  value={interviewForm.title}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Google ML Engineer Interview"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={interviewForm.company}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Google"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={interviewForm.role}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="ML Engineer"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Key Topics
                </label>
                <input
                  type="text"
                  value={interviewForm.topics}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, topics: e.target.value }))}
                  placeholder="Machine Learning, Deep Learning, NLP"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea
                  value={interviewForm.description}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what you know about the interview focus areas..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setInterviewForm({ title: '', company: '', role: '', topics: '', description: '' });
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createInterview}
                disabled={!interviewForm.title}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: interviewForm.title ? '#4f46e5' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: interviewForm.title ? 'pointer' : 'not-allowed'
                }}
              >
                Create Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocument && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#333' }}>
              Add Document
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Attention Is All You Need"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Source
                </label>
                <input
                  type="text"
                  value={documentForm.source}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., arXiv:1706.03762"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Content *
                </label>
                <textarea
                  value={documentForm.content}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Paste the abstract, paper content, or your notes here..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  setShowAddDocument(false);
                  setDocumentForm({ title: '', content: '', source: '' });
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addDocument}
                disabled={!documentForm.title || !documentForm.content}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: (documentForm.title && documentForm.content) ? '#4f46e5' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: (documentForm.title && documentForm.content) ? 'pointer' : 'not-allowed'
                }}
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}