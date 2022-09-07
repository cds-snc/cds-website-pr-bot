const fetch = require('node-fetch');
const buildFileName = require('../utils/buildFileName');
const {Headers} = require('node-fetch');
var myHeaders = new Headers();
myHeaders.append('Cache-Control', 'no-cache');

var meta = {
    method: 'GET',
    headers: myHeaders
}

var getGCArticlesCoachingAndAdvice = async function (lang) {
    let url = lang == "en" ? process.env.GC_ARTICLES_ENDPOINT_EN + "product?_embed&categories=12" : process.env.GC_ARTICLES_ENDPOINT_FR + "product?_embed&categories=22";
    return await fetch(url, meta)
    .then(response => response.json())
    .then(data => {
        let files = [];
        for (p in data) {
            let post = data[p];
            let parsed = JSON.parse(post.meta.cds_product)
            let out = "";
            out += "---\n";
            out += "title: '" + post.title.rendered + "'\n";
            out += "translationKey: " + post.slug + "\n";
            out += "description: >-\n";
            out += "  " + parsed.description + "\n";

            if (parsed.button_link) {
                out += "product-url: " + parsed.button_link + "\n";
            }
            if (parsed.parsed_cds_product_links_related.length > 0) {
                out += "partners:\n";
                for (pp in parsed.parsed_cds_product_links_related) {
                    let partner = parsed.parsed_cds_product_links_related[pp];
                    out += "  - name: " + partner["text"] + "\n";
                    out += "    url: " + partner["link"] + "\n";
                }
            }
            if (parsed.parsed_cds_product_links.length > 0) {
                out += "links:\n";
                for (l in parsed.parsed_cds_product_links) {
                    let link = parsed.parsed_cds_product_links[l];
                    out += "  - name: " + link["text"] + "\n";
                    out += "    url: " + link["link"] + "\n"; 
                }
            }
            out += "---\n";

            let slug = buildFileName(post.title.rendered)
            files.push({body: out, fileName: slug + ".md"})
        }
        return files;
    }
    )
}

module.exports = getGCArticlesCoachingAndAdvice