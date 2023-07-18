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

function getSuggestDom() {
  return $("#search-tabContent").children(".active").find("#search-suggest");
}

function getInputDom() {
  return $("#search-tabContent").children(".active").find("input").eq(0);
}

function handleSuggestWords(suggests = []) {
  let suggest = getSuggestDom();
  suggest.empty().show();
  if (!suggests.length) {
    suggest.empty();
    suggest.hide();
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
  let callback = suggest.match(eval(`/${jsonp}=(.*)/`))[1];
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

$(function () {
  $(document).keyup(function (event) {
    if (event.keyCode == 13) {
      let input = getInputDom();
      let word = input.val();
      if (!word.trim()) {
        return;
      }
      let search = input.attr("data-search") + word;
      location.href = search;
    }
  });
  $(document).on("click", "#search-suggest li", function () {
    let word = $(this).find("#text-container").text();
    let input = getInputDom();
    let search = input.attr("data-search") + word;
    input.val(word);
    location.href = search;
  });
  $(document).on("click", "input", function (e) {
    e.stopPropagation();
    let suggest = getSuggestDom();
    if (suggest.children().length) {
      suggest.show();
    }
  });
  $(document).on("click", function (e) {
    e.stopPropagation();
    let suggest = getSuggestDom();
    suggest.hide();
  });
});
  