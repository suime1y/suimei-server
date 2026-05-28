(function () {
  const grid = document.getElementById('gallery-grid');
  const status = document.getElementById('gallery-status');
  const modal = document.getElementById('gallery-modal');
  const modalImage = document.getElementById('gallery-modal-image');
  const modalCaption = document.getElementById('gallery-modal-caption');
  const modalClose = modal ? modal.querySelector('.gallery-modal-close') : null;

  if (!grid || !status) {
    return;
  }

  const setStatus = (message, isVisible = true) => {
    status.textContent = message;
    status.hidden = !isVisible;
  };

  const createText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text || '';
    return element;
  };

  const openModal = (item) => {
    if (!modal || !modalImage || !modalCaption) {
      window.open(item.image, '_blank', 'noopener,noreferrer');
      return;
    }

    modalImage.src = item.image;
    modalImage.alt = item.alt || item.title || 'ギャラリー画像';
    modalCaption.textContent = item.title || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-modal-open');
  };

  const closeModal = () => {
    if (!modal || !modalImage) {
      return;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modalImage.src = '';
    document.body.classList.remove('gallery-modal-open');
  };

  const createCard = (item) => {
    const card = document.createElement('article');
    card.className = 'gallery-card';

    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'gallery-image-button';
    imageButton.setAttribute('aria-label', `${item.title || '画像'}を拡大表示`);

    const image = document.createElement('img');
    image.className = 'gallery-image';
    image.src = item.image || '';
    image.alt = item.alt || item.title || 'ギャラリー画像';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      imageButton.classList.add('is-missing');
      image.remove();
      imageButton.textContent = '画像を読み込めませんでした';
    }, { once: true });

    imageButton.appendChild(image);
    imageButton.addEventListener('click', () => {
      if (item.image) {
        openModal(item);
      }
    });

    const content = document.createElement('div');
    content.className = 'gallery-content';

    const title = createText('h3', 'gallery-title', item.title || '無題の写真');
    const meta = createText('p', 'gallery-meta', item.author || '投稿者未設定');
    const description = createText('p', 'gallery-description', item.description || '');

    content.append(title, meta, description);
    card.append(imageButton, content);
    return card;
  };

  const renderGallery = (items) => {
    grid.textContent = '';

    if (!Array.isArray(items) || items.length === 0) {
      setStatus('まだ写真は掲載されていません');
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(createCard(item));
    });
    grid.appendChild(fragment);
    setStatus('', false);
  };

  fetch('../data/gallery.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load gallery data: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      renderGallery(data.items);
    })
    .catch(() => {
      grid.textContent = '';
      setStatus('写真情報を取得できませんでした');
    });

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}());
