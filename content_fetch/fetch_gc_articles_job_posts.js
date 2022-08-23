const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getJobPostsFromGCArticles = async function (lang) {
    let url = lang == "en" ? "https://articles.alpha.canada.ca/cds-snc/wp-json/wp/v2/job?markdown=true&_embed" : "https://articles.alpha.canada.ca/cds-snc/fr/wp-json/wp/v2/job?markdown=true&_embed"
    return await fetch(url)
    .then(response => response.json())
    .then(
        data => {
            let files = [];
            for (p in data) {
                let post = data[p]
                let out = "";
                out += "---\n";
                out += "layout: job-posting\n";
                out += "type: section\n";
                out += "title: '" + post.title.rendered + "'\n";
                out += "description: >-\n";
                out += "  " + post.excerpt.rendered + "\n";
                out += "archived: " + post.meta.gc_job_archived + "\n";
                out += "translationKey: " + post.slug + "\n";
                out += "leverId: " + post.meta.gc_lever_id + "\n";
                out += "---\n\n";
                out += post.content.rendered + "\n";
        
                let slug = buildFileName(post.title.rendered + `- ${post.meta.gc_lever_id}`);
                
                files.push({body: out, fileName: slug + ".md"})
              }
              
              return files;
        }
    )
}

module.exports = getJobPostsFromGCArticles;