const { fetch, buildFileName } = require('./shared');  

const formatPageToMarkdown = (page) => {
  const replacedTitle = page.title.rendered.replace(/&#8217;/g, "'");

  let markdownContent = '';
  markdownContent += `---\n`;
  markdownContent += `date: '${page.date}'\n`;
  markdownContent += `description: >-\n  '${page.markdown?.excerpt?.rendered || ''}'\n`;
  
  // Safely access nested media properties with optional chaining
  if (page._embedded?.['wp:featuredmedia']?.[0]) {
    const media = page._embedded['wp:featuredmedia'][0];
    const imageUrl = media.media_details?.sizes?.full?.source_url || '';
    const altText = media.alt_text || '';
    
    markdownContent += `image: ${imageUrl}\n`;
    markdownContent += `image-alt: ${altText}\n`;
    markdownContent += `thumb: ${imageUrl}\n`;
  }
  
  markdownContent += `layout: ${page.layout || 'default'}\n`
  markdownContent += `title: '${replacedTitle}'\n`;
  markdownContent += `translationKey: ${page.slug}\n`;
  if (page.type) {
    markdownContent += `type: ${page.type}\n`
  }
  markdownContent += `---\n`;
  markdownContent += `${page.content?.rendered || ''}\n`;

  return markdownContent;
};

const getGCArticlesPagesFromAPI = async function(lang) {
  try {
    const url = lang === "en" 
      ? process.env.GC_ARTICLES_ENDPOINT_EN
      : process.env.GC_ARTICLES_ENDPOINT_FR

    if (!url) {
      throw new Error(`Missing endpoint configuration for language: ${lang}`);
    }

    const response = await fetch(`${url}pages?markdown=true&_embed`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Expected array of pages from API');
    }

    return data.map(page => {
      try {
        const content = formatPageToMarkdown(page);
        const fileName = buildFileName(page.title.rendered);
        return { body: content, fileName: `${fileName}.md` };
      } catch (error) {
        console.error(`Error processing page "${page.title?.rendered || 'unknown'}":`, error);
        return null;
      }
    }).filter(Boolean); // Remove any nulls from failed processing

  } catch (error) {
    console.error('Failed to fetch pages:', error);
    throw error;
  }
}

module.exports = getGCArticlesPagesFromAPI;