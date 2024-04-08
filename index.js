if (process.env.NODE_ENV != "Production") {
  const envResult = require('dotenv').config()
}
const github = require('@actions/github');
const Base64 = require('js-base64').Base64;

const myToken = process.env.TOKEN;
const octokit = github.getOctokit(myToken);

const getBlogPosts = require("./content_fetch/fetch_blog_posts");
const getJobPosts = require("./content_fetch/fetch_job_posts");

const getBlogPostsFromGCArticles = require("./content_fetch/fetch_gc_articles_blog_post");

const getJobPostsFromGCArticles = require("./content_fetch/fetch_gc_articles_job_posts");


async function closePRs() {
  // Close old auto PRs
  const { data: prs } = await octokit.pulls.list({
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    state: 'open'
  });

  prs.forEach(async pr => {
    if (pr.title.startsWith("[AUTO-PR]")) {
      await octokit.pulls.update({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        pull_number: pr.number,
        state: "closed"
      });
      await octokit.git.deleteRef({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        ref: `heads/${pr.head.ref}`
      });
    }
  })
}

const getHeadSha = async (repo, branch = 'main') => {
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
    repo: 'digital-canada-ca-website',
    path: path,
  });
  return data;
}

const createAndUpdateFiles = async (newFiles, oldFiles, lang, subpath, branchName) => {
  // for each modified or changed file:
  let path = "content/" + lang + "/";
  for (f in newFiles) {
    // === if file new or modified code here! ====
    // If single file, github returns an object instead of an array
    var exists = (oldFiles.name && oldFiles.name == newFiles[f].fileName) ? [oldFiles] : oldFiles.filter(oldFile => oldFile.path == subpath + newFiles[f].fileName);

    let content = Base64.encode(newFiles[f].body)

    if (exists.length == 0) {
      // Create new File
      await octokit.repos.createOrUpdateFileContents({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        path: path + subpath + newFiles[f].fileName,
        content: content,
        branch: branchName,
        message: "Added new file: " + newFiles[f].fileName
      })
    } else {
      await octokit.repos.getContent({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        path: path + exists[0].path
      }).then(async result => {
        if (Base64.decode(result.data.content) != newFiles[f].body) {
          // Update existing file
          await octokit.repos.createOrUpdateFileContents({
            owner: 'cds-snc',
            repo: 'digital-canada-ca-website',
            sha: exists[0].sha, // if update this is required
            path: path + exists[0].path,
            content: content,
            branch: branchName,
            message: "Updated file: " + newFiles[f].fileName
          })
        }
      });
    }
  }
}

/*
Steps to update:
1. Strapi webhook calls this on a change in Strapi
2. Pull down digital-canada-ca-website
3. Run build content script to generate / update markdown
4. Do a pull request onto digital-canada-ca-website with the new content
*/

async function run() {
  /*
    Existing Content from the repo
  */

  // get content tree(s) shas
  let treeShas = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    path: "/content",
  });

  let existingContentEN = await octokit.git.getTree({
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    tree_sha: treeShas.data.filter(tree => tree.name === "en")[0].sha, // filter by name in case this directory is ever modified / added to
    recursive: true
  });
  let existingContentFR = await octokit.git.getTree({
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    tree_sha: treeShas.data.filter(tree => tree.name === "fr")[0].sha,
    recursive: true
  });


  /*
    Get CMS Content
  */


  // Blog Posts
  var blogPostsEnNew = await getBlogPosts("en");
  var blogPostsFrNew = await getBlogPosts("fr");
  // Job Postings
  var jobPostsEnNew = await getJobPosts("en");
  var jobPostsFrNew = await getJobPosts("fr");

  //GC Articles Blogs
  var gcArticlesBlogsEn = await getBlogPostsFromGCArticles("en");
  var gcArticlesBlogsFr = await getBlogPostsFromGCArticles("fr");

  //GC Articles Jobs
  var gcArticlesJobPostsEn = await getJobPostsFromGCArticles("en");
  var gcArticlesJobPostsFr = await getJobPostsFromGCArticles("fr");

  // Create Ref
  const websiteSha = await getHeadSha("digital-canada-ca-website", "main");
  branchName = `content-release-${new Date().getTime()}`;

  let refs = await octokit.git.createRef({
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    ref: `refs/heads/${branchName}`,
    sha: websiteSha
  });


  // Create / Update file commits
  // Blog posts
  await createAndUpdateFiles(blogPostsEnNew, existingContentEN.data.tree, "en", "blog/posts/", branchName);
  await createAndUpdateFiles(blogPostsFrNew, existingContentFR.data.tree, "fr", "blog/posts/", branchName);
  await createAndUpdateFiles(gcArticlesBlogsEn, existingContentEN.data.tree, "en", "blog/posts/", branchName);
  await createAndUpdateFiles(gcArticlesBlogsFr, existingContentFR.data.tree, "fr", "blog/posts/", branchName);
  // Job Postings
  await createAndUpdateFiles(jobPostsEnNew, existingContentEN.data.tree, "en", "careers/positions/", branchName);
  await createAndUpdateFiles(jobPostsFrNew, existingContentFR.data.tree, "fr", "careers/positions/", branchName);
  await createAndUpdateFiles(gcArticlesJobPostsEn, existingContentEN.data.tree, "en", "careers/positions/", branchName)
  await createAndUpdateFiles(gcArticlesJobPostsFr, existingContentFR.data.tree, "fr", "careers/positions/", branchName)


  // if there is content - compare shas of most recent commit on the branch and main
  let branchcommit = await octokit.request('GET /repos/{owner}/{repo}/commits/{sha}', {
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    sha: branchName
  });
  let maincommit = await octokit.request('GET /repos/{owner}/{repo}/commits/{sha}', {
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    sha: "main"
  })
  if (branchcommit.data && branchcommit.data.sha != maincommit.data.sha) {
    closePRs()

    // Make the new PR
    await octokit.pulls.create({
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      title: `[AUTO-PR] New content release -  ${new Date().toISOString()}`,
      head: branchName,
      base: 'main',
      body: "New Content release for CDS Website. See below commits for list of changes.",
      draft: false
    });

  } else {
    // no commits, delete the ref
    await octokit.git.deleteRef({
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      ref: `heads/${branchName}`
    });
  }

}
run();