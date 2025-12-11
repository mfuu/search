const CUSTOM_BOOKMARK_KEY = "customBookmarkLocalStoreKey";
const ENGINE_CONFIG_KEY = "SearchEngineConfigs";
const APP_CONFIG_KEY = "recommendedAppConfigs";

window.baidu = {
  sug(data) {
    const list = data.s || [];
    const suggests = list.map((item) => {
      return `
        <li data-key="baidu" title="${item}">
          <i class="search-icon suggest-icon"></i>
          <div class="inner-text">${item}</div>
          <div class="logo baidu-logo">
        </li>`;
    });
    handleSuggestWords(suggests, "baidu");
  },
};
window.google = {
  ac: {
    h(data) {
      const list = data[1];
      const suggests = list.map((item) => {
        return `
          <li data-key="google" title="${item[0]}">
            <i class="search-icon suggest-icon"></i>
            <div class="inner-text">${item[0]}</div>
            <div class="logo google-logo">
          </li>`;
      });
      handleSuggestWords(suggests, "google");
    },
  },
};
window.bing = {
  sug(data) {
    const { Results = [] } = data.AS;
    const list = Results.reduce((res, item) => {
      res.push(...item.Suggests.map((el) => el.Txt));
      return res;
    }, []);
    const suggests = list.map((item) => {
      return `
        <li data-key="bing" title="${item}">
          <i class="search-icon suggest-icon"></i>
          <div class="inner-text">${item}</div>
          <div class="logo bing-logo">
        </li>`;
    });
    handleSuggestWords(suggests, "bing");
  },
};

function getDomain(url) {
  const REG = /^https?:\/\/([^\/]+)/i;
  return url.match(REG)?.[1] || "";
}

function getProtocol(url) {
  const REG = /^(https?)/i;
  return url.match(REG)?.[1] || "";
}

function getEngineDom() {
  return $("#search").find("#searchEngine");
}

function getSuggestDom() {
  return $("#search").find("#searchSuggest");
}

function getInputDom() {
  return $("#search").find("#searchInput");
}

function toggleSearchClass(bool) {
  $("#search")[bool ? "addClass" : "removeClass"]("sug-show");
}

function toggleBookmarkClass(bool) {
  $("#bookmark")[bool ? "addClass" : "removeClass"]("edit");
}

function toogleContextmenuVisible(bool) {
  $("contextmenu").css("display", bool ? "block" : "");
}

function toogleAddBookmarkVisible() {
  const wrap = $("#bookmark");
  if (wrap.children().length <= 1) {
    wrap.children("#addBookmark").css("display", "block");
  } else {
    wrap.children("#addBookmark").css("display", "");
  }
}

function handleSuggestWords(suggests = [], dataKey = "") {
  const suggestDom = getSuggestDom();
  suggestDom.children(`li[data-key="${dataKey}"]`).remove();
  const inputText = getInputDom().val();
  if (inputText.trim()) {
    suggests.forEach((item) => suggestDom.append(item));
  }
  if (suggestDom.children().length) {
    toggleSearchClass(true);
  } else {
    toggleSearchClass(false);
  }
}

function handleEngineDropdownClick(e) {
  const inputDom = getInputDom();
  const currentEngine = getEngineDom().find("#currentEngine");
  const engineKey = $(e.target).attr("data-key");
  const searchUrl = $(e.target).attr("data-search");
  const placeholder = $(e.target).attr("data-placeholder");
  inputDom.attr("data-search", searchUrl);
  inputDom.attr("placeholder", placeholder);
  currentEngine.attr("data-key", engineKey);
  currentEngine.removeClass(function (i, cls) {
    const classToRemove = [];
    cls.split(/\s+/).forEach((item) => {
      if (item.match(/^.*-logo$/)) {
        classToRemove.push(item);
      }
    });
    return classToRemove.join(" ");
  });
  currentEngine.addClass(`${engineKey}-logo`);

  const engineDropdown = getEngineDom().find("#engineDropdown");
  engineDropdown.children().each(function (i, o) {
    $(this).removeClass("active");
    if ($(this).attr("data-key") === engineKey) {
      $(this).addClass("active");
    }
  });
}

function onInputChange() {
  var keywords = $(this).val();
  if (!keywords.trim()) {
    toggleSearchClass(false);
    getSuggestDom().empty();
    return;
  }
  $.each(window[ENGINE_CONFIG_KEY], (i, o) => {
    $.ajax({
      url: o.suggest.replace("#content#", keywords),
      dataType: "jsonp",
      jsonp: o.jsonp,
      jsonpCallback: o.callback,
      error: function (e) {
        if (e.status !== 200) {
          handleSuggestWords([], o.key);
        }
      },
    });
  });
}

function onSearch(search = "") {
  let inputDom = getInputDom();
  if (!inputDom) {
    console.error("The Input box with id `searchInput` is not found.");
    return;
  }
  let word = inputDom.val();
  if (!word.trim()) {
    return;
  }
  let link = (search || inputDom.attr("data-search")) + word;
  location.href = link;
}

