if (process.env.NODE_ENV != "Production") {
  const envResult = require('dotenv').config()
}
const github = require('@actions/github');
const Base64 = require('js-base64').Base64;

const myToken = "eea2c9b2e17474870ccd974efe07421d2b02f68c"; // process.env.TOKEN;
const octokit = github.getOctokit(myToken);

const getBlogPosts = require("./content_fetch/fetch_blog_posts");

const getHeadSha = async (repo, branch = 'master') => {
  const { data: data } = await octokit.repos.getBranch({
    owner: 'cds-snc',
    repo,
    branch,
  });
  return data.commit.sha;
}

/*

Steps to update:

1. Strapi webhook calls this on a change in Strapi
2. Pull down digital-canada-ca
3. Run build content script to generate / update markdown
4. Do a pull request onto digital-canada-ca with the new content

*/

async function run() {
  // who
  const { data: data } = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca'
  });
  //console.log(data)

  const { data: blogPostsEnData } = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    path: '/content/en/blog/posts',
  });
  //console.log(blogPostsEnData)
  /*
  var blogPostsEn = []
  for (bp in blogPostsEnData) {
    console.log(blogPostsEnData[bp].data.content)
    blogPostsEn.push(Base64.decode(blogPostsEnData[bp].content))
  }
  console.log(blogPostsEn)
  */

  const websiteSha = await getHeadSha("digital-canada-ca", "master");

  // Get CMS Content
  var blogPostsEnNew = await getBlogPosts("en");
  console.log(blogPostsEnNew);

  branchName = `release-${new Date().getTime()}`;
  await octokit.git.createRef({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    ref: `refs/heads/${branchName}`,
    sha: websiteSha
  });

  // for each modified or changed file:
  
  for (f in blogPostsEnNew) {
    // === if file new or modified code here! ====
    var exists = blogPostsEnData.filter(blogPostEnglish => blogPostEnglish.name == blogPostsEnNew[f].fileName)
    console.log(exists)
    /* TODO - modified files */
    if (exists.length == 0) {
      console.log("CREATE NEW FILE!")
      let content = Base64.encode(blogPostsEnNew[f].body)
      
      /*await octokit.repos.createOrUpdateFileContents({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        //sha: fileSha, // if update this is required
        path: "content/en/blog/posts/" + blogPostsEnNew[f].fileName,
        content: content,
        branch: branchName,
        message: "Added blog post file: " + blogPostsEnNew[f].fileName
      })
      */
      
    }
  }
  

  /*
  // Make the PR
  await octokit.pulls.create({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    title: `[AUTO-PR] New content release -  ${new Date().toISOString()}`,
    head: branchName,
    base: 'master',
    body: "Testing!",
    draft: false
  });
  */
}
run();