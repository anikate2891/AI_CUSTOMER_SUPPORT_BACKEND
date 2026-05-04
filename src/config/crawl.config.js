import { PlaywrightCrawler, log } from 'crawlee'
import knowledgeChunkModel from '../models/knowledge.model.js'
import businessModel from '../models/business.model.js'

export const crawlAndSave = async (businessId, websiteURL) => {
    try {
        log.setLevel(log.LEVELS.OFF)
        const chunks = []

        const crawler = new PlaywrightCrawler({
            maxRequestsPerCrawl: 20,
            async requestHandler({ page, request }) {
                // wait for JS to finish rendering
                await page.waitForLoadState('networkidle')

                const text = await page.innerText('body')

                if (text) {
                    chunks.push({
                        businessId,
                        sourceUrl: request.url,
                        text: text.replace(/\s+/g, ' ').trim()
                    })
                }

                // follow links within the same domain
                const links = await page.$$eval('a[href]', (els, base) =>
                    els
                        .map(el => el.getAttribute('href'))
                        .filter(href => href && href.startsWith('/'))
                        .map(href => `${base}${href}`),
                    new URL(websiteURL).origin
                )

                await crawler.addRequests(links)
            },
        })

        await crawler.run([websiteURL])

        await knowledgeChunkModel.insertMany(chunks)

        await businessModel.findByIdAndUpdate(businessId, { isCrawling: 'done' })

    } catch (error) {
        console.log(error)
        await businessModel.findByIdAndUpdate(businessId, { isCrawling: 'failed' })
    }
}