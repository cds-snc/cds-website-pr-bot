const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getBlogPosts = async function(lang) {
  return await fetch(process.env.GC_ARTICLES_BLOG_ENDPOINT + "blog-" + lang + "s")
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        
        let out = "";
        out += "---\n";
        out += "layout: blog\n";
        out += "title: '" + post.og_title + "'\n";
        out += "description: >-\n";
        out += "  " + post.og_description + "\n";
        out += "author: '" + post.meta.gc_author_name + "'\n";
        out += "date: '" + post.date + "'\n";

        // Strapi can only interface with the S3 URLS for the images, so we need to convert them to
        // Cloudfront so they will be externally visible
        out += "image: " + post.og_image.url.replace(
          "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
          "https://de2an9clyit2x.cloudfront.net") + "\n";
        out += "image-alt: " + post.alt_text + "\n";
        out += "thumb: " + post.media_details.sizes.thumbnail.source_url.replace(
          "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
          "https://de2an9clyit2x.cloudfront.net") + "\n";
        out += "translationKey: " + post.slug_en + "\n";
        out += "---\n";

        // Convert any body image URLS to Cloudfront
        while (post.content.rendered.indexOf("https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com") !== -1) {
          post.content.rendered = post.content.rendered.replace(
            "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
            "https://de2an9clyit2x.cloudfront.net");
        }

        out += post.content.rendered + "\n";
        
        let slug = buildFileName(post.og_title);

        files.push({body: out, fileName: slug + ".md"})
      }
      
      return files;
    }
  )
}

module.exports = getBlogPosts;