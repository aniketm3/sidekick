import { useState, useEffect } from 'react';
import { deleteDocument } from '../utils/documentUtils';

export default function ViewCorpus() {
  const [corpus, setCorpus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'original', 'interview'

  useEffect(() => {
    fetchCorpus();
  }, []);

  const fetchCorpus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/corpus');
      if (!response.ok) {
        throw new Error('Failed to fetch corpus');
      }
      const data = await response.json();
      setCorpus(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching corpus:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = corpus?.documents?.filter(doc => {
    // Filter by search term
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.interview_title && doc.interview_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by type
    const matchesType = filterType === 'all' || 
                       (filterType === 'original' && doc.type === 'original_corpus') ||
                       (filterType === 'interview' && doc.type === 'interview_document');
    
    return matchesSearch && matchesType;
  }) || [];

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleDeleteDocument = async (doc) => {
    const result = await deleteDocument(doc);
    
    if (result.success) {
      await fetchCorpus();
      setSelectedDocument(null);
    } else {
      alert(`Failed to delete document: ${result.error}`);
    }
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
        <div>Loading corpus...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontFamily: 'sans-serif',
        color: '#dc2626'
      }}>
        <div>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Error loading corpus</div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>{error}</div>
          <button
            onClick={fetchCorpus}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '600', 
          margin: '0 0 0.5rem 0',
          color: '#333'
        }}>
          Knowledge Base Corpus
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '1rem',
          margin: 0
        }}>
          Explore the {corpus?.corpus_info?.total_documents || 0} documents in your knowledge base
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4f46e5' }}>
            {corpus?.corpus_info?.total_documents || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Total Documents
          </div>
        </div>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
            {(corpus?.corpus_info?.total_words || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Total Words
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '2rem', marginTop: '3rem' }}>
        <input
          type="text"
          placeholder="Search documents by title or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
        {searchTerm && (
          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.875rem', 
            color: '#6b7280' 
          }}>
            Found {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: selectedDocument ? '1fr 1fr' : '1fr'
      }}>
        {/* Documents List */}
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {filteredDocuments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280',
              fontSize: '1rem'
            }}>
              {searchTerm ? 'No documents match your search' : 'No documents found'}
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                style={{
                  backgroundColor: selectedDocument?.id === doc.id ? '#f0f9ff' : '#ffffff',
                  border: selectedDocument?.id === doc.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedDocument(selectedDocument?.id === doc.id ? null : doc)}
                onMouseOver={(e) => {
                  if (selectedDocument?.id !== doc.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedDocument?.id !== doc.id) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0,
                    lineHeight: '1.4',
                    flex: 1
                  }}>
                    {doc.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', alignItems: 'center' }}>
                    {doc.type === 'interview_document' && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#d97706',
                        backgroundColor: '#fef3c7',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        border: '1px solid #fbbf24'
                      }}>
                        {doc.interview_title}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {doc.word_count} words
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        fontSize: '0.8rem',
                        borderRadius: '4px'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Delete document"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {truncateText(doc.content, 150)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Document Detail Panel */}
        {selectedDocument && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '2rem',
            position: 'sticky',
            top: '120px',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {selectedDocument.title}
              </h2>
              <button
                onClick={() => setSelectedDocument(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem'
                }}
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div>Document ID: {selectedDocument.id}</div>
              <div>Word Count: {selectedDocument.word_count}</div>
            </div>

            <div style={{
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: '#374151',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedDocument.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}