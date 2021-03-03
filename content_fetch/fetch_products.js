const fetch = require('node-fetch');

var getProducts = async function(lang, productType) {
  return await fetch(process.env.STRAPI_ENDPOINT + productType + lang + "s")
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        let out = "";
        out += "---\n";
        out += "title: " + post.title + "\n";
        out += "translationKey: " + post.TranslationID + "\n";
        out += "description: >-\n";
        out += "  " + post.description + "\n";
        
        if (post.LinkToProduct)
          out += "product-url: " + post.LinkToProduct + "\n";

        out += "phase: " + post.phase + "\n";
        out += "status: " + (post.status == "inflight" ? "in-flight" : post.status) + "\n"; // strapi regex does not allow the dash
        out += "onhomepage: " + post.onhomepage + "\n";

        out += "contact:\n";
        for (c in post.contacts) {
          out += "  - email: " + post.contacts[c].email + "\n";
          out += "    name: " + post.contacts[c].name + "\n";
        }

        if (post.partners.length > 0) {
          out += "partners:\n";
          for (pp in post.partners) {
            let partner = post.partners[pp];
            out += "  - name: " + partner["name" + lang.toUpperCase()] + "\n";
            out += "    url: " + partner["url" + lang.toUpperCase()] + "\n";
          }
        }

        if (post.product_links.length > 0) {
          out += "links:\n";
          for (l in post.product_links) {
            let link = post.product_links[l];
            out += "  - name: " + link["linkText" + lang.toUpperCase()] + "\n";
            out += "    url: " + link["url" + lang.toUpperCase()] + "\n";
          }
        }
        out += "---\n";

        let slug = "";
        let fields = post.title.split(" ");
        for (i in fields) {
          slug += fields[i].toLowerCase();
          if (i < fields.length - 1) {
            slug += "-"
          }
        }

        files.push({body: out, fileName: slug + ".md"})
      }
      return files;
    }
  )
}

module.exports = getProducts;