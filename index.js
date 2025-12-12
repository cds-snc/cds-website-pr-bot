if (process.env.NODE_ENV != "Production") {
  const envResult = require('dotenv').config()
}
const github = require('@actions/github');
const Base64 = require('js-base64').Base64;

const myToken = process.env.TOKEN;
const octokit = github.getOctokit(myToken);

const getJobPosts = require("./content_fetch/fetch_job_posts");
const getBlogPostsFromGCArticles = require("./content_fetch/fetch_gc_articles_blog_post");
const getJobPostsFromGCArticles = require("./content_fetch/fetch_gc_articles_job_posts");

async function closePRs() {
  console.log("Checking for old auto PRs to close...");
  const { data: prs } = await octokit.pulls.list({
    owner: 'cds-snc',
    repo: 'digital-canada-ca-website',
    state: 'open'
  });

  for (const pr of prs) {
    if (pr.title.startsWith("[AUTO-PR]")) {
      console.log(`Closing PR #${pr.number}: ${pr.title}`);
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
  }
}

const getHeadSha = async (repo, branch = 'main') => {
  const { data: data } = await octokit.repos.getBranch({
    owner: 'cds-snc',
    repo,
    branch,
  });
  return data.commit.sha;
}

const createAndUpdateFiles = async (newFiles, oldFiles, lang, subpath, branchName) => {
  let path = "content/" + lang + "/";
  for (const f in newFiles) {
    const exists = (oldFiles.name && oldFiles.name == newFiles[f].fileName) ? [oldFiles] : oldFiles.filter(oldFile => oldFile.path == subpath + newFiles[f].fileName);

    const content = Base64.encode(newFiles[f].body)

    if (exists.length === 0) {
      console.log(`Creating new file: ${path + subpath + newFiles[f].fileName}`);
      await octokit.repos.createOrUpdateFileContents({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        path: path + subpath + newFiles[f].fileName,
        content,
        branch: branchName,
        message: "Added new file: " + newFiles[f].fileName
      })
    } else {
      const result = await octokit.repos.getContent({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        path: path + exists[0].path
      });
      if (Base64.decode(result.data.content) != newFiles[f].body) {
        console.log(`Updating existing file: ${path + exists[0].path}`);
        await octokit.repos.createOrUpdateFileContents({
          owner: 'cds-snc',
          repo: 'digital-canada-ca-website',
          sha: exists[0].sha,
          path: path + exists[0].path,
          content,
          branch: branchName,
          message: "Updated file: " + newFiles[f].fileName
        })
      }
    }
  }
}

async function run() {
  try {
    console.log("=== PR Bot Monitor Started ===");
    console.log("Timestamp:", new Date().toISOString());

    console.log("Fetching existing content from repo...");
    const treeShas = await octokit.repos.getContent({
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      path: "/content",
    });

    const existingContentEN = await octokit.git.getTree({
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      tree_sha: treeShas.data.find(tree => tree.name === "en").sha,
      recursive: true
    });
    const existingContentFR = await octokit.git.getTree({
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      tree_sha: treeShas.data.find(tree => tree.name === "fr").sha,
      recursive: true
    });

    console.log("Fetching CMS content...");

    const jobPostsEnNew = await getJobPosts("en");
    const jobPostsFrNew = await getJobPosts("fr");

    const gcArticlesBlogsEn = await getBlogPostsFromGCArticles("en");
    const gcArticlesBlogsFr = await getBlogPostsFromGCArticles("fr");

    const gcArticlesJobPostsEn = await getJobPostsFromGCArticles("en");
    const gcArticlesJobPostsFr = await getJobPostsFromGCArticles("fr");

    console.log(`EN blogs fetched: ${gcArticlesBlogsEn.length}, FR blogs fetched: ${gcArticlesBlogsFr.length}`);
    console.log(`EN jobs fetched: ${jobPostsEnNew.length}, FR jobs fetched: ${jobPostsFrNew.length}`);
    console.log(`EN GC jobs fetched: ${gcArticlesJobPostsEn.length}, FR GC jobs fetched: ${gcArticlesJobPostsFr.length}`);

    const websiteSha = await getHeadSha("digital-canada-ca-website", "main");
    const branchName = `content-release-${new Date().getTime()}`;

    console.log(`Creating branch: ${branchName}`);
    await octokit.git.createRef({
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      ref: `refs/heads/${branchName}`,
      sha: websiteSha
    });

    console.log("Creating/updating files...");
    await createAndUpdateFiles(gcArticlesBlogsEn, existingContentEN.data.tree, "en", "blog/posts/", branchName);
    await createAndUpdateFiles(gcArticlesBlogsFr, existingContentFR.data.tree, "fr", "blog/posts/", branchName);
    await createAndUpdateFiles(jobPostsEnNew, existingContentEN.data.tree, "en", "jobs/positions/", branchName);
    await createAndUpdateFiles(jobPostsFrNew, existingContentFR.data.tree, "fr", "jobs/positions/", branchName);
    await createAndUpdateFiles(gcArticlesJobPostsEn, existingContentEN.data.tree, "en", "jobs/positions/", branchName);
    await createAndUpdateFiles(gcArticlesJobPostsFr, existingContentFR.data.tree, "fr", "jobs/positions/", branchName);

    console.log("Checking commits to see if PR is needed...");
    const branchcommit = await octokit.request('GET /repos/{owner}/{repo}/commits/{sha}', {
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      sha: branchName
    });
    const maincommit = await octokit.request('GET /repos/{owner}/{repo}/commits/{sha}', {
      owner: 'cds-snc',
      repo: 'digital-canada-ca-website',
      sha: "main"
    });

    if (branchcommit.data && branchcommit.data.sha !== maincommit.data.sha) {
      console.log("Changes detected, closing old PRs and creating a new one...");
      await closePRs();
      await octokit.pulls.create({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        title: `[AUTO-PR] New content release -  ${new Date().toISOString()}`,
        head: branchName,
        base: 'main',
        body: "New Content release for CDS Website. See below commits for list of changes.",
        draft: false
      });
      console.log("PR created successfully ✅");
    } else {
      console.log("No changes detected, deleting branch...");
      await octokit.git.deleteRef({
        owner: 'cds-snc',
        repo: 'digital-canada-ca-website',
        ref: `heads/${branchName}`
      });
      console.log("Branch deleted.");
    }

    console.log("=== PR Bot Monitor Finished Successfully ✅ ===");

  } catch (err) {
    console.error("PR Bot Monitor encountered an error ❌");
    console.error(err.message || err);
    process.exit(1);
  }
}

run();