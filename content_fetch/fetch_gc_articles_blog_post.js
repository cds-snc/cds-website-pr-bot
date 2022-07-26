const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getBlogPostsFromGCArticles = async function(lang) {
  return await fetch(lang == "en" ? process.env.GC_ARTICLES_BLOG_ENDPOINT_EN + "posts?markdown=true&_embed" : process.env.GC_ARTICLES_BLOG_ENDPOINT_FR + "posts?markdown=true&_embed")
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        
        let out = "";
        out += "---\n";
        out += "layout: blog\n";
        out += "title: '" + post.title.rendered + "'\n";
        out += "description: >-\n";
        out += "  " + post.markdown.excerpt.rendered + "\n";
        out += "author: '" + post.meta.gc_author_name + "'\n";
        out += "date: '" + post.date + "'\n";

        out += "image: " + post.yoast_head_json.og_image[0].url.replace(
          "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
          "https://de2an9clyit2x.cloudfront.net") + "\n";
        out += "image-alt: " + post._embedded['wp:featuredmedia'][0].alt_text + "\n";
        out += "thumb: " + post._embedded['wp:featuredmedia'][0].media_details.sizes.thumbnail.source_url.replace(
          "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
          "https://de2an9clyit2x.cloudfront.net") + "\n";
        out += "translationKey: " + post.slug + "\n";
        out += "---\n";

        // Convert any body image URLS to Cloudfront
        while (post.markdown.content.rendered.indexOf("https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com") !== -1) {
          post.markdown.content.rendered = post.markdown.content.rendered.replace(
            "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
            "https://de2an9clyit2x.cloudfront.net");
        }

        out += post.markdown.content.rendered + "\n";
        
        let slug = buildFileName(post.title.rendered);

        files.push({body: out, fileName: slug + ".md"})
      }
      
      return files;
    }
  )
}

module.exports = getBlogPostsFromGCArticles;