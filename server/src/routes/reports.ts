import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import {
  generateReportPdf,
  generateGeoScorePdf,
  generateInsightsPdf,
  cleanupTempFiles,
  type ReportData,
  type GeoScoreData,
  type InsightsData,
} from '../services/reportGenerator.js';

const router = Router();

// POST /api/reports/pdf - PDF 리포트 생성 및 다운로드
router.post('/pdf', async (req: Request, res: Response) => {
  try {
    const reportData: ReportData = req.body;

    // 필수 필드 검증
    if (!reportData.title || !reportData.type || !reportData.period) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, period',
      });
    }

    // 기본값 설정
    const fullReportData: ReportData = {
      title: reportData.title,
      type: reportData.type,
      period: reportData.period,
      generatedAt: reportData.generatedAt || new Date().toISOString().split('T')[0],
      metrics: reportData.metrics || {
        citationRate: 0,
        citationRateChange: 0,
        shareOfVoice: 0,
        shareOfVoiceChange: 0,
        avgRank: 0,
        avgRankChange: 0,
        totalTests: 0,
        totalTestsChange: 0,
      },
      enginePerformance: reportData.enginePerformance || [],
      highlights: reportData.highlights || [],
      topQueries: reportData.topQueries || [],
      worstQueries: reportData.worstQueries || [],
      trend: reportData.trend,
      categoryDistribution: reportData.categoryDistribution,
      aiAnalysis: reportData.aiAnalysis || null,
    };

    console.log('Generating PDF report:', fullReportData.title);

    // PDF 생성
    const result = await generateReportPdf(fullReportData);

    if (!result.success || !result.pdfPath) {
      return res.status(500).json({
        error: result.error || 'Failed to generate PDF',
      });
    }

    // PDF 파일 읽기
    const pdfBuffer = await fs.readFile(result.pdfPath);

    // 파일명 생성
    const filename = `GEO_Report_${reportData.type}_${reportData.period.replace(/\s/g, '_')}.pdf`;

    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // PDF 전송
    res.send(pdfBuffer);

    // 임시 파일 정리 (비동기)
    cleanupTempFiles(result.pdfPath).catch(console.error);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/reports/pdf/health - 헬스 체크
router.get('/pdf/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PDF Report Generator',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/reports/geo-score - GEO Score PDF 리포트 생성
router.post('/geo-score', async (req: Request, res: Response) => {
  try {
    const scoreData: GeoScoreData = req.body;

    // 필수 필드 검증
    if (!scoreData.url || scoreData.totalScore === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: url, totalScore',
      });
    }

    console.log('Generating GEO Score PDF for:', scoreData.url);

    // PDF 생성
    const result = await generateGeoScorePdf(scoreData);

    if (!result.success || !result.pdfPath) {
      return res.status(500).json({
        error: result.error || 'Failed to generate PDF',
      });
    }

    // PDF 파일 읽기
    const pdfBuffer = await fs.readFile(result.pdfPath);

    // 파일명 생성 (URL에서 도메인 추출)
    let domain = 'site';
    try {
      const urlObj = new URL(scoreData.url);
      domain = urlObj.hostname.replace(/\./g, '_');
    } catch {}

    const filename = `GEO_Score_${domain}_${scoreData.grade}_${scoreData.totalScore}.pdf`;

    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // PDF 전송
    res.send(pdfBuffer);

    // 임시 파일 정리 (비동기)
    cleanupTempFiles(result.pdfPath).catch(console.error);
  } catch (error) {
    console.error('GEO Score PDF generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/reports/insights - AI 인사이트 PDF 리포트 생성
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const insightsData: InsightsData = req.body;

    // 필수 필드 검증
    if (!insightsData.brandName || !insightsData.metadata) {
      return res.status(400).json({
        error: 'Missing required fields: brandName, metadata',
      });
    }

    console.log('Generating AI Insights PDF for:', insightsData.brandName);

    // PDF 생성
    const result = await generateInsightsPdf(insightsData);

    if (!result.success || !result.pdfPath) {
      return res.status(500).json({
        error: result.error || 'Failed to generate PDF',
      });
    }

    // PDF 파일 읽기
    const pdfBuffer = await fs.readFile(result.pdfPath);

    // 파일명 생성
    const brandName = insightsData.brandName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const date = new Date(insightsData.metadata.analyzedAt).toISOString().split('T')[0];
    const filename = `AI_Insights_${brandName}_${date}.pdf`;

    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // PDF 전송
    res.send(pdfBuffer);

    // 임시 파일 정리 (비동기)
    cleanupTempFiles(result.pdfPath).catch(console.error);
  } catch (error) {
    console.error('AI Insights PDF generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
