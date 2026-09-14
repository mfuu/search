const CUSTOM_BOOKMARK_KEY = 'customBookmarkLocalStoreKey';

let $bookmark;
let currentContextMenuTarget = null;

$(function () {
  $bookmark = $('#bookmark');
});

function getDomain(url) {
  const REG = /^https?:\/\/([^\/]+)/i;
  return url.match(REG)?.[1] || '';
}

function getProtocol(url) {
  const REG = /^(https?)/i;
  return url.match(REG)?.[1] || '';
}

function getFavicon(url) {
  const domain = getDomain(url);
  const protocol = getProtocol(url);
  return `${protocol}://${domain}/favicon.ico`;
}

const getBookmarkUrl = (item) => $(item).attr('href');

const toogleContextmenuVisible = (bool) => $('contextmenu').css('display', bool ? 'block' : 'none');

function addBookmark({ url, title }) {
  const addIcon = $bookmark.children('#addBookmark');
  addIcon.before(`
    <a class="bookmark-item item" href="${url}" target="_blank" data-title="${title}">
      <img
        src="${getFavicon(url)}"
        alt="${title[0]}"
        onerror="this.src='';this.onerror=null;"
        class="favicon"
      />
    </a>`);
}

function handleAddBookmark() {
  const title = $('#bookmarkModal').find('#webSiteTitle').val();
  const url = $('#bookmarkModal').find('#webSiteUrl').val();
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
  $('#bookmarkModal').modal('hide');
}

function handleRemoveBookmark(item) {
  if (!item) return;
  const url = getBookmarkUrl(item);
  const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
  const result = store ? JSON.parse(store) : [];
  const index = result.findIndex((i) => i.url === url);
  if (index > -1) {
    result.splice(index, 1);
  }
  localStorage.setItem(CUSTOM_BOOKMARK_KEY, JSON.stringify(result));
  $(item).remove();
}

function initBookmarks() {
  const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
  $bookmark.children('.bookmark-item').remove();
  if (store) {
    $.each(JSON.parse(store), (i, o) => {
      addBookmark(o);
    });
  }

  new Sortable($bookmark.get(0), {
    draggable: '.bookmark-item',
    animation: 300,
    delay: 1000,
    delayOnTouchOnly: true,
    onDrop: ({ node, target, oldIndex, newIndex }) => {
      if (oldIndex === newIndex) return;
      const store = localStorage.getItem(CUSTOM_BOOKMARK_KEY);
      const result = store ? JSON.parse(store) : [];
      const fromIndex = result.findIndex((item) => item.url === getBookmarkUrl(node));
      const toIndex = result.findIndex((item) => item.url === getBookmarkUrl(target));
      const item = result[fromIndex];
      result.splice(fromIndex, 1);
      result.splice(toIndex, 0, item);
      localStorage.setItem(CUSTOM_BOOKMARK_KEY, JSON.stringify(result));
    },
  });
}

$(function () {
  initBookmarks();

  $(document).on('contextmenu', '.bookmark-item', function (e) {
    e.preventDefault();
    currentContextMenuTarget = this;
    let pageX = e.pageX + 6;
    let pageY = e.pageY;

    // Temporarily show to get width
    $('contextmenu').css({ display: 'block', visibility: 'hidden' });
    const menuWidth = $('contextmenu').outerWidth();
    $('contextmenu').css({ display: 'none', visibility: 'visible' });

    const { clientWidth } = document.documentElement;
    if (clientWidth - pageX < menuWidth + 1) {
      pageX -= menuWidth;
    }
    $('contextmenu').css({ left: pageX, top: pageY });
    toogleContextmenuVisible(true);
  });

  $(document).on('contextmenu', '#bookmark', function (e) {
    if ($(e.target).closest('.bookmark-item').length) {
      return;
    }
  });

  $('#cm-open').on('click', function () {
    if (currentContextMenuTarget) {
      window.open($(currentContextMenuTarget).attr('href'), '_blank');
    }
    toogleContextmenuVisible(false);
  });

  $('#cm-delete').on('click', function () {
    if (currentContextMenuTarget) {
      handleRemoveBookmark(currentContextMenuTarget);
      currentContextMenuTarget = null;
    }
    toogleContextmenuVisible(false);
  });

  $(document).on('click', function (e) {
    if ($(e.target).closest('.modal').length) {
      return;
    } else if ($(e.target).closest('contextmenu').length) {
      return;
    } else {
      toogleContextmenuVisible(false);
    }
  });
});
