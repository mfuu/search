const ENGINE_CONFIG_KEY = 'SearchEngineConfigs';
const APP_CONFIG_KEY = 'recommendedAppConfigs';

let $search, $searchEngine, $searchSuggest, $searchInput;

$(function () {
  $search = $('#search');
  $searchEngine = $search.find('#searchEngine');
  $searchInput = $search.find('#searchInput');
  $searchSuggest = $search.find('#searchSuggest');
});

const toggleSearchSuggestVisible = (bool) => $search.toggleClass('suggest-visible', bool);

function handleSuggestWords(suggests = [], dataKey = '') {
  $searchSuggest.children(`li[data-key="${dataKey}"]`).remove();
  const inputText = $searchInput.val();
  if (inputText.trim()) {
    suggests.forEach((item) => $searchSuggest.append(item));
  }
  if ($searchSuggest.children().length) {
    toggleSearchSuggestVisible(true);
  } else {
    toggleSearchSuggestVisible(false);
  }
}

function renderSuggestItem(item, key) {
  return `<li data-key="${key}" title="${item}">
    <svg width="18" height="18" class="text-secondary"><use href="./assets/icons.svg#icon-search"></use></svg>
    <div class="inner-text">${item}</div>
    <svg width="16" height="16"><use href="./assets/icons.svg#icon-${key}"></use></svg>
  </li>`;
}

window.baidu = {
  sug(data) {
    handleSuggestWords(
      (data.s || []).map((item) => renderSuggestItem(item, 'baidu')),
      'baidu'
    );
  },
};

window.google = {
  ac: {
    h(data) {
      handleSuggestWords(
        (data[1] || []).map((item) => renderSuggestItem(item[0], 'google')),
        'google'
      );
    },
  },
};

window.bing = {
  sug(data) {
    const list = (data.AS.Results || []).reduce(
      (res, item) => res.concat(item.Suggests.map((el) => el.Txt)),
      []
    );
    handleSuggestWords(
      list.map((item) => renderSuggestItem(item, 'bing')),
      'bing'
    );
  },
};

function handleSuggestItemClick(e) {
  const currentEngine = $searchEngine.find('#currentEngine');
  const engineKey = $(e.target).attr('data-key');
  const searchUrl = $(e.target).attr('data-search');
  const placeholder = $(e.target).attr('data-placeholder');

  $searchInput.attr('data-search', searchUrl);
  $searchInput.attr('placeholder', placeholder);

  currentEngine.attr('data-key', engineKey);
  currentEngine.html(
    `<svg width="20" height="20"><use href="./assets/icons.svg#icon-${engineKey}"></use></svg>`
  );

  const engineDropdown = $searchEngine.find('#engineDropdown');
  engineDropdown.children().each(function (i, o) {
    $(this).removeClass('active');
    if ($(this).attr('data-key') === engineKey) {
      $(this).addClass('active');
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.onInputChange = debounce(function () {
  const keywords = $(this).val().trim();
  if (!keywords) {
    toggleSearchSuggestVisible(false);
    $searchSuggest.empty();
    return;
  }
  $.each(window[ENGINE_CONFIG_KEY], (i, o) => {
    $.ajax({
      url: o.suggest.replace('#content#', encodeURIComponent(keywords)),
      dataType: 'jsonp',
      jsonp: o.jsonp,
      jsonpCallback: o.callback,
      error: function (e) {
        if (e.status !== 200) handleSuggestWords([], o.key);
      },
    });
  });
}, 200);

function onSearch(search = '') {
  if (!$searchInput) {
    console.error('The Input box with id `searchInput` is not found.');
    return;
  }
  let word = $searchInput.val();
  if (!word.trim()) {
    return;
  }
  let link = (search || $searchInput.attr('data-search')) + word;
  location.href = link;
}

function initSearch() {
  const input = $search.find('#searchInput');
  input.bind('input propertychange', window.onInputChange);
  $.getJSON('config.json', function (data) {
    const { app, engine } = data;
    engine.sort((a, b) => a.index - b.index);
    window[APP_CONFIG_KEY] = app;
    window[ENGINE_CONFIG_KEY] = engine;

    const engineDropdown = $search.find('#engineDropdown');
    $.each(engine, (i, o) => {
      engineDropdown.append(
        `<a class="dropdown-item ${o.key}" href="#${o.key}" data-key="${o.key}" data-search="${o.search}" data-placeholder="${o.placeholder}">${o.title}</a>`
      );
    });
    $.each(engine, (i, o) => {
      if (o.default) {
        const item = $searchEngine.find(`.${o.key}`);
        handleSuggestItemClick({ target: item[0] });
      }
    });

    const hash = window.location.hash.split('#')[1];
    if (hash) {
      const item = $searchEngine.find(`.${hash}`);
      item.length && handleSuggestItemClick({ target: item[0] });
    }
  });
}

$(function () {
  initSearch();

  $searchInput.focus();

  $($searchInput).on('keydown', function (event) {
    const isInputing = $(this).attr('inputing') === 'true';
    if (!isInputing && event.keyCode == 13) {
      const items = $searchSuggest.find('li');
      const activeItem = items.filter('.active');
      if (activeItem.length) {
        activeItem.click();
      } else {
        onSearch();
      }
    }

    // up and down to select suggest item
    if (event.keyCode == 38 || event.keyCode == 40) {
      event.preventDefault();
      const items = $searchSuggest.find('li');
      const activeItem = items.filter('.active');

      if (activeItem.length) {
        activeItem.removeClass('active');

        if (event.keyCode == 38) {
          if (activeItem.index() === 0) {
            // ignore
          } else {
            activeItem.prev().addClass('active');
          }
        } else if (event.keyCode == 40) {
          if (activeItem.index() === items.length - 1) {
            // ignore
          } else {
            activeItem.next().addClass('active');
          }
        }
      } else {
        if (event.keyCode == 38) {
          items.last().addClass('active');
        } else {
          items.first().addClass('active');
        }
      }

      const currentActive = items.filter('.active');

      // update input value
      if (currentActive.length) {
        $(this).val(currentActive.find('.inner-text').text());
      }

      // scroll active item into view
      currentActive[0]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  });

  $($searchInput).on('compositionstart', function () {
    $($searchInput).attr('inputing', 'true');
  });

  $($searchInput).on('compositionend', function () {
    $($searchInput).attr('inputing', 'false');
  });

  $($searchSuggest).on('mouseover', function () {
    $(this).find('li').filter('.active').removeClass('active');
  });

  $(document).on('click', function (e) {
    if ($(e.target).parents('#searchSuggest').length) {
      const li = $(e.target).closest('li');
      const txt = li.find('.inner-text').text();
      const key = li.attr('data-key');
      $searchInput.val(txt);
      let search = '';
      $.each(window[ENGINE_CONFIG_KEY], (i, o) => {
        if (o.key === key) {
          search = o.search;
        }
      });
      onSearch(search);
    } else if ($(e.target).closest('#searchInput').length) {
      if ($searchSuggest.children().length) {
        toggleSearchSuggestVisible(true);
      }
    } else if ($(e.target).closest('#searchIcon').length) {
      onSearch();
    } else if ($(e.target).parents('#engineDropdown').length) {
      handleSuggestItemClick(e);
    } else {
      toggleSearchSuggestVisible(false);
    }
  });
});
