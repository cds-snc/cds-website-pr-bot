if (process.env.NODE_ENV != "Production") {
  const envResult = require('dotenv').config()
}
const github = require('@actions/github');
const Base64 = require('js-base64').Base64;

const myToken = process.env.TOKEN;
const octokit = github.getOctokit(myToken);

async function closePRs() {
  // Close old auto PRs
  const {data: prs} = await octokit.pulls.list({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    state: 'open'
  });

  prs.forEach( async pr => {
    if(pr.title.startsWith("[AUTO-PR]")) {
      await octokit.pulls.update({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        pull_number: pr.number,
        state: "closed"
      });
      await octokit.git.deleteRef({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        ref: `heads/${pr.head.ref}`
      });
    }
  })
}

const getBlogPosts = require("./content_fetch/fetch_blog_posts");

const getHeadSha = async (repo, branch = 'master') => {
  const { data: data } = await octokit.repos.getBranch({
    owner: 'cds-snc',
    repo,
    branch,
  });
  return data.commit.sha;
}

const getExistingContent = async (path) => {
  const { data: data } = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    path: path,
  });
  //console.log(data)
  return data;
}

const createAndUpdateFiles = async (newFiles, oldFiles, path, branchName) => {
  // for each modified or changed file:
  for (f in newFiles) {
    // === if file new or modified code here! ====
    var exists = oldFiles.filter(oldFile => oldFile.name == newFiles[f].fileName)
    /* TODO - modified files:
        If exists - get that file specifically and compare blobs
    */
    if (exists.length == 0) {
      console.log("CREATE NEW FILE!")
      let content = Base64.encode(newFiles[f].body)
      
      /*
      await octokit.repos.createOrUpdateFileContents({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        //sha: fileSha, // if update this is required
        path: path + newFiles[f].fileName,
        content: content,
        branch: branchName,
        message: "Added blog post file: " + blogPostsEnNew[f].fileName
      })
      */
      
    }
  }
}

/*

Steps to update:

1. Strapi webhook calls this on a change in Strapi
2. Pull down digital-canada-ca
3. Run build content script to generate / update markdown
4. Do a pull request onto digital-canada-ca with the new content

*/

async function run() {
  /*
  // whole repo
  const { data: data } = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca'
  });
  //console.log(data)
  */

  // blog posts - en / fr
  blogPostsEnExisting = await getExistingContent('/content/en/blog/posts');
  blogPostsFrExisting = await getExistingContent('/content/fr/blog/posts');

  // job postings (en / fr)
  jobPostsEnExisting = await getExistingContent('/content/en/join-our-team/positions');
  jobPostsFrExisting = await getExistingContent('/content/fr/join-our-team/positions');
  // products (en / fr)


  // Get CMS Content
  var blogPostsEnNew = await getBlogPosts("en");
  var blogPostsFrNew = await getBlogPosts("fr");

  // Create Ref
  const websiteSha = await getHeadSha("digital-canada-ca", "master");
  branchName = `content-release-${new Date().getTime()}`;
  await octokit.git.createRef({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    ref: `refs/heads/${branchName}`,
    sha: websiteSha
  });

  // Create / Update file commits
  await createAndUpdateFiles(blogPostsEnNew, blogPostsEnExisting, "content/en/blog/posts/", branchName);
  await createAndUpdateFiles(blogPostsFrNew, blogPostsFrExisting, "content/fr/blog/posts/", branchName);

  // if there is content

  // closePRs()

  // Make the PR
  /*
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