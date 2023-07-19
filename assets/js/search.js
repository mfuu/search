window.baidu = {
  sug(data) {
    const list = data.s || [];
    const suggests = list.map((item) => {
      return `<li><span id="text-container">${item}</span></li>`;
    });
    handleSuggestWords(suggests);
  },
};
window.google = {
  ac: {
    h(data) {
      const list = data[1];
      const suggests = list.map((item) => {
        return `<li><i class="fa-solid fa-magnifying-glass suggest-icon"></i><div id="text-container">${item[0]}</div></li>`;
      });
      handleSuggestWords(suggests);
    },
  },
};
window.bing = {
  sug(data) {
    const list = data.AS.Results.reduce((res, item) => {
      res.push(...item.Suggests.map(el => el.Txt));
      return res;
    }, [])
    const suggests = list.map((item) => {
      return `<li><i class="fa-solid fa-magnifying-glass suggest-icon"></i><div id="text-container">${item}</div></li>`;
    });
    handleSuggestWords(suggests);
  }
}

function getSuggestDom() {
  return $("#search-tabContent").children(".active").find("#search-suggest");
}

function getInputDom() {
  return $("#search-tabContent").children(".active").find("#searchInput");
}

function togglePaneClass(bool) {
  let activePane = $("#search-tabContent").children(".active");
  activePane[bool ? 'addClass' : 'removeClass']('sug-show');
}

function handleSuggestWords(suggests = []) {
  let suggest = getSuggestDom();
  suggest.empty().show();
  togglePaneClass(true);
  if (!suggests.length) {
    suggest.empty();
    suggest.hide();
    togglePaneClass(false);
  }
  suggests.forEach((item) => suggest.append(item));
}

function onInputChange() {
  var keywords = $(this).val();
  if (!keywords) {
    handleSuggestWords([]);
    return;
  }
  let suggest = $(this).attr("data-suggest");
  let jsonp = $(this).attr("data-jsonp");
  let callback = $(this).attr("data-callback");
  $.ajax({
    url: suggest.replace("#content#", keywords),
    dataType: "jsonp",
    jsonp: jsonp,
    jsonpCallback: callback,
    error: function (e) {
      if (e.status !== 200) {
        handleSuggestWords([]);
      }
    },
  });
}

function onSearch() {
  let input = getInputDom();
  if (!input) {
    console.error('The Input box with id `searchInput` is not found.')
    return;
  }
  let word = input.val();
  if (!word.trim()) {
    return;
  }
  let search = input.attr("data-search") + word;
  location.href = search;
}

$(function () {
  $(document).keyup(function (event) {
    if (event.keyCode == 13) {
      onSearch();
    }
  });
  $(document).on("click", "#search-suggest li", function () {
    let word = $(this).find("#text-container").text();
    let input = getInputDom();
    input.val(word);
    onSearch();
  });
  $(document).on("click", "#searchInput", function (e) {
    e.stopPropagation();
    let suggest = getSuggestDom();
    if (suggest.children().length) {
      suggest.show();
      togglePaneClass(true);
    }
  });
  $(document).on("click", "#submitInput", function (e) {
    e.stopPropagation();
    onSearch();
  });
  $(document).on("click", function (e) {
    e.stopPropagation();
    let suggest = getSuggestDom();
    suggest.hide();
    togglePaneClass(false);
  });
});
