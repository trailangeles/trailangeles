const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdown = require("markdown-it")({
  html: true
})

module.exports = function (eleventyConfig) {
  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addGlobalData("permalink", () => {
    return (data) => `${data.page.filePathStem}.${data.page.outputFileExtension}`;
  });

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // human readable date from string
  eleventyConfig.addFilter("formatDate", (dateObj) => {
    return new Date(Date.parse(dateObj)).toDateString();
  });

  // human readable date from string
  eleventyConfig.addFilter("isInTheFuture", (dateObj) => {
    let currentDate = new Date();
    let eventDate = new Date(Date.parse(dateObj));
    return eventDate > currentDate;
  });

  // add console log tool
  eleventyConfig.addFilter('log', value => {
    console.log('[11ty log]', value)
  })

  eleventyConfig.addFilter('markdown', value => {
    return `<div class="md-block">${markdown.render(value)}</div>`    
  })

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) =>
    yaml.safeLoad(contents)
  );

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
    "./node_modules/alpinejs/dist/alpine.js": "./static/js/alpine.js",
    "./src/static/js/netlify-cms-widget-simple-uuid.js": "./static/js/netlify-cms-widget-simple-uuid.js"
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");

  eleventyConfig.browserSyncConfig = {
    https: true
  };

  eleventyConfig.setFrontMatterParsingOptions({
    delimiters: ['/*---', '---*/'],
  });

  return {
    dir: {
      input: "src",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
