const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

const ENDPOINT = "https://articles.alpha.canada.ca/articles-demo-darticles/wp-json/wp/v2/posts?markdown=true&_embed";

var getArticlesPost = async function () {
    return await fetch(ENDPOINT)
    .then(response => response.json())
    .then(
        data => {
            let files = [];
            for (p in data) {
                let post = data[p]
                let out = "";
                const title = post.title.rendered;
                out += "---\n";
                out += "layout: blog\n";
                out += "title: '" + title + "'\n";
                out += "description: >-\n";
                out += "  " + post.markdown.content.rendered + "\n";
                out += "author: '" + post._embedded.author[0].name + "'\n";
                out += "date: '" + post.modified + "'\n";
                out += post.Body + "\n";
        
                let slug = buildFileName(post.title);
        
                files.push({body: out, fileName: slug + ".md"})
            }
            return files;
        }
    )
}
module.exports = getArticlesPost;