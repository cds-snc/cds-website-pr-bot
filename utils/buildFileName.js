var buildFileName = function(title) {
  let slug = "";

  // sanitize special characters
  title = title.replace(",", "");
  title = title.replace(" / ", " ");
  title = title.replace("/", " ");
  title = title.replace("(", " ");
  title = title.replace(")", " ");

  // build filename
  let fields = title.split(" ");
  for (i in fields) {
    slug += fields[i].toLowerCase();
    if (i < fields.length - 1) {
      slug += "-"
    }
  }

  return slug;
}

module.exports = buildFileName;