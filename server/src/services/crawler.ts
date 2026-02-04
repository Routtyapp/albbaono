import puppeteer, { Browser, Page } from 'puppeteer-core';
import { existsSync } from 'fs';
import type { PageData } from '../types/geoScore.js';

let browserInstance: Browser | null = null;

/**
 * 시스템에 설치된 Chrome/Edge 경로 찾기
 */
function findChromePath(): string {
  const platform = process.platform;

  const windowsPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ];

  const macPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];

  const linuxPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];

  let paths: string[] = [];

  if (platform === 'win32') {
    paths = windowsPaths;
  } else if (platform === 'darwin') {
    paths = macPaths;
  } else {
    paths = linuxPaths;
  }

  for (const p of paths) {
    if (p && existsSync(p)) {
      console.log(`[Crawler] 브라우저 발견: ${p}`);
      return p;
    }
  }

  // 환경 변수에서 Chrome 경로 확인
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  throw new Error(
    'Chrome/Edge 브라우저를 찾을 수 없습니다. ' +
    '환경 변수 CHROME_PATH에 브라우저 경로를 설정하거나 Chrome/Edge를 설치해주세요.'
  );
}

/**
 * 브라우저 인스턴스 가져오기 (싱글톤)
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    const executablePath = findChromePath();
    console.log(`[Crawler] 브라우저 실행: ${executablePath}`);

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
      ],
    });
  }
  return browserInstance;
}

/**
 * 브라우저 종료
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * 단일 페이지 크롤링
 */
async function crawlPage(page: Page, url: string): Promise<PageData> {
  const startTime = Date.now();

  const response = await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  const statusCode = response?.status() || 0;
  const loadTime = Date.now() - startTime;

  const html = await page.content();
  const title = await page.title();

  return {
    url: page.url(), // 리다이렉트 후 실제 URL
    html,
    title,
    loadTime,
    statusCode,
  };
}

/**
 * 페이지에서 내부 링크 추출
 */
async function extractInternalLinks(
  page: Page,
  baseUrl: string,
  maxLinks: number
): Promise<string[]> {
  const baseHostname = new URL(baseUrl).hostname;

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    return anchors.map((a) => a.getAttribute('href')).filter(Boolean) as string[];
  });

  const uniqueLinks = new Set<string>();

  for (const link of links) {
    try {
      const absoluteUrl = new URL(link, baseUrl);

      // 같은 도메인만
      if (absoluteUrl.hostname !== baseHostname) continue;

      // 해시, 쿼리 제거
      absoluteUrl.hash = '';
      const cleanUrl = absoluteUrl.href;

      // 파일 확장자 제외
      if (/\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|woff|woff2)$/i.test(cleanUrl)) {
        continue;
      }

      // 기본 URL과 동일하면 제외
      if (cleanUrl === baseUrl || cleanUrl === baseUrl + '/') continue;

      uniqueLinks.add(cleanUrl);

      if (uniqueLinks.size >= maxLinks) break;
    } catch {
      // 잘못된 URL 무시
    }
  }

  return Array.from(uniqueLinks);
}

export interface CrawlOptions {
  includeSubpages?: boolean;
  maxSubpages?: number;
}

export interface CrawlResult {
  pages: PageData[];
  errors: Array<{ url: string; error: string }>;
}

/**
 * 메인 크롤링 함수
 */
export async function crawlSite(
  url: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const { includeSubpages = false, maxSubpages = 10 } = options;

  const browser = await getBrowser();
  const page = await browser.newPage();

  // User-Agent 설정
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // 타임아웃 설정
  page.setDefaultTimeout(30000);

  const pages: PageData[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  try {
    // 메인 페이지 크롤링
    const mainPage = await crawlPage(page, url);
    pages.push(mainPage);

    // 서브페이지 크롤링
    if (includeSubpages) {
      const subLinks = await extractInternalLinks(page, url, maxSubpages);

      for (const subUrl of subLinks) {
        try {
          const subPage = await crawlPage(page, subUrl);
          pages.push(subPage);
        } catch (err) {
          errors.push({
            url: subUrl,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }
  } catch (err) {
    errors.push({
      url,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  } finally {
    await page.close();
  }

  return { pages, errors };
}

/**
 * URL 유효성 검사
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'HTTP 또는 HTTPS URL만 지원합니다.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: '유효하지 않은 URL 형식입니다.' };
  }
}
