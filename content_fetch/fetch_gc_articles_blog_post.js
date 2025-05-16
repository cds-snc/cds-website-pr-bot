const fetch = require("node-fetch");
const buildFileName = require("../utils/buildFileName");

var getBlogPostsFromGCArticles = async function (lang) {
  let page = 1;
  const perPage = 100;
  let baseUrl =
    lang == "en"
      ? process.env.GC_ARTICLES_ENDPOINT_EN
      : process.env.GC_ARTICLES_ENDPOINT_FR;


  let files = [];
  
  while (true) {
    const url = `${baseUrl}posts?markdown=true&_embed&per_page=${perPage}&page=${page}`;
    const response = await fetch(url);

    if (response.status === 400) {
      console.log("Reached the end of the pages");
      break;
    }

    if (!response.ok) {
      console.error("Error fetching data:", response.statusText);
      break;
    }

    const data = await response.json();

    if (data.length === 0) {
      console.log("No more data available");
      break;
    }
    for (const post of data) {
      let replacedTitle = post.title.rendered.replace(/&#8217;/g, "’");
      let category = post._embedded["wp:term"];
      let categoryNames = [];
      let out = "";
      out += "---\n";
      out += "layout: blog\n";
      out += "title: '" + replacedTitle + "'\n";
      out += "description: >-\n";
      out += "  " + post.markdown.excerpt.rendered + "\n";
      out += "author: '" + post.meta.gc_author_name + "'\n";
      out += "date: '" + post.date + "'\n";
      if (post._embedded["wp:featuredmedia"]) {
        out += `image: ${post._embedded["wp:featuredmedia"][0].media_details.sizes.full.source_url}\n`;
        out += `image-alt: ${post._embedded["wp:featuredmedia"][0].alt_text}\n`;
        out += `thumb: ${post._embedded["wp:featuredmedia"][0].media_details.sizes.full.source_url}\n`;
      }
      if (category) {
        category.forEach((group) => {
          group.forEach((term) => {
            categoryNames.push(term.name);
          });
        });
      } else {
        categoryNames = [""];
      }
      out += "tags: " + JSON.stringify(categoryNames) + "\n";
      out += "translationKey: " + post.slug + "\n";
      out += "---\n";

      // Convert any body image URLS to Cloudfront

      out += post.content.rendered + "\n";

      let slug = buildFileName(replacedTitle);

      files.push({ body: out, fileName: slug + ".md" });
    }
    page++;
  }
  return files;
};

module.exports = getBlogPostsFromGCArticles;
