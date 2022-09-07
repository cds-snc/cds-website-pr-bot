const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");
const ms = Date.now();

var getGCArticlesGuides = async function (lang) {
    let url = lang == "en" ? process.env.GC_ARTICLES_ENDPOINT_EN + "product?_embed&categories=11" : process.env.GC_ARTICLES_ENDPOINT_FR + "product?_embed&categories=18";

    return await fetch(url + "?dummy=" + ms)
    .then(response => response.json())
    .then(data => {
        let files = [];
        for (p in data) {
            let post = data[p];
            let parsed = JSON.parse(post.meta.cds_product)
            let out = "";
            out += "---\n";
            out += "Title: " + post.title.rendered + "\n";
            out += "TranslationKey: " + post.slug  + "\n";
            out += "Description: >-\n";
            out += "  " + parsed.description + "\n";
            out += "ButtonText: " + parsed.button_text + "\n";
            out += "ButtonAria: " + parsed.button_aria + "\n";
            out += "Weight: " + parsed.weight + "\n";
            out += "TagID: " + parsed.tag_id + "\n";
            out += "LinkToGuide: " + parsed.button_link + "\n";
            out += "---\n\n";

            let slug = buildFileName(post.title.rendered);
            
            files.push({body: out, fileName: slug + ".md"});
        }
        return files
    }
    ).catch((e) => {
        console.error(e)
    })
}

module.exports = getGCArticlesGuides