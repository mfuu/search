(() => {
  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = (theme) => localStorage.setItem('theme', theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    if (theme === 'auto') {
      $('html').attr(
        'data-bs-theme',
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    } else {
      $('html').attr('data-bs-theme', theme);
    }
  };

  setTheme(getPreferredTheme());

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme();
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme());
    }
  });

  $(function () {
    const themeOptions = [
      { value: 'light', icon: 'light', label: '浅色' },
      { value: 'dark', icon: 'dark', label: '深色' },
      { value: 'auto', icon: 'auto', label: '自动' },
    ];

    const $dropdownMenu = $('#themeDropdownMenu');
    themeOptions.forEach((opt) => {
      $dropdownMenu.append(`
        <li>
          <a class="dropdown-item d-flex align-items-center" href="#" data-bs-theme-value="${opt.value}">
            <svg width="16" height="16" class="me-2"><use href="./assets/icons.svg#icon-theme-${opt.icon}"></use></svg>${opt.label}
          </a>
        </li>
      `);
    });

    const showActiveTheme = (theme) => {
      const $activeThemeIcon = $('.theme-icon-active use');
      const $btnToActive = $(`[data-bs-theme-value="${theme}"]`);

      if (!$btnToActive.length || !$activeThemeIcon.length) return;

      const hrefOfActiveBtn = $btnToActive.find('svg use').attr('href');

      $('[data-bs-theme-value]').removeClass('active');
      $btnToActive.addClass('active');
      $activeThemeIcon.attr('href', hrefOfActiveBtn);
    };

    const storedTheme = getStoredTheme() || 'auto';
    showActiveTheme(storedTheme);

    $('[data-bs-theme-value]').on('click', function (e) {
      e.preventDefault();
      const theme = $(this).attr('data-bs-theme-value');
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme);
    });
  });
})();
