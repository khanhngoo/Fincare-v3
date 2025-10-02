'use client'

import type React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

interface MockFileUploaderProps {
  category?: string
  acceptedFileTypes?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  onError?: (error: string) => void
}

export function MockFileUploader({
  category = "documents",
  acceptedFileTypes = ".pdf,.docx,.csv,.xlsx",
  onUploadComplete,
  onError
}: MockFileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles: UploadedFile[] = droppedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }))

    setFiles((prev) => [...prev, ...newFiles])
    setUploadStatus(null)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }))

      setFiles((prev) => [...prev, ...newFiles])
      setUploadStatus(null)
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus({
        success: false,
        message: "Please select at least one file to upload"
      })
      onError?.("No files selected")
      return
    }

    setUploading(true)
    setUploadStatus(null)

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock success - files are accepted but NOT saved to database
      setUploadStatus({
        success: true,
        message: `Successfully uploaded ${files.length} file(s) (Demo mode - not saved to database)`
      })

      onUploadComplete?.(files)

      // Clear files after short delay
      setTimeout(() => {
        setFiles([])
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadStatus({
        success: false,
        message: errorMessage
      })
      onError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Drop files here or click to upload</h3>
              <p className="text-sm text-muted-foreground">
                Supports {acceptedFileTypes.replace(/\./g, '').toUpperCase().split(',').join(', ')} (Max 10MB per file)
              </p>
              <p className="text-xs text-muted-foreground italic">
                Demo mode: Files will be accepted but not saved to database
              </p>
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Selected Files ({files.length})</h4>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              size="sm"
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Confirm Upload
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {uploadStatus && (
        <Alert variant={uploadStatus.success ? 'default' : 'destructive'}>
          {uploadStatus.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <p className="font-medium">{uploadStatus.message}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-2">📝 Demo Mode Information:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Files will be validated and accepted</li>
          <li>• Upload simulation will complete successfully</li>
          <li>• <strong>No data will be saved to the database</strong></li>
          <li>• This is for demonstration purposes only</li>
        </ul>
      </div>
    </div>
  )
}
