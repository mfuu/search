const CUSTOM_TAG_KEY = "customTagLocalStoreKey";

window.baidu = {
  sug(data) {
    const list = data.s || [];
    const suggests = list.map((item) => {
      return `
        <li data-key="baidu" title="${item}">
          <i class="search-icon suggest-icon"></i>
          <div id="innerText">${item}</div>
          <div id="logo" class="baidu-logo">
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
            <div id="innerText">${item[0]}</div>
            <div id="logo" class="google-logo">
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
          <div id="innerText">${item}</div>
          <div id="logo" class="bing-logo">
        </li>`;
    });
    handleSuggestWords(suggests, "bing");
  },
};

function getEngineDom() {
  return $(".integrated-search").find("#searchEngine");
}

function getSuggestDom() {
  return $(".integrated-search").find("#searchSuggest");
}

function getInputDom() {
  return $(".integrated-search").find("#searchInput");
}

function toggleSearchClass(bool) {
  let wrap = $(".integrated-search");
  wrap[bool ? "addClass" : "removeClass"]("sug-show");
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

function handleDropdownClick(e) {
  const inputDom = getInputDom();
  const currentEngine = getEngineDom().find("#currentEngine");
  const engineKey = $(e.target).attr("data-key");
  const searchUrl = $(e.target).attr("data-search");
  const placeholder = $(e.target).attr("data-placeholder");
  inputDom.attr("data-search", searchUrl);
  inputDom.attr("placeholder", placeholder);
  currentEngine.attr("data-key", engineKey);
  currentEngine.removeClass();
  currentEngine.addClass(`${engineKey}-logo`);

  const availableEngine = getEngineDom().find("#availableEngine");
  availableEngine.children().each(function (i, o) {
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
  $.each(window.searchConfig, (i, o) => {
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

function handleAddCustom() {
  const title = $("#customModal").find("#webSiteTitle").val();
  const url = $("#customModal").find("#webSiteUrl").val();
  const icon = $("#customModal").find("#webSiteIcon").val();
  const store = localStorage.getItem(CUSTOM_TAG_KEY);
  let result = store ? JSON.parse(store) : [{ title, url, icon }];
  if (store) {
    result.push({ title, url, icon });
  }
  localStorage.setItem(CUSTOM_TAG_KEY, JSON.stringify(result));
  $("#customModal").modal("hide");
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
  $(document).on("click", function (e) {
    if ($(e.target).parents("#searchSuggest").length) {
      const li = $(e.target).closest("li");
      const txt = li.find("#innerText").text();
      const key = li.attr("data-key");
      const inputDom = getInputDom();
      inputDom.val(txt);
      let search = "";
      $.each(window.searchConfig, (i, o) => {
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
    } else if ($(e.target).parents("#availableEngine").length) {
      handleDropdownClick(e);
    } else {
      toggleSearchClass(false);
    }
  });
});
