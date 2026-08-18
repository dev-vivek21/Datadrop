import { useState, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import Toast from './components/Toast'
import './App.css'

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [parsedData,   setParsedData]   = useState(null)
  const [activeTab,    setActiveTab]    = useState('overview')
  const [filters,      setFilters]      = useState([])  // [{id, col, op, value}]
  const [toast,        setToast]        = useState(null)

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleFileAccepted = useCallback((file, data) => {
    setUploadedFile(file)
    setParsedData(data)
    setActiveTab('overview')
    setFilters([])
  }, [])

  const handleReset = useCallback(() => {
    setUploadedFile(null)
    setParsedData(null)
    setActiveTab('overview')
    setFilters([])
  }, [])

  return (
    <>
      <div className="ambient-blob blob-1" aria-hidden="true" />
      <div className="ambient-blob blob-2" aria-hidden="true" />

      <Dashboard
        uploadedFile={uploadedFile}
        parsedData={parsedData}
        activeTab={activeTab}
        filters={filters}
        onTabChange={setActiveTab}
        onFiltersChange={setFilters}
        onFileAccepted={handleFileAccepted}
        onReset={handleReset}
        onError={showToast}
        onToast={showToast}
      />

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}
    </>
  )
}