function handleAddBookmark() {
  const title = $("#bookmarkModal").find("#webSiteTitle").val();
  const url = $("#bookmarkModal").find("#webSiteUrl").val();
  const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
  const result = store ? JSON.parse(store) : [];
  const index = result.findIndex((item) => item.url == url);
  if (index > -1) {
    result[index] = { title, url };
  } else {
    result.push({ title, url });
    addBookmark({ url, title });
  }
  localStorage.setItem(CUSTOM_BOOKMARK_KEY, JSON.stringify(result));
  $("#bookmarkModal").modal("hide");
  toogleAddBookmarkVisible();
}

function handleRemoveBookmark(e) {
  const item = e.target.parentNode;
  const url = getBookmarkUrl(item);
  const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
  const result = store ? JSON.parse(store) : [];
  const index = result.findIndex((item) => item.url === url);
  if (index > -1) {
    result.splice(index, 1);
  }
  localStorage.setItem(CUSTOM_BOOKMARK_KEY, JSON.stringify(result));
  item.remove();
  toogleAddBookmarkVisible();
}

function getBookmarkUrl(item) {
  return $(item).attr("href");
}

function visibleBookmarks() {
  const wrap = $("#bookmark");
  const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
  wrap.children(".item").remove();
  if (store) {
    $.each(JSON.parse(store), (i, o) => {
      addBookmark(o);
    });
  }
  toogleAddBookmarkVisible();
}

function addBookmark({ url, title }) {
  const addIcon = $("#bookmark").children("#addBookmark");
  addIcon.before(`
    <a class="item" href="${url}" target="_blank" data-title="${title}">
      <img
        src="${getProtocol(url)}://${getDomain(url)}/favicon.ico"
        alt="${title[0]}"
        onerror="this.src='';this.onerror=null;"
        class="favicon"
      />
      <span id="closeTagIcon" class="close-icon">x</span>
    </a>`
  );
}

function bookmarkSortable() {
  new Sortable($("#bookmark").get(0), {
    draggable: '.edit > .item',
    onDrop: ({ node, target, oldIndex, newIndex }) => {
      if (oldIndex === newIndex) return;
      const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
      const result = store ? JSON.parse(store) : [];
      const fromIndex = result.findIndex(item => item.url === getBookmarkUrl(node));
      const toIndex = result.findIndex(item => item.url === getBookmarkUrl(target));
      const item = result[fromIndex];;
      result.splice(fromIndex, 1);
      result.splice(toIndex, 0, item);
      localStorage.setItem(CUSTOM_BOOKMARK_KEY, JSON.stringify(result));
    }
  });
}

$(function () {
  $(document).ready(function () {
    const inputDom = getInputDom();
    inputDom.focus();
  });
  $(document).keyup(function (event) {
    if (event.keyCode == 13) {
      onSearch();
    }
  });
  $(document).on("contextmenu", "#bookmark", function (e) {
    if ($(e.target).closest(".item").length) {
      return;
    } else {
      e.preventDefault();
      let pageX = e.pageX + 6;
      let pageY = e.pageY;
      const { clientWidth } = document.documentElement;
      const menuWidth = $("contextmenu").width();
      if (clientWidth - pageX < menuWidth + 1) {
        pageX -= menuWidth;
      }
      $("contextmenu").css("left", pageX);
      $("contextmenu").css("top", pageY);
      toogleContextmenuVisible(true);
    }
  });
  $(document).on("click", function (e) {
    if ($(e.target).parents("#searchSuggest").length) {
      const li = $(e.target).closest("li");
      const txt = li.find(".inner-text").text();
      const key = li.attr("data-key");
      const inputDom = getInputDom();
      inputDom.val(txt);
      let search = "";
      $.each(window[ENGINE_CONFIG_KEY], (i, o) => {
        if (o.key === key) {
          search = o.search;
        }
      });
      onSearch(search);
    } else if ($(e.target).closest("#searchInput").length) {
      let suggest = getSuggestDom();
      if (suggest.children().length) {
        toggleSearchClass(true);
      }
    } else if ($(e.target).closest("#searchIcon").length) {
      onSearch();
    } else if ($(e.target).parents("#engineDropdown").length) {
      handleEngineDropdownClick(e);
    } else if ($(e.target).attr("id") === "closeTagIcon") {
      e.preventDefault();
      handleRemoveBookmark(e);
    } else if ($(e.target).closest(".modal").length) {
      return;
    } else if ($(e.target).closest("contextmenu").length) {
      toogleContextmenuVisible(false);
      return;
    } else if ($(e.target).closest("#bookmark").length) {
      toogleContextmenuVisible(false);
      return;
    } else {
      toggleSearchClass(false);
      toggleBookmarkClass(false);
    }
    toogleContextmenuVisible(false);
  });
  $(document).on("touchend", function (e) {
    if ($(e.target).attr("id") === "closeTagIcon") {
      e.preventDefault();
      handleRemoveBookmark(e);
    }
  });
});
