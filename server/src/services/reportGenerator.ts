import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ReportData {
  title: string;
  type: 'weekly' | 'monthly';
  period: string;
  generatedAt: string;
  metrics: {
    citationRate: number;
    citationRateChange: number;
    shareOfVoice: number;
    shareOfVoiceChange: number;
    avgRank: number;
    avgRankChange: number;
    totalTests: number;
    totalTestsChange: number;
  };
  enginePerformance: Array<{
    engine: string;
    citationRate: number;
    avgRank: number | null;
    totalTests: number;
    citations: number;
    change: number;
  }>;
  highlights: string[];
  topQueries: Array<{ query: string; citationRate: number }>;
  worstQueries: Array<{ query: string; citationRate: number }>;
  trend?: {
    dates: string[];
    citationRates: number[];
  };
  categoryDistribution?: {
    categories: string[];
    values: number[];
  };
  aiAnalysis?: {
    summary: string;
    categoryAnalysis: Array<{ category: string; insight: string; citationRate: number }>;
    competitorAnalysis: string;
    actionItems: string[];
    highlights: string[];
  } | null;
}

async function runPythonScript(
  scriptPath: string,
  args: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath, ...args], {
      cwd: path.dirname(scriptPath),
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python script failed: ${stderr || stdout}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

export async function generateReportPdf(
  reportData: ReportData
): Promise<{ success: boolean; pdfPath?: string; error?: string }> {
  // scripts 폴더는 src/scripts 또는 dist/scripts에 위치
  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const tempDir = path.join(__dirname, '..', '..', 'temp', `report_${Date.now()}`);
  const chartsDir = path.join(tempDir, 'charts');
  const jsonPath = path.join(tempDir, 'report_data.json');
  const pdfPath = path.join(tempDir, 'report.pdf');

  try {
    // 임시 디렉토리 생성
    await fs.mkdir(chartsDir, { recursive: true });

    // 차트 데이터 준비
    const chartData = {
      trend: reportData.trend || {
        dates: ['1주차', '2주차', '3주차', '4주차'],
        citationRates: [
          reportData.metrics.citationRate - 10,
          reportData.metrics.citationRate - 5,
          reportData.metrics.citationRate - 2,
          reportData.metrics.citationRate,
        ],
      },
      enginePerformance: {
        engines: reportData.enginePerformance.map((e) => e.engine),
        citationRates: reportData.enginePerformance.map((e) => e.citationRate),
      },
      categoryDistribution: reportData.categoryDistribution || {
        categories: ['제품 추천', '서비스 비교', '기술 문의', '기타'],
        values: [35, 28, 22, 15],
      },
      topQueries: {
        queries: reportData.topQueries.slice(0, 5).map((q) => q.query),
        citationRates: reportData.topQueries.slice(0, 5).map((q) => q.citationRate),
      },
      metrics: {
        citationRate: reportData.metrics.citationRate,
        citationRateChange: reportData.metrics.citationRateChange,
        totalTests: reportData.metrics.totalTests,
        avgRank: reportData.metrics.avgRank,
        shareOfVoice: reportData.metrics.shareOfVoice,
      },
    };

    // JSON 데이터 저장
    await fs.writeFile(jsonPath, JSON.stringify(chartData, null, 2), 'utf-8');

    // 차트 생성 스크립트 실행
    const chartsScript = path.join(scriptsDir, 'generate_report_charts.py');
    console.log('Generating charts...');
    await runPythonScript(chartsScript, [jsonPath, chartsDir]);

    // PDF용 전체 데이터 준비
    const pdfData = {
      ...reportData,
      generatedAt: new Date().toISOString().split('T')[0],
    };
    await fs.writeFile(jsonPath, JSON.stringify(pdfData, null, 2), 'utf-8');

    // PDF 생성 스크립트 실행
    const pdfScript = path.join(scriptsDir, 'generate_pdf.py');
    console.log('Generating PDF...');
    await runPythonScript(pdfScript, [jsonPath, chartsDir, pdfPath]);

    // PDF 파일 존재 확인
    await fs.access(pdfPath);

    return {
      success: true,
      pdfPath,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function cleanupTempFiles(pdfPath: string): Promise<void> {
  try {
    const tempDir = path.dirname(pdfPath);
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// GEO Score PDF 생성
export interface GeoScoreData {
  url: string;
  analyzedAt: string;
  totalScore: number;
  grade: string;
  categories: {
    [key: string]: {
      score: number;
      maxScore: number;
      percentage: number;
      items: Array<{
        name: string;
        passed: boolean;
        score: number;
        maxScore: number;
        detail: string;
      }>;
    };
  };
  pages: Array<{
    url: string;
    title: string;
    scores: {
      structure: number;
      schema: number;
      url: number;
      meta: number;
      content: number;
      total: number;
    };
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    suggestion: string;
    impact: string;
  }>;
}

export async function generateGeoScorePdf(
  scoreData: GeoScoreData
): Promise<{ success: boolean; pdfPath?: string; error?: string }> {
  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const tempDir = path.join(__dirname, '..', '..', 'temp', `geo_score_${Date.now()}`);
  const jsonPath = path.join(tempDir, 'score_data.json');
  const pdfPath = path.join(tempDir, 'geo_score_report.pdf');

  try {
    // 임시 디렉토리 생성
    await fs.mkdir(tempDir, { recursive: true });

    // JSON 데이터 저장
    await fs.writeFile(jsonPath, JSON.stringify(scoreData, null, 2), 'utf-8');

    // PDF 생성 스크립트 실행
    const pdfScript = path.join(scriptsDir, 'generate_geo_score_pdf.py');
    console.log('Generating GEO Score PDF...');
    await runPythonScript(pdfScript, [jsonPath, pdfPath]);

    // PDF 파일 존재 확인
    await fs.access(pdfPath);

    return {
      success: true,
      pdfPath,
    };
  } catch (error) {
    console.error('GEO Score PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// AI Insights PDF 생성
export interface InsightsData {
  id: string;
  brandId: string;
  brandName: string;
  commonKeywords: Array<{
    keyword: string;
    count: number;
    importance: 'high' | 'medium' | 'low';
    description: string;
  }>;
  categoryInsights: Array<{
    category: string;
    keyFactors: string[];
    recommendation: string;
  }>;
  citationPatterns: {
    citedPatterns: string[];
    uncitedPatterns: string[];
  };
  actionableInsights: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
  }>;
  contentGaps: Array<{
    area: string;
    currentState: string;
    recommendation: string;
  }>;
  metadata: {
    analyzedAt: string;
    totalResponses: number;
    citedResponses: number;
    categories: string[];
  };
}

export async function generateInsightsPdf(
  insightsData: InsightsData
): Promise<{ success: boolean; pdfPath?: string; error?: string }> {
  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const tempDir = path.join(__dirname, '..', '..', 'temp', `insights_${Date.now()}`);
  const jsonPath = path.join(tempDir, 'insights_data.json');
  const pdfPath = path.join(tempDir, 'insights_report.pdf');

  try {
    // 임시 디렉토리 생성
    await fs.mkdir(tempDir, { recursive: true });

    // JSON 데이터 저장
    await fs.writeFile(jsonPath, JSON.stringify(insightsData, null, 2), 'utf-8');

    // PDF 생성 스크립트 실행
    const pdfScript = path.join(scriptsDir, 'generate_insights_pdf.py');
    console.log('Generating AI Insights PDF...');
    await runPythonScript(pdfScript, [jsonPath, pdfPath]);

    // PDF 파일 존재 확인
    await fs.access(pdfPath);

    return {
      success: true,
      pdfPath,
    };
  } catch (error) {
    console.error('AI Insights PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
