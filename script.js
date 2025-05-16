(function() {
  "use strict";

  ready(function() {

    // Restore focus after page reload
    var returnFocusTo = sessionStorage.getItem('returnFocusTo');
    if (returnFocusTo) {
      sessionStorage.removeItem('returnFocusTo');
      var returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }

    // Render inline micro-templates
    each('[data-element="template"]', function(el) {
      if (el.hasAttribute('data-template')) {
        Util.renderTemplate(el, el.getAttribute('data-template'));
      }
    });

    /**
     * Converts HTML links within a given element into objects.
     * @param el
     * @returns {[]}
     */
    var convertLinksToObjects = function(el) {
      return Array.prototype.map.call(el.querySelectorAll('a'), function(a) {
        return { title: a.innerText, html_url: a.href };
      });
    };

    // Render Zendesk helper micro-templates
    // @see https://developer.zendesk.com/documentation/help_center/help-center-templates/helpers/
    var supportedHelpers = ['breadcrumbs', 'recent-articles', 'related-articles', 'recent-activity', 'share'];
    supportedHelpers.forEach(function(helper) {
      each('[data-element="' + helper + '"]', function(el) {
        if (el.hasAttribute('data-template')) {
          var data = {};

          // Breadcrumb helper data
          if (helper === 'breadcrumbs') {
            data = { breadcrumbs: convertLinksToObjects(el) };
          }

          // Recent and related articles helper data
          else if (helper === 'recent-articles' || helper === 'related-articles') {
            data = { articles: convertLinksToObjects(el) };
          }

          // Recent activity helper data
          else if (helper === 'recent-activity') {
            data = { items: convertLinksToObjects(el) };
          }

          // Social share links helper data
          else if (helper === 'share') {
            var links = Array.prototype.map.call(el.querySelectorAll('a'), function(a) {
              var svg = a.querySelector('svg');
              return {
                title: a.getAttribute('aria-label'),
                description: svg ? svg.getAttribute('aria-label') : '',
                html_url: a.href
              };
            });
            data = { links: links };
          }

          // Render the micro-template
          Util.renderTemplate(el, el.getAttribute('data-template'), data);
        }
      });
    });

    // Open social sharing links in a new window
    each('.share a', function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        window.open(this.href, '', 'height = 500, width = 500');
      });
    });

    // Add focus classname to search field
    each('.form-field [type="search"]', function(el) {
      el.addEventListener('focus', function() { this.parentNode.classList.add(Util.classNames.FOCUS); });
      el.addEventListener('focusout', function() { this.parentNode.classList.remove(Util.classNames.FOCUS); });
    });

    // Replace images with inline SVG
    Array.prototype.forEach.call(document.querySelectorAll('[data-inline-svg]'), Util.replaceWithSVG);

    // Smooth scroll
    function maybeScroll() {
      var smoothScroll = Util.getURLParameter('smooth-scroll', window.location);
      if (smoothScroll === 'true' && window.location.hash) {
        var offset = Util.getURLParameter('offset', window.location);
        var target = document.getElementById(window.location.hash.substring(1).split("?")[0]);
        Util.scrollIntoView(target, offset);
      }
    }

    window.addEventListener('hashchange', maybeScroll, false);
    maybeScroll();

    /**
     * Collapsible navigation.
     * @param el
     * @constructor
     */
    function CollapsibleNav(el) {
      this.el = el;
      el.addEventListener('click', this.onClick.bind(this));
    }

    CollapsibleNav.prototype = {

      onClick: function(e) {
        var maxHeight = window.getComputedStyle(this.el).maxHeight;
        if (maxHeight === 'none') {
          return;
        }

        var isExpanded = this.el.getAttribute('aria-expanded') === 'true';
        var navLink = e.target;

        if (isExpanded) {

          // Close the nav if the clicked link is selected
          if (navLink.getAttribute('aria-selected') === 'true') {
            this.el.setAttribute('aria-expanded', 'false');
            this.el.classList.remove('is-expanded');
            navLink.setAttribute('aria-selected', 'false');
            e.preventDefault();
          }
        } else {

          // Open the nav if it's closed
          this.el.setAttribute('aria-expanded', 'true');
          this.el.classList.add('is-expanded');
          navLink.setAttribute('aria-selected', 'true');
          e.preventDefault();
        }
      }
    };

    each('.collapsible-nav', function(nav) {
      new CollapsibleNav(nav);
    });

    window.CollapsibleNav = CollapsibleNav;

  });
})();

