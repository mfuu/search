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
    const txt = getInputDom().val();
    handleSuggestWords(suggests, txt);
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
      const txt = getInputDom().val();
      handleSuggestWords(suggests, txt);
    },
  },
};
window.bing = {
  sug(data) {
    const list = data.AS.Results.reduce((res, item) => {
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
    const txt = getInputDom().val();
    handleSuggestWords(suggests, txt);
  },
};

function getEngineDom() {
  return $(".integrating-search").find("#searchEngine");
}

function getSuggestDom() {
  return $(".integrating-search").find("#searchSuggest");
}

function getInputDom() {
  return $(".integrating-search").find("#searchInput");
}

function toggleSearchClass(bool) {
  let wrap = $(".integrating-search");
  wrap[bool ? "addClass" : "removeClass"]("sug-show");
}

function handleSuggestWords(suggests = [], txt = "") {
  const suggest = getSuggestDom();
  const lastTxt = suggest.attr("data-search");
  if (lastTxt !== txt) {
    suggest.empty();
    suggest.attr("data-search", txt);
  }

  toggleSearchClass(true);
  if (!suggests.length) {
    suggest.empty();
    toggleSearchClass(false);
  }
  suggests.forEach((item) => suggest.append(item));
}

function handleDropdownClick(e) {
  const input = getInputDom();
  const current = $(".integrating-search").find("#currentEngine");
  const key = $(e.target).attr("data-key");
  const search = $(e.target).attr("data-search");
  const placeholder = $(e.target).attr("data-placeholder");
  input.attr("data-search", search);
  input.attr("placeholder", placeholder);
  current.attr("data-key", key);
  current.removeClass();
  current.addClass(`${key}-logo`);

  const engine = getEngineDom();
  const dropdown = engine.find(".dropdown-menu");
  dropdown.children().each(function (i, o) {
    $(this).removeClass("active");
    if ($(this).attr("data-key") === key) {
      $(this).addClass("active");
    }
  });
}

function onInputChange() {
  var keywords = $(this).val();
  if (!keywords) {
    handleSuggestWords([]);
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
          const txt = getInputDom().val();
          handleSuggestWords([], txt);
        }
      },
    });
  });
}

function onSearch(search = "") {
  let input = getInputDom();
  if (!input) {
    console.error("The Input box with id `searchInput` is not found.");
    return;
  }
  let word = input.val();
  if (!word.trim()) {
    return;
  }
  let link = (search || input.attr("data-search")) + word;
  location.href = link;
}

$(function () {
  $(document).ready(function () {
    const input = getInputDom();
    input.focus();
  });
  $(document).keyup(function (event) {
    if (event.keyCode == 13) {
      onSearch();
    }
  });
  $(document).on("click", function (e) {
    if ($(e.target).parents("#searchSuggest").length) {
      const word = $(this).find("#innerText").text();
      const key = $(this).attr("data-key");
      const input = getInputDom();
      input.val(word);
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
    } else if ($(e.target).parents("#dropdownEngine").length) {
      handleDropdownClick(e);
    } else {
      toggleSearchClass(false);
    }
  });
});
