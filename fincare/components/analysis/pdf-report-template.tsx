import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3
  },
  infoSection: {
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4
  },
  infoRow: {
    fontSize: 10,
    marginBottom: 4,
    color: '#334155'
  },
  scoreBox: {
    backgroundColor: '#eff6ff',
    border: 2,
    borderColor: '#2563eb',
    borderRadius: 6,
    padding: 15,
    marginVertical: 12,
    textAlign: 'center'
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  scoreLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 5
  },
  section: {
    marginTop: 18,
    marginBottom: 12
  },
  heading1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderLeft: 4,
    borderLeftColor: '#2563eb'
  },
  heading2: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 10,
    marginBottom: 6
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 6,
    color: '#1e293b'
  },
  bulletPoint: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 5,
    marginLeft: 15,
    color: '#334155'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  }
})

interface PDFReportProps {
  businessName: string
  loanAmount: string
  bankName: string
  productName: string
  baselineScore: number
  reportText: string
  generatedDate: string
}

// Helper to parse markdown-style report into sections
function parseReport(text: string) {
  const sections: Array<{ title: string; content: string }> = []
  const lines = text.split('\n')

  let currentSection: { title: string; content: string } | null = null

  for (const line of lines) {
    // Detect heading (## Title)
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        title: line.replace('## ', '').trim(),
        content: ''
      }
    } else if (currentSection) {
      currentSection.content += line + '\n'
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

// Helper to format content with bullet points
function formatContent(content: string) {
  const lines = content.split('\n').filter(line => line.trim())
  return lines.map((line, index) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      return (
        <Text key={index} style={styles.bulletPoint}>
          • {trimmed.substring(2)}
        </Text>
      )
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      // Bold text (subheading)
      return (
        <Text key={index} style={styles.heading2}>
          {trimmed.replace(/\*\*/g, '')}
        </Text>
      )
    } else if (trimmed) {
      return (
        <Text key={index} style={styles.text}>
          {trimmed}
        </Text>
      )
    }
    return null
  })
}

export function PDFReportTemplate({ data }: { data: PDFReportProps }) {
  const sections = parseReport(data.reportText)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Loan Analysis Report</Text>
          <Text style={styles.subtitle}>FinCare AI - Comprehensive Financial Assessment</Text>
        </View>

        {/* Business Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoRow}>Business: {data.businessName}</Text>
          <Text style={styles.infoRow}>Loan Amount: {data.loanAmount}</Text>
          <Text style={styles.infoRow}>Loan Product: {data.productName} ({data.bankName})</Text>
          <Text style={styles.infoRow}>Report Date: {data.generatedDate}</Text>
        </View>

        {/* Baseline Score */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{data.baselineScore}/100</Text>
          <Text style={styles.scoreLabel}>Creditworthiness Score</Text>
        </View>

        {/* Report Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.heading1}>{section.title}</Text>
            {formatContent(section.content)}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by FinCare AI | Confidential Report | {data.generatedDate}
        </Text>
      </Page>
    </Document>
  )
}