// Show all articles

$(document).ready(function () {
    var hc_url = "https://midjourneydev.zendesk.com";
		// var hc_url = "https://docs.midjourney.com";

    // Artcile ID to Hash map:   articleId -> articleHash
  	// articleID: '', // File Name / Article Slug
    const articleIdToHash = {
      // Section: Getting Started
      33329261836941: '01JJMXM6KJP60JMC33CJFKYTHG', // 33329261836941-Getting-Started-Guide
      31541658411789: '01JK1K0TM2CGNTFF03WTXM0YAD', // 31541658411789-Quick-Start

      // Section: Prompting Basics
      32023408776205: '01JJMXM01SEKX17JHF101C749Q', // 32023408776205-Prompt-Basics
      33329329805581: '01JJW3SQ4Z3WE7M1YZ7YTARJS7', // 33329329805581-Modifying-Your-Creations
      31894244298125: '01JJMJJR9T49KAV6YZK6797Z10', // 31894244298125-Aspect-Ratio
      33329374594957: '01JKBY1HV2TVM43Q0MAG46NC2H', // 33329374594957-Image-Size-Resolution
      32835253061645: '01JJMXM49WXJJSTY78XSPXF0DV', // 32835253061645-Art-of-Prompting

      // Section: Using Your Own Images
      32040250122381: '01JJTBK97CB896WSDV153RRGHB', // 32040250122381-Image-Prompts
      32162917505293: '01JJTA1B9X2JRY8C8VZRVGJRVN', // 32162917505293-Character-Reference
      32180011136653: '01JJTA1VTKPYA3JCFQVHM7J61X', // 32180011136653-Style-Reference
      36285124473997: '01JT7457M114RA5RDVHEKK937M', // 36285124473997-Omni-Reference
      32497889043981: '01JJW2E5XDX7X2K6EMWGRMSK5C', // 32497889043981-Describe
      32764383466893: '01JK6W0D0XZQWB7QB70FKB1VWZ', // 32764383466893-Editor
      33329380893325: '01JK6W0F6MZ3RV7573X5B9RR2N', // 33329380893325-Managing-Image-Uploads

      // Section: Using Web
      33329460426765: '01JJ525VWR4KM0M5HYW81ZWVSJ', // 33329460426765-Website-Overview
      33390732264589: '01JK6W0JR11Z5TEY0RNZ6D3XXD', // 33390732264589-Creating-on-Web
      35577175650957: '01JQZKJCGZDY9SSP4QJ1480YJF', // 35577175650957-Draft-Mode
      33329462451469: '01JK6W0H3PP4HCHTPT0CH0PCPW', // 33329462451469-Organizing-Your-Creations
      34580542725645: '01JN7BWQH49D4T8ZHTJYJFMVFE', // 34580542725645-Using-Folders
      32696720371341: '01JJD61P8TD8JJHP4DDDB2E6FY', // 32696720371341-Web-Editor
      33390759197197: '01JK6W0MKASM8G0K3DHMTQEVEN', // 33390759197197-Complete-Tasks
      32433330574221: '01JK9F8BYZQ0Y5C89CH5PDVNCC', // 32433330574221-Personalization


      // Section: Midjourney Controls
      32859204029709: '01JJW7DBSGD322G8312FKRX4KQ', // 32859204029709-Parameter-List
      32099348346765: '01JJWJ1XNASTYSZZJF68ZJEM6F', // 32099348346765-Chaos-Variety
      33329788681101: '01JJWG0CPMKMQXM2TDT5B0S1B8', // 33329788681101-Legacy-Features
      32658968492557: '01JK715Q1MXPDSNWTXCZTABDP9', // 32658968492557-Multi-Prompts-Weights
      32173351982093: '01JJWHJN18EWR8BKTZEHSZF5N6', // 32173351982093-No
      32570788043405: '01JKC0W8FVCHG6XJGY3VJ9YV12', // 32570788043405-Pan
      32761322355597: '01JK70SGGMAP0C6FS4SRQ5W4B2', // 32761322355597-Permutations
      32176522101773: '01JK9F89RD8AWF3MBA5BVWQ8W5', // 32176522101773-Quality
      32634113811853: '01JKBYCTPVP4Y38RZBWP2G1YSV', // 32634113811853-Raw-Mode-Style-Raw
      32799074515213: '01JKBY1FFNB9QY76PMNF08NP57', // 32799074515213-Remix
      32757107922061: '01JJZ0YSKS8S1M1CSYVRGAPN6E', // 32757107922061-Repeat
      32604356340877: '01JKBY1B7V07D9JHMSCYPXJFRW', // 32604356340877-Seeds
      32602768934925: '01JJWENP50JXXRNBJSJ7WHFQ04', // 32602768934925-Stop
      32196176868109: '01JK9DY9YSQJ8KE0YA8Z36HMRT', // 32196176868109-Stylize
      32502277092109: '01JJYT56W9C5ABXDYYHYJ1857Y', // 32502277092109-Text-Generation
      32197978340109: '01JJX9QZ1WX013KP0KXZHVBJWW', // 32197978340109-Tile
      32804058614669: '01JK9DYV37X1JXB1MX8ZAST6K9', // 32804058614669-Upscalers
      32692978437005: '01JKBY1DJAW74V65TYGGTP50F2', // 32692978437005-Variations
      32199405667853: '01JJYT187WGYNPF751MV8NKY9X', // 32199405667853-Version
      32390120435085: '01JK1K18CPAN6AX9XP32WTBPVP', // 32390120435085-Weird
      32595476770957: '01JJYRST6SBMBJJ5AE0DTMK40Z', // 32595476770957-Zoom-Out

      // Section: Using Discord
      33329300781837: '01JK711CNAWBKCACVGZ9E7VZJP', // 33329300781837-Web-vs-Discord
      32631709682573: '01JK9DYDW8S63W435AJ5GJPAKZ', // 32631709682573-Discord-Quick-Start
      33330535666445: '01JK711ETGHH708X9JJX3R7BJK', // 33330535666445-Discord-Overview
      32637339216013: '01JK9DYKH216D2RZFPWDWP09P6', // 32637339216013-Discord-Direct-Messages
      32637946450445: '01JK9DYNRXPJGHWM42V08XRCJG', // 32637946450445-Add-Midjourney-to-Your-Discord-Server
      32894521590669: '01JK9DYYQ8QF7KTC6AZVN35QYQ', // 32894521590669-Discord-Command-List
      32868982949517: '01JK9DYX1BYFHDW6TPBJDPK8GE', // 32868982949517-Creation-Settings-in-Discord
      32084927086861: '01JK6Y24G0VFJVP83W9T1AKPY4', // 32084927086861-Info-Command
      32635695384461: '01JK9DYHPMEDW48FHNK900PGRG', // 32635695384461-Show-Command
      32794723105549: '01JK9DYRRTZA1RKSJWH3Q3AY39', // 32794723105549-Vary-Region
      32635189884557: '01JK9DYFS0TBAYGJDKYM861NBE', // 32635189884557-Blend-Images-on-Discord
      32558957919117: '01JK9DYC022CGMG1WWPBQA9RC0', // 32558957919117-Hosting-Images-on-Discord

      // Section: Midjourney Policies
      32083055291277: '01JKC02DQ6GK34RZNHWBRSDN2G', // 32083055291277-Terms-of-Service
      32013696484109: '01JKC02DQ6GK34RZNHWBRSDN2G', // 32013696484109-Community-Guidelines
      32083472637453: '01JKC02DQ6GK34RZNHWBRSDN2G', // 32083472637453-Privacy-Policy
      32084281102349: '01JKC02DQ6GK34RZNHWBRSDN2G', // 32084281102349-Midjourney-Trademark-Policy
      32084462534541: '01JKC02DQ6GK34RZNHWBRSDN2G', // 32084462534541-Data-Deletion-and-Privacy-FAQ
      32084601469581: '01JKC02DQ6GK34RZNHWBRSDN2G', // 32084601469581-Purchase-Order-Terms-and-Conditions
      };

    // Function to fetch all articles for a given section
    function fetchAllArticles(sectionId, locale, callback) {
        var url = `${hc_url}/api/v2/help_center/${locale}/sections/${sectionId}/articles.json?page[size]=100`;
        let allArticles = [];

        function getArticles(pageUrl) {
            $.ajax({
                url: pageUrl,
                type: "GET",
                dataType: "json",
                success: function(data) {
                    allArticles = allArticles.concat(data.articles);
                    if (data.next_page) {
                        getArticles(data.next_page);
                    } else {
                        callback(allArticles);
                    }
                },
                error: function(err) {
                    console.error("Error fetching articles:", err);
                    callback(allArticles); // Return whatever articles have been fetched so far
                }
            });
        }

        getArticles(url);
    }

    // Build article HTML
    function buildArticleHTML(article, settings, isLastArticle) {
        if (article.draft === true) {
            return '';
        }

        // Image src URL: https://midjourney.zendesk.com/guide-media/ + articleIdToHash[article.id] && hash is not ''
        let articleHTML = `
            <li class="col-12 ${settings.article_list_columns >= 2 ? 'md:col-6' : ''} ${settings.article_list_columns >= 3 ? 'lg:col-4' : ''}">
                ${articleIdToHash[article.id] && articleIdToHash[article.id] !== '' ? `
                    <div class="media-header mb-2 text-center">
                        <a href="${article.html_url}">
                            <img 
                                data-asset="image" 
                                data-asset-id="header-${article.id}.png" 
                                src="/hc/theming_assets/${articleIdToHash[article.id]}"
                                alt="${article.title}" 
                                class="article-thumbnail img-fluid rounded"
                            />
                        </a>
                    </div>
                ` : `
                    <div class="media-header mb-2 text-center"></div>
                `}

                <div class="relative media align-items-baseline py-one-third
                    ${settings.article_list_style === '1-bullet' ? '' : ''}
                    ${settings.article_list_excerpt === 0 ? 'font-light' : ''}
                    ${settings.article_list_style === '3-bordered' ? 'border-bottom' + (settings.article_list_columns === '1' && isLastArticle ? ' border-bottom-0' : '') : ''}
                ">
                    ${settings.article_list_style === '3-bordered' ? `
                    <div class="flex" x-data="{ src: Theme.assets['article'] }">
                        <template x-if="src">
                            <img class="svg-icon mr-3" src="${hc_url}/placeholder.png" alt="" aria-hidden="true" :src="src" />
                        </template>
                    </div>
                    ` : ''}

                    <div class="media-body">                            
                        <a class="link-stretched text-inherit font-bold${settings.promoted_article_style === 'bold' && article.promoted ? ' font-extrabold' : ''}" href="${article.html_url}">
                            ${article.title}
                        </a>
                        ${settings.promoted_article_style === 'icon' && article.promoted ? `
                        <svg class="svg-icon ml-1 fill-current text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 426 405" aria-hidden="true">
                            <title>Promoted</title>
                            <use xlink:href="#icon-star" />
                        </svg>
                        ` : ''}
                        ${article.internal ? `
                        <svg class="svg-icon ml-1 fill-current text-base" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true">
                            <title>Internal</title>
                            <use xlink:href="#icon-lock" />
                        </svg>
                        ` : ''}
                        ${settings.article_list_excerpt !== 0 ? `
                        <p class="my-2 font-size-md font-normal excerpt">
                            ${ Util.getExcerpt(article.body, 150) }...
                        </p>
                        ` : ''}
                    </div>
                </div>
            </li>
        `;
        
        return articleHTML;
    }
   
    // Remove ellipsis ("...") from elements with class "excerpt" on the Docs category page only
    function removeEllipsis() {
        if (window.location.href.includes("/hc/en-us/categories/34802284143757")) {
            // console.log("Removing ellipsis from excerpts on:", window.location.href);
            document.querySelectorAll(".excerpt").forEach((element) => {
                element.textContent = element.textContent.replace(/\.\.\./g, "");
            });
        }
    }

    // Main function to replace "Show All Articles" with all articles
    function replaceShowAllArticles() {

        const links = document.querySelectorAll('.see-all-articles');
        const containers = document.querySelectorAll('div[id^="article-list-"]');

        containers.forEach((container) => {   
          const sectionId = container.id.replace('article-list-', '');

            // Determine locale
            let locale = "en-us"; // default locale
            if (typeof HelpCenter !== "undefined" && HelpCenter.user && HelpCenter.user.locale) {
                locale = HelpCenter.user.locale;
                // console.log("User locale:", locale);
            } else {
                const pathParts = window.location.pathname.split("/");
                if (pathParts[1] === "hc" && pathParts[2]) {
                    locale = pathParts[2];
                } else if (pathParts[1]) {
                    locale = pathParts[1];
                }
                // console.warn("Locale not found. Using default locale:", locale);
            }

            // Fetch all articles for this section
            fetchAllArticles(sectionId, locale, function(allArticles) {
              // console.log("All articles: ", allArticles);

                const settings = {
                    article_list_style: '1-bullet',
                    article_list_excerpt: 100,
                    promoted_article_style: 'icon',
                    article_list_columns: 3,
                };

                // Find the corresponding article list container
                const articleListContainer = container.closest('.col-12').querySelector('ul.article-list');
                if (!articleListContainer) {
                    console.warn("Article list container not found for link:", link);
                    return;
                }

                // console.log("Article list container:", articleListContainer);


                // Clear existing articles
                articleListContainer.innerHTML = '';

                // Iterate over all articles and build HTML
                let finalHTML = '';
                allArticles.forEach((article, index) => {
                    // Determine if this is the last article (for conditional classes)
                    const isLastArticle = index === allArticles.length - 1;

                    // Build HTML for this article
                    finalHTML += buildArticleHTML(article, settings, isLastArticle);
                });

                // Insert all articles into the container
                articleListContainer.innerHTML = finalHTML;

              	// Remove ellipsis
              	removeEllipsis();
            });
        });        
    }

    // Execute the replacement
    replaceShowAllArticles();

    // Hide the "Show All Articles" link for each section
    $('.see-all-articles').hide();

    // Hide the Inkeep search bar on the home page only
    function hideSearchBar(url) {
      if (window.location.href === url) {
        const searchBar = document.getElementById("inkeepSearchBarNav");
        if (searchBar) {
          searchBar.style.display = "none";
        }
      }
    }

    // hideSearchBar("https://docs.midjourney.com/hc/en-us");
    hideSearchBar("https://midjourneydev.zendesk.com/hc/en-us");
  
});

(function() {
  // Get stored theme or determine from system preference
  function getTheme() {
    var storedTheme = localStorage.getItem('mj_docs_theme');
    if (storedTheme) {
      console.log('Stored theme:', storedTheme);
      return storedTheme;
    }
    console.log('Using system preference for theme');
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Set the theme both in localStorage and on the document element
  function setTheme(theme) {
    localStorage.setItem('mj_docs_theme', theme);
    console.log('Setting theme:', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Toggle theme and update the icon display accordingly
  function toggleTheme() {
    var currentTheme = getTheme();
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateIcons(newTheme);
    console.log('Toggled theme to:', newTheme);
  }

  // Update the icon visibility based on the current theme
  function updateIcons(theme) {
    var sunIcon = document.querySelector('.theme .fa-sun');
    var moonIcon = document.querySelector('.theme .fa-moon');
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.display = 'flex';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'flex';
      }
    }
  }

  // Initialize theme on page load and attach the event listener
  document.addEventListener('DOMContentLoaded', function() {
    var theme = getTheme();
    setTheme(theme);
    updateIcons(theme);

    var themeButton = document.querySelector('.theme');
    if (themeButton) {
      themeButton.addEventListener('click', toggleTheme);
    }
  });
})();
