import * as d from '../../declarations';
import { connectBrowser, disconnectBrowser, newBrowserPage } from '../puppeteer/puppeteer-browser';
import NodeEnvironment from 'jest-environment-node';


export function createJestPuppeteerEnvironment() {

  const JestEnvironment = class extends NodeEnvironment {

    global: d.JestEnvironmentGlobal;
    browser: any = null;
    pages: any[] = [];

    constructor(config: any) {
      super(config);
    }

    async setup() {
      if ((process.env as d.E2EProcessEnv).__STENCIL_E2E_TESTS__ === 'true') {
        this.global.__NEW_TEST_PAGE__ = this.newPuppeteerPage.bind(this);
        this.global.__CLOSE_OPEN_PAGES__ = this.closeOpenPages.bind(this);
      }
    }

    async newPuppeteerPage() {
      if (!this.browser) {
        // load the browser and page on demand
        this.browser = await connectBrowser();
      }

      const page = await newBrowserPage(this.browser);
      this.pages.push(page);
      const env: d.E2EProcessEnv = process.env;
      if (typeof env.__STENCIL_DEFAULT_TIMEOUT__ === 'string') {
        page.setDefaultTimeout(parseInt(env.__STENCIL_DEFAULT_TIMEOUT__, 10) * 0.5);
      }
      return page;
    }

    async closeOpenPages() {
      await Promise.all(
        this.pages.map(page => page.close())
      );
      this.pages.length = 0;
    }

    async teardown() {
      await super.teardown();
      await this.closeOpenPages();
      await disconnectBrowser(this.browser);
      this.browser = null;
    }
  };


  return JestEnvironment;
}
