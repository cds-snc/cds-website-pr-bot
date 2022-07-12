const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getBlogPosts = async function(lang) {
  return await fetch(process.env.STRAPI_ENDPOINT + "blog-" + lang + "s")
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        
        let out = "";
        out += "---\n";
        out += "layout: blog\n";
        out += "title: '" + post.Title + "'\n";
        out += "description: >-\n";
        out += "  " + post.Description + "\n";
        out += "author: '" + post.AuthorAndTitle + "'\n";
        out += "date: '" + post.PublishDate + "'\n";
        // Strapi can only interface with the S3 URLS for the images, so we need to convert them to
        // Cloudfront so they will be externally visible
        out += "image: " + post.BannerImage.url.replace(
          "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
          "https://de2an9clyit2x.cloudfront.net") + "\n";
        out += "image-alt: " + post.ImageAltText + "\n";
        out += "thumb: " + post.BannerImage.formats.small.url.replace(
          "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
          "https://de2an9clyit2x.cloudfront.net") + "\n";
        out += "translationKey: " + post.TranslationID + "\n";
        out += "---\n";
        // Convert any body image URLS to Cloudfront
        while (post.Body.indexOf("https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com") !== -1) {
          post.Body = post.Body.replace(
            "https://cds-website-assets-prod.s3.ca-central-1.amazonaws.com",
            "https://de2an9clyit2x.cloudfront.net");
        }
        out += post.Body + "\n";
        
        let slug = buildFileName(post.Title);
        files.push({body: out, fileName: slug + ".md"})
      }
      
      return files;
    }
  )
}
module.exports = getBlogPosts;